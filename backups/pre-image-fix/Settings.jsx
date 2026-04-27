import { useState, useEffect, useRef } from "react";
import {
  X,
  Moon,
  Sun,
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Palette,
  ChevronRight,
  ChevronLeft,
  Check,
  Camera,
  Link,
  Share2,
  QrCode,
} from "lucide-react";
import "./Settings.css";

// firebase storage helper
import { storageRef, uploadBytesResumable, getDownloadURL, getStorage } from "../../services/firebase.js";

const Settings = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  user,
  setUser,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState(null);
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("settings_notifications");
    return stored !== null ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem("settings_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  // whenever settings panel is closed reset the active subsection
  useEffect(() => {
    if (!isOpen) setActiveSection(null);
  }, [isOpen]);

  const handleSaveProfile = (newProfile) => {
    setUser(newProfile);
    setActiveSection(null);
  };

  const SectionHeader = ({ title }) => (
    <div className="settings-header">
      <button className="back-btn" onClick={() => setActiveSection(null)}>
        <ChevronLeft size={20} />
      </button>
      <h2>{title}</h2>
      <div style={{ width: 32 }} />
    </div>
  );

  const ProfileSection = () => {
    const [name, setName] = useState(user?.name || "");
    const [status, setStatus] = useState(user?.status || "");
    const [avatarURL, setAvatarURL] = useState(user?.avatar || "");
    const [avatarFile, setAvatarFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
      if (avatarFile) {
        const reader = new FileReader();
        reader.onload = () => {
          setAvatarURL(reader.result);
        };
        reader.readAsDataURL(avatarFile);
      }
    }, [avatarFile]);

    const uploadAvatar = async (file) => {
      if (!file) return avatarURL;
      try {
        const path = `avatars/${Date.now()}_${file.name}`;
        const imgRef = storageRef(storage, path);
        const snapshot = await uploadBytesResumable(imgRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return url;
      } catch (err) {
        console.error("Avatar upload failed", err);
        // fallback to local preview
        return avatarURL;
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      let finalUrl = avatarURL;
      if (avatarFile) {
        finalUrl = await uploadAvatar(avatarFile);
      }
      handleSaveProfile({ name, status, avatar: finalUrl });
    };

    const initials = name
      ? name
          .split(" ")
          .map((p) => p[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "";

    return (
      <div className="settings-section">
        <SectionHeader title="Mon Profil" />
        <div
          className="avatar-preview"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          {avatarURL ? <img src={avatarURL} alt="avatar" /> : initials}
          <div className="avatar-overlay">
            <Camera size={16} />
          </div>
        </div>
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-row">
            <label>
              Nom
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
              />
            </label>
          </div>
          <div className="profile-row" style={{ flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>Statut</span>
            <div className="telegram-status-toggle">
              <div 
                className={`status-option ${status !== 'Privé' ? 'active' : ''}`} 
                onClick={() => setStatus('Public')}
              >
                Public
              </div>
              <div 
                className={`status-option ${status === 'Privé' ? 'active' : ''}`} 
                onClick={() => setStatus('Privé')}
              >
                Privé
              </div>
              <div className={`status-slider ${status === 'Privé' ? 'right' : 'left'}`} />
            </div>
          </div>
          <div className="profile-row">
            <label>
              Avatar (URL)
              <input
                type="text"
                value={avatarURL}
                onChange={(e) => setAvatarURL(e.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => setAvatarFile(e.target.files[0] || null)}
          />
          <div className="avatar-note">
            cliquez sur l'avatar pour sélectionner un fichier
          </div>
          <div className="profile-buttons">
            <button type="button" onClick={() => setActiveSection(null)}>
              Annuler
            </button>
            <button type="submit" className="primary">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    );
  };

  const PrivacySection = () => {
    const [shareStatus, setShareStatus] = useState(false);
    const [readReceipts, setReadReceipts] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const profileUrl = `${window.location.origin}/profile/${user?.id || user?.uid || 'unknown'}`;

    const handleCopy = () => {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Mon Profil Cogito',
            text: 'Ajoutez-moi sur Cogito !',
            url: profileUrl,
          });
        } catch (err) {
          console.warn("Share failed", err);
        }
      } else {
        handleCopy();
      }
    };

    return (
      <div className="settings-section">
        <SectionHeader title="Confidentialité" />
        <div className="settings-list">
          <div
            className="settings-item"
            onClick={() => setShareStatus((v) => !v)}
          >
            <span>Partager mon statut</span>
            <div className={`toggle-track ${shareStatus ? "on" : ""}`}>
              <div className="toggle-thumb" />
            </div>
          </div>
          <div
            className="settings-item"
            onClick={() => setReadReceipts((v) => !v)}
          >
            <span>Recevoir des accusés de lecture</span>
            <div className={`toggle-track ${readReceipts ? "on" : ""}`}>
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-list" style={{ padding: "0 8px" }}>
          <h3 style={{ fontSize: "14px", margin: "10px 0 6px 14px", color: "var(--text-secondary)", fontWeight: "600" }}>
            Partager mon profil
          </h3>
          <div style={{ display: "flex", gap: "10px", padding: "4px 14px", flexWrap: "wrap", boxSizing: "border-box" }}>
            <button 
              onClick={handleCopy}
              className="edit-profile-btn"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              {copied ? <Check size={16} color="#22c55e" /> : <Link size={16} />}
              {copied ? "Copié !" : "Copier le lien"}
            </button>
            <button 
              onClick={handleShare}
              className="edit-profile-btn"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", backgroundColor: "var(--highlight-color)", color: "#fff", border: "none" }}
            >
              <Share2 size={16} />
              Partager
            </button>
          </div>
          
          <div style={{ padding: "4px 14px", marginTop: "8px" }}>
            <button 
              onClick={() => setShowQR(!showQR)}
              className="edit-profile-btn"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <QrCode size={16} />
              {showQR ? "Masquer le Code QR" : "Afficher mon Code QR"}
            </button>
          </div>

          {showQR && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "16px", marginBottom: "16px", animation: "qrPopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" }}>
              <div style={{ background: "#fff", padding: "12px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(profileUrl)}`} 
                  alt="QR Code"
                  style={{ width: "160px", height: "160px", display: "block" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ThemeSection = () => {
    const defaultBackgrounds = [
      "#e5ddd5", 
      "#2b5278", 
      "#1e1e1e", 
      "#4a6741", 
      "linear-gradient(45deg, #2563eb, #7c3aed)",
      "linear-gradient(135deg, #f59e0b, #ef4444)"
    ];
    
    const [selectedBg, setSelectedBg] = useState(() => localStorage.getItem("chat_background") || "#e5ddd5");
    const [customBgUrl, setCustomBgUrl] = useState(null);
    const bgInputRef = useRef(null);

    const handleBgChange = (bg) => {
      setSelectedBg(bg);
      localStorage.setItem("chat_background", bg);
      window.dispatchEvent(new CustomEvent('chatBackgroundChanged', { detail: bg }));
    };

    const handleCustomBgUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result;
        setCustomBgUrl(url);
        handleBgChange(url);
      };
      reader.readAsDataURL(file);
    };

    return (
      <div className="settings-section">
        <SectionHeader title="Apparence" />
        <div className="settings-list" style={{ padding: "0 14px" }}>
          
          <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "10px", marginBottom: "8px" }}>Thème Global</h3>
          <div className="telegram-status-toggle" style={{ marginBottom: "20px" }}>
              <div 
                className={`status-option ${!isDark ? 'active' : ''}`} 
                onClick={() => setTheme("light")}
              >
                Clair
              </div>
              <div 
                className={`status-option ${isDark ? 'active' : ''}`} 
                onClick={() => setTheme("dark")}
              >
                Sombre
              </div>
              <div className={`status-slider ${isDark ? 'right' : 'left'}`} />
          </div>

          <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>Arrière-plan du Chat</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
             {defaultBackgrounds.map((bg, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleBgChange(bg)}
                  style={{ 
                    height: "80px", 
                    borderRadius: "8px", 
                    background: bg.startsWith("http") || bg.startsWith("data:") ? `url(${bg}) center/cover` : bg,
                    border: selectedBg === bg ? "3px solid #007aff" : "2px solid transparent",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                  className="bg-thumbnail"
                />
             ))}
             {customBgUrl && !defaultBackgrounds.includes(customBgUrl) && (
               <div 
                  onClick={() => handleBgChange(customBgUrl)}
                  style={{ 
                    height: "80px", 
                    borderRadius: "8px", 
                    background: `url(${customBgUrl}) center/cover`,
                    border: selectedBg === customBgUrl ? "3px solid #007aff" : "2px solid transparent",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                  className="bg-thumbnail"
                />
             )}
          </div>
          
          <button 
            onClick={() => bgInputRef.current && bgInputRef.current.click()}
            className="edit-profile-btn" 
            style={{ width: "100%", marginTop: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "10px" }}
          >
             <Camera size={18} />
             Choisir une Image
          </button>
          
          <input 
             type="file" 
             accept="image/*" 
             style={{ display: "none" }} 
             ref={bgInputRef}
             onChange={handleCustomBgUpload}
          />

        </div>
      </div>
    );
  };

  const HelpSection = () => (
    <div className="settings-section">
      <SectionHeader title="Aide & Support" />
      <div className="help-content">
        <p>
          Besoin d'aide ? Consultez notre <a href="/faq">FAQ</a> ou
          contactez-nous à <a href="mailto:support@example.com">support@example.com</a>.
        </p>
      </div>
    </div>
  );

  const renderMain = () => (
    <>
      {/* Header */}
      <div className="settings-header">
        <h2>Paramètres</h2>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {/* Profile */}
      <div className="settings-profile">
        <div className="profile-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" />
          ) : (
            user?.name?.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="profile-info">
          <strong>{user?.name || "Utilisateur"}</strong>
          <span>{user?.status || ""}</span>
        </div>
        <button
          className="edit-profile-btn"
          onClick={() => setActiveSection("profile")}
        >
          Modifier
        </button>
      </div>

      <div className="settings-divider" />

      {/* Options list */}
      <div className="settings-list">
        <div className="settings-item" onClick={toggleTheme}>
          <div className="settings-icon" style={{ backgroundColor: "#5856d6", color: "#fff" }}>
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </div>
          <span>Mode Sombre</span>
          <div className={`toggle-track ${isDark ? "on" : ""}`}>
            <div className="toggle-thumb" />
          </div>
        </div>

        <div
          className="settings-item"
          onClick={() => setNotifications((n) => !n)}
        >
          <div className="settings-icon" style={{ backgroundColor: "#ff3b30", color: "#fff" }}>
            <Bell size={18} />
          </div>
          <span>Notifications</span>
          <div className={`toggle-track ${notifications ? "on" : ""}`}>
            <div className="toggle-thumb" />
          </div>
        </div>

        <div className="settings-divider" />

        <div
          className="settings-item"
          onClick={() => setActiveSection("profile")}
        >
          <div className="settings-icon" style={{ backgroundColor: "#007aff", color: "#fff" }}>
            <User size={18} />
          </div>
          <span>Mon Profil</span>
          <ChevronRight size={16} className="chevron" />
        </div>

        <div
          className="settings-item"
          onClick={() => setActiveSection("privacy")}
        >
          <div className="settings-icon" style={{ backgroundColor: "#8e8e93", color: "#fff" }}>
            <Shield size={18} />
          </div>
          <span>Confidentialité</span>
          <ChevronRight size={16} className="chevron" />
        </div>

        <div
          className="settings-item"
          onClick={() => setActiveSection("theme")}
        >
          <div className="settings-icon" style={{ backgroundColor: "#32ade6", color: "#fff" }}>
            <Palette size={18} />
          </div>
          <span>Apparence</span>
          <ChevronRight size={16} className="chevron" />
        </div>

        <div
          className="settings-item"
          onClick={() => setActiveSection("help")}
        >
          <div className="settings-icon" style={{ backgroundColor: "#ff9500", color: "#fff" }}>
            <HelpCircle size={18} />
          </div>
          <span>Aide & Support</span>
          <ChevronRight size={16} className="chevron" />
        </div>

        <div className="settings-divider" />

        <div
          className="settings-item danger"
          onClick={() => {
            onLogout && onLogout();
            onClose && onClose();
          }}
        >
          <div className="settings-icon" style={{ backgroundColor: "#ff3b30", color: "#fff" }}>
            <LogOut size={18} />
          </div>
          <span style={{ color: "var(--text-primary)" }}>Se Déconnecter</span>
        </div>
      </div>
    </>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection />;
      case "privacy":
        return <PrivacySection />;
      case "theme":
        return <ThemeSection />;
      case "help":
        return <HelpSection />;
      default:
        return renderMain();
    }
  };

  return (
    <div
      className={`settings-overlay ${isOpen ? "open" : ""}`}
      onClick={onClose}
    >
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        {renderSectionContent()}
      </div>
    </div>
  );
};

export default Settings;
