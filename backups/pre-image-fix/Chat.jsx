import { useState, useEffect, useRef, Fragment } from "react";
import "./Chat.css";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../../lib/chatStore";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import { upload } from "../../lib/upload";
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const STICKERS = [
  "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
  "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
  "https://media.giphy.com/media/TdfyKrN7HGTIY/giphy.gif",
  "https://media.giphy.com/media/11sBLVxIRvnAwt/giphy.gif",
  "https://media.giphy.com/media/l41JRsph73VokN6ik/giphy.gif",
  "https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif",
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/xT0xeJpnrWC4XWblWQ/giphy.gif"
];

/* ─── Inline SVG icons ─────────────────────────────────── */

const IconPhone = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.8"
    fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.39 19a19.45 19.45 0 0 1-6-6
      19.79 19.79 0 0 1-2.93-8.39A2 2 0 0 1 4.43 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81
      a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45
      c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconVideo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.8"
    fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const IconInfo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.8"
    fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const IconImage = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.8"
    fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const IconMic = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.8"
    fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const IconFileText = ({ size = 20, color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke={color} strokeWidth="1.8"
    fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconMapPin = ({ color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" stroke={color} strokeWidth="2"
    fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconBarChart = ({ color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" stroke={color} strokeWidth="2"
    fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);

const IconGift = ({ color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" stroke={color} strokeWidth="2"
    fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);

/* ─── Emoji face SVG (animated) ────────────────────────── */
const EmojiSVG = ({ active }) => {
  const color = active ? "#C5A059" : "#5a5a7a";
  return (
    <svg
      className="emoji-face-svg"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      {/* Eyes – filled dots */}
      <circle cx="9"  cy="9.5" r="1.4" fill={color} stroke="none" />
      <circle cx="15" cy="9.5" r="1.4" fill={color} stroke="none" />
      {/* Smile */}
      <path d={active ? "M8 14.5s1.5 2.5 4 2.5 4-2.5 4-2.5" : "M8 14s1.5 2 4 2 4-2 4-2"} />
      {/* Cheek blush when active */}
      {active && (
        <>
          <ellipse cx="7.5"  cy="13.5" rx="1.5" ry="0.8" fill="#ffb8b8" stroke="none" opacity="0.7" />
          <ellipse cx="16.5" cy="13.5" rx="1.5" ry="0.8" fill="#ffb8b8" stroke="none" opacity="0.7" />
        </>
      )}
    </svg>
  );
};

/* ─── Plus SVG (animated rotate) ──────────────────────── */
const PlusSVG = ({ rotated }) => (
  <svg
    className={`plus-svg ${rotated ? "rotated" : ""}`}
    viewBox="0 0 24 24"
    width="22"
    height="22"
    stroke={rotated ? "#C5A059" : "#5a5a7a"}
    strokeWidth="2.5"
    fill="none"
    strokeLinecap="round"
    style={{ display: "block", flexShrink: 0 }}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5"  y1="12" x2="19" y2="12" />
  </svg>
);

/* ─── Send SVG ─────────────────────────────────────────── */
const SendSVG = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="#fff" strokeWidth="2"
    fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#fff" />
  </svg>
);

/* ══════════════════════════════════════════════════════════
   CHAT COMPONENT
══════════════════════════════════════════════════════════ */
const Chat = () => {
  const [open, setOpen]             = useState(false);   // emoji picker
  const [attachOpen, setAttachOpen] = useState(false);   // attachment menu
  const [text, setText]             = useState("");
  const [chat, setChat]             = useState();
  const [file, setFile]             = useState({ data: null, url: "", type: "" });
  const [isSending, setIsSending]   = useState(false);

  // Advanced Features State
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [callSession, setCallSession] = useState(null);
  
  // Poll State
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState([{ id: 1, text: "" }, { id: 2, text: "" }]);

  const { currentUser }  = useUserStore();
  const {
    chatId, user, isGroupChat, groupInfo,
    isCurrentUserBlocked, isReceiverBlocked,
    darkMode, toggleDetails
  } = useChatStore();

  const blocked   = !isGroupChat && (isCurrentUserBlocked || isReceiverBlocked);
  const endRef    = useRef(null);
  const attachRef = useRef(null);

  /* ─── Auto-scroll ─── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  /* ─── Real-time messages ─── */
  useEffect(() => {
    const col   = isGroupChat ? "groups" : "chats";
    const unSub = onSnapshot(doc(db, col, chatId), (res) => setChat(res.data()));
    return () => unSub();
  }, [chatId, isGroupChat]);

  /* ─── Handlers ─── */
  const handleEmoji = (e) => { setText((prev) => prev + e.emoji); };

  const handleFile = (e, type) => {
    if (e.target.files[0]) {
      setFile({ data: e.target.files[0], url: URL.createObjectURL(e.target.files[0]), type });
    }
    setAttachOpen(false);
  };

  const handleSend = async () => {
    if (text.trim() === "" && !file.data) return;
    setIsSending(true);
    let fileUrl = null;
    try {
      if (file.data) fileUrl = await upload(file.data);

      const col = isGroupChat ? "groups" : "chats";
      await updateDoc(doc(db, col, chatId), {
        messages: arrayUnion({
          senderId:   currentUser.id,
          senderName: currentUser.username,
          text,
          createdAt:  new Date(),
          ...(fileUrl && file.type === "image"    && { img:      fileUrl }),
          ...(fileUrl && file.type === "document" && { document: fileUrl }),
          ...(fileUrl && file.type === "audio"    && { audio:    fileUrl }),
        }),
      });

      if (!isGroupChat) {
        const userIDs = [currentUser.id, user.id];
        userIDs.forEach(async (id) => {
          const ref  = doc(db, "userschats", id);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            const idx  = data.chats.findIndex((c) => c.chatId === chatId);
            if (idx !== -1) {
              data.chats[idx].lastMessage = file.data ? `[Fichier joint]` : text;
              data.chats[idx].isSeen     = id === currentUser.id;
              data.chats[idx].updatedAt  = Date.now();
              await updateDoc(ref, { chats: data.chats });
            }
          }
        });
      }

      setTimeout(() => {
        setIsSending(false);
        setFile({ data: null, url: "", type: "" });
        setText("");
      }, 500);

    } catch (err) {
      console.log(err);
      setIsSending(false);
    }
  };

  const handleLocationSend = () => {
    if (!navigator.geolocation) return toast.error("Géolocalisation non supportée");
    setAttachOpen(false);
    toast.info("Récupération de la position...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          setIsSending(true);
          const col = isGroupChat ? "groups" : "chats";
          await updateDoc(doc(db, col, chatId), {
            messages: arrayUnion({
              senderId: currentUser.id,
              senderName: currentUser.username,
              location: { lat: latitude, lng: longitude },
              createdAt: new Date(),
            }),
          });
          setIsSending(false);
        } catch (err) { setIsSending(false); }
      },
      () => toast.error("Impossible d'obtenir la position")
    );
  };

  const handleStickerSend = async (url) => {
    setShowStickerPicker(false);
    setIsSending(true);
    try {
      const col = isGroupChat ? "groups" : "chats";
      await updateDoc(doc(db, col, chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          senderName: currentUser.username,
          sticker: url,
          createdAt: new Date(),
        }),
      });
      setIsSending(false);
    } catch (err) { setIsSending(false); }
  };

  const handlePollSend = async () => {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.text.trim()).length < 2) {
      return toast.warn("Question et au moins deux options requises");
    }
    const finalOptions = pollOptions.filter(o => o.text.trim()).map(o => ({ ...o, votes: [] }));
    setIsSending(true);
    setShowPollModal(false);
    try {
      const col = isGroupChat ? "groups" : "chats";
      await updateDoc(doc(db, col, chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          senderName: currentUser.username,
          poll: { question: pollQuestion, options: finalOptions },
          createdAt: new Date(),
        }),
      });
      setPollQuestion("");
      setPollOptions([{ id: 1, text: "" }, { id: 2, text: "" }]);
      setIsSending(false);
    } catch (err) { setIsSending(false); }
  };

  const handleVote = async (messageIndex, optionId) => {
     if (isSending) return;
     const messages = [...chat.messages];
     const msg = messages[messageIndex];
     if (!msg.poll) return;

     let hasChanged = false;
     msg.poll.options.forEach(opt => {
         if (opt.votes.includes(currentUser.id)) {
           if (opt.id !== optionId) {
             opt.votes = opt.votes.filter(v => v !== currentUser.id);
             hasChanged = true;
           }
         }
     });

     const targetOpt = msg.poll.options.find(o => o.id === optionId);
     if (targetOpt && !targetOpt.votes.includes(currentUser.id)) {
        targetOpt.votes.push(currentUser.id);
        hasChanged = true;
     }

     if (hasChanged) {
       const col = isGroupChat ? "groups" : "chats";
       await updateDoc(doc(db, col, chatId), { messages });
     }
  };

  const handleCall = async (type) => {
    const roomId = `cogito-call-${chatId}-${Date.now()}`;
    const col = isGroupChat ? "groups" : "chats";
    await updateDoc(doc(db, col, chatId), {
      messages: arrayUnion({
        senderId: currentUser.id,
        senderName: currentUser.username,
        callRoom: roomId,
        callType: type,
        createdAt: new Date(),
      }),
    });
    setCallSession(roomId);
  };

  const closeAll = () => { setOpen(false); setAttachOpen(false); setShowStickerPicker(false); };

  return (
    <div
      className="Chat"
      style={{
        backgroundImage: darkMode ? "url('/darke.png')" : "url('/backround.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* dismiss overlay */}
      {(open || attachOpen || showStickerPicker) && (
        <div className="dismiss-overlay" onClick={closeAll} />
      )}

      {/* CALL OVERLAY (JITSI) */}
      {callSession && (
        <div className="call-overlay">
           <div className="call-overlay-header">
              <span>Appel Cogito Sécurisé</span>
              <button onClick={() => setCallSession(null)} className="btn-call-end">Quitter l'appel</button>
           </div>
           <iframe 
             src={`https://meet.jit.si/${callSession}#config.prejoinPageEnabled=false`} 
             allow="camera; microphone; fullscreen; display-capture"
             className="call-iframe"
           />
        </div>
      )}

      {/* POLL MODAL (SONDAGE) */}
      {showPollModal && (
         <div className="poll-modal-overlay">
            <div className="poll-modal">
               <div className="poll-header">
                 <h3>Créer un Sondage</h3>
                 <button onClick={() => setShowPollModal(false)}>X</button>
               </div>
               <div className="poll-body">
                 <input className="poll-input main" placeholder="Posez une question..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
                 {pollOptions.map((opt, idx) => (
                   <div key={opt.id} className="poll-opt-row">
                     <input className="poll-input" placeholder={`Option ${idx + 1}`} value={opt.text} onChange={e => {
                       const newOpts = [...pollOptions];
                       newOpts[idx].text = e.target.value;
                       setPollOptions(newOpts);
                     }} />
                     {idx > 1 && <button className="remove-opt" onClick={() => setPollOptions(pollOptions.filter(o => o.id !== opt.id))}>-</button>}
                   </div>
                 ))}
                 <button className="add-opt" onClick={() => setPollOptions([...pollOptions, { id: Date.now(), text: "" }])}>+ Ajouter une option</button>
               </div>
               <button className="poll-submit" onClick={handlePollSend}>Envoyer le Sondage</button>
            </div>
         </div>
      )}

      {/* ═══ TOP BAR ═══════════════════════════════════════════ */}
      <div className="chat-top">
        <div className="chat-top-user">
          <img
            src={isGroupChat ? "./Groups.png" : (user?.avatar || "./Avatar.png")}
            alt=""
            className="chat-avatar"
          />
          <div className="chat-top-texts">
            <span className="chat-username">{isGroupChat ? groupInfo?.name : (user?.customPseudo || user?.username)}</span>
            <span className="chat-status">{isGroupChat ? "Espace Collaboration" : "En ligne"}</span>
          </div>
        </div>
        <div className="chat-top-icons">
          <button className="icon-btn" title="Appel audio" onClick={() => handleCall("audio")}><IconPhone /></button>
          <button className="icon-btn" title="Appel vidéo" onClick={() => handleCall("video")}><IconVideo /></button>
          <button className="icon-btn" title="Informations" onClick={toggleDetails}>
            <IconInfo />
          </button>
        </div>
      </div>

      {/* ═══ MESSAGES ═══════════════════════════════════════════ */}
      <div className="chat-centre">
        {chat?.messages?.map((message, i) => (
          <div
            key={i}
            className={`chat-message ${message.senderId === currentUser?.id ? "own" : ""} ${message.sticker ? "sticker-msg" : ""}`}
          >
            <div className="chat-bubble">
              {isGroupChat && message.senderId !== currentUser?.id && (
                <span className="chat-sender-name">{message.senderName || "Membre"}</span>
              )}
              {message.img && <img src={message.img} alt="" className="chat-img" />}
              {message.document && (
                <a href={message.document} target="_blank" rel="noopener noreferrer" className="chat-file-link">
                  <IconFileText size={40} />
                  <span>Document joint</span>
                </a>
              )}
              {message.audio && (
                <audio controls className="chat-audio">
                  <source src={message.audio} type="audio/mpeg" />
                  <source src={message.audio} type="audio/wav" />
                  <source src={message.audio} type="audio/ogg" />
                </audio>
              )}

              {/* Call Link Rendering */}
              {message.callRoom && (
                <div className="chat-call-block">
                  <div className="chat-call-header">
                     {message.callType === "video" ? <IconVideo /> : <IconPhone />}
                     <span>Appel {message.callType === "video" ? "Vidéo" : "Audio"}</span>
                  </div>
                  <button className="chat-call-join" onClick={() => setCallSession(message.callRoom)}>Rejoindre l'appel</button>
                </div>
              )}

              {/* Maps Localisation */}
              {message.location && (
                <div className="chat-location-wrap">
                  <iframe 
                    width="100%" height="200" style={{ border:0, borderRadius: "10px", marginTop: "5px" }} 
                    loading="lazy" allowFullScreen 
                    src={`https://maps.google.com/maps?q=${message.location.lat},${message.location.lng}&z=15&output=embed`}>
                  </iframe>
                  <a href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`} target="_blank" rel="noopener noreferrer" className="chat-file-link" style={{ marginTop: '8px' }}>
                     <IconMapPin size={16} /> <span>Ouvrir dans Maps</span>
                  </a>
                </div>
              )}

              {/* Sticker Rendering */}
              {message.sticker && (
                <img src={message.sticker} alt="Sticker" className="chat-sticker" />
              )}

              {/* Poll Rendering */}
              {message.poll && (
                <div className="chat-poll">
                   <strong>📊 {message.poll.question}</strong>
                   <div className="poll-options">
                     {message.poll.options.map(opt => {
                        const totalVotes = message.poll.options.reduce((acc, curr) => acc + (curr.votes?.length || 0), 0);
                        const myVotes = opt.votes?.length || 0;
                        const pct = totalVotes === 0 ? 0 : Math.round((myVotes / totalVotes) * 100);
                        const didIVote = opt.votes?.includes(currentUser.id);
                        return (
                           <div key={opt.id} className={`poll-opt ${didIVote ? "voted" : ""}`} onClick={() => handleVote(i, opt.id)}>
                              <div className="poll-opt-bg" style={{ width: `${pct}%` }}></div>
                              <span className="poll-opt-text">{opt.text}</span>
                              <span className="poll-opt-pct">{pct}%</span>
                           </div>
                        )
                     })}
                   </div>
                   <div className="poll-total">{message.poll.options.reduce((acc, curr) => acc + (curr.votes?.length || 0), 0)} votes</div>
                </div>
              )}

              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}

        {file.url && (
          <div className="chat-message own">
            <div className="chat-bubble">
              {file.type === "image"    && <img src={file.url} alt="" className="chat-img" />}
              {file.type === "document" && <div className="chat-file-link"><IconFileText size={40} /><span>Upload document…</span></div>}
              {file.type === "audio"    && <audio controls className="chat-audio"><source src={file.url} /></audio>}
              <p style={{ fontSize: "12px", opacity: 0.7, marginTop: 4 }}>Envoi en cours…</p>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ═══ INPUT BAR ══════════════════════════════════════════ */}
      <div className="chat-bottom">
        <div className="chat-input-wrap">

          {/* Left actions */}
          <div className="chat-inner-actions">

            {/* Image / Photo */}
            <label className="icon-btn" htmlFor="chat-img-visible" title="Photo / Vidéo">
              <IconImage />
            </label>
            <input id="chat-img-visible" type="file" accept="image/*,video/*"
              style={{ display: "none" }} onChange={(e) => handleFile(e, "image")} />

            {/* Audio / Mic */}
            <label className="icon-btn" htmlFor="chat-audio-input" title="Message vocal">
              <IconMic />
            </label>
            <input id="chat-audio-input" type="file" accept="audio/*"
              style={{ display: "none" }} onChange={(e) => handleFile(e, "audio")} disabled={blocked} />

            {/* Plus / Attach */}
            <div className="attach-wrap" ref={attachRef}>
              <button
                className={`icon-btn plus-btn ${attachOpen ? "gold" : ""}`}
                onClick={() => { setAttachOpen((p) => !p); setOpen(false); }}
                disabled={blocked}
                title="Plus d'options"
              >
                <PlusSVG rotated={attachOpen} />
              </button>

              {attachOpen && (
                <div className="attach-menu">
                  {/* Document */}
                  <label className="attach-item" htmlFor="chat-doc-input">
                    <span className="attach-icon-circle" style={{ background: "#f97316" }}>
                      <IconFileText size={17} color="#fff" />
                    </span>
                    <span>Document</span>
                  </label>
                  <input id="chat-doc-input" type="file"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e, "document")} />

                  {/* Location */}
                  <button className="attach-item" onClick={handleLocationSend}>
                    <span className="attach-icon-circle" style={{ background: "#10b981" }}>
                      <IconMapPin color="#fff" />
                    </span>
                    <span>Localisation</span>
                  </button>

                  {/* Poll */}
                  <button className="attach-item"
                    onClick={() => { setShowPollModal(true); setAttachOpen(false); }}>
                    <span className="attach-icon-circle" style={{ background: "#C5A059" }}>
                      <IconBarChart color="#fff" />
                    </span>
                    <span>Sondage</span>
                  </button>

                  {/* Sticker / Gift */}
                  <button className="attach-item"
                    onClick={() => { setShowStickerPicker(true); setAttachOpen(false); }}>
                    <span className="attach-icon-circle" style={{ background: "#8b5cf6" }}>
                      <IconGift color="#fff" />
                    </span>
                    <span>Sticker</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Text input */}
          <input
            type="text"
            placeholder={blocked ? "Vous ne pouvez pas répondre" : "Écrire un message…"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={blocked || isSending}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
          />

          {/* Right actions */}
          <div className="chat-inner-actions">

            {/* Emoji */}
            <div className="emoji-wrap">
              <button
                className={`icon-btn emoji-btn ${open ? "active" : ""}`}
                onClick={() => { setOpen((p) => !p); setAttachOpen(false); }}
                disabled={blocked || isSending}
                title="Emoji"
                type="button"
              >
                <EmojiSVG active={open} />
              </button>
              {open && (
                <div className="emoji-picker-pos">
                  <EmojiPicker
                    open={open}
                    onEmojiClick={handleEmoji}
                    lazyLoadEmojis={true}
                    searchPlaceholder="Rechercher un emoji…"
                    skinTonesDisabled
                  />
                </div>
              )}
              {showStickerPicker && (
                <div className="emoji-picker-pos sticker-picker-pos">
                   <div className="sticker-grid">
                      {STICKERS.map((s, idx) => (
                         <img 
                           key={idx} 
                           src={s} 
                           alt={`Sticker ${idx}`} 
                           onClick={() => handleStickerSend(s)}
                           className="sticker-thumb" 
                         />
                      ))}
                   </div>
                </div>
              )}
            </div>

            {/* Send */}
            <button
              className={`send-btn ${isSending ? "sending" : ""}`}
              onClick={handleSend}
              disabled={blocked || (text.trim() === "" && !file.data) || isSending}
              title="Envoyer"
              type="button"
            >
              <div className={`send-icon-container ${isSending ? "fly" : ""}`}>
                <SendSVG />
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Chat;