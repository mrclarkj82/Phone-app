import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { appDoc } from "../lib/appFirestore";
import {
  ensureTeacherClass,
  isTeacherStaffAccount,
  teacherClassId,
} from "../lib/classAccess";

export default function useTeacherClass(account) {
  const [teacherClass, setTeacherClass] = useState(null);
  const [classLoaded, setClassLoaded] = useState(false);
  const [classError, setClassError] = useState("");

  useEffect(() => {
    if (!isTeacherStaffAccount(account)) {
      setTeacherClass(null);
      setClassLoaded(true);
      setClassError("");
      return undefined;
    }

    let active = true;
    let unsubscribe = null;
    setClassLoaded(false);
    setClassError("");

    ensureTeacherClass(account)
      .then(() => {
        if (!active) return;
        unsubscribe = onSnapshot(
          appDoc("classes", teacherClassId(account.uid)),
          (snapshot) => {
            if (!active) return;
            setTeacherClass(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
            setClassLoaded(true);
            setClassError("");
          },
          (error) => {
            if (!active) return;
            setClassError(error.message || "Unable to load your class code.");
            setClassLoaded(true);
          },
        );
      })
      .catch((error) => {
        if (!active) return;
        setClassError(error.message || "Unable to create your class code.");
        setClassLoaded(true);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [account?.uid, account?.role, account?.email, account?.displayName]);

  return { teacherClass, classLoaded, classError };
}
