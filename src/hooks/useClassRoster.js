import { getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { appDoc } from "../lib/appFirestore";

function fallbackStudent(teacherClass, studentUid, index) {
  const email = Array.isArray(teacherClass?.studentEmails)
    ? teacherClass.studentEmails[index] || ""
    : "";

  return {
    key: studentUid,
    name: email || "Enrolled student",
    email,
  };
}

export default function useClassRoster(account, teacherClass) {
  const [students, setStudents] = useState([]);
  const [rosterLoaded, setRosterLoaded] = useState(false);
  const [rosterError, setRosterError] = useState("");
  const studentUidSignature = Array.isArray(teacherClass?.studentUids)
    ? teacherClass.studentUids.join("|")
    : "";

  useEffect(() => {
    const studentUids = Array.isArray(teacherClass?.studentUids)
      ? [...new Set(teacherClass.studentUids.filter(Boolean))]
      : [];

    if (!account?.uid || !teacherClass?.id || !studentUids.length) {
      setStudents([]);
      setRosterLoaded(true);
      setRosterError("");
      return undefined;
    }

    let active = true;
    setRosterLoaded(false);
    setRosterError("");

    Promise.all(
      studentUids.map(async (studentUid, index) => {
        const fallback = fallbackStudent(teacherClass, studentUid, index);
        try {
          const snapshot = await getDoc(appDoc("users", studentUid));
          if (!snapshot.exists()) return fallback;
          const profile = snapshot.data();
          return {
            key: studentUid,
            name: profile.displayName || profile.email || fallback.name,
            email: profile.email || fallback.email,
          };
        } catch {
          return fallback;
        }
      }),
    )
      .then((loadedStudents) => {
        if (!active) return;
        setStudents(loadedStudents);
        setRosterLoaded(true);
      })
      .catch((error) => {
        if (!active) return;
        setStudents(studentUids.map((studentUid, index) =>
          fallbackStudent(teacherClass, studentUid, index)));
        setRosterError(error.message || "Unable to load the enrolled student roster.");
        setRosterLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [account?.uid, teacherClass?.id, studentUidSignature]);

  return { students, rosterLoaded, rosterError };
}
