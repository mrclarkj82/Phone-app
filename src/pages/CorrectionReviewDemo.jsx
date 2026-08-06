import { useEffect, useMemo, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  demoStudent,
  getCorrectionReviewData,
  getCorrectionExpectedInput,
  getCorrectionReviewStatus,
  getSavedCorrectionReviewProgress,
  getUnitOneCorrectionOptions,
  isCorrectionFollowUpCorrect,
  saveCorrectionReviewProgress,
} from "../../app";
import { useAuth } from "../auth/AuthProvider";
import { appCollection } from "../lib/appFirestore";
import { db, firebaseConfigured } from "../lib/firebase";

const REVEAL_SECONDS = 60;
const CORRECTION_STUDENT_SESSION_KEY = "drrs-math-correction-student-key";

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function makeInitialRecord(saved = {}, followUpProblem = null) {
  const record = {
    revealed: 0,
    elapsedSeconds: 0,
    earlyHelpClicks: 0,
    finalAnswerRevealed: false,
    followUpValue: "",
    followUpMessage: "",
    followUpAttempts: 0,
    mastered: false,
    ...saved,
    followUpMessage: "",
  };
  if (record.mastered && !String(record.followUpValue || "").trim()) {
    record.followUpValue = getCorrectionExpectedInput(followUpProblem);
  }
  return record;
}

function makeReviewUrl(studentKey, assignmentId, mode = "student", classId = "") {
  const query = new URLSearchParams({ studentKey, assignmentId });
  if (mode === "teacher") query.set("mode", "teacher");
  if (classId) query.set("classId", classId);
  return `/corrections?${query.toString()}`;
}

function useSharedCorrectionSubmissions(account, studentKey, classId) {
  const requestKey = `${account?.role || ""}:${account?.uid || ""}:${classId}:${studentKey}`;
  const [result, setResult] = useState({
    requestKey: "",
    submissions: {},
    loading: true,
    error: "",
  });

  useEffect(() => {
    if (!firebaseConfigured || !db || !account?.uid || !studentKey) {
      setResult({ requestKey, submissions: {}, loading: false, error: "" });
      return undefined;
    }

    const isStudent = account.role === "student";
    if (!isStudent && !classId) {
      setResult({ requestKey, submissions: {}, loading: false, error: "" });
      return undefined;
    }

    setResult({ requestKey, submissions: {}, loading: true, error: "" });
    const submissionsQuery = isStudent
      ? query(appCollection("submissions"), where("studentUid", "==", account.uid))
      : query(appCollection("submissions"), where("classId", "==", classId));

    return onSnapshot(
      submissionsQuery,
      (snapshot) => {
        const submissions = {};
        snapshot.docs.forEach((submissionDoc) => {
          const submission = submissionDoc.data();
          if (
            submission.studentKey !== studentKey
            || !submission.assignmentId
            || (classId && submission.classId !== classId)
          ) {
            return;
          }
          submissions[submission.assignmentId] = submission;
        });
        setResult({ requestKey, submissions, loading: false, error: "" });
      },
      (error) => {
        console.error("Unable to load shared correction submissions", error);
        setResult({
          requestKey,
          submissions: {},
          loading: false,
          error: error?.message || "Unable to load submitted corrections.",
        });
      },
    );
  }, [account?.role, account?.uid, classId, requestKey, studentKey]);

  return result.requestKey === requestKey
    ? result
    : { requestKey, submissions: {}, loading: true, error: "" };
}

