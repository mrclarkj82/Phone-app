export function roleHome(role) {
  if (role === "teacher") return "/teacher";
  if (role === "admin") return "/admin";
  return "/student";
}
