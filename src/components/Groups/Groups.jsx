import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDocs,
} from "firebase/firestore";
import { upload } from "../../lib/upload";
import {
  Plus,
  Crown,
  Users,
  BarChart3,
  MessageCircle,
  X,
  ArrowUpDown,
  MoreVertical,
  Pin,
  Trash2,
  LogOut,
  UserPlus,
  Camera,
} from "lucide-react";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";
import "./Groups.css";

const defaultSettings = {
  onlyAdminCanPost: false,
  allowPolls: true,
  allowMedia: true,
  allowReactions: true,
  membersCanInvite: true,
  groupType: "discussion",
};

const Toggle = ({ label, checked, onChange }) => (
  <div className="cogito-toggle" onClick={onChange}>
    <span className="label">{label}</span>
    <button type="button" className={`toggle-track ${checked ? "active" : ""}`}>
      <span className="toggle-thumb" />
    </button>
  </div>
);

const Groups = ({ setPage }) => {
  const { currentUser } = useUserStore();
  const { changeGroup } = useChatStore();
  const [groups, setGroups] = useState([]);
  const [pinnedGroups, setPinnedGroups] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [sortBy, setSortBy] = useState("date");
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    group: null,
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    members: "",
    settings: { ...defaultSettings },
  });
  const [groupImgFile, setGroupImgFile] = useState(null);
  const [groupImgPreview, setGroupImgPreview] = useState("");

  const handleGroupImgChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setGroupImgFile(f);
    setGroupImgPreview(URL.createObjectURL(f));
  };

  // Seed local pinnedGroups state from user doc
  useEffect(() => {
    if (currentUser?.pinnedGroups) {
      setPinnedGroups(currentUser.pinnedGroups);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", currentUser.id),
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setGroups(items);
    });
    return () => unsub();
  }, [currentUser]);

  // Click outside listener for context menu
  useEffect(() => {
    const handleClick = () =>
      setContextMenu({ ...contextMenu, visible: false });
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu]);

  // Context Menu Actions
  const handleContextMenu = (e, group) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, group });
  };

  const handlePinGroup = async (group) => {
    if (!currentUser) return;
    const isPinned = pinnedGroups.includes(group.id);
    const newPinned = isPinned
      ? pinnedGroups.filter((id) => id !== group.id)
      : [...pinnedGroups, group.id];
    setPinnedGroups(newPinned); // Optimistic UI update
    try {
      await updateDoc(doc(db, "users", currentUser.id), {
        pinnedGroups: isPinned ? arrayRemove(group.id) : arrayUnion(group.id),
      });
    } catch (err) {}
  };

  const handleLeaveGroup = async (group) => {
    if (!currentUser) return;
    if (group.adminId === currentUser.id) {
      window.alert(
        "En tant qu'Admin, vous devez nommer un autre membre admin ou supprimer le groupe. (Fonction en dev)",
      );
      return;
    }
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir quitter le groupe "${group.groupName}" ?`,
      )
    )
      return;

    try {
      await updateDoc(doc(db, "groups", group.id), {
        members: arrayRemove(currentUser.id),
      });
    } catch (err) {}
  };

  const handleAddMembers = async (groupToUpdate) => {
    // Seul l'admin a la permission d'ajouter des membres
    const canInvite = groupToUpdate.adminId === currentUser?.id || groupToUpdate.settings?.membersCanInvite !== false;
    if (!canInvite) {
      toast.error("Seul l'administrateur peut ajouter des membres.");
      return;
    }

    const input = window.prompt(
      "Noms d'utilisateurs des membres à ajouter (séparés par des virgules)",
      "",
    );
    if (!input) return;
    const usernames = input
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (!usernames.length) return;

    try {
      // Find IDs by usernames
      const usersRef = collection(db, "users");
      const foundIds = [];
      for (const uname of usernames) {
        const q = query(usersRef, where("username", "==", uname));
        const snap = await getDocs(q);
        if (!snap.empty) {
          foundIds.push(snap.docs[0].id);
        } else {
          toast.warn(`Utilisateur '${uname}' non trouvé.`);
        }
      }

      if (!foundIds.length) return;

      // Filter out already existing members
      const newMemberIds = foundIds.filter(
        (id) => !groupToUpdate.members?.includes(id),
      );
      if (!newMemberIds.length) {
        toast.warning("Tous les membres valides sont déjà dans le groupe");
        return;
      }

      const msg = {
        id: "sys_" + Date.now() + Math.random().toString(36).substr(2, 9),
        senderId: currentUser.id,
        senderName: currentUser.username,
        text: `A ajouté ${newMemberIds.length} membre(s) au groupe.`,
        createdAt: new Date(),
        isSystem: true,
      };

      await updateDoc(doc(db, "groups", groupToUpdate.id), {
        members: arrayUnion(...newMemberIds),
        messages: arrayUnion(msg),
      });
      toast.success(`${newMemberIds.length} membre(s) ajouté(s)`);
    } catch (err) {}
  };

  const handleDeleteGroup = async (group) => {
    if (group.adminId !== currentUser?.id) return;
    if (
      !window.confirm(
        "Supprimer ce groupe définitivement ? Cette action est irréversible.",
      )
    )
      return;
    try {
      await deleteDoc(doc(db, "groups", group.id));
    } catch (err) {}
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!currentUser || !form.name.trim()) return;
    setCreating(true);

    const memberIds = form.members
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (!memberIds.includes(currentUser.id)) memberIds.push(currentUser.id);

    try {
      // Upload group image if provided
      let groupImgUrl = "";
      if (groupImgFile) {
        groupImgUrl = await upload(groupImgFile, "group-avatars", {
          allowDataUrlFallback: true,
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.8,
          maxLength: 250000,
        });
      }

      await addDoc(collection(db, "groups"), {
        groupName: form.name.trim(),
        description: form.description.trim(),
        adminId: currentUser.id,
        members: memberIds,
        settings: form.settings,
        groupImg: groupImgUrl,
        createdAt: serverTimestamp(),
      });
      setOpenCreate(false);
      setForm({
        name: "",
        description: "",
        members: "",
        settings: { ...defaultSettings },
      });
      setGroupImgFile(null);
      setGroupImgPreview("");
    } catch (err) {
    } finally {
      setCreating(false);
    }
  };

  // Sorting Logic
  const sortedGroups = [...groups].sort((a, b) => {
    const aPinned = pinnedGroups.includes(a.id);
    const bPinned = pinnedGroups.includes(b.id);

    // Pinned groups always at the top
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    // Secondary sort
    if (sortBy === "name") {
      return (a.groupName || "").localeCompare(b.groupName || "");
    }
    if (sortBy === "members") {
      return (b.members?.length || 0) - (a.members?.length || 0);
    }

    // Default: date desc (Plus récents)
    const dateA = a.createdAt?.toMillis?.() ?? 0;
    const dateB = b.createdAt?.toMillis?.() ?? 0;
    return dateB - dateA;
  });

  return (
    <div className="groups-container">
      <header className="groups-header">
        <div className="header-text">
          <span className="subtitle">COGITO COLLABORATION</span>
          <h1>Espaces de Groupe</h1>
        </div>

        <div className="header-actions">
          {/* SORT CONTROLS */}
          <div className="sort-control">
            <ArrowUpDown size={15} className="sort-icon" />
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Plus récents</option>
              <option value="name">De A à Z</option>
              <option value="members">Plus peuplés</option>
            </select>
          </div>

          <button
            onClick={() => setOpenCreate(true)}
            className="btn-create-gold"
          >
            <Plus size={18} /> Nouveau Groupe
          </button>
        </div>
      </header>

      {/* GROUPS LIST/GRID */}
      <div className="groups-grid">
        {sortedGroups.map((group) => {
          const settings = { ...defaultSettings, ...(group.settings || {}) };
          const isPinned = pinnedGroups.includes(group.id);

          return (
            <div
              key={group.id}
              className={`group-card ${isPinned ? "pinned" : ""}`}
              onContextMenu={(e) => handleContextMenu(e, group)}
            >
              {/* Group image banner */}
              {group.groupImg && (
                <div className="group-card-img-wrap">
                  <img src={group.groupImg} alt={group.groupName} className="group-card-img" />
                </div>
              )}
              <div className="card-top">
                <div className="title-area">
                  <h3>
                    {isPinned && (
                      <Pin size={15} className="pin-icon" fill="currentColor" />
                    )}
                    {group.groupName}
                  </h3>
                  {group.adminId === currentUser?.id ? (
                    <span className="badge admin">
                      <Crown size={12} /> Admin
                    </span>
                  ) : (
                    <span className="badge member">Étudiant</span>
                  )}
                </div>
                <div className="member-count">
                  <Users size={16} /> <span>{group.members?.length || 0}</span>
                </div>
              </div>

              <p className="description">
                {group.description || "Aucune description."}
              </p>

              <div className="card-footer">
                <div className="tags">
                  <span
                    className={`tag ${settings.onlyAdminCanPost ? "lock" : ""}`}
                  >
                    <MessageCircle size={13} />{" "}
                    {settings.onlyAdminCanPost ? "Canal" : "Libre"}
                  </span>
                  <span className="tag">{settings.groupType}</span>
                  {settings.allowPolls && (
                    <span className="tag gold">
                      <BarChart3 size={13} /> Sondages
                    </span>
                  )}
                </div>
                <div className="card-actions">
                  <button
                    className="btn-enter"
                    onClick={() => {
                      changeGroup(
                        group.id,
                        group.groupName,
                        group.groupImg || "",
                        group.members?.length || 0,
                      );
                      setPage("chat");
                    }}
                  >
                    Entrer
                  </button>
                  <button
                    className="btn-secondary"
                    style={{
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, group);
                    }}
                  >
                    <MoreVertical size={16} /> Options
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CONTEXT MENU */}
      {contextMenu.visible && contextMenu.group && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={() => {
              handlePinGroup(contextMenu.group);
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            <Pin size={15} />
            {pinnedGroups.includes(contextMenu.group.id)
              ? "Désépingler l'Espace"
              : "Épingler l'Espace"}
          </button>

          {(contextMenu.group.adminId === currentUser?.id || contextMenu.group.settings?.membersCanInvite !== false) && (
            <button
              className="context-menu-item"
              onClick={() => {
                handleAddMembers(contextMenu.group);
                setContextMenu({ ...contextMenu, visible: false });
              }}
            >
              <UserPlus size={15} /> Inviter des membres
            </button>
          )}

          {contextMenu.group.adminId === currentUser?.id ? (
            <button
              className="context-menu-item danger"
              onClick={() => {
                handleDeleteGroup(contextMenu.group);
                setContextMenu({ ...contextMenu, visible: false });
              }}
            >
              <Trash2 size={15} /> Supprimer le groupe
            </button>
          ) : (
            <button
              className="context-menu-item danger"
              onClick={() => {
                handleLeaveGroup(contextMenu.group);
                setContextMenu({ ...contextMenu, visible: false });
              }}
            >
              <LogOut size={15} /> Quitter le groupe
            </button>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {openCreate && (
        <div className="modal-overlay" onClick={() => setOpenCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Programmer un espace</h2>
              <button
                className="modal-close"
                onClick={() => setOpenCreate(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="modal-form">
              {/* Group image picker */}
              <div className="group-img-picker">
                <label htmlFor="group-img-input" className="group-img-label">
                  {groupImgPreview ? (
                    <img src={groupImgPreview} alt="Aperçu" className="group-img-preview" />
                  ) : (
                    <div className="group-img-placeholder">
                      <Camera size={28} />
                      <span>Photo du groupe</span>
                    </div>
                  )}
                </label>
                <input
                  id="group-img-input"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleGroupImgChange}
                />
              </div>

              <div className="form-grid">
                <div className="form-column">
                  <div className="input-group">
                    <label>Nom de l'espace *</label>
                    <input
                      required
                      placeholder="ex: Intelligence Artificielle S3"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label>Description (Objectif)</label>
                    <textarea
                      rows="2"
                      placeholder="De quoi allez-vous discuter ?"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label>Membres (IDs séparées par virgules)</label>
                    <input
                      placeholder="ex: uid1, uid2"
                      value={form.members}
                      onChange={(e) =>
                        setForm({ ...form, members: e.target.value })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label>Type d'espace</label>
                    <select
                      value={form.settings.groupType}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          settings: {
                            ...form.settings,
                            groupType: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="discussion">Discussion Standard</option>
                      <option value="canal">Canal (Lecture seule)</option>
                      <option value="annonce">Annonce rapide</option>
                    </select>
                  </div>
                </div>

                <div className="form-column">
                  <div className="permissions-box">
                    <p>Autorisations</p>
                    <Toggle
                      label="Seul l'Admin poste"
                      checked={form.settings.onlyAdminCanPost}
                      onChange={() =>
                        setForm({
                          ...form,
                          settings: {
                            ...form.settings,
                            onlyAdminCanPost: !form.settings.onlyAdminCanPost,
                          },
                        })
                      }
                    />
                    <Toggle
                      label="Autoriser sondages"
                      checked={form.settings.allowPolls}
                      onChange={() =>
                        setForm({
                          ...form,
                          settings: {
                            ...form.settings,
                            allowPolls: !form.settings.allowPolls,
                          },
                        })
                      }
                    />
                    <Toggle
                      label="Autoriser médias (Img/Vid)"
                      checked={form.settings.allowMedia}
                      onChange={() =>
                        setForm({
                          ...form,
                          settings: {
                            ...form.settings,
                            allowMedia: !form.settings.allowMedia,
                          },
                        })
                      }
                    />
                    <Toggle
                      label="Réactions rapides"
                      checked={form.settings.allowReactions}
                      onChange={() =>
                        setForm({
                          ...form,
                          settings: {
                            ...form.settings,
                            allowReactions: !form.settings.allowReactions,
                          },
                        })
                      }
                    />
                    <Toggle
                      label="Membres peuvent inviter"
                      checked={form.settings.membersCanInvite}
                      onChange={() =>
                        setForm({
                          ...form,
                          settings: {
                            ...form.settings,
                            membersCanInvite: !form.settings.membersCanInvite,
                          },
                        })
                      }
                    />
                  </div>

                  <div
                    className="modal-footer"
                    style={{
                      marginTop: "auto",
                      borderTop: "none",
                      paddingTop: 0,
                    }}
                  >
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setOpenCreate(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="btn-submit-full"
                    >
                      {creating ? "Création..." : "Confirmer la création"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
