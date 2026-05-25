import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { startCoordinateGraphRepair } from "./coordinateGraphRepair";
import { startStudentWorkScrollGuard } from "./studentWorkScrollGuard";
import "./index.css";
import "./teacherEnhancements.css";

const REDIRECT_KEY = "github-pages-spa-redirect";
const restoredPath = window.sessionStorage.getItem(REDIRECT_KEY);

if (restoredPath) {
  window.sessionStorage.removeItem(REDIRECT_KEY);
  window.history.replaceState(null, "", restoredPath);
}

function getRouterBasename() {
  const baseUrl = import.meta.env.BASE_URL;
  return baseUrl === "/" ? "/" : baseUrl.replace(/\/$/, "");
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter basename={getRouterBasename()}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
);

startCoordinateGraphRepair();
startStudentWorkScrollGuard();
