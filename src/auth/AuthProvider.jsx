import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
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

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function readAssignedAccount(firebaseUser) {
  if (!firebaseUser.email) return null;

  const uidAccount = accountFromSnapshot(await getDoc(appDoc("users", firebaseUser.uid)), firebaseUser);
  if (uidAccount) return uidAccount;

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
    // Email-indexed account records are optional; users/{uid} is the stable login path.
  }

  if (matchingAccounts.length) {
    return matchingAccounts[0];
  }

  return null;
}

async function readAssignedAccountWithRetry(firebaseUser) {
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await readAssignedAccount(firebaseUser);
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await wait(350 * (attempt + 1));
      }
    }
  }

  throw lastError;
}

async function ensureAuthPersistence() {
  if (!auth) return;
  await setPersistence(auth, browserLocalPersistence);
}

export function AuthProvider({ children }) {
  const deniedMessage = useRef("");
  const accountRef = useRef(null);
  const authUserRef = useRef(null);
  const [status, setStatus] = useState("checking");
  const [authUser, setAuthUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [message, setMessage] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);

  const setAccountState = useCallback((nextAccount) => {
    accountRef.current = nextAccount;
    setAccount(nextAccount);
  }, []);

  const setAuthUserState = useCallback((nextAuthUser) => {
    authUserRef.current = nextAuthUser;
    setAuthUser(nextAuthUser);
  }, []);

  const clearSession = useCallback(async (nextMessage = "") => {
    deniedMessage.current = nextMessage;
    setAccountState(null);
    setAuthUserState(null);
    if (auth) {
      await signOut(auth);
    }
    setMessage(nextMessage);
    setStatus("signedOut");
  }, [setAccountState, setAuthUserState]);

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
        setAuthUserState(null);
        setAccountState(null);
        setStatus("signedOut");
        setMessage(deniedMessage.current);
        return;
      }

      const verifiedAccount = accountRef.current;
      const isSameVerifiedUser = verifiedAccount?.uid === firebaseUser.uid;

      setAuthUserState(firebaseUser);
      if (!isSameVerifiedUser) {
        setStatus("checking");
        setAccountState(null);
      }

      try {
        const assignedAccount = await readAssignedAccountWithRetry(firebaseUser);
        if (!mounted || currentCheck !== checkNumber) return;

        if (!assignedAccount) {
          if (accountRef.current?.uid === firebaseUser.uid) {
            setStatus("assigned");
            return;
          }

          await clearSession(ACCESS_DENIED_MESSAGE);
          return;
        }

        deniedMessage.current = "";
        setAccountState(assignedAccount);
        setMessage("");
        setStatus("assigned");
      } catch {
        if (!mounted || currentCheck !== checkNumber) return;
        if (accountRef.current?.uid === firebaseUser.uid) {
          setStatus("assigned");
          return;
        }

        setMessage("Unable to verify account access. Please refresh and try again.");
        setStatus("signedOut");
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [clearSession, setAccountState, setAuthUserState]);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseConfigured) {
      setMessage(CONFIG_MESSAGE);
      return;
    }

    deniedMessage.current = "";
    setMessage("");
    setSignInLoading(true);

    try {
      await ensureAuthPersistence();
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
