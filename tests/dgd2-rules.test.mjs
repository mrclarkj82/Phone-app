import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
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
  const newStudentEmail = "new-student@student.doralacademynv.org";
  const newStudent = testEnvironment.authenticatedContext(
    "new-math-student",
    schoolAuth(newStudentEmail),
  );
  const profileOnlyStudentEmail = "profile-only@student.doralacademynv.org";
  const profileOnlyStudent = testEnvironment.authenticatedContext(
    "profile-only-student",
    { email_verified: true },
  );
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

  await suite.test("student SSO can complete the account lookup and provisioning sequence", async () => {
    const database = newStudent.firestore();
    const accountRef = doc(database, "apps/drrs-math/users/new-math-student");
    const accountSnapshot = await assertSucceeds(getDoc(accountRef));
    assert.equal(accountSnapshot.exists(), false);

    const emailLookup = query(
      collection(database, "apps/drrs-math/users"),
      where("email", "==", newStudentEmail),
      limit(3),
    );
    const emailSnapshot = await assertSucceeds(getDocs(emailLookup));
    assert.equal(emailSnapshot.empty, true);

    await assertSucceeds(
      setDoc(accountRef, {
        uid: "new-math-student",
        email: newStudentEmail,
        displayName: "New Math Student",
        role: "student",
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    const provisionedSnapshot = await assertSucceeds(getDoc(accountRef));
    assert.equal(provisionedSnapshot.data().role, "student");
  });

  await suite.test("a UID-keyed student profile remains authorized without an email claim", async () => {
    await seedDocuments({
      "apps/drrs-math/users/profile-only-student": {
        uid: "profile-only-student",
        email: profileOnlyStudentEmail,
        displayName: "Profile Only Student",
        role: "student",
        active: true,
      },
    });

    const enrollmentSnapshot = await assertSucceeds(
      getDoc(
        doc(
          profileOnlyStudent.firestore(),
          "apps/drrs-math/studentClasses/profile-only-student",
        ),
      ),
    );
    assert.equal(enrollmentSnapshot.exists(), false);
  });

  await suite.test("a signed-in user can only check their own enrollment document", async () => {
    const ownEnrollment = await assertSucceeds(
      getDoc(doc(outsider.firestore(), "apps/drrs-math/studentClasses/math-outsider")),
    );
    assert.equal(ownEnrollment.exists(), false);
    await assertFails(
      getDoc(doc(outsider.firestore(), "apps/drrs-math/studentClasses/math-student")),
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
        code: "DLTUX5",
        name: "Legacy Algebra I Class",
        teacherUid: "math-teacher",
        teacherEmail,
        studentUids: ["legacy-student"],
        studentEmails: ["legacy-student@student.doralacademynv.org"],
        studentKeys: ["legacy-student"],
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

  await suite.test("a provisioned student can join a legacy classroom code", async () => {
    const database = profileOnlyStudent.firestore();
    const enrollmentRef = doc(database, "apps/drrs-math/studentClasses/profile-only-student");
    const enrollmentSnapshot = await assertSucceeds(getDoc(enrollmentRef));
    assert.equal(enrollmentSnapshot.exists(), false);
    await assertSucceeds(
      getDoc(doc(database, "apps/drrs-math/classJoinCodes/DLTUX5")),
    );

    await assertSucceeds(
      runTransaction(database, async (transaction) => {
        const codeSnapshot = await transaction.get(
          doc(database, "apps/drrs-math/classJoinCodes/DLTUX5"),
        );
        const classRef = doc(database, "apps/drrs-math/classes/DLTUX5");
        await transaction.get(classRef);
        transaction.update(classRef, {
          studentUids: arrayUnion("profile-only-student"),
          studentEmails: arrayUnion(profileOnlyStudentEmail),
          updatedAt: serverTimestamp(),
        });
        transaction.set(enrollmentRef, {
          studentUid: "profile-only-student",
          studentEmail: profileOnlyStudentEmail,
          classId: codeSnapshot.data().classId,
          classCode: "DLTUX5",
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }),
    );
    await assertSucceeds(getDoc(doc(database, "apps/drrs-math/classes/DLTUX5")));
  });

  await suite.test("teachers can load enrolled profiles and shared student submissions", async () => {
    const enrolledProfile = await assertSucceeds(
      getDoc(doc(teacher.firestore(), "apps/drrs-math/users/profile-only-student")),
    );
    assert.equal(enrolledProfile.data().displayName, "Profile Only Student");
    await assertFails(
      getDoc(doc(teacher.firestore(), "apps/drrs-math/users/new-math-student")),
    );

    const submissionRef = doc(
      profileOnlyStudent.firestore(),
      "apps/drrs-math/submissions/DLTUX5__unit-1-parts__profile-only-student",
    );
    await assertSucceeds(
      setDoc(submissionRef, {
        assignmentId: "unit-1-parts",
        assignmentTitle: "Parts of an Expression",
        studentKey: "profile-only-student",
        name: "Profile Only Student",
        correct: 8,
        total: 10,
        percent: 80,
        answered: 10,
        answers: { problem1: { value: "x" } },
        submitted: true,
        submittedAt: "2026-08-05T15:00:00.000Z",
        classId: "DLTUX5",
        studentUid: "profile-only-student",
        studentEmail: profileOnlyStudentEmail,
        updatedAt: serverTimestamp(),
      }),
    );

    const teacherSubmissions = query(
      collection(teacher.firestore(), "apps/drrs-math/submissions"),
      where("classId", "==", "DLTUX5"),
    );
    const studentSubmissions = query(
      collection(profileOnlyStudent.firestore(), "apps/drrs-math/submissions"),
      where("studentUid", "==", "profile-only-student"),
    );
    assert.equal((await assertSucceeds(getDocs(teacherSubmissions))).size, 1);
    assert.equal((await assertSucceeds(getDocs(studentSubmissions))).size, 1);
    await assertFails(
      getDoc(
        doc(
          student.firestore(),
          "apps/drrs-math/submissions/DLTUX5__unit-1-parts__profile-only-student",
        ),
      ),
    );
    await assertSucceeds(
      deleteDoc(
        doc(
          teacher.firestore(),
          "apps/drrs-math/submissions/DLTUX5__unit-1-parts__profile-only-student",
        ),
      ),
    );
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
