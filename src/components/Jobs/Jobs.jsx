import { useEffect, useState } from "react";
import {
  addDoc, collection, doc, onSnapshot, serverTimestamp, deleteDoc,
  query, where, updateDoc, arrayUnion
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import {
  Briefcase, Building2, GraduationCap, HandCoins, X,
  Send, MapPin, Mail, CalendarDays, Clock, Phone, Plus,
  MoreVertical, Trash2, Users, Filter,
} from "lucide-react";
import "./Jobs.css";

const CATEGORIES = [
  { key: "job", icon: Briefcase, label: "Job",
    desc: "Petits boulots et jobs étudiants",
    longDesc: "Développe-toi professionnellement avec des missions adaptées à ton emploi du temps.",
    highlights: ["Flexibilité horaire", "Revenu complémentaire", "Expérience pro"],
    color: "#c5a059" },
  { key: "emploi", icon: Building2, label: "Emploi",
    desc: "Offres d'emploi à temps plein/partiel",
    longDesc: "Lance ta carrière avec des offres des plus grandes entreprises algériennes.",
    highlights: ["Carrière longue durée", "Avantages sociaux", "Évolution"],
    color: "#00497e" },
  { key: "stage", icon: GraduationCap, label: "Stage",
    desc: "Stages PFE et conventions",
    longDesc: "Trouve le stage idéal pour valider ta formation.",
    highlights: ["Convention PFE", "Stage d'été", "Rémunéré"],
    color: "#00a651" },
  { key: "bourse", icon: HandCoins, label: "Bourse",
    desc: "Bourses d'études et aides financières",
    longDesc: "Finance tes études à l'étranger ou en Algérie.",
    highlights: ["Études à l'étranger", "Aide au mérite", "Programmes d'échange"],
    color: "#e30613" },
];

const demoOffres = {
  job: [
    { nom: "Café Lina", localisation: "Alger Centre", telephone: "+213 555 12 34", email: "cafelina@dz", duree: "3 mois", debut: "Juillet 2026", specialite: "Service client", besoin: "Serveur(se) pour café étudiant — 15h/sem", logo: "CL", logoColor: "#8B4513" },
    { nom: "Star Market", localisation: "Bab Ezzouar", telephone: "+213 555 56 78", email: "rh@starmarket.dz", duree: "CDD", debut: "Immédiat", specialite: "Commerce", besoin: "Caissier(ère) étudiant(e) — temps partiel", logo: "SM", logoColor: "#dc2626" },
  ],
  emploi: [
    { nom: "Naftal", localisation: "Alger, Hydra", telephone: "+213 21 54 00 00", email: "emploi@naftal.dz", duree: "CDI", debut: "Septembre 2026", specialite: "Logistique", besoin: "Ingénieur logistique et supply chain", logo: "NA", logoColor: "#003d7a" },
    { nom: "Air Algérie", localisation: "Alger, Dar El Beïda", telephone: "+213 21 98 00 00", email: "recrutement@airalgerie.dz", duree: "CDI", debut: "Octobre 2026", specialite: "Aéronautique", besoin: "Technicien de maintenance aéronautique", logo: "AH", logoColor: "#0066a1" },
    { nom: "Tosyali", localisation: "Oran, Bethioua", telephone: "+213 41 00 00 00", email: "rh@tosyali.dz", duree: "CDI", debut: "Janvier 2027", specialite: "Métallurgie", besoin: "Ingénieur matériaux et métallurgie", logo: "TY", logoColor: "#8b0000" },
  ],
  stage: [
    { nom: "Algérie Poste", localisation: "Alger, Birkhadem", telephone: "+213 21 44 44 44", email: "stage@poste.dz", duree: "3 mois", debut: "Octobre 2026", specialite: "Informatique", besoin: "Stagiaire développement web et mobile", logo: "AP", logoColor: "#ff6600" },
    { nom: "ENIEM", localisation: "Tizi Ouzou, Oued Aïssi", telephone: "+213 26 00 00 00", email: "stage@eniem.dz", duree: "4 mois", debut: "Novembre 2026", specialite: "Électroménager", besoin: "Stagiaire génie industriel et maintenance", logo: "EN", logoColor: "#005a9c" },
    { nom: "Saïdal", localisation: "Alger, El Harrach", telephone: "+213 21 00 33 33", email: "stage@saidal.dz", duree: "6 mois", debut: "Septembre 2026", specialite: "Pharmacie", besoin: "Stagiaire contrôle qualité pharmaceutique", logo: "SD", logoColor: "#009639" },
  ],
  bourse: [
    { nom: "Ministère Enseignement Sup.", localisation: "Alger", telephone: "+213 21 00 00 00", email: "bourses@mesrs.dz", duree: "1 an", debut: "Janvier 2027", specialite: "Toutes", besoin: "Bourse d'excellence pour études à l'étranger", logo: "ME", logoColor: "#003366" },
    { nom: "Ambassade de France", localisation: "Alger, Hydra", telephone: "+213 21 00 11 11", email: "campusfrance@dz", duree: "2 ans", debut: "Septembre 2026", specialite: "Master", besoin: "Programme d'échange Franco-Algérien", logo: "AF", logoColor: "#002395" },
    { nom: "ENAGRO", localisation: "Alger, El Harrach", telephone: "+213 21 00 22 22", email: "bourses@enagro.dz", duree: "6 mois", debut: "Février 2027", specialite: "Agronomie", besoin: "Bourse de recherche en agriculture durable", logo: "EG", logoColor: "#2e7d32" },
  ],
};

const partenaires = [
  { name: "Sonatrach", color: "#005030" },
  { name: "Sotramo", color: "#1a5276" },
  { name: "Hyproc", color: "#003366" },
  { name: "Mobilis", color: "#00a651" },
  { name: "Djezzy", color: "#e30613" },
  { name: "Algérie Télécom", color: "#00497e" },
  { name: "Sonelgaz", color: "#f7941d" },
  { name: "Air Algérie", color: "#0066a1" },
  { name: "Naftal", color: "#003d7a" },
  { name: "SNTF", color: "#008751" },
  { name: "Cosider", color: "#003f87" },
  { name: "ENIEM", color: "#005a9c" },
  { name: "Saïdal", color: "#009639" },
  { name: "Tosyali", color: "#8b0000" },
  { name: "Algérie Poste", color: "#ff6600" },
  { name: "ENAGRO", color: "#2e7d32" },
];

const PartenairesFooter = () => (
  <div className="jobs-partenaires">
    <p className="jobs-partenaires-title">Partenaires Officiels</p>
    {[1, 2, 3].map((row) => (
      <div key={row} className="jobs-partenaires-track-wrap">
        <div className={`jobs-partenaires-track${row === 2 ? " reverse" : ""}`}>
          <div className="jobs-partenaires-inner">
            {[...partenaires, ...partenaires].map((p, i) => (
              <div key={i} className="jobs-partenaires-item">
                <span style={{ color: p.color, opacity: 0.4 }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Jobs = ({ setPage }) => {
  const { currentUser } = useUserStore();
  const [category, setCategory] = useState(null);
  const [offers, setOffers] = useState([]);
  const [tab, setTab] = useState("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, offer: null });
  const [form, setForm] = useState({
    title: "", organisation: "", location: "", email: "", telephone: "", poste: "",
    besoins: "", duree: "", debut: "", description: ""
  });

  useEffect(() => {
    if (!category) return;
    const q = query(collection(db, "jobs"), where("category", "==", category));
    const unsub = onSnapshot(q, (snap) => {
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [category]);

  const filteredOffers = offers.filter((o) => {
    if (tab === "mine" && !isAdmin) return o.employerId === currentUser.id;
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
      const uid = currentUser?.id || "demo-" + Date.now();
      const uname = currentUser?.username || "Étudiant";
      const uavatar = currentUser?.avatar || "";
      await addDoc(collection(db, "jobs"), {
        ...form,
        category,
        employerId: uid,
        employerName: uname,
        employerAvatar: uavatar,
        applicants: [],
        status: "open",
        createdAt: serverTimestamp(),
      });
      setForm({
        title: "", organisation: "", location: "", email: "", telephone: "", poste: "",
        besoins: "", duree: "", debut: "", description: ""
      });
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

  const isAdmin = currentUser.role === "admin";
  const isOwner = (offer) => offer.employerId === currentUser.id || isAdmin;
  const hasApplied = (offer) => offer.applicants?.includes(currentUser.id);

  const currentCat = CATEGORIES.find((c) => c.key === category);

  if (!category) {
    return (
      <div className="jobs-page">
        <div className="jobs-scroll">
          <div className="jobs-header">
            <div className="header-text">
              <h1>Jobs Étudiants</h1>
              <p>Trouve un job, un stage ou une bourse</p>
            </div>
          </div>
          <div className="jobs-categories">
            {CATEGORIES.map(({ key, icon: Icon, label, desc, longDesc, highlights, color }) => (
              <div key={key} className="job-category-card" onClick={() => setCategory(key)} style={{ borderTop: `3px solid ${color}` }}>
                <div className="job-category-icon" style={{ background: `${color}15`, color }}><Icon size={36} /></div>
                <h3>{label}</h3>
                <p className="category-desc">{desc}</p>
                <p className="category-long">{longDesc}</p>
                <div className="category-highlights">
                  {highlights.map((h, i) => (
                    <span key={i} className="category-highlight" style={{ background: `${color}12`, color }}>{h}</span>
                  ))}
                </div>
                <div className="category-cta">
                  <span style={{ color }}>Explorer les offres →</span>
                </div>
              </div>
            ))}
          </div>
          <div className="category-info-banner">
            <GraduationCap size={18} />
            <span>Plus de 200 offres disponibles — Les entreprises algériennes recrutent !</span>
          </div>
          <PartenairesFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="jobs-page">
      <div className="jobs-scroll">
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

        <div className="org-cards-section">
          <h2 className="org-cards-title">Exemples d'offres — {currentCat?.label}</h2>
          <div className="org-cards-grid">
            {(demoOffres[category] || []).map((offre, i) => (
              <div key={i} className="org-card">
                <div className="org-card-logo" style={{ background: offre.logoColor }}>
                  <span>{offre.logo}</span>
                </div>
                <div className="org-card-body">
                  <h3>{offre.nom}</h3>
                  <div className="org-card-info">
                    <span><MapPin size={13} /> {offre.localisation}</span>
                    <span><Phone size={13} /> {offre.telephone}</span>
                    <span><Mail size={13} /> {offre.email}</span>
                    <span><Clock size={13} /> Durée : {offre.duree}</span>
                    <span><CalendarDays size={13} /> Début : {offre.debut}</span>
                    <span className="specialite-badge"><GraduationCap size={13} /> {offre.specialite}</span>
                  </div>
                  <div className="org-card-besoin">
                    <Briefcase size={13} /> {offre.besoin}
                  </div>
                  <div className="org-card-actions">
                    <a href={`mailto:${offre.email}`} className="org-card-btn contact">
                      <Send size={13} /> Contacter
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="jobs-grid">
          <h2 className="org-cards-title" style={{ gridColumn: "1 / -1" }}>
            Offres publiées ({filteredOffers.length})
          </h2>
          {filteredOffers.length === 0 && (
            <div className="jobs-empty">
              <Briefcase size={48} />
              <p>Aucune offre publiée pour le moment. Publie la première !</p>
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
                {isAdmin && offer.employerId !== currentUser.id && (
                  <span className="admin-tag">Admin</span>
                )}
              </div>

              <p className="job-card-desc">{offer.description}</p>

              <div className="job-card-meta">
                {offer.organisation && <span><Building2 size={13} /> {offer.organisation}</span>}
                {offer.poste && <span><Briefcase size={13} /> {offer.poste}</span>}
                {offer.location && <span><MapPin size={13} /> {offer.location}</span>}
                {offer.email && <span><Mail size={13} /> {offer.email}</span>}
                {(offer.duree || offer.debut) && (
                  <span><CalendarDays size={13} />
                    {offer.duree}{offer.duree && offer.debut ? " · " : ""}{offer.debut ? `Dès ${offer.debut}` : ""}
                  </span>
                )}
                <span><Users size={13} /> {(offer.applicants?.length || 0)} candidat(s)</span>
              </div>
              {offer.besoins && (
                <div className="offer-besoins">
                  <strong>Profil :</strong> {offer.besoins}
                </div>
              )}

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

        <PartenairesFooter />
      </div>

      {contextMenu.visible && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          {!isOwner(contextMenu.offer) && contextMenu.offer.status === "open" && !hasApplied(contextMenu.offer) && (
            <button className="context-menu-item" onClick={() => handleApply(contextMenu.offer)}>
              <Send size={14} /> Postuler
            </button>
          )}
          {(isOwner(contextMenu.offer) || isAdmin) && (
            <button className="context-menu-item danger" onClick={() => handleDelete(contextMenu.offer)}>
              <Trash2 size={14} /> Supprimer
            </button>
          )}
        </div>
      )}

      {openCreate && (
        <div className="modal-overlay" onClick={() => setOpenCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Publier une offre — {currentCat?.label}</h2>
              <button className="modal-close" onClick={() => setOpenCreate(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="form-grid three-column">
                <div className="form-column">
                  <div className="input-group">
                    <label>Titre de l'offre</label>
                    <input type="text" placeholder="ex: Développeur React" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label>Organisation</label>
                    <input type="text" placeholder="ex: Sonatrach, Djezzy..." value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} list="org-suggestions" />
                    <datalist id="org-suggestions">
                      <option value="Sonatrach" /><option value="Djezzy" /><option value="Mobilis" />
                      <option value="Sotramo" /><option value="Ifri" /><option value="Naftal" />
                      <option value="Algérie Poste" /><option value="Air Algérie" /><option value="Tosyali" />
                    </datalist>
                  </div>
                  <div className="input-group">
                    <label>Téléphone</label>
                    <input type="tel" placeholder="+213 21 54 70 00" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Localisation</label>
                    <input type="text" placeholder="ex: Alger, Tizi Ouzou" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>
                <div className="form-column">
                  <div className="input-group">
                    <label>Email de contact</label>
                    <input type="email" placeholder="ex: recrutement@entreprise.dz" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Type de poste</label>
                    <input type="text" placeholder="ex: CDI, Freelance, Stage..." value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Durée</label>
                    <input type="text" placeholder="ex: 3 mois, 6 mois..." value={form.duree} onChange={(e) => setForm({ ...form, duree: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Début</label>
                    <input type="text" placeholder="ex: Septembre 2025" value={form.debut} onChange={(e) => setForm({ ...form, debut: e.target.value })} />
                  </div>
                </div>
                <div className="form-column">
                  <div className="input-group full-height">
                    <label>Description</label>
                    <textarea placeholder="Décris l'offre en détail..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={10} required />
                  </div>
                  <div className="input-group">
                    <label>Besoins / Profil</label>
                    <textarea placeholder="ex: Ingénieur en informatique, niveau Master..." value={form.besoins} onChange={(e) => setForm({ ...form, besoins: e.target.value })} rows={3} />
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
