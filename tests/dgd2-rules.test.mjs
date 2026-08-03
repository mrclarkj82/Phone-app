import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getBytes, ref, uploadBytes } from "firebase/storage";

const projectId = "dragonmath-rules-matrix";
const firestoreRules = readFileSync("firestore.rules", "utf8");
const storageRules = readFileSync("storage.rules", "utf8");

const testEnvironment = await initializeTestEnvironment({
  projectId,
  firestore: { rules: firestoreRules },
  storage: { rules: storageRules },
});

function schoolAuth(email, extraClaims = {}) {
  return {
    email,
    email_verified: true,
    ...extraClaims,
  };
}

async function seedDocuments(documents) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await Promise.all(
      Object.entries(documents).map(([path, data]) => setDoc(doc(database, path), data)),
    );
  });
}

test("shared DGD2 Firestore and Storage rules matrix", async (suite) => {
  await seedDocuments({
    "dgd2Profiles/student-a": {
      displayName: "Student A",
      settings: {},
      onboardingState: {},
    },
    "dgd2Profiles/student-b": {
      displayName: "Student B",
      settings: {},
      onboardingState: {},
    },
    "dgd2Classrooms/class-a": {
      teacherIds: ["teacher-a"],
      name: "DGD2 Class A",
    },
    "dgd2Classrooms/class-a/members/student-a": {
      status: "active",
    },
    "dgd2Courses/published-course": {
      status: "published",
      title: "Published DGD2 Course",
    },
    "dgd2Courses/draft-course": {
      status: "draft",
      title: "Draft DGD2 Course",
    },
    "dgd2Assignments/assignment-a": {
      classId: "class-a",
      title: "Class Assignment",
    },
    "dgd2AssessmentResults/result-a": {
      uid: "student-a",
      classId: "class-a",
      score: 8,
    },
  });

  const student = testEnvironment.authenticatedContext(
    "student-a",
    schoolAuth("student-a@student.doralacademynv.org"),
  );
  const otherStudent = testEnvironment.authenticatedContext(
    "student-b",
    schoolAuth("student-b@student.doralacademynv.org"),
  );
  const teacher = testEnvironment.authenticatedContext(
    "teacher-a",
    schoolAuth("teacher@doralacademynv.org", { dgd2Roles: ["teacher"] }),
  );
  const outsider = testEnvironment.authenticatedContext(
    "outsider",
    schoolAuth("outsider@example.com"),
  );

  await suite.test("students can read only their own protected DGD2 records", async () => {
    await assertSucceeds(getDoc(doc(student.firestore(), "dgd2Profiles/student-a")));
    await assertFails(getDoc(doc(student.firestore(), "dgd2Profiles/student-b")));
    await assertFails(getDoc(doc(otherStudent.firestore(), "dgd2AssessmentResults/result-a")));
  });

  await suite.test("teachers and enrolled students can read their DGD2 classroom", async () => {
    await assertSucceeds(getDoc(doc(teacher.firestore(), "dgd2Classrooms/class-a")));
    await assertSucceeds(getDoc(doc(student.firestore(), "dgd2Classrooms/class-a")));
    await assertSucceeds(getDoc(doc(teacher.firestore(), "dgd2AssessmentResults/result-a")));
  });

  await suite.test("published content is readable but drafts and outsiders remain blocked", async () => {
    await assertSucceeds(getDoc(doc(student.firestore(), "dgd2Courses/published-course")));
    await assertFails(getDoc(doc(student.firestore(), "dgd2Courses/draft-course")));
    await assertFails(getDoc(doc(outsider.firestore(), "dgd2Courses/published-course")));
  });

  await suite.test("DGD2 client writes remain server-authoritative", async () => {
    await assertFails(
      setDoc(doc(student.firestore(), "dgd2Profiles/student-a"), {
        displayName: "Changed",
      }),
    );
    await assertFails(
      setDoc(doc(teacher.firestore(), "dgd2Assignments/new-assignment"), {
        classId: "class-a",
      }),
    );
  });

  await suite.test("shared Storage stays closed to students, teachers, and anonymous users", async () => {
    await assertFails(
      uploadBytes(ref(student.storage(), "dgd2/student-a/evidence.txt"), new Uint8Array([1, 2, 3])),
    );
    await assertFails(getBytes(ref(teacher.storage(), "dgd2/student-a/evidence.txt")));
    await assertFails(
      getBytes(ref(testEnvironment.unauthenticatedContext().storage(), "dgd2/public.txt")),
    );
  });
});

