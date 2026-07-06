import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { appCollection, appDoc } from "../lib/appFirestore";
import {
  auth,
  firebaseConfigured,
  missingFirebaseConfig,
} from "../lib/firebase";

const allowedRoles = new Set(["student", "teacher", "admin"]);
const ACCESS_DENIED_MESSAGE =
  "Access denied. Your account has not been assigned access to this app.";
const CONFIG_MESSAGE = "Firebase is not configured for this deployment yet.";

const AuthContext = createContext(null);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isAssignedAccount(account, firebaseUser) {
  return (
    account &&
    account.uid === firebaseUser.uid &&
    normalizeEmail(account.email) === normalizeEmail(firebaseUser.email) &&
    account.active === true &&
    allowedRoles.has(account.role)
  );
}

function accountFromSnapshot(snapshot, firebaseUser) {
  if (!snapshot.exists()) return null;

  const account = snapshot.data();
  return isAssignedAccount(account, firebaseUser)
    ? { id: snapshot.id, ...account }
    : null;
}

async function readAssignedAccount(firebaseUser) {
  if (!firebaseUser.email) return null;

  let matchingAccounts = [];

  try {
    const accountsByEmail = query(
      appCollection("users"),
      where("email", "==", firebaseUser.email),
      limit(3),
    );
    const querySnapshot = await getDocs(accountsByEmail);
    matchingAccounts = querySnapshot.docs
      .map((accountDoc) => accountFromSnapshot(accountDoc, firebaseUser))
      .filter(Boolean);
  } catch {
    // users/{uid} is the canonical rules path and remains the fallback below.
  }

  if (matchingAccounts.length) {
    return matchingAccounts[0];
  }

  return accountFromSnapshot(await getDoc(appDoc("users", firebaseUser.uid)), firebaseUser);
}

export function AuthProvider({ children }) {
  const deniedMessage = useRef("");
  const [status, setStatus] = useState("checking");
  const [authUser, setAuthUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [message, setMessage] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);

  const clearSession = useCallback(async (nextMessage = "") => {
    deniedMessage.current = nextMessage;
    setAccount(null);
    setAuthUser(null);
    if (auth) {
      await signOut(auth);
    }
    setMessage(nextMessage);
    setStatus("signedOut");
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) {
      setMessage(CONFIG_MESSAGE);
      setStatus("signedOut");
      return undefined;
    }

    let mounted = true;
    let checkNumber = 0;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const currentCheck = ++checkNumber;

      if (!firebaseUser) {
        if (!mounted) return;
        setAuthUser(null);
        setAccount(null);
        setStatus("signedOut");
        setMessage(deniedMessage.current);
        return;
      }

      setStatus("checking");
      setAuthUser(firebaseUser);
      setAccount(null);

      try {
        const assignedAccount = await readAssignedAccount(firebaseUser);
        if (!mounted || currentCheck !== checkNumber) return;

        if (!assignedAccount) {
          await clearSession(ACCESS_DENIED_MESSAGE);
          return;
        }

        deniedMessage.current = "";
        setAccount(assignedAccount);
        setMessage("");
        setStatus("assigned");
      } catch {
        if (!mounted || currentCheck !== checkNumber) return;
        await clearSession("Unable to verify account access. Please try again.");
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [clearSession]);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseConfigured) {
      setMessage(CONFIG_MESSAGE);
      return;
    }

    deniedMessage.current = "";
    setMessage("");
    setSignInLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error?.code !== "auth/popup-closed-by-user") {
        setMessage(error?.message || "Google sign-in could not be completed.");
      }
    } finally {
      setSignInLoading(false);
    }
  }, []);

  const signOutCurrentUser = useCallback(async () => {
    await clearSession("");
  }, [clearSession]);

  const value = useMemo(
    () => ({
      account,
      authUser,
      configured: firebaseConfigured,
      message,
      missingFirebaseConfig,
      signInLoading,
      signInWithGoogle,
      signOutCurrentUser,
      status,
    }),
    [account, authUser, message, signInLoading, signInWithGoogle, signOutCurrentUser, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}

export { ACCESS_DENIED_MESSAGE };
