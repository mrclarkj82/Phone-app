import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AnnouncementCard } from "../components/AnnouncementDisplay";
import PrivateHeader from "../components/PrivateHeader";
import { appCollection, appDoc } from "../lib/appFirestore";
import {
  announcementAudiences,
  announcementPriorities,
  announcementTypes,
  cleanAnnouncementId,
  dateInputToTimestamp,
  formatAnnouncementDate,
  getAnnouncementScheduleState,
  normalizeAnnouncement,
  optionLabel,
  safeHttpUrl,
  valueToDateInput,
} from "../lib/announcementUtils";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

const emptyAnnouncementForm = {
  title: "",
  body: "",
  type: "general",
  priority: "normal",
  targetAudience: "both",
  startDate: todayInput(),
  endDate: todayInput(),
  active: true,
  archived: false,
  linkUrl: "",
  videoUrl: "",
  imageUrl: "",
};

function readAnnouncements(snapshot) {
  return snapshot.docs
    .map((item) => normalizeAnnouncement(item.id, item.data()))
    .sort((left, right) => {
      const leftDate = left.createdAt?.toMillis?.() || 0;
      const rightDate = right.createdAt?.toMillis?.() || 0;
      return rightDate - leftDate || left.title.localeCompare(right.title);
    });
}

function announcementFromForm(form, fallbackId = "preview") {
  return normalizeAnnouncement(fallbackId, {
    ...form,
    startDate: dateInputToTimestamp(form.startDate),
    endDate: dateInputToTimestamp(form.endDate, true),
  });
}

function matchesFilter(announcement, filter) {
  const state = getAnnouncementScheduleState(announcement).toLowerCase();
  if (filter === "all") return true;
  if (filter === "active") return state === "active";
  if (filter === "scheduled") return state === "scheduled";
  if (filter === "expired") return state === "expired";
  if (filter === "archived") return announcement.archived;
  if (filter === "student-facing") {
    return ["students", "both"].includes(announcement.targetAudience);
  }
  if (filter === "teacher-facing") {
    return ["teachers", "both"].includes(announcement.targetAudience);
  }
  if (filter === "urgent") return announcement.priority === "urgent";
  return true;
}

function statusClass(status) {
  if (status === "Active") return "bg-emerald-100 text-emerald-800";
  if (status === "Scheduled") return "bg-blue-100 text-blue-800";
  if (status === "Expired") return "bg-slate-100 text-slate-700";
  if (status === "Archived") return "bg-zinc-200 text-zinc-800";
  return "bg-amber-100 text-amber-900";
}

