import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./AdminPanel.css";

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
);
const BanIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
);
const CrownIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20" /><path d="M5 20V10l7-7 7 7v10" /><path d="M12 3v7" /></svg>
);
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const FolderIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);

const AdminPanel = ({ onClose }) => {
  const { currentUser } = useUserStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchGroup, setSearchGroup] = useState("");
  const [selectedGroupMsgs, setSelectedGroupMsgs] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) =>
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "groups"), (snap) =>
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "meetings"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setMeetings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const handleBanUser = async (user) => {
    if (user.id === currentUser?.id) return alert("Vous ne pouvez pas vous bannir vous-même.");
    const isBanned = Boolean(user.banned);
    const label = isBanned ? "débannir" : "bannir";
    if (!window.confirm(`Voulez-vous ${label} ${user.username || user.email} ?`)) return;
    await updateDoc(doc(db, "users", user.id), { banned: !isBanned });
  };

  const handlePromoteAdmin = async (user) => {
    if (user.id === currentUser?.id) return;
    const isAdmin = user.role === "admin";
    const label = isAdmin ? "révoquer les droits admin de" : "promouvoir admin";
    if (!window.confirm(`Voulez-vous ${label} ${user.username || user.email} ?`)) return;
    await updateDoc(doc(db, "users", user.id), { role: isAdmin ? "user" : "admin" });
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Supprimer définitivement le groupe "${group.groupName}" ?`)) return;
    await deleteDoc(doc(db, "groups", group.id));
  };

  const handleDeleteMeet = async (meet) => {
    if (!window.confirm(`Supprimer la réunion "${meet.title}" ?`)) return;
    await deleteDoc(doc(db, "meetings", meet.id));
  };

  const filteredUsers = users.filter((u) =>
    (u.username || u.email || "").toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredGroups = groups.filter((g) =>
    (g.groupName || "").toLowerCase().includes(searchGroup.toLowerCase())
  );

  const activeUsersCount = users.filter(u => !u.banned).length;
  const bannedUsersCount = users.filter(u => u.banned).length;

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Sidebar */}
        <div className="admin-sidebar">
          <div className="admin-sidebar-header">
            <ShieldIcon />
            <h2>Cogito Admin</h2>
          </div>
          <nav className="admin-nav">
            <button className={`admin-nav-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
              <DashboardIcon /> Vue d'ensemble
            </button>
            <button className={`admin-nav-item ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
              <UsersIcon /> Utilisateurs
            </button>
            <button className={`admin-nav-item ${activeTab === "groups" ? "active" : ""}`} onClick={() => setActiveTab("groups")}>
              <FolderIcon /> Groupes
            </button>
            <button className={`admin-nav-item ${activeTab === "meets" ? "active" : ""}`} onClick={() => setActiveTab("meets")}>
              <CalendarIcon /> Réunions
            </button>
            <div className="admin-nav-divider"></div>
            <button className={`admin-nav-item ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
              <SettingsIcon /> Système
            </button>
          </nav>
          <div className="admin-sidebar-footer">
            <p>Connecté en tant que</p>
            <strong>{currentUser?.username || "Admin"}</strong>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-main">
          <div className="admin-topbar">
            <h1 className="admin-page-title">
              {activeTab === "dashboard" && "Vue d'ensemble du système"}
              {activeTab === "users" && "Gestion des utilisateurs"}
              {activeTab === "groups" && "Gestion des groupes"}
              {activeTab === "meets" && "Gestion des réunions"}
              {activeTab === "settings" && "Paramètres système"}
            </h1>
            <button className="admin-close-btn" onClick={onClose}>Fermer</button>
          </div>

          <div className="admin-content-area">
            
            {/* ── DASHBOARD ── */}
            {activeTab === "dashboard" && (
              <div className="admin-dashboard">
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <h3>Total Utilisateurs</h3>
                    <div className="stat-value">{users.length}</div>
                    <div className="stat-desc">Actifs: {activeUsersCount} | Bannis: {bannedUsersCount}</div>
                  </div>
                  <div className="admin-stat-card">
                    <h3>Groupes Actifs</h3>
                    <div className="stat-value">{groups.length}</div>
                    <div className="stat-desc">Espaces de collaboration</div>
                  </div>
                  <div className="admin-stat-card">
                    <h3>Réunions Planifiées</h3>
                    <div className="stat-value">{meetings.length}</div>
                    <div className="stat-desc">Sessions vidéo futures</div>
                  </div>
                  <div className="admin-stat-card">
                    <h3>État du Système</h3>
                    <div className="stat-value status-ok">Optimal</div>
                    <div className="stat-desc">Latence réseau: 12ms</div>
                  </div>
                </div>
                
                <div className="admin-recent-section">
                  <h3>Activités Récentes</h3>
                  <div className="admin-recent-list">
                    <p className="admin-empty-state">L'historique des activités sera bientôt disponible.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {activeTab === "users" && (
              <div className="admin-section">
                <div className="admin-search-bar">
                  <input
                    placeholder="Rechercher par nom ou email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                  <span className="search-count">{filteredUsers.length} résultat(s)</span>
                </div>
                <div className="admin-list-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className={u.banned ? "row-banned" : ""}>
                          <td>
                            <div className="td-user">
                              <div className="td-avatar">
                                {u.avatar && !u.avatar.startsWith("./") ? (
                                  <img src={u.avatar} alt="" />
                                ) : (
                                  <span>{(u.username || u.email || "?")[0].toUpperCase()}</span>
                                )}
                              </div>
                              <div className="td-info">
                                <strong>{u.username || "Non renseigné"}</strong>
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            {u.role === "admin" ? <span className="badge-admin">Administrateur</span> : <span className="badge-user">Standard</span>}
                          </td>
                          <td>
                            {u.banned ? <span className="badge-banned">Suspendu</span> : <span className="badge-active">Actif</span>}
                          </td>
                          <td>
                            {u.id !== currentUser?.id && (
                              <div className="td-actions">
                                <button className={`action-btn ${u.banned ? "btn-unban" : "btn-ban"}`} onClick={() => handleBanUser(u)}>
                                  <BanIcon /> {u.banned ? "Rétablir" : "Suspendre"}
                                </button>
                                <button className="action-btn btn-role" onClick={() => handlePromoteAdmin(u)}>
                                  <CrownIcon /> {u.role === "admin" ? "Rétrograder" : "Promouvoir"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── GROUPS ── */}
            {activeTab === "groups" && (
              <div className="admin-section">
                <div className="admin-search-bar">
                  <input
                    placeholder="Rechercher un groupe..."
                    value={searchGroup}
                    onChange={(e) => setSearchGroup(e.target.value)}
                  />
                  <span className="search-count">{filteredGroups.length} résultat(s)</span>
                </div>
                <div className="admin-list-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Groupe</th>
                        <th>Membres</th>
                        <th>Créateur ID</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGroups.map((g) => (
                        <tr key={g.id}>
                          <td>
                            <div className="td-user">
                              <div className="td-avatar square">
                                {g.groupImg ? (
                                  <img src={g.groupImg} alt="" />
                                ) : (
                                  <span>{(g.groupName || "G")[0].toUpperCase()}</span>
                                )}
                              </div>
                              <div className="td-info">
                                <strong>{g.groupName || "Sans nom"}</strong>
                              </div>
                            </div>
                          </td>
                          <td>{g.members?.length || 0}</td>
                          <td className="td-mono">{g.adminId?.slice(0, 8)}...</td>
                          <td>
                            <div className="td-actions">
                              <button className="action-btn btn-role" onClick={() => setSelectedGroupMsgs(g)}>
                                <FolderIcon /> Voir messages
                              </button>
                              <button className="action-btn btn-delete" onClick={() => handleDeleteGroup(g)}>
                                <TrashIcon /> Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── MEETS ── */}
            {activeTab === "meets" && (
              <div className="admin-section">
                <div className="admin-list-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Titre de la réunion</th>
                        <th>Date & Heure</th>
                        <th>Organisateur</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meetings.map((m) => (
                        <tr key={m.id}>
                          <td><strong>{m.title}</strong></td>
                          <td>{m.date ? new Date(m.date.seconds * 1000).toLocaleString("fr-FR") : "Non définie"}</td>
                          <td>{m.creatorName || "Inconnu"}</td>
                          <td>
                            <div className="td-actions">
                              <button className="action-btn btn-delete" onClick={() => handleDeleteMeet(m)}>
                                <TrashIcon /> Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {meetings.length === 0 && (
                        <tr><td colSpan="4" className="admin-empty-state">Aucune réunion programmée.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {activeTab === "settings" && (
              <div className="admin-settings-section">
                <div className="admin-settings-card">
                  <h3>Configuration de la Base de Données</h3>
                  <p>Serveur connecté : Firebase Firestore (Europe-West)</p>
                  <p>Mode strict activé : Oui</p>
                  <button className="action-btn btn-role" style={{marginTop: 15}}>Purger le cache</button>
                </div>
                <div className="admin-settings-card">
                  <h3>Sécurité</h3>
                  <p>Authentification Google : Activée</p>
                  <p>Authentification Email/MDP : Activée</p>
                  <p>Enregistrement public : Ouvert</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── GROUP MESSAGES MODAL ── */}
      {selectedGroupMsgs && (
        <div className="admin-overlay" style={{ zIndex: 10001, background: "rgba(0,0,0,0.6)" }} onClick={() => setSelectedGroupMsgs(null)}>
          <div className="admin-panel" style={{ width: "600px", height: "600px", minHeight: "400px", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-topbar">
              <h2 className="admin-page-title">Messages du groupe : {selectedGroupMsgs.groupName}</h2>
              <button className="admin-close-btn" onClick={() => setSelectedGroupMsgs(null)}>Fermer</button>
            </div>
            <div className="admin-content-area" style={{ background: "#f1f5f9" }}>
              {(!selectedGroupMsgs.messages || selectedGroupMsgs.messages.length === 0) ? (
                <p className="admin-empty-state">Aucun message dans ce groupe.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {selectedGroupMsgs.messages.map((msg, i) => (
                    <div key={i} style={{ background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontWeight: "600" }}>
                        ID Expéditeur: <span className="td-mono">{msg.senderId}</span>
                      </div>
                      <div style={{ color: "#0f172a", fontSize: "14px" }}>
                        {msg.text || (msg.img ? "[Image envoyée]" : msg.audio ? "[Audio envoyé]" : msg.document ? "[Document envoyé]" : "[Contenu non supporté]")}
                      </div>
                      {msg.createdAt && (
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px", textAlign: "right" }}>
                          {new Date(msg.createdAt.seconds ? msg.createdAt.seconds * 1000 : msg.createdAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
