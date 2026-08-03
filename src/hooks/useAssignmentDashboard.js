import { useEffect } from "react";
import { mountAssignmentDashboard } from "../../app";

export default function useAssignmentDashboard(options = {}) {
  const visibleStudentKeys = options.visibleStudentKeys || null;
  const visibleStudentKeySignature = visibleStudentKeys?.join("|") || "";
  const accountSignature = options.account
    ? `${options.account.uid || ""}:${options.account.role || ""}`
    : "";
  const studentSignature = options.student
    ? `${options.student.key || ""}:${options.student.name || ""}`
    : "";
  const activeClassId = options.activeClassId || "";

  useEffect(() => {
    if (options.enabled === false) return undefined;
    return mountAssignmentDashboard({
      account: options.account || null,
      activeClassId,
      student: options.student || null,
      visibleStudentKeys,
    });
  }, [options.enabled, visibleStudentKeySignature, accountSignature, activeClassId, studentSignature]);
}
