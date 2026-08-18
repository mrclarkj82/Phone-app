import { useEffect } from "react";
import { mountAssignmentDashboard } from "../../app";

export default function useAssignmentDashboard(options = {}) {
  const visibleStudentKeys = options.visibleStudentKeys || null;
  const visibleStudentKeySignature = visibleStudentKeys?.join("|") || "";
  const visibleStudents = options.visibleStudents || null;
  const visibleStudentSignature = visibleStudents
    ?.map((student) => `${student.key || ""}:${student.name || ""}:${student.email || ""}`)
    .join("|") || "";
  const accountSignature = options.account
    ? `${options.account.uid || ""}:${options.account.role || ""}`
    : "";
  const studentSignature = options.student
    ? `${options.student.key || ""}:${options.student.name || ""}`
    : "";
  const activeClassId = options.activeClassId || "";
  const initialAssignmentId = options.initialAssignmentId || "";

  useEffect(() => {
    if (options.enabled === false) return undefined;
    return mountAssignmentDashboard({
      account: options.account || null,
      activeClassId,
      initialAssignmentId,
      student: options.student || null,
      visibleStudentKeys,
      visibleStudents,
    });
  }, [
    options.enabled,
    visibleStudentKeySignature,
    visibleStudentSignature,
    accountSignature,
    activeClassId,
    initialAssignmentId,
    studentSignature,
  ]);
}
