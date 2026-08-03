import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { appDoc } from "../lib/appFirestore";

export default function useStudentClass(account) {
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

    let classUnsubscribe = null;
    setClassLoaded(false);
    setClassError("");

    const enrollmentUnsubscribe = onSnapshot(
      appDoc("studentClasses", account.uid),
      (enrollmentSnapshot) => {
        classUnsubscribe?.();
        classUnsubscribe = null;

        if (!enrollmentSnapshot.exists() || !enrollmentSnapshot.data().classId) {
          setStudentClass(null);
          setClassLoaded(true);
          setClassError("");
          return;
        }

        classUnsubscribe = onSnapshot(
          appDoc("classes", enrollmentSnapshot.data().classId),
          (classSnapshot) => {
            setStudentClass(
              classSnapshot.exists() ? { id: classSnapshot.id, ...classSnapshot.data() } : null,
            );
            setClassLoaded(true);
            setClassError("");
          },
          (error) => {
            setClassError(error.message || "Unable to load your class.");
            setClassLoaded(true);
          },
        );
      },
      (error) => {
        setClassError(error.message || "Unable to check your class enrollment.");
        setClassLoaded(true);
      },
    );

    return () => {
      classUnsubscribe?.();
      enrollmentUnsubscribe();
    };
  }, [account?.uid, account?.role]);

  return { studentClass, classLoaded, classError };
}
