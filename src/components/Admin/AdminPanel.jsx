import { useEffect, useState, useMemo } from "react";
import {
  collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, getDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import "./AdminPanel.css";

/* ── Icons ─────────────────────────────────────────────── */
const I = (d, vb = "0 0 24 24") => (
  <svg viewBox={vb} width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const CHART_COLORS = ["#C5A059", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b", "#06b6d4"];

/* ── Time-series helpers ──────────────────────────────── */
const bucketByDay = (items, dateField = "createdAt", days = 30) => {
  const now = Date.now();
  const map = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    map[key] = 0;
  }
  items.forEach((item) => {
    const ts = item[dateField];
    if (!ts) return;
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    if (key in map) map[key]++;
  });
  return Object.entries(map).map(([date, count]) => ({ date, count }));
};

const bucketByMonth = (items, dateField = "createdAt") => {
  const map = {};
  const months = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  for (let i = 0; i < 12; i++) map[months[i]] = 0;
  items.forEach((item) => {
    const ts = item[dateField];
    if (!ts) return;
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    map[months[d.getMonth()]]++;
  });
  return Object.entries(map).map(([date, count]) => ({ date, count }));
};

/* ── Custom Tooltip ───────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ap-tooltip">
      <p className="ap-tooltip-label">{label}</p>
      <p className="ap-tooltip-value">{payload[0].value}</p>
    </div>
  );
};

/* ══════════════════════════════════════════════════════ */
const AdminPanel = ({ onClose }) => {
  const { currentUser } = useUserStore();
  const [tab, setTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchGroup, setSearchGroup] = useState("");
  const [searchJob, setSearchJob] = useState("");
  const [timeScale, setTimeScale] = useState("day");
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (s) =>
      setUsers(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "groups"), (s) =>
      setGroups(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "meetings"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (s) =>
      setMeetings(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "jobs"), (s) =>
      setJobs(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  /* ── Analytics data ─────────────────────────────────── */
  const registrationData = useMemo(() =>
    timeScale === "day" ? bucketByDay(users) : bucketByMonth(users),
    [users, timeScale]
  );

  const univDistribution = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      const k = u.academicInfo?.universite || "Non renseigné";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.replace("Université ", "U. "), value }));
  }, [users]);

  const groupActivity = useMemo(() => {
    const active = groups.filter((g) => g.members?.length > 1).length;
    return [
      { name: "Actifs", value: active },
      { name: "Inactifs", value: groups.length - active },
    ];
  }, [groups]);

  /* ── User actions ───────────────────────────────────── */
  const banUser = async (u) => {
    if (u.id === currentUser?.id) return;
    if (!window.confirm(`${u.banned ? "Débannir" : "Bannir"} ${u.username || u.email} ?`)) return;
    await updateDoc(doc(db, "users", u.id), { banned: !u.banned });
  };

  const promoteUser = async (u) => {
    if (u.id === currentUser?.id) return;
    const isAdmin = u.role === "admin";
    if (!window.confirm(`${isAdmin ? "Rétrograder" : "Promouvoir admin"} ${u.username} ?`)) return;
    await updateDoc(doc(db, "users", u.id), { role: isAdmin ? "user" : "admin" });
  };

  const deleteGroup = async (g) => {
    if (!window.confirm(`Supprimer "${g.groupName}" ?`)) return;
    await deleteDoc(doc(db, "groups", g.id));
  };

  const deleteMeet = async (m) => {
    if (!window.confirm(`Supprimer "${m.title}" ?`)) return;
    await deleteDoc(doc(db, "meetings", m.id));
  };

  const deleteJob = async (j) => {
    if (!window.confirm(`Supprimer l'offre "${j.title}" ?`)) return;
    await deleteDoc(doc(db, "jobs", j.id));
  };

  const filteredUsers = users.filter((u) =>
    (u.username || u.email || "").toLowerCase().includes(searchUser.toLowerCase())
  );
  const filteredGroups = groups.filter((g) =>
    (g.groupName || "").toLowerCase().includes(searchGroup.toLowerCase())
  );
  const filteredJobs = jobs.filter((j) =>
    (j.title || "").toLowerCase().includes(searchJob.toLowerCase())
  );
  const activeUsers = users.filter((u) => !u.banned).length;
  const bannedUsers = users.filter((u) => u.banned).length;

  /* ── Nav items ──────────────────────────────────────── */
  const navItems = [
    { id: "dashboard", label: "Vue d'ensemble" },
    { id: "analytics", label: "Analytics" },
    { id: "users", label: "Utilisateurs" },
    { id: "groups", label: "Groupes" },
    { id: "meets", label: "Réunions" },
    { id: "jobs", label: "Jobs" },
    { id: "permissions", label: "Permissions" },
  ];

  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-panel" onClick={(e) => e.stopPropagation()}>

        {/* Sidebar */}
        <aside className="ap-sidebar">
          <div className="ap-sidebar-brand">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#C5A059" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Cogito Admin</span>
          </div>
          <nav className="ap-nav">
            {navItems.map((n) => (
              <button key={n.id} className={`ap-nav-item ${tab === n.id ? "active" : ""}`} onClick={() => setTab(n.id)}>
                {n.label}
              </button>
            ))}
          </nav>
          <div className="ap-sidebar-footer">
            <div className="ap-user-chip">
              <div className="ap-user-dot" />
              <span>{currentUser?.username || "Admin"}</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="ap-main">
          <div className="ap-topbar">
            <h1 className="ap-page-title">
              {navItems.find((n) => n.id === tab)?.label}
            </h1>
            <button className="ap-close-btn" onClick={onClose}>✕ Fermer</button>
          </div>

          <div className="ap-content">

            {/* ── DASHBOARD ── */}
            {tab === "dashboard" && (
              <div className="ap-dashboard">
                <div className="ap-stat-grid">
                  {[
                    { label: "Total Utilisateurs", value: users.length, sub: `Actifs: ${activeUsers} | Bannis: ${bannedUsers}`, color: "#3b82f6" },
                    { label: "Groupes", value: groups.length, sub: "Espaces de collaboration", color: "#10b981" },
                    { label: "Offres", value: jobs.length, sub: "Jobs étudiants", color: "#f59e0b" },
                    { label: "Réunions", value: meetings.length, sub: "Sessions vidéo", color: "#8b5cf6" },
                    { label: "Système", value: "Optimal", sub: "Tous services actifs", color: "#C5A059" },
                  ].map((s) => (
                    <div key={s.label} className="ap-stat-card" style={{ "--accent": s.color }}>
                      <div className="ap-stat-value">{s.value}</div>
                      <div className="ap-stat-label">{s.label}</div>
                      <div className="ap-stat-sub">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Mini charts row */}
                <div className="ap-charts-row">
                  <div className="ap-chart-card">
                    <div className="ap-chart-header">
                      <h3>Inscriptions (30 derniers jours)</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={bucketByDay(users)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} interval={4} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="count" stroke="#C5A059" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="ap-chart-card">
                    <div className="ap-chart-header"><h3>Groupes actifs vs inactifs</h3></div>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={groupActivity} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                          {groupActivity.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                        </Pie>
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {tab === "analytics" && (
              <div className="ap-analytics">
                <div className="ap-time-switcher">
                  {["day", "month"].map((s) => (
                    <button key={s} className={`ap-time-btn ${timeScale === s ? "active" : ""}`} onClick={() => setTimeScale(s)}>
                      {s === "day" ? "Par jour" : "Par mois"}
                    </button>
                  ))}
                </div>

                <div className="ap-chart-card ap-chart-full">
                  <div className="ap-chart-header">
                    <h3>Inscriptions utilisateurs</h3>
                    <span className="ap-chart-badge">{users.length} total</span>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={registrationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="count" stroke="#C5A059" strokeWidth={2.5} dot={{ r: 3, fill: "#C5A059" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="ap-charts-row">
                  <div className="ap-chart-card">
                    <div className="ap-chart-header"><h3>Distribution par université</h3></div>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={univDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
                          {univDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="ap-chart-card">
                    <div className="ap-chart-header"><h3>Statut des comptes</h3></div>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Actifs", value: activeUsers },
                            { name: "Bannis", value: bannedUsers },
                            { name: "Non vérifiés", value: users.filter(u => !u.emailVerified && !u.banned).length },
                          ]}
                          cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}
                        >
                          {[0,1,2].map((i) => <Cell key={i} fill={["#10b981","#ef4444","#f59e0b"][i]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {tab === "users" && (
              <div className="ap-section">
                <div className="ap-search-bar">
                  <input placeholder="Rechercher par nom ou email…" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} />
                  <span className="ap-count">{filteredUsers.length} résultat(s)</span>
                </div>
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead><tr><th>Utilisateur</th><th>Académique</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className={u.banned ? "ap-row-banned" : ""}>
                          <td>
                            <div className="ap-td-user">
                              <div className="ap-avatar">
                                {u.avatar && !u.avatar.startsWith("./")
                                  ? <img src={u.avatar} alt="" />
                                  : <span>{(u.username || u.email || "?")[0].toUpperCase()}</span>}
                              </div>
                              <div>
                                <strong>{u.name || u.username || "—"}</strong>
                                <small>{u.email}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <small style={{ color: "#94a3b8" }}>
                              {u.academicInfo?.universite
                                ? `${u.academicInfo.universite.slice(0, 20)}…`
                                : "Non renseigné"}
                            </small>
                          </td>
                          <td>
                            <span className={`ap-badge ${u.role === "admin" ? "ap-badge-admin" : "ap-badge-user"}`}>
                              {u.role === "admin" ? "Admin" : "Étudiant"}
                            </span>
                          </td>
                          <td>
                            <span className={`ap-badge ${u.banned ? "ap-badge-banned" : "ap-badge-active"}`}>
                              {u.banned ? "Suspendu" : "Actif"}
                            </span>
                          </td>
                          <td>
                            {u.id !== currentUser?.id && (
                              <div className="ap-actions">
                                <button className={`ap-btn ${u.banned ? "ap-btn-green" : "ap-btn-red"}`} onClick={() => banUser(u)}>
                                  {u.banned ? "Rétablir" : "Suspendre"}
                                </button>
                                <button className="ap-btn ap-btn-gold" onClick={() => promoteUser(u)}>
                                  {u.role === "admin" ? "Rétrograder" : "Promouvoir"}
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
            {tab === "groups" && (
              <div className="ap-section">
                <div className="ap-search-bar">
                  <input placeholder="Rechercher un groupe…" value={searchGroup} onChange={(e) => setSearchGroup(e.target.value)} />
                  <span className="ap-count">{filteredGroups.length} groupe(s)</span>
                </div>
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead><tr><th>Groupe</th><th>Membres</th><th>Type</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filteredGroups.map((g) => (
                        <tr key={g.id}>
                          <td>
                            <div className="ap-td-user">
                              <div className="ap-avatar ap-avatar-sq">
                                {g.groupImg ? <img src={g.groupImg} alt="" /> : <span>{(g.groupName || "G")[0]}</span>}
                              </div>
                              <strong>{g.groupName || "Sans nom"}</strong>
                            </div>
                          </td>
                          <td>{g.members?.length || 0}</td>
                          <td><span className="ap-badge ap-badge-user">{g.groupType || "Private"}</span></td>
                          <td>
                            <div className="ap-actions">
                              <button className="ap-btn ap-btn-gold" onClick={() => setSelectedGroup(g)}>Messages</button>
                              <button className="ap-btn ap-btn-red" onClick={() => deleteGroup(g)}>Supprimer</button>
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
            {tab === "meets" && (
              <div className="ap-section">
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead><tr><th>Titre</th><th>Date</th><th>Organisateur</th><th>Actions</th></tr></thead>
                    <tbody>
                      {meetings.length === 0 && <tr><td colSpan={4} className="ap-empty">Aucune réunion.</td></tr>}
                      {meetings.map((m) => (
                        <tr key={m.id}>
                          <td><strong>{m.title}</strong></td>
                          <td>{m.date ? new Date(m.date.seconds * 1000).toLocaleString("fr-FR") : "—"}</td>
                          <td>{m.creatorName || "Inconnu"}</td>
                          <td>
                            <button className="ap-btn ap-btn-red" onClick={() => deleteMeet(m)}>Supprimer</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── JOBS ── */}
            {tab === "jobs" && (
              <div className="ap-section">
                <div className="ap-search-bar">
                  <input placeholder="Rechercher une offre…" value={searchJob} onChange={(e) => setSearchJob(e.target.value)} />
                  <span className="ap-count">{filteredJobs.length} offre(s)</span>
                </div>
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead><tr><th>Titre</th><th>Catégorie</th><th>Employeur</th><th>Candidats</th><th>Statut</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filteredJobs.length === 0 && <tr><td colSpan={6} className="ap-empty">Aucune offre.</td></tr>}
                      {filteredJobs.map((j) => (
                        <tr key={j.id}>
                          <td><strong>{j.title}</strong></td>
                          <td><span className="ap-badge ap-badge-user">{j.category}</span></td>
                          <td><small>{j.employerName || "—"}</small></td>
                          <td>{j.applicants?.length || 0}</td>
                          <td>
                            <span className={`ap-badge ${j.status === "open" ? "ap-badge-active" : "ap-badge-banned"}`}>
                              {j.status === "open" ? "Ouvert" : "Fermé"}
                            </span>
                          </td>
                          <td>
                            <div className="ap-actions">
                              <button className="ap-btn ap-btn-gold" onClick={() => updateDoc(doc(db, "jobs", j.id), {
                                status: j.status === "open" ? "closed" : "open"
                              })}>
                                {j.status === "open" ? "Fermer" : "Ouvrir"}
                              </button>
                              <button className="ap-btn ap-btn-red" onClick={() => deleteJob(j)}>Supprimer</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── PERMISSIONS ── */}
            {tab === "permissions" && (
              <div className="ap-permissions">
                <p className="ap-permissions-intro">Gérez les rôles et accès par groupe. Les modifications sont appliquées en temps réel.</p>
                {groups.map((g) => (
                  <div key={g.id} className="ap-perm-card">
                    <div className="ap-perm-header">
                      <strong>{g.groupName || "Groupe"}</strong>
                      <span className="ap-badge ap-badge-user">{g.members?.length || 0} membres</span>
                    </div>
                    <div className="ap-perm-row">
                      <span>Seul l'admin peut poster</span>
                      <div className={`ap-toggle ${g.settings?.onlyAdminCanPost ? "on" : ""}`}
                        onClick={() => updateDoc(doc(db, "groups", g.id), {
                          "settings.onlyAdminCanPost": !g.settings?.onlyAdminCanPost
                        })}>
                        <div className="ap-toggle-thumb" />
                      </div>
                    </div>
                    <div className="ap-perm-row">
                      <span>Médias autorisés</span>
                      <div className={`ap-toggle ${g.settings?.allowMedia !== false ? "on" : ""}`}
                        onClick={() => updateDoc(doc(db, "groups", g.id), {
                          "settings.allowMedia": !(g.settings?.allowMedia !== false)
                        })}>
                        <div className="ap-toggle-thumb" />
                      </div>
                    </div>
                    <div className="ap-perm-row">
                      <span>Membres peuvent inviter</span>
                      <div className={`ap-toggle ${g.settings?.membersCanInvite !== false ? "on" : ""}`}
                        onClick={() => updateDoc(doc(db, "groups", g.id), {
                          "settings.membersCanInvite": !(g.settings?.membersCanInvite !== false)
                        })}>
                        <div className="ap-toggle-thumb" />
                      </div>
                    </div>
                  </div>
                ))}
                {groups.length === 0 && <p className="ap-empty">Aucun groupe trouvé.</p>}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Group messages modal */}
      {selectedGroup && (
        <div className="ap-overlay" style={{ zIndex: 10001 }} onClick={() => setSelectedGroup(null)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h2>{selectedGroup.groupName} — Messages</h2>
              <button className="ap-close-btn" onClick={() => setSelectedGroup(null)}>✕</button>
            </div>
            <div className="ap-modal-body">
              {(!selectedGroup.messages?.length)
                ? <p className="ap-empty">Aucun message.</p>
                : selectedGroup.messages.map((msg, i) => (
                  <div key={i} className="ap-msg-row">
                    <div className="ap-msg-sender">{msg.senderName || msg.senderId?.slice(0, 8)}</div>
                    <div className="ap-msg-text">
                      {msg.text || (msg.img ? "[Image]" : msg.audio ? "[Audio]" : msg.document ? "[Document]" : "[—]")}
                    </div>
                    {msg.createdAt && (
                      <div className="ap-msg-time">
                        {new Date(msg.createdAt.seconds ? msg.createdAt.seconds * 1000 : msg.createdAt).toLocaleString("fr-FR")}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
