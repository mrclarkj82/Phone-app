import { limit, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { appCollection } from "../lib/appFirestore";

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

    setClassLoaded(false);
    setClassError("");

    const classSource = query(
      appCollection("classes"),
      where("studentUids", "array-contains", account.uid),
      limit(1),
    );

    return onSnapshot(
      classSource,
      (snapshot) => {
        const classDocument = snapshot.docs[0];
        setStudentClass(
          classDocument ? { id: classDocument.id, ...classDocument.data() } : null,
        );
        setClassLoaded(true);
        setClassError("");
      },
      (error) => {
        setClassError(error.message || "Unable to check your class enrollment.");
        setClassLoaded(true);
      },
    );
  }, [account?.uid, account?.role]);

  return { studentClass, classLoaded, classError };
}
