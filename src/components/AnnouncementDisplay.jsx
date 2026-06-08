import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { db, firebaseConfigured } from "../lib/firebase";
import {
  announcementAudiences,
  announcementPriorities,
  announcementTypes,
  formatAnnouncementDate,
  getVideoEmbed,
  isAnnouncementVisible,
  normalizeAnnouncement,
  optionLabel,
  roleAudienceValues,
  safeHttpUrl,
} from "../lib/announcementUtils";

const priorityStyles = {
  normal: {
    card: "border-slate-200 bg-white",
    badge: "bg-slate-100 text-slate-700",
    label: "Normal",
  },
  important: {
    card: "border-amber-300 bg-amber-50",
    badge: "bg-amber-200 text-amber-950",
    label: "Important",
  },
  urgent: {
    card: "border-red-300 bg-red-50",
    badge: "bg-red-600 text-white",
    label: "Urgent",
  },
};

function readKey(userId, announcementId) {
  return `${userId}_${announcementId}`.replace(/[^A-Za-z0-9_-]/g, "-");
}

function renderBody(body) {
  return String(body || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function AnnouncementMedia({ announcement }) {
  const imageUrl = safeHttpUrl(announcement.imageUrl);
  const linkUrl = safeHttpUrl(announcement.linkUrl);
  const video = getVideoEmbed(announcement.videoUrl);

  return (
    <div className="grid gap-3">
      {imageUrl ? (
        <img
          alt=""
          className="max-h-72 w-full rounded-md border border-slate-200 object-cover"
          loading="lazy"
          src={imageUrl}
        />
      ) : null}

      {video?.kind === "iframe" ? (
        <div className="aspect-video overflow-hidden rounded-md border border-slate-200 bg-slate-950">
          <iframe
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
            loading="lazy"
            src={video.src}
            title={announcement.title || video.label}
          />
        </div>
      ) : null}

      {video?.kind === "video" ? (
        <video className="w-full rounded-md border border-slate-200" controls preload="metadata">
          <source src={video.src} />
        </video>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {linkUrl ? (
          <a
            className="secondary-button table-reset-button inline-grid min-h-10 place-items-center px-3"
            href={linkUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open Link
          </a>
        ) : null}
        {video?.kind === "link" ? (
          <a
            className="secondary-button table-reset-button inline-grid min-h-10 place-items-center px-3"
            href={video.src}
            rel="noreferrer"
            target="_blank"
          >
            Open Video Announcement
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function AnnouncementCard({
  announcement,
  onDismiss,
  showDismiss = false,
  showMeta = true,
}) {
  const styles = priorityStyles[announcement.priority] || priorityStyles.normal;
  const paragraphs = renderBody(announcement.body);

  return (
    <article className={`grid gap-3 rounded-lg border p-4 shadow-sm ${styles.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">
            {optionLabel(announcementTypes, announcement.type)}
          </p>
          <h3 className="m-0 text-xl font-black text-slate-950">{announcement.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${styles.badge}`}>
          {styles.label}
        </span>
      </div>

      {paragraphs.length ? (
        <div className="grid gap-2 text-sm font-semibold leading-6 text-slate-700">
          {paragraphs.map((paragraph) => (
            <p className="m-0" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      <AnnouncementMedia announcement={announcement} />

      {showMeta ? (
        <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
          <span>{optionLabel(announcementAudiences, announcement.targetAudience)}</span>
          <span>
            {formatAnnouncementDate(announcement.startDate)} -{" "}
            {formatAnnouncementDate(announcement.endDate)}
          </span>
        </div>
      ) : null}

      {showDismiss && announcement.priority !== "urgent" ? (
        <div>
          <button
            className="secondary-button table-reset-button"
            onClick={() => onDismiss?.(announcement)}
            type="button"
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function AnnouncementDisplay({ audienceRole, className = "" }) {
  const { account } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [reads, setReads] = useState(new Map());
  const [loadError, setLoadError] = useState("");
  const [closedUrgentIds, setClosedUrgentIds] = useState([]);
  const readMarked = useRef(new Set());
  const role = audienceRole || account?.role;

  useEffect(() => {
    if (!firebaseConfigured || !db || !account || !role) return undefined;
    const audienceValues = roleAudienceValues(role);
    if (!audienceValues.length) return undefined;

    const announcementQuery = query(
      collection(db, "announcements"),
      where("active", "==", true),
      where("archived", "==", false),
      where("targetAudience", "in", audienceValues),
    );

    const unsubscribe = onSnapshot(
      announcementQuery,
      (snapshot) => {
        setAnnouncements(
          snapshot.docs
            .map((item) => normalizeAnnouncement(item.id, item.data()))
            .sort((left, right) => {
              const leftPriority = left.priority === "urgent" ? 0 : left.priority === "important" ? 1 : 2;
              const rightPriority =
                right.priority === "urgent" ? 0 : right.priority === "important" ? 1 : 2;
              return leftPriority - rightPriority || left.title.localeCompare(right.title);
            }),
        );
        setLoadError("");
      },
      (error) => setLoadError(error.message || "Unable to load announcements."),
    );

    return unsubscribe;
  }, [account, role]);

  useEffect(() => {
    if (!firebaseConfigured || !db || !account?.uid) return undefined;

    const readsQuery = query(
      collection(db, "announcementReads"),
      where("userId", "==", account.uid),
    );

    const unsubscribe = onSnapshot(readsQuery, (snapshot) => {
      setReads(new Map(snapshot.docs.map((item) => [item.data().announcementId, item.data()])));
    });

    return unsubscribe;
  }, [account?.uid]);

  const visibleAnnouncements = useMemo(
    () =>
      announcements.filter((announcement) => {
        if (!isAnnouncementVisible(announcement, role)) return false;
        const read = reads.get(announcement.id);
        return announcement.priority === "urgent" || !read?.dismissedAt;
      }),
    [announcements, reads, role],
  );

  useEffect(() => {
    if (!firebaseConfigured || !db || !account?.uid || !visibleAnnouncements.length) return;

    visibleAnnouncements.forEach((announcement) => {
      if (readMarked.current.has(announcement.id)) return;
      readMarked.current.add(announcement.id);
      setDoc(
        doc(db, "announcementReads", readKey(account.uid, announcement.id)),
        {
          announcementId: announcement.id,
          userId: account.uid,
          userEmail: account.email || "",
          readAt: serverTimestamp(),
        },
        { merge: true },
      ).catch(() => {
        readMarked.current.delete(announcement.id);
      });
    });
  }, [account, visibleAnnouncements]);

  async function dismissAnnouncement(announcement) {
    if (!account?.uid || announcement.priority === "urgent") return;
    await setDoc(
      doc(db, "announcementReads", readKey(account.uid, announcement.id)),
      {
        announcementId: announcement.id,
        userId: account.uid,
        userEmail: account.email || "",
        readAt: reads.get(announcement.id)?.readAt || serverTimestamp(),
        dismissedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  const urgentAnnouncement = visibleAnnouncements.find(
    (announcement) =>
      announcement.priority === "urgent" && !closedUrgentIds.includes(announcement.id),
  );

  if (loadError) {
    return (
      <section className={`rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 ${className}`}>
        {loadError}
      </section>
    );
  }

  if (!visibleAnnouncements.length) return null;

  return (
    <section className={`grid gap-4 ${className}`} aria-label="Announcements">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Daily Updates</p>
          <h2 className="m-0 text-2xl font-black text-slate-950">Announcements</h2>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-black text-teal-900">
          {visibleAnnouncements.length} active
        </span>
      </div>

      <div className="grid gap-3">
        {visibleAnnouncements.map((announcement) => (
          <AnnouncementCard
            announcement={announcement}
            key={announcement.id}
            onDismiss={dismissAnnouncement}
            showDismiss
          />
        ))}
      </div>

      {urgentAnnouncement ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4 py-6"
          role="dialog"
        >
          <div className="grid max-h-[90vh] w-full max-w-2xl gap-4 overflow-auto rounded-lg bg-white p-5 shadow-2xl shadow-slate-950/30">
            <AnnouncementCard announcement={urgentAnnouncement} showMeta={false} />
            <div className="flex justify-end">
              <button
                className="primary-button px-4"
                onClick={() =>
                  setClosedUrgentIds((current) => [...current, urgentAnnouncement.id])
                }
                type="button"
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
