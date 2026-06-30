import { useState, useEffect, useRef } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { upload } from "../../lib/upload";

const AdminOffers = () => {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingExpiration, setEditingExpiration] = useState(null);
  const [newExpirationDate, setNewExpirationDate] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    entreprise: "",
    specialite: "",
    type: "JOB",
    description: "",
    keywords: "",
    expirationDate: "",
    reqNom: "required",
    reqPrenom: "required",
    reqCv: "required",
    reqMotivation: "optional",
    reqVideo: "hidden",
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "job_offers"), (snapshot) => {
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
    if (!formData.title || !formData.description || !formData.entreprise || !formData.expirationDate) {
      return toast.warn("Titre, description, entreprise et date d'expiration sont requis.");
    }
    setIsSubmitting(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await upload(photoFile);
      }
      const keywordsArray = formData.keywords ? formData.keywords.split(",").map(k => k.trim()).filter(k => k) : [];
      await addDoc(collection(db, "job_offers"), {
        title: formData.title,
        entreprise: formData.entreprise,
        specialite: formData.specialite,
        type: formData.type,
        description: formData.description,
        keywords: keywordsArray,
        photoUrl: photoUrl,
        expirationDate: new Date(formData.expirationDate),
        active: true,
        createdAt: serverTimestamp(),
        requirements: {
          nom: formData.reqNom,
          prenom: formData.reqPrenom,
          cv: formData.reqCv,
          motivation: formData.reqMotivation,
          video: formData.reqVideo,
        }
      });
      toast.success("Offre ajoutée avec succès !");
      setIsAdding(false);
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFormData({
        title: "", entreprise: "", specialite: "", type: "JOB", description: "", keywords: "", expirationDate: "",
        reqNom: "required", reqPrenom: "required", reqCv: "required", reqMotivation: "optional", reqVideo: "hidden"
      });
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'ajout de l'offre: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (offer) => {
    try {
      await updateDoc(doc(db, "job_offers", offer.id), { active: !offer.active });
    } catch (err) {
      toast.error("Erreur lors du changement de statut.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette offre définitivement ?")) {
      try {
        await deleteDoc(doc(db, "job_offers", id));
        toast.success("Offre supprimée.");
      } catch (err) {
        toast.error("Erreur lors de la suppression.");
      }
    }
  };

  const handleExtendExpiration = async (offerId) => {
    if (!newExpirationDate) return;
    try {
      await updateDoc(doc(db, "job_offers", offerId), {
        expirationDate: new Date(newExpirationDate)
      });
      toast.success("Date d'expiration prolongée !");
      setEditingExpiration(null);
      setNewExpirationDate("");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la modification de la date.");
    }
  };

  const filteredOffers = offers.filter(o =>
    o.title?.toLowerCase().includes(search.toLowerCase()) ||
    o.type?.toLowerCase().includes(search.toLowerCase()) ||
    o.entreprise?.toLowerCase().includes(search.toLowerCase())
  );

  const now = Date.now();

  return (
    <div className="ap-offers-container" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Rechercher une offre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "10px 16px", width: "300px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
        />
        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{ padding: "10px 20px", background: "#002147", color: "white", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 }}
        >
          {isAdding ? "Annuler" : "+ Nouvelle Offre"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddOffer} style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 30, border: "1px solid #e2e8f0" }}>
          <h3 style={{ marginTop: 0, marginBottom: 20 }}>Ajouter une offre</h3>

          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Titre</label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #cbd5e1" }} required />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Entreprise</label>
              <input type="text" name="entreprise" value={formData.entreprise} onChange={handleInputChange} placeholder="Ex: Google, Thales..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #cbd5e1" }} required />
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Type</label>
              <select name="type" value={formData.type} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #cbd5e1" }}>
                <option value="JOB">JOB</option>
                <option value="STAGE">Stage</option>
                <option value="EMPLOI">Emploi</option>
                <option value="BOURSES">Bourses</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Spécialité (Filtre)</label>
              <input type="text" name="specialite" value={formData.specialite} onChange={handleInputChange} placeholder="Ex: Informatique, Management..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #cbd5e1" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Date d'expiration</label>
              <input type="date" name="expirationDate" value={formData.expirationDate} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #cbd5e1" }} required />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Image / Photo de l'offre (Optionnel)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #cbd5e1", background: "#f8fafc" }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #cbd5e1", minHeight: 100 }} required />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Mots-clés (séparés par des virgules)</label>
            <input type="text" name="keywords" value={formData.keywords} onChange={handleInputChange} placeholder="React, Développement, Stage 6 mois..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #cbd5e1" }} />
          </div>

          <h4 style={{ marginBottom: 12 }}>Exigences du Formulaire</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#f8fafc", padding: 16, borderRadius: 8, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Nom / Prénom</label>
              <select disabled style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #cbd5e1", background: "#e2e8f0" }}>
                <option>Obligatoire</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>CV (Fichier)</label>
              <select name="reqCv" value={formData.reqCv} onChange={handleInputChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #cbd5e1" }}>
                <option value="required">Obligatoire</option>
                <option value="optional">Optionnel</option>
                <option value="hidden">Masqué</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Lettre de motivation</label>
              <select name="reqMotivation" value={formData.reqMotivation} onChange={handleInputChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #cbd5e1" }}>
                <option value="required">Obligatoire</option>
                <option value="optional">Optionnel</option>
                <option value="hidden">Masqué</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Vidéo de présentation</label>
              <select name="reqVideo" value={formData.reqVideo} onChange={handleInputChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #cbd5e1" }}>
                <option value="required">Obligatoire</option>
                <option value="optional">Optionnel</option>
                <option value="hidden">Masqué</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} style={{ background: "#c5a059", color: "white", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer" }}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer l'offre"}
          </button>
        </form>
      )}

      <div className="ap-list-container">
        <table className="ap-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Type & Spécialité</th>
              <th>Titre & Entreprise</th>
              <th>Date Exp.</th>
              <th>Statut Visibilité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOffers.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", color: "#64748b" }}>Aucune offre trouvée</td></tr>
            )}
            {filteredOffers.map((o) => {
              const expTime = o.expirationDate?.toDate ? o.expirationDate.toDate().getTime() : (o.expirationDate ? new Date(o.expirationDate).getTime() : 0);
              const isExpired = expTime < now;

              return (
                <tr key={o.id}>
                  <td>
                    {o.photoUrl ? (
                      <img src={o.photoUrl} alt="Offer" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: "#e2e8f0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 10 }}>Sans</div>
                    )}
                  </td>
                  <td>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                      <span style={{ background: "#002147", color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, width: 'fit-content' }}>{o.type}</span>
                      {o.specialite && <span style={{ fontSize: 12, color: "#64748b" }}>{o.specialite}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{o.title}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{o.entreprise}</div>
                  </td>
                  <td>
                    {editingExpiration === o.id ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="date" value={newExpirationDate} onChange={(e) => setNewExpirationDate(e.target.value)} style={{ padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
                        <button onClick={() => handleExtendExpiration(o.id)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '0 8px' }}>✓</button>
                        <button onClick={() => setEditingExpiration(null)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '0 8px' }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: isExpired ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                          {o.expirationDate?.toDate ? o.expirationDate.toDate().toLocaleDateString() : (o.expirationDate ? new Date(o.expirationDate).toLocaleDateString() : "Aucune")}
                        </span>
                        <button onClick={() => setEditingExpiration(o.id)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>Prolonger</button>
                      </div>
                    )}
                  </td>
                  <td>
                    {isExpired ? (
                      <span style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Expirée (Cachée)</span>
                    ) : (
                      <button
                        onClick={() => toggleActive(o)}
                        style={{ background: o.active ? "rgba(16,185,129,0.1)" : "rgba(100,116,139,0.1)", color: o.active ? "#10b981" : "#64748b", border: "none", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                      >
                        {o.active ? "Visible" : "Masquée"}
                      </button>
                    )}
                  </td>
                  <td>
                    <button onClick={() => handleDelete(o.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Supprimer</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOffers;