function ProblemTable({ table }) {
  if (!table?.headers?.length || !table?.rows?.length) return null;

  return (
    <div className="mt-4 max-w-full overflow-x-auto">
      <table className="w-auto min-w-52 border-collapse text-center text-sm">
        <thead>
          <tr>
            {table.headers.map((header) => (
              <th className="border border-slate-300 bg-slate-100 px-4 py-2 font-black" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={`${row.join("-")}-${rowIndex}`}>
              {row.map((value, cellIndex) => (
                <td className="border border-slate-300 bg-white px-4 py-2 font-bold" key={`${value}-${cellIndex}`}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssignmentSwitcher({ assignments, classId, currentId, mode, studentKey }) {
  return (
    <section className="border-b border-slate-200 bg-white" aria-label="Unit 1 correction assignments">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
        <p className="eyebrow">Unit 1 Assignments</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {assignments.map((assignment) => (
            <Link
              className={`min-h-20 rounded-md border px-3 py-3 no-underline transition ${
                assignment.id === currentId
                  ? "border-teal-700 bg-teal-50 text-teal-950"
                  : "border-slate-200 bg-white text-slate-800 hover:border-teal-400"
              }`}
              key={assignment.id}
              to={makeReviewUrl(studentKey, assignment.id, mode, classId)}
            >
              <strong className="block text-sm">{assignment.title}</strong>
              <span className="mt-1 block text-xs font-bold text-slate-500">
                {assignment.submitted
                  ? assignment.status.label
                  : "Not submitted"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewHeader({ canViewTeacher = false, demo, masteredCount, mode }) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="eyebrow">{mode === "teacher" ? "Teacher Correction Monitor" : "Student Correction Review"}</p>
            <h1 className="m-0 text-2xl font-black sm:text-3xl">
              {mode === "teacher" ? "Correction Progress" : "Guided Correction Review"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="m-0 text-sm font-bold text-slate-500">{demo.studentName}</p>
              <p className="m-0 text-lg font-black text-teal-800">
                {masteredCount} / {demo.problems.length} mastered
              </p>
            </div>
            {mode === "teacher" ? (
              <Link className="secondary-button grid min-h-11 place-items-center px-4 no-underline" to="/teacher">
                Back to Teacher
              </Link>
            ) : canViewTeacher ? (
              <Link
                className="secondary-button grid min-h-11 place-items-center px-4 no-underline"
                to={makeReviewUrl(demo.studentKey, demo.assignmentId, "teacher", demo.classId)}
              >
                Teacher View
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-slate-100">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="m-0 text-sm font-black text-teal-800">{demo.unitLabel}</p>
            <h2 className="m-0 mt-1 text-xl font-black">{demo.assignmentTitle}</h2>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-bold">
            <span className="rounded-md border border-slate-200 bg-white px-3 py-2">
              Submitted: {demo.score.correct} / {demo.score.total}
            </span>
            <span className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">
              {demo.problems.length} corrections required
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

function TeacherCorrectionSummary({ assignments, demo, records: initialRecords }) {
  const [records, setRecords] = useState(initialRecords);
  const masteredCount = records.filter((record) => record.mastered).length;
  const status = getCorrectionReviewStatus(demo.studentKey, demo.assignmentId, demo.problems.length);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  useEffect(() => {
    const refresh = () => {
      const saved = getSavedCorrectionReviewProgress(demo.studentKey, demo.assignmentId);
      if (!saved?.records) return;
      const nextRecords = demo.problems.map((problem, index) =>
        makeInitialRecord(saved.records[index], problem.followUp),
      );
      setRecords((current) =>
        JSON.stringify(current) === JSON.stringify(nextRecords) ? current : nextRecords,
      );
    };
    const timer = window.setInterval(refresh, 3000);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
    };
  }, [demo.assignmentId, demo.problems, demo.studentKey]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <ReviewHeader canViewTeacher demo={demo} masteredCount={masteredCount} mode="teacher" />
      <AssignmentSwitcher
        assignments={assignments}
        classId={demo.classId}
        currentId={demo.assignmentId}
        mode="teacher"
        studentKey={demo.studentKey}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <section className="border-y border-slate-200 py-5" aria-labelledby="teacher-status-heading">
          <p className="eyebrow">Overall Status</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="m-0 text-2xl font-black" id="teacher-status-heading">{status.label}</h2>
              <p className="m-0 mt-1 text-sm font-semibold text-slate-600">
                Final answers do not count as mastery. Each problem requires a correct independent follow-up.
              </p>
            </div>
            <Link
              className="primary-button grid min-h-11 place-items-center px-5 no-underline"
              to={makeReviewUrl(demo.studentKey, demo.assignmentId, "student", demo.classId)}
            >
              Open Student Experience
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-3" aria-label="Correction details">
          {demo.problems.map((problem, index) => {
            const record = records[index] || makeInitialRecord();
            const problemState = record.mastered
              ? "Mastered"
              : record.elapsedSeconds || record.revealed || record.followUpAttempts
                ? "In progress"
                : "Not started";
            return (
              <article className="rounded-md border border-slate-200 bg-white p-4" key={problem.id}>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_repeat(4,minmax(90px,auto))] md:items-center">
                  <div className="min-w-0">
                    <p className="eyebrow">Problem {problem.number}</p>
                    <h3 className="m-0 mt-1 text-lg font-black">{problem.type}</h3>
                    <p className="m-0 mt-2 break-words font-bold">{problem.expression}</p>
                    <p className="m-0 mt-1 text-sm text-slate-600">Student answer: {problem.studentAnswer || "Not answered"}</p>
                    {record.mastered ? (
                      <p className="m-0 mt-1 text-sm font-bold text-emerald-700">
                        Saved mastery answer: {record.followUpValue}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase text-slate-500">Status</span>
                    <strong className="mt-1 block">{problemState}</strong>
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase text-slate-500">Time</span>
                    <strong className="mt-1 block">{formatTime(record.elapsedSeconds)}</strong>
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase text-slate-500">Hints</span>
                    <strong className="mt-1 block">{record.revealed} / 3</strong>
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase text-slate-500">Attempts</span>
                    <strong className="mt-1 block">{record.followUpAttempts}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function StudentCorrectionReview({ assignments, canViewTeacher, demo, initialRecords }) {
  const [activeIndex, setActiveIndex] = useState(() => {
    const firstIncomplete = initialRecords.findIndex((record) => !record.mastered);
    return firstIncomplete === -1 ? Math.max(0, demo.problems.length - 1) : firstIncomplete;
  });
  const [countdown, setCountdown] = useState(REVEAL_SECONDS);
  const [records, setRecords] = useState(initialRecords);

  const problem = demo.problems[activeIndex];
  const record = records[activeIndex];
  const masteredCount = records.filter((item) => item.mastered).length;

  function updateRecord(index, updater) {
    setRecords((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? typeof updater === "function"
            ? updater(item)
            : { ...item, ...updater }
          : item,
      ),
    );
  }

  useEffect(() => {
    saveCorrectionReviewProgress(
      demo.studentKey,
      demo.assignmentId,
      records.map(({ followUpMessage, ...savedRecord }) => savedRecord),
    );
  }, [demo.assignmentId, demo.studentKey, records]);

  useEffect(() => {
    setCountdown(REVEAL_SECONDS);
  }, [activeIndex]);

  useEffect(() => {
    if (!record || record.mastered) return undefined;

    const timer = window.setInterval(() => {
      updateRecord(activeIndex, (current) => ({
        ...current,
        elapsedSeconds: current.elapsedSeconds + 1,
      }));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeIndex, record?.mastered]);

  useEffect(() => {
    if (!record || record.mastered || record.revealed >= 3) return undefined;

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current > 1) return current - 1;

        updateRecord(activeIndex, (activeRecord) => {
          const nextReveal = Math.min(3, activeRecord.revealed + 1);
          return {
            ...activeRecord,
            revealed: nextReveal,
            finalAnswerRevealed: nextReveal === 3,
          };
        });
        return REVEAL_SECONDS;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeIndex, record?.mastered, record?.revealed]);

  if (!problem || !record) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <ReviewHeader canViewTeacher={canViewTeacher} demo={demo} masteredCount={0} mode="student" />
        <AssignmentSwitcher assignments={assignments} classId={demo.classId} currentId={demo.assignmentId} mode="student" studentKey={demo.studentKey} />
        <section className="mx-auto w-full max-w-3xl px-4 py-12 text-center sm:px-6">
          <h2 className="m-0 text-2xl font-black">No corrections needed</h2>
          <p className="m-0 mt-2 text-slate-600">Every problem on this submitted assignment was correct.</p>
        </section>
      </main>
    );
  }

  function revealEarly() {
    if (record.revealed >= 3 || record.mastered) return;

    updateRecord(activeIndex, (current) => {
      const nextReveal = Math.min(3, current.revealed + 1);
      return {
        ...current,
        revealed: nextReveal,
        earlyHelpClicks: current.earlyHelpClicks + 1,
        finalAnswerRevealed: nextReveal === 3,
      };
    });
    setCountdown(REVEAL_SECONDS);
  }

  function updateFollowUp(value) {
    updateRecord(activeIndex, {
      followUpValue: value,
      followUpMessage: "",
    });
  }

  function checkFollowUp(event) {
    event.preventDefault();
    const isCorrect = isCorrectionFollowUpCorrect(problem.followUp, record.followUpValue);

    updateRecord(activeIndex, (current) => ({
      ...current,
      followUpAttempts: current.followUpAttempts + 1,
      followUpMessage: isCorrect
        ? "Correct. This correction now counts as mastered."
        : "Not yet. Use the completed example above, then try the new problem again.",
      mastered: isCorrect,
      masteredAt: isCorrect ? current.masteredAt || new Date().toISOString() : current.masteredAt || "",
    }));
  }

  function moveToProblem(index) {
    const previousProblemsComplete = records.slice(0, index).every((item) => item.mastered);
    if (!previousProblemsComplete) return;
    setActiveIndex(index);
  }

  function continueReview() {
    if (activeIndex < demo.problems.length - 1) {
      setActiveIndex((current) => current + 1);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <ReviewHeader canViewTeacher={canViewTeacher} demo={demo} masteredCount={masteredCount} mode="student" />
      <AssignmentSwitcher assignments={assignments} classId={demo.classId} currentId={demo.assignmentId} mode="student" studentKey={demo.studentKey} />

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
        <nav aria-label="Correction problems" className="border-r border-slate-200 pr-4">
          <p className="eyebrow">Corrections</p>
          <div className="mt-3 grid gap-2">
            {demo.problems.map((item, index) => {
              const itemRecord = records[index];
              const isAvailable = records.slice(0, index).every((previous) => previous.mastered);
              return (
                <button
                  className={`flex min-h-12 items-center justify-between rounded-md border px-3 text-left text-sm font-black transition ${
                    index === activeIndex
                      ? "border-teal-700 bg-teal-50 text-teal-950"
                      : "border-slate-200 bg-white text-slate-700"
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                  disabled={!isAvailable}
                  key={item.id}
                  onClick={() => moveToProblem(index)}
                  type="button"
                >
                  <span>Problem {item.number}</span>
                  <span>{itemRecord.mastered ? "Mastered" : index === activeIndex ? "Reviewing" : isAvailable ? "Ready" : "Locked"}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <section aria-labelledby="correction-heading" className="min-w-0">
          <div className="border-b border-slate-200 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Original Incorrect Problem {problem.number}</p>
                <h2 className="m-0 text-xl font-black" id="correction-heading">{problem.type}</h2>
              </div>
              <span className="rounded-md bg-red-100 px-3 py-2 text-sm font-black text-red-800">
                Student answer: {problem.studentAnswer || "Not answered"}
              </span>
            </div>
            <p className="m-0 mt-5 break-words text-2xl font-black">{problem.expression}</p>
            <p className="m-0 mt-2 text-base font-bold text-slate-700">{problem.question}</p>
            <ProblemTable table={problem.table} />
          </div>

          <div className="grid gap-0 py-2">
            {problem.steps.map((step, index) => {
              const revealNumber = index + 1;
              const isVisible = record.revealed >= revealNumber;
              const isNext = record.revealed + 1 === revealNumber;
              return (
                <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-3 border-b border-slate-200 py-5" key={step}>
                  <span className={`grid size-10 place-items-center rounded-full text-sm font-black ${isVisible ? "bg-teal-700 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {revealNumber}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="m-0 text-base font-black">
                        {revealNumber === 1 ? "What the problem is asking" : revealNumber === 2 ? "Important clue" : "Next major step"}
                      </h3>
                      {isNext ? <span className="text-sm font-black text-amber-700">Reveals in {countdown}s</span> : null}
                    </div>
                    <p className={`m-0 mt-2 leading-7 ${isVisible ? "text-slate-700" : "text-slate-400"}`}>
                      {isVisible ? step : "This step is still covered."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {record.revealed < 3 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 py-5">
              <p className="m-0 text-sm font-bold text-slate-600">
                Next reveal in <strong className="text-slate-950">{countdown} seconds</strong>
              </p>
              <button className="secondary-button px-4" onClick={revealEarly} type="button">I need help</button>
            </div>
          ) : (
            <>
              <section className="border-y border-teal-200 bg-teal-50 px-4 py-5">
                <p className="eyebrow">Complete Solution</p>
                <p className="m-0 mt-2 break-words text-lg font-black">Answer: {problem.finalAnswer}</p>
                <p className="m-0 mt-2 leading-7 text-slate-700">{problem.solution}</p>
              </section>

              <section className="mt-6 border-t border-slate-200 pt-6">
                <p className="eyebrow">Independent Mastery Check</p>
                <h3 className="m-0 mt-1 text-lg font-black">New problem</h3>
                <p className="m-0 mt-4 break-words text-xl font-black">{problem.followUp.expression}</p>
                <p className="m-0 mt-2 font-bold text-slate-700">{problem.followUp.equation}</p>
                <ProblemTable table={problem.followUp.table} />
                {record.mastered ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <div>
                      <span className="block text-xs font-black uppercase text-emerald-800">Saved mastery answer</span>
                      <strong className="mt-1 block break-words text-lg text-emerald-950">{record.followUpValue}</strong>
                    </div>
                    <span className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-black text-white">Correct</span>
                  </div>
                ) : (
                  <form className="mt-4 flex flex-wrap gap-3" onSubmit={checkFollowUp}>
                    <input
                      aria-label="Follow-up answer"
                      className="min-h-11 min-w-0 flex-1"
                      onChange={(event) => updateFollowUp(event.target.value)}
                      placeholder={problem.followUp.answerMode === "combineLikeTerms" ? "Enter the simplified expression" : "Enter your answer"}
                      value={record.followUpValue}
                    />
                    <button className="primary-button px-5" type="submit">Check My Answer</button>
                  </form>
                )}
                {record.followUpMessage ? (
                  <p className={`m-0 mt-3 text-sm font-black ${record.mastered ? "text-emerald-700" : "text-red-700"}`} aria-live="polite">
                    {record.followUpMessage}
                  </p>
                ) : null}
              </section>
            </>
          )}

          {record.mastered && activeIndex < demo.problems.length - 1 ? (
            <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
              <button className="primary-button px-5" onClick={continueReview} type="button">Continue to Next Correction</button>
            </div>
          ) : null}

          {record.mastered && activeIndex === demo.problems.length - 1 ? (
            <div className="mt-6 border-y border-emerald-200 bg-emerald-50 px-4 py-5 text-emerald-900">
              <p className="m-0 text-lg font-black">Correction review complete</p>
              <p className="m-0 mt-1 font-semibold">Every follow-up problem was completed independently.</p>
            </div>
          ) : null}
        </section>

        <aside className="border-l border-slate-200 pl-4" aria-label="Review record">
          <p className="eyebrow">Review Record</p>
          <dl className="mt-3 grid gap-0">
            {[
              ["Time working", formatTime(record.elapsedSeconds)],
              ["Hints revealed", `${record.revealed} / 3`],
              ["Early help clicks", record.earlyHelpClicks],
              ["Final answer revealed", record.finalAnswerRevealed ? "Yes" : "No"],
              ["Follow-up attempts", record.followUpAttempts],
              ["Follow-up completed", record.mastered ? "Yes" : "No"],
            ].map(([label, value]) => (
              <div className="border-b border-slate-200 py-3" key={label}>
                <dt className="text-xs font-black uppercase text-slate-500">{label}</dt>
                <dd className="m-0 mt-1 text-lg font-black">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </main>
  );
}

function CorrectionReviewRouter() {
  const { account } = useAuth();
  const [searchParams] = useSearchParams();
  const canViewTeacher = ["teacher", "admin"].includes(account?.role);
  const requestedStudentKey = searchParams.get("studentKey");
  const assignedStudentKey =
    account?.studentKey ||
    account?.rosterKey ||
    (account?.role === "student" ? account?.uid : "") ||
    sessionStorage.getItem(CORRECTION_STUDENT_SESSION_KEY);
  const unauthorizedStudent =
    !canViewTeacher &&
    (!assignedStudentKey || (requestedStudentKey && requestedStudentKey !== assignedStudentKey));

  const studentKey = canViewTeacher
    ? requestedStudentKey || demoStudent.key
    : assignedStudentKey || demoStudent.key;
  const classId = searchParams.get("classId") || "";
  const mode = canViewTeacher && searchParams.get("mode") === "teacher" ? "teacher" : "student";
  const shared = useSharedCorrectionSubmissions(account, studentKey, classId);
  const assignments = useMemo(
    () => getUnitOneCorrectionOptions(studentKey, shared.submissions),
    [shared.submissions, studentKey],
  );
  const requestedAssignmentId = searchParams.get("assignmentId");
  const assignmentId = assignments.some((assignment) => assignment.id === requestedAssignmentId)
    ? requestedAssignmentId
    : assignments[0]?.id;
  const demo = useMemo(
    () => getCorrectionReviewData({
      studentKey,
      assignmentId,
      classId,
      submission: shared.submissions[assignmentId],
    }),
    [assignmentId, classId, shared.submissions, studentKey],
  );
  const initialRecords = useMemo(() => {
    if (!demo) return [];
    const saved = getSavedCorrectionReviewProgress(studentKey, assignmentId);
    return demo.problems.map((problem, index) =>
      makeInitialRecord(saved?.records?.[index], problem.followUp),
    );
  }, [assignmentId, demo, studentKey]);

  if (unauthorizedStudent) {
    return <Navigate replace to="/student" />;
  }

  if (shared.loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center text-slate-950">
        <section className="max-w-xl border-y border-slate-200 py-8">
          <p className="eyebrow">Correction Review</p>
          <h1 className="m-0 mt-2 text-2xl font-black">Loading submitted corrections</h1>
          <p className="m-0 mt-3 text-slate-600">Checking the shared class submission now.</p>
        </section>
      </main>
    );
  }

  if (shared.error && !demo) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center text-slate-950">
        <section className="max-w-xl border-y border-slate-200 py-8">
          <p className="eyebrow">Correction Review</p>
          <h1 className="m-0 mt-2 text-2xl font-black">Unable to load submitted corrections</h1>
          <p className="m-0 mt-3 text-slate-600">{shared.error}</p>
          <Link className="secondary-button mt-5 inline-grid min-h-11 place-items-center px-5 no-underline" to={canViewTeacher ? "/teacher" : "/student"}>Go Back</Link>
        </section>
      </main>
    );
  }

  if (!demo) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center text-slate-950">
        <section className="max-w-xl border-y border-slate-200 py-8">
          <p className="eyebrow">Correction Review</p>
          <h1 className="m-0 mt-2 text-2xl font-black">No submitted correction set found</h1>
          <p className="m-0 mt-3 text-slate-600">This student must submit the selected Unit 1 assignment before corrections can begin.</p>
          <Link className="secondary-button mt-5 inline-grid min-h-11 place-items-center px-5 no-underline" to="/teacher">Back to Teacher</Link>
        </section>
      </main>
    );
  }

  return mode === "teacher" ? (
    <TeacherCorrectionSummary
      assignments={assignments}
      demo={demo}
      key={`${studentKey}:${assignmentId}:teacher`}
      records={initialRecords}
    />
  ) : (
    <StudentCorrectionReview
      assignments={assignments}
      canViewTeacher={canViewTeacher}
      demo={demo}
      initialRecords={initialRecords}
      key={`${studentKey}:${assignmentId}`}
    />
  );
}

export default function CorrectionReviewDemo() {
  return <CorrectionReviewRouter />;
}
