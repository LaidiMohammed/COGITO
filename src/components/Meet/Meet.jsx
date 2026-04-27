import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import {
  Calendar,
  Clock,
  Link2,
  Copy,
  Check,
  Plus,
  LayoutGrid,
  List,
  X,
  Video,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import "./Meet.css";

const Meet = () => {
  const { currentUser } = useUserStore();
  const [meetings, setMeetings] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date"); // "date" | "name" | "duration" | "owner"

  // Form state
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    duration: "",
    meetingLink: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Firestore real-time listener
  useEffect(() => {
    const q = query(collection(db, "meetings"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMeetings(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Format date from Firestore Timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Copy to clipboard
  const handleCopy = (id, link) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Delete a meeting
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette réunion ?")) return;
    try {
      await deleteDoc(doc(db, "meetings", id));
    } catch (err) {}
  };

  // Sort meetings
  const sortedMeetings = [...meetings].sort((a, b) => {
    if (sortBy === "name") {
      return (a.title || "").localeCompare(b.title || "");
    }
    if (sortBy === "duration") {
      return (a.duration || 0) - (b.duration || 0);
    }
    if (sortBy === "owner") {
      return (a.creatorName || "").localeCompare(b.creatorName || "");
    }
    // default: date desc
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
    return dateB - dateA;
  });

  // Modal form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time || !form.meetingLink) return;
    setSubmitting(true);
    try {
      const combined = new Date(`${form.date}T${form.time}`);
      await addDoc(collection(db, "meetings"), {
        title: form.title,
        date: Timestamp.fromDate(combined),
        duration: parseInt(form.duration) || 60,
        meetingLink: form.meetingLink,
        createdByPhoto: currentUser?.avatar || "",
        creatorName: currentUser?.username || "Utilisateur",
        createdAt: Timestamp.now(),
      });
      setForm({ title: "", date: "", time: "", duration: "", meetingLink: "" });
      setShowModal(false);
    } catch (err) {}
    setSubmitting(false);
  };

  // Avatar initials fallback
  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="meet-container">
      {/* ── HEADER ── */}
      <div className="meet-header">
        <div className="meet-header-left">
          <Video className="meet-header-icon" size={24} />
          <div>
            <h1 className="meet-title">Réunions</h1>
            <p className="meet-subtitle">
              {meetings.length} réunion{meetings.length !== 1 ? "s" : ""}{" "}
              programmée{meetings.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="meet-header-right">
          {/* Sort selector */}
          <div className="sort-control">
            <ArrowUpDown size={15} className="sort-icon" />
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="name">Nom</option>
              <option value="duration">Durée</option>
              <option value="owner">Propriétaire</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Vue grille"
            >
              <LayoutGrid size={17} />
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="Vue liste"
            >
              <List size={17} />
            </button>
          </div>
          {/* Schedule button */}
          <button className="btn-schedule" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Programmer un Meet
          </button>
        </div>
      </div>

      {/* ── MEETING LIST ── */}
      {loading ? (
        <div className="meet-loading">
          <div className="spinner" />
          <span>Chargement des réunions…</span>
        </div>
      ) : meetings.length === 0 ? (
        <div className="meet-empty">
          <Video size={56} className="meet-empty-icon" />
          <h2>Aucune réunion programmée</h2>
          <p>Cliquez sur "Programmer un Meet" pour en créer une.</p>
        </div>
      ) : (
        <div
          className={`meetings-grid ${viewMode === "list" ? "meetings-list" : ""}`}
        >
          {sortedMeetings.map((m) => (
            <div key={m.id} className="meeting-card">
              {/* DELETE button */}
              <button
                className="btn-delete"
                onClick={() => handleDelete(m.id)}
                title="Supprimer cette réunion"
              >
                <Trash2 size={13} />
              </button>

              {/* LEFT: Avatar */}
              <div className="card-avatar-wrap">
                {m.createdByPhoto ? (
                  <img
                    src={m.createdByPhoto}
                    alt={m.creatorName}
                    className="card-avatar"
                  />
                ) : (
                  <div className="card-avatar card-avatar-initials">
                    {getInitials(m.creatorName)}
                  </div>
                )}
              </div>

              {/* CENTER: Info */}
              <div className="card-info">
                <h3 className="card-title">{m.title}</h3>
                <p className="card-creator">par {m.creatorName}</p>
                <div className="card-meta">
                  <span className="card-meta-item">
                    <Calendar size={13} />
                    {formatDate(m.date)}
                  </span>
                  <span className="card-meta-item">
                    <Clock size={13} />
                    {formatTime(m.date)}
                  </span>
                  <span className="card-duration-badge">{m.duration} min</span>
                </div>
              </div>

              {/* RIGHT: Actions */}
              <div className="card-actions">
                <a
                  href={m.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-join"
                >
                  <Link2 size={15} />
                  Rejoindre
                </a>
                <button
                  className={`btn-copy ${copiedId === m.id ? "copied" : ""}`}
                  onClick={() => handleCopy(m.id, m.meetingLink)}
                  title="Copier le lien"
                >
                  {copiedId === m.id ? (
                    <>
                      <Check size={15} /> Copié
                    </>
                  ) : (
                    <>
                      <Copy size={15} /> Copier
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Video size={20} /> Programmer un Meet
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Titre de la réunion *</label>
                <input
                  type="text"
                  placeholder="Ex : Réunion projet PFE"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Heure *</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Durée (minutes)</label>
                <input
                  type="number"
                  placeholder="Ex : 45"
                  min="5"
                  max="480"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Lien de la réunion *</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={form.meetingLink}
                  onChange={(e) =>
                    setForm({ ...form, meetingLink: e.target.value })
                  }
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? "Enregistrement…" : "Programmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meet;
