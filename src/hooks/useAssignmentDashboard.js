import { useEffect } from "react";
import { mountAssignmentDashboard } from "../../app";

export default function useAssignmentDashboard(options = {}) {
  const visibleStudentKeys = options.visibleStudentKeys || null;
  const visibleStudentKeySignature = visibleStudentKeys?.join("|") || "";

  useEffect(() => {
    if (options.enabled === false) return undefined;
    return mountAssignmentDashboard({ visibleStudentKeys });
  }, [options.enabled, visibleStudentKeySignature]);
}
