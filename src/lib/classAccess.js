import {
  arrayUnion,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { appCollection, appDoc } from "./appFirestore";
import { db } from "./firebase";

export const TEACHER_EMAIL_DOMAIN = "@doralacademynv.org";
export const STUDENT_EMAIL_DOMAIN = "@student.doralacademynv.org";

const CLASS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CLASS_CODE_LENGTH = 6;

export function normalizeSchoolEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function schoolRoleForEmail(email) {
  const normalizedEmail = normalizeSchoolEmail(email);
  if (normalizedEmail.endsWith(STUDENT_EMAIL_DOMAIN)) return "student";
  if (normalizedEmail.endsWith(TEACHER_EMAIL_DOMAIN)) return "teacher";
  return "";
}

export function isTeacherStaffAccount(account) {
  return (
    ["teacher", "admin"].includes(account?.role) &&
    normalizeSchoolEmail(account?.email).endsWith(TEACHER_EMAIL_DOMAIN)
  );
}

export function normalizeClassCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-HJ-NP-Z2-9]/g, "")
    .slice(0, CLASS_CODE_LENGTH);
}

function formatNamePart(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join("-");
}

export function teacherLastNameForClass(classRecord = {}) {
  const record = classRecord || {};
  const classOwner = String(record.name || "")
    .match(/^(.+?)(?:['’]s)\s+Algebra\b/i)?.[1]
    ?.trim();
  const nameLastName = classOwner?.split(/\s+/).filter(Boolean).at(-1);
  if (nameLastName) return formatNamePart(nameLastName);

  const emailName = normalizeSchoolEmail(record.teacherEmail).split("@")[0];
  const emailLastName = emailName.split(/[._]+/).filter(Boolean).at(-1);
  return formatNamePart(emailLastName) || "Teacher";
}

function makeClassCode() {
  const randomValues = new Uint32Array(CLASS_CODE_LENGTH);
  crypto.getRandomValues(randomValues);
  return Array.from(
    randomValues,
    (value) => CLASS_CODE_ALPHABET[value % CLASS_CODE_ALPHABET.length],
  ).join("");
}

export function teacherClassId(uid) {
  return `teacher-${uid}`;
}

export function normalizeTeacherClassRecord(id, data = {}) {
  const storedCode = normalizeClassCode(data.classCode);
  const legacyIdCode = normalizeClassCode(id);

  return {
    id,
    ...data,
    classCode:
      storedCode.length === CLASS_CODE_LENGTH
        ? storedCode
        : legacyIdCode.length === CLASS_CODE_LENGTH
          ? legacyIdCode
          : "",
  };
}

export async function ensureTeacherClass(account) {
  if (!db || !isTeacherStaffAccount(account)) return null;

  const classId = teacherClassId(account.uid);
  const classRef = appDoc("classes", classId);
  const existingClass = await getDoc(classRef);
  if (existingClass.exists()) {
    return normalizeTeacherClassRecord(existingClass.id, existingClass.data());
  }

  const existingTeacherClasses = await getDocs(
    query(
      appCollection("classes"),
      where("teacherUid", "==", account.uid),
      limit(1),
    ),
  );
  const legacyClass = existingTeacherClasses.docs[0];
  if (legacyClass) {
    return normalizeTeacherClassRecord(legacyClass.id, legacyClass.data());
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const classCode = makeClassCode();
    const codeRef = appDoc("classJoinCodes", classCode);

    try {
      const classRecord = await runTransaction(db, async (transaction) => {
        const [classSnapshot, codeSnapshot] = await Promise.all([
          transaction.get(classRef),
          transaction.get(codeRef),
        ]);

        if (classSnapshot.exists()) {
          return normalizeTeacherClassRecord(classSnapshot.id, classSnapshot.data());
        }

        if (codeSnapshot.exists()) {
          throw new Error("CLASS_CODE_COLLISION");
        }

        const displayName = String(account.displayName || account.email || "Teacher").trim();
        const classData = {
          id: classId,
          classCode,
          name: `${displayName}'s Algebra I Class`,
          period: "",
          teacherUid: account.uid,
          teacherEmail: normalizeSchoolEmail(account.email),
          studentUids: [],
          studentEmails: [],
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(classRef, classData);
        transaction.set(codeRef, {
          code: classCode,
          classId,
          teacherUid: account.uid,
          teacherEmail: normalizeSchoolEmail(account.email),
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return { id: classId, ...classData };
      });

      return normalizeTeacherClassRecord(classRecord.id, classRecord);
    } catch (error) {
      if (error?.message !== "CLASS_CODE_COLLISION") throw error;
    }
  }

  throw new Error("Unable to reserve a unique class code. Please try again.");
}

export async function joinStudentClass(account, enteredCode) {
  if (!db || account?.role !== "student") {
    throw new Error("A signed-in student account is required.");
  }

  const classCode = normalizeClassCode(enteredCode);
  if (classCode.length !== CLASS_CODE_LENGTH) {
    throw new Error("Enter the full 6-character class code.");
  }

  const codeRef = appDoc("classJoinCodes", classCode);
  const enrollmentRef = appDoc("studentClasses", account.uid);

  return runTransaction(db, async (transaction) => {
    const codeSnapshot = await transaction.get(codeRef);
    if (!codeSnapshot.exists() || codeSnapshot.data().active !== true) {
      throw new Error("That class code was not found. Check it and try again.");
    }

    const codeData = codeSnapshot.data();
    const classRef = appDoc("classes", codeData.classId);
    const classSnapshot = await transaction.get(classRef);
    if (!classSnapshot.exists() || classSnapshot.data().active !== true) {
      throw new Error("That class is not available.");
    }

    transaction.update(classRef, {
      studentUids: arrayUnion(account.uid),
      studentEmails: arrayUnion(normalizeSchoolEmail(account.email)),
      updatedAt: serverTimestamp(),
    });
    transaction.set(enrollmentRef, {
      studentUid: account.uid,
      studentEmail: normalizeSchoolEmail(account.email),
      classId: classSnapshot.id,
      classCode,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: classSnapshot.id, ...classSnapshot.data() };
  });
}
