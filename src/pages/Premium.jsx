import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-toastify";
import { Crown, CheckCircle, Clock, ArrowLeft } from "lucide-react";

const styles = {
  container: {
    maxWidth: 600, margin: "40px auto", padding: "0 20px",
  },
  card: {
    background: "rgba(255,255,255,0.04)", borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)", padding: 32,
  },
  planBox: {
    background: "rgba(197,160,89,0.1)", border: "1px solid rgba(197,160,89,0.3)",
    borderRadius: 12, padding: 24, textAlign: "center", marginTop: 20,
  },
  btn: {
    background: "#c5a059", color: "#1e293b", border: "none",
    padding: "12px 28px", borderRadius: 10, fontWeight: 600,
    cursor: "pointer", fontSize: 15,
  },
};

const Premium = ({ user, setUser }) => {
  const [step, setStep] = useState("confirm");
  const [loading, setLoading] = useState(false);

  const isFree = user?.plan === "free" || !user?.plan;
  const requested = user?.premiumRequested;
  const isPro = user?.role === "pro";

  const handleRequestPremium = async () => {
    setLoading(true);
    try {
      const uid = user.id || user.uid;
      await updateDoc(doc(db, "users", uid), {
        plan: "pro",
        premiumRequested: true,
      });
      setUser({ ...user, plan: "pro", premiumRequested: true });
      toast.success("Demande envoyée ! En attente d'approbation.");
      setStep("done");
    } catch (err) {
      toast.error("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition" style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Crown size={28} style={{ color: "#c5a059" }} />
          <h2 style={{ margin: 0, color: "#e2e8f0" }}>Cogito Premium</h2>
        </div>

        {isPro ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle size={48} style={{ color: "#10b981", marginBottom: 16 }} />
            <h3 style={{ color: "#e2e8f0", margin: "0 0 8px" }}>Compte Pro Actif</h3>
            <p style={{ color: "#94a3b8" }}>Vous avez accès à toutes les fonctionnalités premium.</p>
          </div>
        ) : requested ? (
          <div style={{ textAlign: "center" }}>
            <Clock size={48} style={{ color: "#f59e0b", marginBottom: 16 }} />
            <h3 style={{ color: "#e2e8f0", margin: "0 0 8px" }}>Demande en attente</h3>
            <p style={{ color: "#94a3b8" }}>
              Votre demande de passage au plan Pro est en cours d'examen par l'administration.
            </p>
          </div>
        ) : (
          <>
            {step === "confirm" && (
              <>
                <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
                  Passez au plan <strong style={{ color: "#c5a059" }}>Pro</strong> et débloquez :
                </p>
                <ul style={{ color: "#cbd5e1", lineHeight: 2, paddingLeft: 20 }}>
                  <li>Cogi IA — Assistant intelligent</li>
                  <li>Cours — Contenu pédagogique exclusif</li>
                  <li>Badge Pro sur votre profil</li>
                  <li>Fonctionnalités à venir</li>
                </ul>
                <div style={styles.planBox}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#c5a059" }}>499 DA</div>
                  <div style={{ color: "#94a3b8", fontSize: 14 }}>/ mois</div>
                </div>
                <button
                  onClick={() => setStep("payment")}
                  style={{ ...styles.btn, width: "100%", marginTop: 20 }}
                >
                  Passer à Pro — 499 DA/mois
                </button>
              </>
            )}

            {step === "payment" && (
              <>
                <h3 style={{ color: "#e2e8f0", marginBottom: 16 }}>Mode de paiement</h3>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>Numéro de carte</label>
                    <input
                      type="text" placeholder="4242 4242 4242 4242"
                      style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>Expiration</label>
                      <input type="text" placeholder="MM/AA" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>CVV</label>
                      <input type="text" placeholder="123" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>
                    Paiement simulé — aucun montant réel ne sera débité.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => setStep("confirm")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "12px 20px", borderRadius: 10, cursor: "pointer", flex: 1 }}>
                    Retour
                  </button>
                  <button onClick={handleRequestPremium} disabled={loading} style={{ ...styles.btn, flex: 1 }}>
                    {loading ? "Traitement..." : "Confirmer le paiement"}
                  </button>
                </div>
              </>
            )}

            {step === "done" && (
              <div style={{ textAlign: "center" }}>
                <Clock size={48} style={{ color: "#f59e0b", marginBottom: 16 }} />
                <h3 style={{ color: "#e2e8f0" }}>Demande envoyée !</h3>
                <p style={{ color: "#94a3b8" }}>L'administrateur examinera votre demande sous 24h.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Premium;