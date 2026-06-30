import { useState, useEffect, useRef } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { upload } from "../../lib/upload";

const AdminOffers = () => {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    organisation: "",
    category: "stage",
    location: "",
    email: "",
    telephone: "",
    poste: "",
    duree: "",
    debut: "",
    description: "",
    besoins: "",
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "jobs"), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOffers(data);
    });
    return unsub;
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleAddOffer = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.organisation) {
      return toast.warn("Titre, description et organisation sont requis.");
    }
    setIsSubmitting(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await upload(photoFile);
      }
      await addDoc(collection(db, "jobs"), {
        title: formData.title,
        organisation: formData.organisation,
        category: formData.category,
        location: formData.location,
        email: formData.email,
        telephone: formData.telephone,
        poste: formData.poste,
        duree: formData.duree,
        debut: formData.debut,
        description: formData.description,
        besoins: formData.besoins,
        photoUrl: photoUrl,
        employerId: "admin",
        employerName: "Administrateur",
        applicants: [],
        status: "open",
        createdAt: serverTimestamp(),
      });
      toast.success("Offre ajoutée avec succès !");
      setIsAdding(false);
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFormData({
        title: "", organisation: "", category: "stage", location: "", email: "", telephone: "",
        poste: "", duree: "", debut: "", description: "", besoins: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'ajout de l'offre: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (offer) => {
    try {
      await updateDoc(doc(db, "jobs", offer.id), {
        status: offer.status === "open" ? "closed" : "open"
      });
    } catch (err) {
      toast.error("Erreur lors du changement de statut.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette offre définitivement ?")) {
      try {
        await deleteDoc(doc(db, "jobs", id));
        toast.success("Offre supprimée.");
      } catch (err) {
        toast.error("Erreur lors de la suppression.");
      }
    }
  };

  const filteredOffers = offers.filter(o =>
    o.title?.toLowerCase().includes(search.toLowerCase()) ||
    o.category?.toLowerCase().includes(search.toLowerCase()) ||
    o.organisation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Rechercher une offre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "10px 16px", width: "300px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", background: "#1e293b", color: "#e2e8f0" }}
        />
        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{ padding: "10px 20px", background: "#c5a059", color: "#1e293b", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 }}
        >
          {isAdding ? "Annuler" : "+ Nouvelle Offre"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddOffer} style={{ background: "rgba(255,255,255,0.04)", padding: 24, borderRadius: 12, marginBottom: 30, border: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 style={{ marginTop: 0, marginBottom: 20, color: "#e2e8f0" }}>Ajouter une offre (Jobs Étudiant)</h3>

          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Titre</label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0" }} required />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Organisation</label>
              <input type="text" name="organisation" value={formData.organisation} onChange={handleInputChange} placeholder="Ex: Sonatrach, Djezzy..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0" }} required />
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Catégorie</label>
              <select name="category" value={formData.category} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0" }}>
                <option value="job">Job</option>
                <option value="emploi">Emploi</option>
                <option value="stage">Stage</option>
                <option value="bourse">Bourse</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Type de poste</label>
              <input type="text" name="poste" value={formData.poste} onChange={handleInputChange} placeholder="ex: CDI, Freelance..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Durée</label>
              <input type="text" name="duree" value={formData.duree} onChange={handleInputChange} placeholder="ex: 6 mois" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Localisation</label>
              <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="ex: Alger" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="contact@..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Téléphone</label>
              <input type="tel" name="telephone" value={formData.telephone} onChange={handleInputChange} placeholder="+213..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Début</label>
              <input type="text" name="debut" value={formData.debut} onChange={handleInputChange} placeholder="ex: Septembre 2026" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Image (optionnel)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0" }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", minHeight: 100 }} required />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#94a3b8" }}>Besoins / Profil recherché</label>
            <textarea name="besoins" value={formData.besoins} onChange={handleInputChange} placeholder="ex: Ingénieur en informatique, niveau Master..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", minHeight: 80 }} />
          </div>

          <button type="submit" disabled={isSubmitting} style={{ background: "#c5a059", color: "#1e293b", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer" }}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer l'offre"}
          </button>
        </form>
      )}

      <div className="ap-list-container">
        <table className="ap-table">
          <thead>
            <tr>
              <th>Titre & Organisation</th>
              <th>Catégorie</th>
              <th>Poste & Durée</th>
              <th>Candidats</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOffers.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", color: "#64748b" }}>Aucune offre trouvée</td></tr>
            )}
            {filteredOffers.map((o) => (
              <tr key={o.id}>
                <td>
                  <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{o.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{o.organisation || o.employerName}</div>
                </td>
                <td>
                  <span style={{ background: "rgba(197,160,89,0.15)", color: "#c5a059", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{o.category}</span>
                </td>
                <td>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>{o.poste || "—"}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{o.duree ? `${o.duree} · ${o.debut || ""}` : o.debut || "—"}</div>
                </td>
                <td style={{ color: "#94a3b8", fontSize: 13 }}>{o.applicants?.length || 0}</td>
                <td>
                  <button
                    onClick={() => toggleStatus(o)}
                    style={{ background: o.status === "open" ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)", color: o.status === "open" ? "#10b981" : "#64748b", border: "none", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    {o.status === "open" ? "Ouvert" : "Fermé"}
                  </button>
                </td>
                <td>
                  <button onClick={() => handleDelete(o.id)} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOffers;
