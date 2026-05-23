import { useEffect } from "react";
import { mountAssignmentDashboard } from "../../app";

export default function useAssignmentDashboard() {
  useEffect(() => mountAssignmentDashboard(), []);
}
