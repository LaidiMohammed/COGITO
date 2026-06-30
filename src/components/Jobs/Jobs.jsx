import { useEffect, useState } from "react";
import {
  addDoc, collection, doc, onSnapshot, serverTimestamp, deleteDoc,
  query, where, updateDoc, arrayUnion, arrayRemove, getDocs
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import {
  Briefcase, Building2, GraduationCap, HandCoins, Plus, X, MoreVertical,
  Trash2, Send, MapPin, Mail, CalendarDays, Users, Filter, Clock
} from "lucide-react";
import "./Jobs.css";

const CATEGORIES = [
  { key: "job", icon: Briefcase, label: "Job", desc: "Petits boulots et jobs étudiants" },
  { key: "emploi", icon: Building2, label: "Emploi", desc: "Offres d'emploi à temps plein/partiel" },
  { key: "stage", icon: GraduationCap, label: "Stage", desc: "Stages PFE et conventions" },
  { key: "bourse", icon: HandCoins, label: "Bourse", desc: "Bourses d'études et aides financières" },
];

const Jobs = ({ setPage }) => {
  const { currentUser } = useUserStore();
  const [category, setCategory] = useState(null);
  const [offers, setOffers] = useState([]);
  const [tab, setTab] = useState("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, offer: null });
  const [form, setForm] = useState({ title: "", description: "", contact: "", location: "" });

  useEffect(() => {
    if (!category) return;
    const q = query(collection(db, "jobs"), where("category", "==", category));
    const unsub = onSnapshot(q, (snap) => {
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [category]);

  const filteredOffers = offers.filter((o) => {
    if (tab === "mine") return o.employerId === currentUser.id;
    return true;
  }).sort((a, b) => {
    const dateA = a.createdAt?.toMillis?.() ?? 0;
    const dateB = b.createdAt?.toMillis?.() ?? 0;
    return dateB - dateA;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "jobs"), {
        ...form,
        category,
        employerId: currentUser.id,
        employerName: currentUser.username,
        employerAvatar: currentUser.avatar || "",
        applicants: [],
        status: "open",
        createdAt: serverTimestamp(),
      });
      setForm({ title: "", description: "", contact: "", location: "" });
      setOpenCreate(false);
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  };

  const handleDelete = async (offer) => {
    try {
      await deleteDoc(doc(db, "jobs", offer.id));
    } catch (err) {
      console.error(err);
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleApply = async (offer) => {
    if (offer.applicants?.includes(currentUser.id)) return;
    try {
      await updateDoc(doc(db, "jobs", offer.id), {
        applicants: arrayUnion(currentUser.id),
      });
    } catch (err) {
      console.error(err);
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleContextMenu = (e, offer) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, offer });
  };

  useEffect(() => {
    const close = () => setContextMenu({ ...contextMenu, visible: false });
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const isOwner = (offer) => offer.employerId === currentUser.id;
  const hasApplied = (offer) => offer.applicants?.includes(currentUser.id);

  if (!category) {
    return (
      <div className="jobs-container">
        <div className="jobs-header">
          <div className="header-text">
            <h1>Jobs Étudiants</h1>
            <p>Trouve un job, un stage ou une bourse</p>
          </div>
        </div>
        <div className="jobs-categories">
          {CATEGORIES.map(({ key, icon: Icon, label, desc }) => (
            <div key={key} className="job-category-card" onClick={() => setCategory(key)}>
              <div className="job-category-icon"><Icon size={32} /></div>
              <h3>{label}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentCat = CATEGORIES.find((c) => c.key === category);

  return (
    <div className="jobs-container">
      <header className="jobs-header">
        <div className="header-text">
          <button className="jobs-back-btn" onClick={() => setCategory(null)}>
            <X size={18} />
          </button>
          <div>
            <h1>{currentCat?.label}</h1>
            <p>{currentCat?.desc}</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="jobs-tabs">
            <button className={`jobs-tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
              <Filter size={14} /> Toutes
            </button>
            <button className={`jobs-tab ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>
              <Briefcase size={14} /> Mes offres
            </button>
          </div>
          <button className="btn-create-gold" onClick={() => setOpenCreate(true)}>
            <Plus size={16} /> Publier une offre
          </button>
        </div>
      </header>

      <div className="jobs-grid">
        {filteredOffers.length === 0 && (
          <div className="jobs-empty">
            <Briefcase size={48} />
            <p>Aucune offre pour le moment</p>
          </div>
        )}
        {filteredOffers.map((offer) => (
          <div key={offer.id} className="job-card" onContextMenu={(e) => handleContextMenu(e, offer)}>
            <div className="card-top">
              <div className="title-area">
                <h3>{offer.title}</h3>
                <span className={`badge ${offer.status === "open" ? "active" : "closed"}`}>
                  {offer.status === "open" ? "Ouvert" : "Fermé"}
                </span>
              </div>
              <button className="card-more-btn" onClick={(e) => handleContextMenu(e, offer)}>
                <MoreVertical size={16} />
              </button>
            </div>

            <div className="job-card-employer">
              <div className="job-employer-avatar">
                {offer.employerAvatar ? (
                  <img src={offer.employerAvatar} alt="" />
                ) : (
                  <span>{offer.employerName?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <span className="job-employer-name">{offer.employerName}</span>
            </div>

            <p className="job-card-desc">{offer.description}</p>

            <div className="job-card-meta">
              {offer.location && (
                <span><MapPin size={13} /> {offer.location}</span>
              )}
              {offer.contact && (
                <span><Mail size={13} /> {offer.contact}</span>
              )}
              <span>
                <Users size={13} /> {(offer.applicants?.length || 0)} candidat(s)
              </span>
            </div>

            <div className="card-footer">
              <div className="tags">
                <span className="tag gold">{currentCat?.label}</span>
                {offer.status === "open" && !isOwner(offer) && (
                  <span className="tag">{hasApplied(offer) ? "Postulé" : "Disponible"}</span>
                )}
              </div>
              {offer.status === "open" && !isOwner(offer) && !hasApplied(offer) && (
                <button className="btn-apply" onClick={() => handleApply(offer)}>
                  <Send size={14} /> Postuler
                </button>
              )}
              {hasApplied(offer) && !isOwner(offer) && (
                <span className="applied-badge">✓ Postulé</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {contextMenu.visible && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          {!isOwner(contextMenu.offer) && contextMenu.offer.status === "open" && !hasApplied(contextMenu.offer) && (
            <button className="context-menu-item" onClick={() => handleApply(contextMenu.offer)}>
              <Send size={14} /> Postuler
            </button>
          )}
          {isOwner(contextMenu.offer) && (
            <>
              <button className="context-menu-item danger" onClick={() => handleDelete(contextMenu.offer)}>
                <Trash2 size={14} /> Supprimer
              </button>
            </>
          )}
        </div>
      )}

      {openCreate && (
        <div className="modal-overlay" onClick={() => setOpenCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Publier une offre</h2>
              <button className="modal-close" onClick={() => setOpenCreate(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-column">
                  <div className="input-group">
                    <label>Titre de l'offre</label>
                    <input
                      type="text" placeholder="ex: Développeur React"
                      value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Description</label>
                    <textarea
                      placeholder="Décris l'offre en détail..."
                      value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={4} required
                    />
                  </div>
                </div>
                <div className="form-column">
                  <div className="input-group">
                    <label>Contact (email/téléphone)</label>
                    <input
                      type="text" placeholder="ex: email@example.com"
                      value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Localisation</label>
                    <input
                      type="text" placeholder="ex: Alger, Tizi Ouzou"
                      value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Catégorie</label>
                    <div className="job-category-badge">{currentCat?.icon({ size: 16 })} {currentCat?.label}</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setOpenCreate(false)}>Annuler</button>
                <button type="submit" className="btn-submit-full" disabled={creating}>
                  {creating ? "Publication..." : "Publier l'offre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
