import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { roster } from "../../app";
import PrivateHeader from "../components/PrivateHeader";
import { db } from "../lib/firebase";

const emptyAccountForm = {
  uid: "",
  email: "",
  displayName: "",
  role: "student",
  active: true,
};

const emptyClassForm = {
  id: "",
  name: "",
  period: "",
  teacherUid: "",
  studentKeys: [],
};

const roleLabels = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function cleanId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readSnapshot(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function sortByName(left, right) {
  const leftName = left.displayName || left.name || left.email || "";
  const rightName = right.displayName || right.name || right.email || "";
  return leftName.localeCompare(rightName);
}

export default function AdminDashboard() {
  const [accounts, setAccounts] = useState([]);
  const [classes, setClasses] = useState([]);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [editingAccountUid, setEditingAccountUid] = useState("");
  const [editingClassId, setEditingClassId] = useState("");
  const [message, setMessage] = useState("Admin connected. Manage teachers, students, and classes here.");
  const [messageTone, setMessageTone] = useState("neutral");
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingClass, setSavingClass] = useState(false);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => setAccounts(readSnapshot(snapshot)),
      (error) => {
        setMessage(error.message || "Unable to load assigned accounts.");
        setMessageTone("danger");
      },
    );

    const unsubscribeClasses = onSnapshot(
      collection(db, "classes"),
      (snapshot) => setClasses(readSnapshot(snapshot)),
      (error) => {
        setMessage(error.message || "Unable to load classes.");
        setMessageTone("danger");
      },
    );

    return () => {
      unsubscribeUsers();
      unsubscribeClasses();
    };
  }, []);

  const sortedAccounts = useMemo(() => [...accounts].sort(sortByName), [accounts]);

  const teachers = useMemo(
    () =>
      sortedAccounts.filter(
        (account) =>
          (account.role === "teacher" || account.role === "admin") && account.active !== false,
      ),
    [sortedAccounts],
  );

  const accountByUid = useMemo(
    () => new Map(accounts.map((account) => [account.uid || account.id, account])),
    [accounts],
  );

  const sortedClasses = useMemo(
    () =>
      [...classes].sort((left, right) =>
        (left.name || left.id || "").localeCompare(right.name || right.id || ""),
      ),
    [classes],
  );

  function updateAccountField(field, value) {
    setAccountForm((current) => ({ ...current, [field]: value }));
  }

  function updateClassField(field, value) {
    setClassForm((current) => ({ ...current, [field]: value }));
  }

  function clearAccountForm() {
    setEditingAccountUid("");
    setAccountForm(emptyAccountForm);
  }

  function clearClassForm() {
    setEditingClassId("");
    setClassForm(emptyClassForm);
  }

  function editAccount(account) {
    setEditingAccountUid(account.uid || account.id);
    setAccountForm({
      uid: account.uid || account.id || "",
      email: account.email || "",
      displayName: account.displayName || "",
      role: account.role || "student",
      active: account.active !== false,
    });
    setMessage(`Editing ${account.displayName || account.email}.`);
    setMessageTone("neutral");
  }

  function editClass(classRecord) {
    setEditingClassId(classRecord.id);
    setClassForm({
      id: classRecord.id || "",
      name: classRecord.name || "",
      period: classRecord.period || "",
      teacherUid: classRecord.teacherUid || "",
      studentKeys: Array.isArray(classRecord.studentKeys)
        ? classRecord.studentKeys
        : Array.isArray(classRecord.studentUids)
          ? classRecord.studentUids
          : [],
    });
    setMessage(`Editing ${classRecord.name || classRecord.id}.`);
    setMessageTone("neutral");
  }

  async function saveAccount(event) {
    event.preventDefault();

    const uid = accountForm.uid.trim();
    const email = normalizeEmail(accountForm.email);
    const displayName = accountForm.displayName.trim();
    const role = accountForm.role;

    if (!uid || !email || !displayName) {
      setMessage("Enter the Firebase UID, email, and display name.");
      setMessageTone("warning");
      return;
    }

    setSavingAccount(true);
    try {
      const payload = {
        uid,
        email,
        displayName,
        role,
        active: accountForm.active,
        updatedAt: serverTimestamp(),
      };

      if (!editingAccountUid) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(doc(db, "users", uid), payload, { merge: true });

      if (role === "teacher") {
        await setDoc(
          doc(db, "teachers", email),
          {
            uid,
            email,
            displayName,
            active: accountForm.active,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      setMessage(`${displayName} saved as ${roleLabels[role]}.`);
      setMessageTone("success");
      clearAccountForm();
    } catch (error) {
      setMessage(error.message || "Unable to save account.");
      setMessageTone("danger");
    } finally {
      setSavingAccount(false);
    }
  }

  async function deleteAccount(account) {
    const uid = account.uid || account.id;
    if (!uid) return;

    const confirmed = window.confirm(`Remove ${account.displayName || account.email} from app access?`);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "users", uid));
      if (account.role === "teacher" && account.email) {
        await deleteDoc(doc(db, "teachers", normalizeEmail(account.email)));
      }
      setMessage(`${account.displayName || account.email} was removed.`);
      setMessageTone("success");
      if (editingAccountUid === uid) clearAccountForm();
    } catch (error) {
      setMessage(error.message || "Unable to remove account.");
      setMessageTone("danger");
    }
  }

  async function saveClass(event) {
    event.preventDefault();

    const classId = editingClassId || cleanId(classForm.id || `${classForm.period}-${classForm.name}`);
    const name = classForm.name.trim();
    const teacher = accountByUid.get(classForm.teacherUid);
    const studentKeys = classForm.studentKeys.filter(Boolean);

    if (!classId || !name || !classForm.teacherUid) {
      setMessage("Enter a class ID, class name, and teacher.");
      setMessageTone("warning");
      return;
    }

    if (!studentKeys.length) {
      setMessage("Assign at least one student to this class.");
      setMessageTone("warning");
      return;
    }

    setSavingClass(true);
    try {
      const payload = {
        name,
        period: classForm.period.trim(),
        teacherUid: classForm.teacherUid,
        teacherEmail: teacher?.email || "",
        studentKeys,
        updatedAt: serverTimestamp(),
      };

      if (!editingClassId) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(doc(db, "classes", classId), payload, { merge: true });

      if (teacher?.email) {
        await setDoc(
          doc(db, "teachers", normalizeEmail(teacher.email)),
          {
            uid: teacher.uid || teacher.id,
            email: teacher.email,
            displayName: teacher.displayName || "",
            active: teacher.active !== false,
            classIds: arrayUnion(classId),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      setMessage(`${name} saved with ${studentKeys.length} students.`);
      setMessageTone("success");
      clearClassForm();
    } catch (error) {
      setMessage(error.message || "Unable to save class.");
      setMessageTone("danger");
    } finally {
      setSavingClass(false);
    }
  }

  async function deleteClass(classRecord) {
    const confirmed = window.confirm(`Delete ${classRecord.name || classRecord.id}?`);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "classes", classRecord.id));
      setMessage(`${classRecord.name || classRecord.id} was deleted.`);
      setMessageTone("success");
      if (editingClassId === classRecord.id) clearClassForm();
    } catch (error) {
      setMessage(error.message || "Unable to delete class.");
      setMessageTone("danger");
    }
  }

  function toggleClassStudent(uid) {
    setClassForm((current) => {
      const studentKeys = new Set(current.studentKeys);
      if (studentKeys.has(uid)) {
        studentKeys.delete(uid);
      } else {
        studentKeys.add(uid);
      }
      return { ...current, studentKeys: [...studentKeys] };
    });
  }

  const statusClasses = {
    danger: "border-red-200 bg-red-50 text-red-800",
    neutral: "border-slate-200 bg-white text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <PrivateHeader eyebrow="Algebra I" title="Admin Dashboard">
        <div className="header-stats" aria-label="Admin summary">
          <span>
            <strong>{teachers.length}</strong> teachers
          </span>
          <span>
            <strong>{roster.length}</strong> students
          </span>
          <span>
            <strong>{classes.length}</strong> classes
          </span>
        </div>
      </PrivateHeader>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${statusClasses[messageTone]}`}>
          {message}
        </div>

        <section className="grid gap-5 lg:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.1fr)]">
          <form
            className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60"
            onSubmit={saveAccount}
          >
            <div>
              <p className="eyebrow">App Access</p>
              <h2 className="m-0 text-2xl font-black">
                {editingAccountUid ? "Edit Account" : "Add Teacher Or Student"}
              </h2>
            </div>

            <label className="grid gap-1.5">
              Firebase UID
              <input
                autoComplete="off"
                disabled={Boolean(editingAccountUid)}
                onChange={(event) => updateAccountField("uid", event.target.value)}
                placeholder="Paste the Firebase Authentication UID"
                value={accountForm.uid}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                Display name
                <input
                  autoComplete="name"
                  onChange={(event) => updateAccountField("displayName", event.target.value)}
                  value={accountForm.displayName}
                />
              </label>
              <label className="grid gap-1.5">
                Email
                <input
                  autoComplete="email"
                  onChange={(event) => updateAccountField("email", event.target.value)}
                  type="email"
                  value={accountForm.email}
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="grid gap-1.5">
                Role
                <select
                  onChange={(event) => updateAccountField("role", event.target.value)}
                  value={accountForm.role}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-3 self-end rounded-md border border-slate-200 px-3 text-slate-700">
                <input
                  checked={accountForm.active}
                  className="h-4 min-h-0 w-4"
                  onChange={(event) => updateAccountField("active", event.target.checked)}
                  type="checkbox"
                />
                Active
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="primary-button px-4" disabled={savingAccount} type="submit">
                {savingAccount ? "Saving..." : editingAccountUid ? "Update Account" : "Save Account"}
              </button>
              <button className="secondary-button px-4" onClick={clearAccountForm} type="button">
                Clear
              </button>
            </div>
          </form>

          <form
            className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60"
            onSubmit={saveClass}
          >
            <div>
              <p className="eyebrow">Classes</p>
              <h2 className="m-0 text-2xl font-black">
                {editingClassId ? "Edit Class" : "Create Class"}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1.5">
                Class ID
                <input
                  autoComplete="off"
                  disabled={Boolean(editingClassId)}
                  onChange={(event) => updateClassField("id", event.target.value)}
                  placeholder="period-1"
                  value={classForm.id}
                />
              </label>
              <label className="grid gap-1.5 sm:col-span-2">
                Class name
                <input
                  autoComplete="off"
                  onChange={(event) => updateClassField("name", event.target.value)}
                  placeholder="Algebra I Period 1"
                  value={classForm.name}
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                Period
                <input
                  autoComplete="off"
                  onChange={(event) => updateClassField("period", event.target.value)}
                  placeholder="1"
                  value={classForm.period}
                />
              </label>
              <label className="grid gap-1.5">
                Teacher
                <select
                  onChange={(event) => updateClassField("teacherUid", event.target.value)}
                  value={classForm.teacherUid}
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.uid || teacher.id} value={teacher.uid || teacher.id}>
                      {teacher.displayName || teacher.email}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-2">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="eyebrow">Students</p>
                  <h3 className="m-0 text-lg font-black">Assigned To Class</h3>
                </div>
                <span className="text-sm font-bold text-slate-500">
                  {classForm.studentKeys.length} selected
                </span>
              </div>
              <div className="grid max-h-80 gap-2 overflow-auto pr-1 sm:grid-cols-2">
                {roster.length ? (
                  roster.map((student) => {
                    const uid = student.key;
                    return (
                      <label
                        className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-md border border-slate-200 bg-slate-50 p-3"
                        key={uid}
                      >
                        <input
                          checked={classForm.studentKeys.includes(uid)}
                          className="mt-1 h-4 min-h-0 w-4"
                          onChange={() => toggleClassStudent(uid)}
                          type="checkbox"
                        />
                        <span className="min-w-0">
                          <strong className="block truncate">{student.name}</strong>
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <div className="rounded-md border border-dashed border-slate-300 p-4 text-center font-bold text-slate-500 sm:col-span-2">
                    Add active student accounts before creating a class.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="primary-button px-4" disabled={savingClass} type="submit">
                {savingClass ? "Saving..." : editingClassId ? "Update Class" : "Save Class"}
              </button>
              <button className="secondary-button px-4" onClick={clearClassForm} type="button">
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="eyebrow">Directory</p>
                <h2 className="m-0 text-xl font-black">Assigned Accounts</h2>
              </div>
              <span className="font-black text-slate-500">{accounts.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[760px]">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAccounts.map((account) => (
                    <tr key={account.uid || account.id}>
                      <td className="font-black">{account.displayName || "Unnamed"}</td>
                      <td>{roleLabels[account.role] || account.role}</td>
                      <td>
                        <span className={`status-pill ${account.active === false ? "" : "is-submitted"}`}>
                          {account.active === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td>{account.email}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="secondary-button table-reset-button"
                            onClick={() => editAccount(account)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="secondary-button table-reset-button"
                            onClick={() => deleteAccount(account)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!sortedAccounts.length && (
                    <tr>
                      <td className="text-center font-bold text-slate-500" colSpan="5">
                        No assigned accounts yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="eyebrow">Roster Groups</p>
                <h2 className="m-0 text-xl font-black">Classes</h2>
              </div>
              <span className="font-black text-slate-500">{classes.length}</span>
            </div>
            <div className="grid gap-3 p-4">
              {sortedClasses.map((classRecord) => {
                const studentKeys = Array.isArray(classRecord.studentKeys)
                  ? classRecord.studentKeys
                  : Array.isArray(classRecord.studentUids)
                    ? classRecord.studentUids
                    : [];
                const studentNames = studentKeys
                  .map((key) => roster.find((student) => student.key === key)?.name)
                  .filter(Boolean);

                return (
                  <article className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4" key={classRecord.id}>
                    <div>
                      <p className="eyebrow">{classRecord.period ? `Period ${classRecord.period}` : classRecord.id}</p>
                      <h3 className="m-0 text-lg font-black">{classRecord.name || classRecord.id}</h3>
                      <p className="m-0 mt-1 text-sm font-semibold text-slate-600">
                        {classRecord.teacherUid ? "Teacher assigned" : "No teacher selected"}
                      </p>
                    </div>
                    <p className="m-0 text-sm leading-6 text-slate-600">
                      {studentNames.length ? studentNames.join(", ") : "No students assigned"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="secondary-button table-reset-button"
                        onClick={() => editClass(classRecord)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="secondary-button table-reset-button"
                        onClick={() => deleteClass(classRecord)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
              {!sortedClasses.length && (
                <div className="rounded-md border border-dashed border-slate-300 p-6 text-center font-bold text-slate-500">
                  No classes have been created yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