export default function AdminAnnouncements() {
  const { account } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyAnnouncementForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Create and schedule daily announcements.");
  const [messageTone, setMessageTone] = useState("neutral");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      appCollection("announcements"),
      (snapshot) => {
        setAnnouncements(readAnnouncements(snapshot));
        setMessage((current) =>
          current === "Unable to load announcements." ? "Announcements loaded." : current,
        );
      },
      (error) => {
        setMessage(error.message || "Unable to load announcements.");
        setMessageTone("danger");
      },
    );

    return unsubscribe;
  }, []);

  const filteredAnnouncements = useMemo(
    () => announcements.filter((announcement) => matchesFilter(announcement, filter)),
    [announcements, filter],
  );

  const previewAnnouncement = useMemo(() => announcementFromForm(form), [form]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyAnnouncementForm);
  }

  function editAnnouncement(announcement) {
    setEditingId(announcement.id);
    setForm({
      title: announcement.title,
      body: announcement.body,
      type: announcement.type,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      startDate: valueToDateInput(announcement.startDate) || todayInput(),
      endDate: valueToDateInput(announcement.endDate),
      active: announcement.active,
      archived: announcement.archived,
      linkUrl: announcement.linkUrl,
      videoUrl: announcement.videoUrl,
      imageUrl: announcement.imageUrl,
    });
    setMessage(`Editing ${announcement.title}.`);
    setMessageTone("neutral");
  }

  async function saveAnnouncement(event) {
    event.preventDefault();
    const title = form.title.trim();
    const body = form.body.trim();

    if (!title || !body || !form.startDate) {
      setMessage("Enter a title, message, and start date.");
      setMessageTone("warning");
      return;
    }

    setSaving(true);
    try {
      const ref = editingId
        ? appDoc("announcements", editingId)
        : doc(
            appCollection("announcements"),
            `${cleanAnnouncementId(title) || "announcement"}-${Date.now()}`,
          );

      const payload = {
        announcementId: ref.id,
        title,
        body,
        type: form.type,
        priority: form.priority,
        targetAudience: form.targetAudience,
        active: form.active,
        archived: form.archived,
        startDate: dateInputToTimestamp(form.startDate),
        endDate: dateInputToTimestamp(form.endDate, true),
        linkUrl: safeHttpUrl(form.linkUrl),
        videoUrl: safeHttpUrl(form.videoUrl),
        imageUrl: safeHttpUrl(form.imageUrl),
        createdBy: account?.uid || "",
        createdByEmail: account?.email || "",
        updatedAt: serverTimestamp(),
      };

      if (!editingId) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(ref, payload, { merge: true });
      setMessage(`${title} was saved.`);
      setMessageTone("success");
      resetForm();
    } catch (error) {
      setMessage(error.message || "Unable to save announcement.");
      setMessageTone("danger");
    } finally {
      setSaving(false);
    }
  }

  async function archiveAnnouncement(announcement) {
    await setDoc(
      appDoc("announcements", announcement.id),
      {
        active: false,
        archived: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    setMessage(`${announcement.title} was archived.`);
    setMessageTone("success");
  }

  async function toggleAnnouncement(announcement) {
    await setDoc(
      appDoc("announcements", announcement.id),
      {
        active: !announcement.active,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    setMessage(`${announcement.title} was ${announcement.active ? "paused" : "activated"}.`);
    setMessageTone("success");
  }

  async function deleteAnnouncement(announcement) {
    const confirmed = window.confirm(`Delete "${announcement.title}"?`);
    if (!confirmed) return;
    await deleteDoc(appDoc("announcements", announcement.id));
    setMessage(`${announcement.title} was deleted.`);
    setMessageTone("success");
    if (editingId === announcement.id) resetForm();
  }

  const statusClasses = {
    danger: "border-red-200 bg-red-50 text-red-800",
    neutral: "border-slate-200 bg-white text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };

  return (
    <>
      <PrivateHeader eyebrow="Algebra I" title="Announcements">
        <Link
          className="grid min-h-11 place-items-center rounded-md bg-white px-4 text-sm font-black text-teal-900 transition hover:bg-teal-50"
          to="/admin"
        >
          Back to Admin
        </Link>
      </PrivateHeader>

      <main className="min-h-screen bg-slate-50 text-slate-950">
        <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${statusClasses[messageTone]}`}>
            {message}
          </div>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
            <form
              className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60"
              onSubmit={saveAnnouncement}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Announcement Builder</p>
                  <h2 className="m-0 text-2xl font-black">
                    {editingId ? "Edit Announcement" : "Create Announcement"}
                  </h2>
                </div>
                <button className="primary-button px-4" disabled={saving} type="submit">
                  {saving ? "Saving..." : editingId ? "Update" : "Publish"}
                </button>
              </div>

              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="eyebrow">Content</p>
                <label className="grid gap-1.5">
                  Title
                  <input
                    onChange={(event) => updateField("title", event.target.value)}
                    placeholder="Daily Algebra Update"
                    value={form.title}
                  />
                </label>
                <label className="grid gap-1.5">
                  Message
                  <textarea
                    className="min-h-32"
                    onChange={(event) => updateField("body", event.target.value)}
                    placeholder="Write the announcement students and teachers should see."
                    value={form.body}
                  />
                </label>
                <label className="grid gap-1.5">
                  Announcement type
                  <select onChange={(event) => updateField("type", event.target.value)} value={form.type}>
                    {announcementTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="eyebrow">Scheduling</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    Start date
                    <input
                      onChange={(event) => updateField("startDate", event.target.value)}
                      type="date"
                      value={form.startDate}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    End date
                    <input
                      onChange={(event) => updateField("endDate", event.target.value)}
                      type="date"
                      value={form.endDate}
                    />
                  </label>
                </div>
              </section>

              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="eyebrow">Audience</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    Target audience
                    <select
                      onChange={(event) => updateField("targetAudience", event.target.value)}
                      value={form.targetAudience}
                    >
                      {announcementAudiences.map((audience) => (
                        <option key={audience.value} value={audience.value}>
                          {audience.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5">
                    Priority
                    <select
                      onChange={(event) => updateField("priority", event.target.value)}
                      value={form.priority}
                    >
                      {announcementPriorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="eyebrow">Media</p>
                <label className="grid gap-1.5">
                  Optional link URL
                  <input
                    onChange={(event) => updateField("linkUrl", event.target.value)}
                    placeholder="https://..."
                    type="url"
                    value={form.linkUrl}
                  />
                </label>
                <label className="grid gap-1.5">
                  Optional video URL
                  <input
                    onChange={(event) => updateField("videoUrl", event.target.value)}
                    placeholder="YouTube, Google Drive, or direct video URL"
                    type="url"
                    value={form.videoUrl}
                  />
                </label>
                <label className="grid gap-1.5">
                  Optional image URL
                  <input
                    onChange={(event) => updateField("imageUrl", event.target.value)}
                    placeholder="https://..."
                    type="url"
                    value={form.imageUrl}
                  />
                </label>
              </section>

              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="eyebrow">Publish Settings</p>
                <div className="flex flex-wrap gap-3">
                  <label className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-slate-700">
                    <input
                      checked={form.active}
                      className="h-4 min-h-0 w-4"
                      onChange={(event) => updateField("active", event.target.checked)}
                      type="checkbox"
                    />
                    Active
                  </label>
                  <label className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-slate-700">
                    <input
                      checked={form.archived}
                      className="h-4 min-h-0 w-4"
                      onChange={(event) => updateField("archived", event.target.checked)}
                      type="checkbox"
                    />
                    Archived
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="primary-button px-4" disabled={saving} type="submit">
                    {saving ? "Saving..." : editingId ? "Update Announcement" : "Create Announcement"}
                  </button>
                  <button className="secondary-button px-4" onClick={resetForm} type="button">
                    Clear
                  </button>
                </div>
              </section>
            </form>

            <aside className="grid gap-4 self-start">
              <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
                <div>
                  <p className="eyebrow">Preview</p>
                  <h2 className="m-0 text-2xl font-black">Before Publishing</h2>
                </div>
                {previewAnnouncement.title || previewAnnouncement.body ? (
                  <AnnouncementCard announcement={previewAnnouncement} />
                ) : (
                  <div className="empty-state compact-empty">Start typing to preview the announcement.</div>
                )}
              </section>
            </aside>
          </section>

          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Announcement History</p>
                <h2 className="m-0 text-2xl font-black">All Announcements</h2>
              </div>
              <label className="grid gap-1.5 text-sm font-black uppercase text-slate-500">
                Filter
                <select onChange={(event) => setFilter(event.target.value)} value={filter}>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                  <option value="archived">Archived</option>
                  <option value="student-facing">Student-facing</option>
                  <option value="teacher-facing">Teacher-facing</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Type</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Audience</th>
                    <th scope="col">Dates</th>
                    <th scope="col">Status</th>
                    <th scope="col">Created By</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnouncements.map((announcement) => {
                    const scheduleState = getAnnouncementScheduleState(announcement);
                    return (
                      <tr key={announcement.id}>
                        <td>{announcement.title}</td>
                        <td>{optionLabel(announcementTypes, announcement.type)}</td>
                        <td>{optionLabel(announcementPriorities, announcement.priority)}</td>
                        <td>{optionLabel(announcementAudiences, announcement.targetAudience)}</td>
                        <td>
                          {formatAnnouncementDate(announcement.startDate)} -{" "}
                          {formatAnnouncementDate(announcement.endDate)}
                        </td>
                        <td>
                          <span className={`rounded-full px-2 py-1 text-xs font-black ${statusClass(scheduleState)}`}>
                            {scheduleState}
                          </span>
                        </td>
                        <td>{announcement.createdByEmail || "Admin"}</td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="secondary-button table-reset-button"
                              onClick={() => editAnnouncement(announcement)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="secondary-button table-reset-button"
                              onClick={() => toggleAnnouncement(announcement)}
                              type="button"
                            >
                              {announcement.active ? "Pause" : "Activate"}
                            </button>
                            <button
                              className="secondary-button table-reset-button"
                              onClick={() => archiveAnnouncement(announcement)}
                              type="button"
                            >
                              Archive
                            </button>
                            <button
                              className="danger-button table-reset-button"
                              onClick={() => deleteAnnouncement(announcement)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!filteredAnnouncements.length ? (
              <div className="empty-state compact-empty">No announcements match this filter.</div>
            ) : null}
          </section>
        </section>
      </main>
    </>
  );
}