test("Dragon Math school-role and class-code rules", async (suite) => {
  const teacherEmail = "teacher@doralacademynv.org";
  const studentEmail = "student@student.doralacademynv.org";
  const teacher = testEnvironment.authenticatedContext("math-teacher", schoolAuth(teacherEmail));
  const student = testEnvironment.authenticatedContext("math-student", schoolAuth(studentEmail));
  const outsider = testEnvironment.authenticatedContext(
    "math-outsider",
    schoolAuth("outsider@example.com"),
  );

  await suite.test("school domains can self-provision only the inferred role", async () => {
    await assertSucceeds(
      setDoc(doc(teacher.firestore(), "apps/drrs-math/users/math-teacher"), {
        uid: "math-teacher",
        email: teacherEmail,
        displayName: "Math Teacher",
        role: "teacher",
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      setDoc(doc(student.firestore(), "apps/drrs-math/users/math-student"), {
        uid: "math-student",
        email: studentEmail,
        displayName: "Math Student",
        role: "student",
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(outsider.firestore(), "apps/drrs-math/users/math-outsider"), {
        uid: "math-outsider",
        email: "outsider@example.com",
        displayName: "Outsider",
        role: "teacher",
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  await suite.test("a teacher can atomically create their class and join code", async () => {
    const database = teacher.firestore();
    const batch = writeBatch(database);
    batch.set(doc(database, "apps/drrs-math/classes/teacher-math-teacher"), {
      id: "teacher-math-teacher",
      classCode: "ABC234",
      name: "Math Teacher's Algebra I Class",
      period: "",
      teacherUid: "math-teacher",
      teacherEmail,
      studentUids: [],
      studentEmails: [],
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(database, "apps/drrs-math/classJoinCodes/ABC234"), {
      code: "ABC234",
      classId: "teacher-math-teacher",
      teacherUid: "math-teacher",
      teacherEmail,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  await suite.test("a teacher can discover an existing legacy classroom", async () => {
    await seedDocuments({
      "apps/drrs-math/classes/DLTUX5": {
        name: "Legacy Algebra I Class",
        teacherUid: "math-teacher",
        teacherEmail,
        studentUids: ["legacy-student"],
        studentEmails: ["legacy-student@student.doralacademynv.org"],
        active: true,
      },
      "apps/drrs-math/classJoinCodes/DLTUX5": {
        code: "DLTUX5",
        classId: "DLTUX5",
        teacherUid: "math-teacher",
        active: true,
      },
    });

    const legacyClassQuery = query(
      collection(teacher.firestore(), "apps/drrs-math/classes"),
      where("teacherUid", "==", "math-teacher"),
      limit(1),
    );
    const snapshot = await assertSucceeds(getDocs(legacyClassQuery));
    assert.equal(snapshot.size, 1);
  });

  await suite.test("a student can use the code and join only as themselves", async () => {
    await assertSucceeds(
      getDoc(doc(student.firestore(), "apps/drrs-math/classJoinCodes/ABC234")),
    );
    const database = student.firestore();
    const joinBatch = writeBatch(database);
    joinBatch.update(doc(database, "apps/drrs-math/classes/teacher-math-teacher"), {
        studentUids: ["math-student"],
        studentEmails: [studentEmail],
        updatedAt: serverTimestamp(),
    });
    joinBatch.set(doc(database, "apps/drrs-math/studentClasses/math-student"), {
      studentUid: "math-student",
      studentEmail,
      classId: "teacher-math-teacher",
      classCode: "ABC234",
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(joinBatch.commit());
    await assertFails(
      updateDoc(doc(student.firestore(), "apps/drrs-math/classes/teacher-math-teacher"), {
        studentUids: ["math-student", "someone-else"],
        studentEmails: [studentEmail, "someone-else@student.doralacademynv.org"],
        updatedAt: serverTimestamp(),
      }),
    );
  });

  await suite.test("student enrollment and assignments remain class-scoped", async () => {
    await seedDocuments({
      "apps/drrs-math/assignments/class-assignment": {
        teacherUid: "math-teacher",
        classId: "teacher-math-teacher",
        assignedClassIds: ["teacher-math-teacher"],
        active: true,
      },
    });

    const assignmentQuery = query(
      collection(student.firestore(), "apps/drrs-math/assignments"),
      where("classId", "==", "teacher-math-teacher"),
    );
    await assertSucceeds(
      getDoc(doc(student.firestore(), "apps/drrs-math/studentClasses/math-student")),
    );
    await assertSucceeds(
      getDoc(doc(student.firestore(), "apps/drrs-math/classes/teacher-math-teacher")),
    );
    await assertSucceeds(getDocs(assignmentQuery));
    await assertFails(getDoc(doc(outsider.firestore(), "apps/drrs-math/assignments/class-assignment")));
  });
});

test.after(async () => {
  await testEnvironment.cleanup();
});
