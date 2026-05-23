import { Route, Routes } from "react-router-dom";
import EntryGate from "./routes/EntryGate";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<EntryGate />} />
      <Route path="/" element={<EntryGate />} />
      <Route path="/dashboard" element={<EntryGate />} />
      <Route
        path="/student"
        element={
          <EntryGate allowedRole="student">
            <StudentDashboard />
          </EntryGate>
        }
      />
      <Route
        path="/teacher"
        element={
          <EntryGate allowedRoles={["teacher", "admin"]}>
            <TeacherDashboard />
          </EntryGate>
        }
      />
      <Route
        path="/admin"
        element={
          <EntryGate allowedRole="admin">
            <AdminDashboard />
          </EntryGate>
        }
      />
      <Route path="*" element={<EntryGate />} />
    </Routes>
  );
}
