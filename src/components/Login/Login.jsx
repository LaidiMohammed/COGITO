import "./Login.css";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { upload } from "../../lib/upload";

auth.languageCode = "fr";
const googleProvider = new GoogleAuthProvider();

const ALGERIAN_UNIVERSITIES = [
  "Université d'Alger 1", "Université d'Alger 2", "Université d'Alger 3",
  "Université de Bejaia", "Université de Tizi Ouzou", "Université de Constantine 1",
  "Université de Constantine 2", "Université de Constantine 3", "Université d'Oran 1",
  "Université d'Oran 2", "Université de Annaba", "Université de Sétif 1",
  "Université de Sétif 2", "Université de Blida 1", "Université de Blida 2",
  "Université de Tlemcen", "Université de Batna 1", "Université de Batna 2",
  "Université de Mostaganem", "Université de Chlef", "Université de Jijel",
  "Université de Skikda", "Université de Guelma", "Université de Biskra",
  "Université de Ouargla", "Université de M'Sila", "Université de Djelfa",
  "Université de Médéa", "Université de Saïda", "Université de Khenchela", "Autre",
];

/* ── Animated floating label input ───────────────────────── */
const FloatInput = ({ id, label, type = "text", value, onChange, disabled, autoComplete, required }) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.length > 0;
  return (
    <div className={`fl-field ${focused || hasValue ? "active" : ""}`}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        autoComplete={autoComplete}
        required={required}
        className="fl-input"
        placeholder=" "
      />
      <label htmlFor={id} className="fl-label">{label}</label>
      <span className="fl-bar" />
    </div>
  );
};

/* ── Floating label select ────────────────────────────────── */
const FloatSelect = ({ id, label, value, onChange, options, disabled }) => {
  const hasValue = value && value.length > 0;
  return (
    <div className={`fl-field ${hasValue ? "active" : ""}`}>
      <select id={id} value={value} onChange={onChange} disabled={disabled} className="fl-input fl-select">
        <option value="" />
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <label htmlFor={id} className="fl-label">{label}</label>
      <span className="fl-bar" />
    </div>
  );
};

/* ── Google SVG logo ──────────────────────────────────────── */
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.6 33.5 30 36.5 24 36.5c-6.9 0-12.5-5.6-12.5-12.5S17.1 11.5 24 11.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.5 5.8 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"/>
    <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16 19.1 13.5 24 13.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.5 5.8 29.6 4 24 4c-7.8 0-14.5 4.5-18.1 10.7z" transform="translate(0,-1)"/>
    <path fill="#FBBC05" d="M24 44c5.8 0 10.9-1.9 14.9-5.1l-6.9-5.7C29.9 35.1 27.1 36.5 24 36.5c-5.9 0-10.9-3.5-13.2-8.5l-7 5.4C7.9 39.9 15.4 44 24 44z"/>
    <path fill="#EA4335" d="M44.3 20H24v8.5h11.8c-1 3-3.5 5.5-6.6 7.2l6.9 5.7C40.4 38 44 32 44 24c0-1.3-.1-2.7-.2-4l.5-4z" transform="translate(0,-1)"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   MAIN LOGIN COMPONENT
