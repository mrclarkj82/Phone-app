import { getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { appDoc } from "../lib/appFirestore";

export default function useStudentClass(account, refreshKey = 0) {
  const [studentClass, setStudentClass] = useState(null);
  const [classLoaded, setClassLoaded] = useState(false);
  const [classError, setClassError] = useState("");

  useEffect(() => {
    if (account?.role !== "student" || !account.uid) {
      setStudentClass(null);
      setClassLoaded(true);
      setClassError("");
      return undefined;
    }

    let active = true;
    setClassLoaded(false);
    setClassError("");

    async function loadStudentClass() {
      try {
        const enrollmentSnapshot = await getDoc(appDoc("studentClasses", account.uid));
        if (!active) return;

        if (!enrollmentSnapshot.exists() || !enrollmentSnapshot.data().classId) {
          setStudentClass(null);
          setClassLoaded(true);
          setClassError("");
          return;
        }

        const classSnapshot = await getDoc(
          appDoc("classes", enrollmentSnapshot.data().classId),
        );
        if (!active) return;

        setStudentClass(
          classSnapshot.exists() ? { id: classSnapshot.id, ...classSnapshot.data() } : null,
        );
        setClassLoaded(true);
        setClassError("");
      } catch (error) {
        if (!active) return;
        setStudentClass(null);
        setClassError(error.message || "Unable to check your class enrollment.");
        setClassLoaded(true);
      }
    }

    loadStudentClass();

    return () => {
      active = false;
    };
  }, [account?.uid, account?.role, refreshKey]);

  return { studentClass, classLoaded, classError };
}
