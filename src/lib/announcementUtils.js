import { Timestamp } from "firebase/firestore";

export const announcementTypes = [
  { value: "general", label: "General" },
  { value: "class-reminder", label: "Class Reminder" },
  { value: "assignment-reminder", label: "Assignment Reminder" },
  { value: "testing", label: "Testing" },
  { value: "schedule-change", label: "Schedule Change" },
  { value: "important-alert", label: "Important Alert" },
  { value: "video-announcement", label: "Video Announcement" },
];

export const announcementPriorities = [
  { value: "normal", label: "Normal" },
  { value: "important", label: "Important" },
  { value: "urgent", label: "Urgent" },
];

export const announcementAudiences = [
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
  { value: "both", label: "Students and Teachers" },
];

export function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value || "";
}

export function cleanAnnouncementId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);
}

export function dateInputToTimestamp(value, endOfDay = false) {
  if (!value) return null;
  const suffix = endOfDay ? "T23:59:59" : "T00:00:00";
  const date = new Date(`${value}${suffix}`);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
}

export function valueToMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function valueToDateInput(value) {
  const millis = valueToMillis(value);
  if (!millis) return "";
  return new Date(millis).toISOString().slice(0, 10);
}

export function formatAnnouncementDate(value) {
  const millis = valueToMillis(value);
  if (!millis) return "Manual";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(millis));
}

export function normalizeAnnouncement(id, data = {}) {
  return {
    id,
    title: data.title || "",
    body: data.body || "",
    type: data.type || "general",
    priority: data.priority || "normal",
    targetAudience: data.targetAudience || "both",
    active: data.active === true,
    archived: data.archived === true,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    linkUrl: data.linkUrl || "",
    videoUrl: data.videoUrl || "",
    imageUrl: data.imageUrl || "",
    createdBy: data.createdBy || "",
    createdByEmail: data.createdByEmail || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export function isAnnouncementInDateWindow(announcement, now = Date.now()) {
  const start = valueToMillis(announcement.startDate);
  const end = valueToMillis(announcement.endDate);
  return (!start || now >= start) && (!end || now <= end);
}

export function roleAudienceValues(role) {
  if (role === "student") return ["students", "both"];
  if (role === "teacher") return ["teachers", "both"];
  if (role === "admin") return ["students", "teachers", "both"];
  return [];
}

export function isAnnouncementForRole(announcement, role) {
  return roleAudienceValues(role).includes(announcement.targetAudience);
}

export function isAnnouncementVisible(announcement, role, now = Date.now()) {
  return (
    announcement.active === true &&
    announcement.archived !== true &&
    isAnnouncementForRole(announcement, role) &&
    isAnnouncementInDateWindow(announcement, now)
  );
}

export function getAnnouncementScheduleState(announcement, now = Date.now()) {
  if (announcement.archived) return "Archived";
  if (!announcement.active) return "Inactive";
  const start = valueToMillis(announcement.startDate);
  const end = valueToMillis(announcement.endDate);
  if (start && now < start) return "Scheduled";
  if (end && now > end) return "Expired";
  return "Active";
}

export function safeHttpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

export function getVideoEmbed(videoUrl) {
  const safeUrl = safeHttpUrl(videoUrl);
  if (!safeUrl) return null;

  const url = new URL(safeUrl);
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id
      ? { kind: "iframe", src: `https://www.youtube.com/embed/${id}`, label: "YouTube video" }
      : { kind: "link", src: safeUrl };
  }

  if (host.endsWith("youtube.com")) {
    const embedMatch = url.pathname.match(/\/embed\/([^/]+)/);
    const id = embedMatch?.[1] || url.searchParams.get("v");
    return id
      ? { kind: "iframe", src: `https://www.youtube.com/embed/${id}`, label: "YouTube video" }
      : { kind: "link", src: safeUrl };
  }

  if (host === "drive.google.com") {
    const driveId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
    return driveId
      ? {
          kind: "iframe",
          src: `https://drive.google.com/file/d/${driveId}/preview`,
          label: "Google Drive video",
        }
      : { kind: "link", src: safeUrl };
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url.pathname)) {
    return { kind: "video", src: safeUrl, label: "Video announcement" };
  }

  return { kind: "link", src: safeUrl };
}