═══════════════════════════════════════════════════════════ */
const Login = () => {
  /* mode: "login" | "register-1" | "register-2" | "register-3" | "verify" */
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  /* Login fields */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  /* Register Step-1 */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPass2, setRegPass2] = useState("");

  /* Register Step-2 */
  const [matricule, setMatricule] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [cardFile, setCardFile] = useState(null);
  const [cardPreview, setCardPreview] = useState("");
  const cardRef = useRef(null);

  /* Register Step-3 */
  const [plan, setPlan] = useState("free");
  const [billingCycle, setBillingCycle] = useState("monthly");

  /* Verify */
  const [pendingUser, setPendingUser] = useState(null);

  /* Parallax tilt removed — white background must be opaque */

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) return toast.warn("Remplissez tous les champs");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPass);
      toast.success("Connexion réussie");
    } catch (err) {
      toast.error("Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  /* ── Google OAuth ── */
  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          id: user.uid,
          username: user.displayName || "Utilisateur",
          email: user.email,
          avatar: user.photoURL || "",
          role: "student",
          plan: "free",
          emailVerified: true,
          createdAt: new Date(),
        });
        await setDoc(doc(db, "userschats", user.uid), { chats: [] });
      }
      toast.success("Connexion Google réussie");
    } catch (err) {
      console.error("Google OAuth Error:", err);
      toast.error("Erreur Google OAuth: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 1 → 2 ── */
  const handleStep1 = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !regEmail.trim() || !regPass) return toast.warn("Remplissez tous les champs");
    if (regPass.length < 6) return toast.warn("Mot de passe minimum 6 caractères");
    if (regPass !== regPass2) return toast.warn("Les mots de passe ne correspondent pas");
    setMode("register-2");
  };

  /* ── Step 2 → 3 ── */
  const handleStep2 = (e) => {
    e.preventDefault();
    if (!matricule || !university || !department || !specialty) return toast.warn("Remplissez tous les champs académiques");
    setMode("register-3");
  };

  /* ── Register final (step 3) ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, regEmail, regPass);
      const user = cred.user;

      let cardUrl = "";
      if (cardFile) {
        cardUrl = await upload(cardFile, "cards", { maxWidth: 800, maxHeight: 800, quality: 0.7 });
      }

      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        username: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: regEmail,
        matricule,
        university,
        department,
        specialty,
        studentCard: cardUrl,
        avatar: "",
        role: "student",
        plan,
        premiumRequested: plan === "pro",
        billingCycle: plan === "pro" ? billingCycle : null,
        paymentVerified: false,
        emailVerified: false,
        createdAt: new Date(),
      });
      await setDoc(doc(db, "userschats", user.uid), { chats: [] });

      /* Send Firebase email verification */
      try {
        await sendEmailVerification(user);
        toast.success("Compte créé — vérifiez votre email");
      } catch (emailErr) {
        console.error("Email verification sending failed:", emailErr);
        toast.warn("Compte créé, mais l'envoi de l'email de vérification a échoué.");
      }
      setPendingUser(user);
      setMode("verify");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") toast.error("Email déjà utilisé");
      else toast.error(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend verification ── */
  const handleResend = async () => {
    if (!pendingUser) return;
    try {
      await sendEmailVerification(pendingUser);
      toast.success("Email de vérification renvoyé");
    } catch (err) {
      console.error("Resend email failed:", err);
      toast.error("Impossible de renvoyer l'email: " + (err.message || err));
    }
  };

  /* ── Card file ── */
  const handleCard = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCardFile(f);
    setCardPreview(URL.createObjectURL(f));
  };

  /* ── Rendering helpers ── */
  const stepLabel = mode === "register-1" ? "1 / 3" : mode === "register-2" ? "2 / 3" : "3 / 3";

  return (
    <div className="lg-root">
      {/* Floating particles */}
      <div className="lg-particles" aria-hidden="true">
        {[...Array(10)].map((_, i) => <span key={i} className="lg-particle" style={{ "--i": i }} />)}
      </div>

      {/* RIGHT: transparent panel holding the form */}
      <div className={`lg-panel ${mode === "verify" ? "lg-panel--narrow" : ""}`}>
        <div className="lg-form-container">
        {/* ──────── VERIFY EMAIL ──────── */}
        {mode === "verify" && (
          <div className="lg-form-block lg-verify">
            <div className="lg-verify-icon">
              <svg viewBox="0 0 48 48" width="56" height="56" fill="none">
                <circle cx="24" cy="24" r="22" stroke="#C5A059" strokeWidth="2.5" />
                <path d="M8 16l16 11 16-11" stroke="#C5A059" strokeWidth="2.5" strokeLinecap="round" />
                <rect x="8" y="14" width="32" height="22" rx="3" stroke="#C5A059" strokeWidth="2.5" />
              </svg>
            </div>
            <h2 className="lg-verify-title">Vérifiez votre email</h2>
            <p className="lg-verify-sub">
              Un lien de vérification a été envoyé à<br />
              <strong>{regEmail}</strong>
            </p>
            <p className="lg-verify-hint">Cliquez sur le lien dans l'email pour activer votre compte. Vérifiez aussi les spams.</p>
            <button className="lg-btn-gold lg-btn-full" onClick={handleResend}>Renvoyer l'email</button>
            <button className="lg-link-btn" onClick={() => setMode("login")}>Retour à la connexion</button>
          </div>
        )}

        {/* ──────── LOGIN ──────── */}
        {mode === "login" && (
          <div className="lg-form-block">
            <div className="lg-form-header">
              <h1 className="lg-title">Bon retour</h1>
              <p className="lg-sub">Connectez-vous à votre espace Cogito</p>
            </div>

            <button className="lg-btn-google" onClick={handleGoogle} disabled={loading}>
              <GoogleLogo />
              <span>Continuer avec Google</span>
            </button>

            <div className="lg-divider"><span>ou</span></div>

            <form onSubmit={handleLogin} className="lg-form" autoComplete="off">
              <FloatInput id="l-email" label="Adresse email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} disabled={loading} autoComplete="email" required />
              <FloatInput id="l-pass" label="Mot de passe" type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} disabled={loading} autoComplete="current-password" required />
              <button type="submit" className="lg-btn-primary lg-btn-full" disabled={loading}>
                {loading ? <span className="lg-spinner" /> : "Se connecter"}
              </button>
            </form>

            <p className="lg-switch">
              Pas encore de compte ?{" "}
              <button className="lg-link-btn" onClick={() => setMode("register-1")}>Créer un compte</button>
            </p>
          </div>
        )}

        {/* ──────── REGISTER STEP 1 ──────── */}
        {mode === "register-1" && (
          <div className="lg-form-block">
            <div className="lg-form-header">
              <div className="lg-steps">
                <span className="lg-step lg-step--active" />
                <span className="lg-step" />
                <span className="lg-step" />
              </div>
              <h1 className="lg-title">Créer un compte</h1>
              <p className="lg-sub">Informations personnelles · {stepLabel}</p>
            </div>

            <button className="lg-btn-google" onClick={handleGoogle} disabled={loading}>
              <GoogleLogo />
              <span>Continuer avec Google</span>
            </button>

            <div className="lg-divider"><span>ou</span></div>

            <form onSubmit={handleStep1} className="lg-form">
              <div className="lg-row">
                <FloatInput id="r-fn" label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={loading} required />
                <FloatInput id="r-ln" label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={loading} required />
              </div>
              <FloatInput id="r-email" label="Adresse email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} disabled={loading} required />
              <FloatInput id="r-pass" label="Mot de passe (min. 6 caractères)" type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} disabled={loading} required />
              <FloatInput id="r-pass2" label="Confirmer le mot de passe" type="password" value={regPass2} onChange={(e) => setRegPass2(e.target.value)} disabled={loading} required />
              <button type="submit" className="lg-btn-primary lg-btn-full" disabled={loading}>
                Continuer
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>

            <p className="lg-switch">
              Déjà inscrit ?{" "}
              <button className="lg-link-btn" onClick={() => setMode("login")}>Se connecter</button>
            </p>
          </div>
        )}

        {/* ──────── REGISTER STEP 2 ──────── */}
        {mode === "register-2" && (
          <div className="lg-form-block">
            <div className="lg-form-header">
              <div className="lg-steps">
                <span className="lg-step lg-step--done" />
                <span className="lg-step lg-step--active" />
                <span className="lg-step" />
              </div>
              <h1 className="lg-title">Informations académiques</h1>
              <p className="lg-sub">Complétez votre profil étudiant · {stepLabel}</p>
            </div>

            <form onSubmit={handleStep2} className="lg-form">
              <FloatInput id="r-mat" label="Matricule étudiant" value={matricule} onChange={(e) => setMatricule(e.target.value)} disabled={loading} required />
              <FloatSelect id="r-uni" label="Université" value={university} onChange={(e) => setUniversity(e.target.value)} options={ALGERIAN_UNIVERSITIES} disabled={loading} />
              <div className="lg-row">
                <FloatInput id="r-dep" label="Département" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={loading} required />
                <FloatInput id="r-spe" label="Spécialité" value={specialty} onChange={(e) => setSpecialty(e.target.value)} disabled={loading} required />
              </div>

              {/* Card upload */}
              <div className="lg-card-upload" onClick={() => cardRef.current?.click()}>
                {cardPreview ? (
                  <img src={cardPreview} alt="Carte" className="lg-card-preview" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#C5A059" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                      <circle cx="7" cy="15" r="1" fill="#C5A059" />
                    </svg>
                    <span>Carte étudiant (optionnel)</span>
                  </>
                )}
                <input ref={cardRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCard} />
              </div>

              <div className="lg-form-actions">
                <button type="button" className="lg-btn-outline" onClick={() => setMode("register-1")} disabled={loading}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                  Retour
                </button>
                <button type="submit" className="lg-btn-primary" disabled={loading}>
                  {loading ? <span className="lg-spinner" /> : "Continuer"}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ──────── REGISTER STEP 3 ──────── */}
        {mode === "register-3" && (
          <div className="lg-form-block">
            <div className="lg-form-header">
              <div className="lg-steps">
                <span className="lg-step lg-step--done" />
                <span className="lg-step lg-step--done" />
                <span className="lg-step lg-step--active" />
              </div>
              <h1 className="lg-title">Choisissez votre formule</h1>
              <p className="lg-sub">Plan · {stepLabel}</p>
            </div>

            <div className="lg-plan-cards">
              {/* Free Plan */}
              <div
                className={`lg-plan-card ${plan === "free" ? "lg-plan-card--selected" : ""}`}
                onClick={() => setPlan("free")}
              >
                <div className="lg-plan-header">
                  <div className="lg-plan-icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#002147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h3 className="lg-plan-name">Gratuit</h3>
                </div>
                <div className="lg-plan-price">
                  <span className="lg-plan-amount">0</span>
                  <span className="lg-plan-currency">DA</span>
                </div>
                <div className="lg-plan-period">/ mois</div>

                <ul className="lg-plan-features">
                  <li className="lg-plan-feature lg-plan-feature--included">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Messagerie (Chat)
                  </li>
                  <li className="lg-plan-feature lg-plan-feature--included">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Groupes
                  </li>
                  <li className="lg-plan-feature lg-plan-feature--included">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Meet (Visio)
                  </li>
                  <li className="lg-plan-feature lg-plan-feature--excluded">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    Cours
                  </li>
                  <li className="lg-plan-feature lg-plan-feature--excluded">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    Assistant COGI
                  </li>
                </ul>

                <div className="lg-plan-select-indicator">
                  {plan === "free" && (
                    <span className="lg-plan-check">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                  )}
                </div>
              </div>

              {/* Pro Plan */}
              <div
                className={`lg-plan-card lg-plan-card--pro ${plan === "pro" ? "lg-plan-card--selected" : ""}`}
                onClick={() => setPlan("pro")}
              >
                <div className="lg-plan-badge">Populaire</div>
                <div className="lg-plan-header">
                  <div className="lg-plan-icon lg-plan-icon--gold">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <h3 className="lg-plan-name">Pro</h3>
                </div>
                <div className="lg-plan-price">
                  <span className="lg-plan-amount">{billingCycle === "yearly" ? "4 999" : "499"}</span>
                  <span className="lg-plan-currency">DA</span>
                </div>
                <div className="lg-plan-period">/ {billingCycle === "yearly" ? "an" : "mois"}</div>
                {billingCycle === "yearly" && <div className="lg-plan-discount">Économisez 17%</div>}

                <ul className="lg-plan-features">
                  <li className="lg-plan-feature lg-plan-feature--included">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Tout du Gratuit
                  </li>
                  <li className="lg-plan-feature lg-plan-feature--included">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Cours
                  </li>
                  <li className="lg-plan-feature lg-plan-feature--included">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Assistant COGI
                  </li>
                  <li className="lg-plan-feature lg-plan-feature--included">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Accès illimité
                  </li>
                  <li className="lg-plan-feature lg-plan-feature--included">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Support prioritaire
                  </li>
                </ul>

                <div className="lg-plan-select-indicator">
                  {plan === "pro" && (
                    <span className="lg-plan-check">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Billing toggle */}
            <div className="lg-billing-toggle">
              <span className={`lg-billing-label ${billingCycle === "monthly" ? "active" : ""}`}>Mensuel</span>
              <label className="lg-toggle-switch">
                <input
                  type="checkbox"
                  checked={billingCycle === "yearly"}
                  onChange={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                />
                <span className="lg-toggle-slider" />
              </label>
              <span className={`lg-billing-label ${billingCycle === "yearly" ? "active" : ""}`}>
                Annuel
                <span className="lg-billing-save">-17%</span>
              </span>
            </div>

            <p className="lg-plan-note">
              {plan === "pro"
                ? "L'accès Pro sera activé après validation par l'administrateur."
                : "Vous pourrez passer à Pro plus tard."}
            </p>

            <form onSubmit={handleRegister} className="lg-form">
              <div className="lg-form-actions">
                <button type="button" className="lg-btn-outline" onClick={() => setMode("register-2")} disabled={loading}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                  Retour
                </button>
                <button type="submit" className="lg-btn-primary" disabled={loading}>
                  {loading ? <span className="lg-spinner" /> : "Créer mon compte"}
                </button>
              </div>
            </form>
          </div>
        )}

        </div>
      </div>
    </div>
  );
};

export default Login;
