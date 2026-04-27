import { useState, useRef, useEffect, useMemo } from "react";
import "./Cogi.css";
import { useChatStore } from "../../lib/chatStore";
import {
  buildImageFallbackUrls,
  generateImageFromText,
} from "../../lib/generator";
import { downloadFile } from "../../lib/chatMessage";

/* ─── System Prompt ────────────────────────────────────────── */
const SYSTEM_PROMPT = `Tu es l'assistant IA central de la plateforme COGITO — un assistant universel de niveau Gemini, bilingue français/anglais.

Domaines de compétence : éducation universitaire (L3 informatique), algorithmique, réseaux, base de données, IA/ML, mathématiques, physique, culture générale, sport (football, basketball…), histoire, géographie, actualité, cuisine, santé, et toute demande de l'utilisateur.

Tes missions spéciales :
1. ANALYSE : Extraire et structurer les points clés d'une discussion académique.
2. GÉNÉRATION DE DOCUMENT : Quand l'utilisateur demande un document/synthèse/rapport, génère un contenu complet en Markdown bien structuré avec titres, sections et conclusion. Commence le Markdown par "---DOC---" sur la première ligne.
3. GÉNÉRATION D'IMAGE : Quand l'utilisateur demande une image/illustration, fournis d'abord une description en français puis un prompt anglais optimisé pour la génération. Format obligatoire :
   ---IMAGE---
   PROMPT: <prompt détaillé en anglais pour la génération>
   DESC: <description en français pour l'utilisateur>
4. RÉPONSE GÉNÉRALE : Réponds de manière structurée, concise et professionnelle. Utilise des listes et titres quand c'est utile.

Contraintes : Toujours en markdown propre. Informe l'utilisateur quand tu effectues une recherche complexe.`;

/* Uses the Google API key already in .env as VITE_API_KEY */
const GEMINI_API_KEY = import.meta.env.VITE_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/* ─── Suggestion cards with Pro SVGs ─────────────────────── */
const SUGGESTIONS = [
  { 
    id: "academic",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>, 
    label: "Aide académique", 
    color: "#3b82f6", 
    prompt: "Aide-moi à comprendre les concepts clés de mon cours de base de données (SQL, normalisation).",
    autoSend: true
  },
  { 
    id: "doc",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, 
    label: "Générer document",    
    color: "#10b981", 
    prompt: "Génère un rapport documenté et complet en Markdown sur : ",
    autoSend: false
  },
  { 
    id: "image",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, 
    label: "Créer une image",       
    color: "#8b5cf6", 
    prompt: "Crée une image illustrant : ",
    autoSend: false
  },
  { 
    id: "sport",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>, 
    label: "Sport & Tactique",      
    color: "#ef4444", 
    prompt: "Analyse les tactiques modernes du football (ex: 4-3-3 vs 3-5-2) et cite des exemples.",
    autoSend: true
  },
  { 
    id: "culture",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, 
    label: "Culture du monde",       
    color: "#f59e0b", 
    prompt: "Parle-moi des merveilles culturelles et de l'histoire fascinante de l'Algérie.",
    autoSend: true
  },
  { 
    id: "code",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>, 
    label: "Aide au Code",      
    color: "#6366f1", 
    prompt: "Aide-moi à débugger ce code JavaScript ou explique-moi comment optimiser un algorithme de tri.",
    autoSend: true
  },
];

/* ─── Typing indicator (Chat-style gold dots) ──────────────── */
const TypingBubble = () => (
  <div className="cogi-typing-bubble">
    <span className="cogi-dot" style={{ animationDelay: "0s" }} />
    <span className="cogi-dot" style={{ animationDelay: "0.18s" }} />
    <span className="cogi-dot" style={{ animationDelay: "0.36s" }} />
  </div>
);

/* ─── Markdown renderer ────────────────────────────────────── */
const RenderMarkdown = ({ text }) => {
  const lines = text.split("\n");
  return (
    <div className="cogi-md">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <h4 key={i} className="cogi-md-h4">{line.slice(4)}</h4>;
        if (line.startsWith("## "))  return <h3 key={i} className="cogi-md-h3">{line.slice(3)}</h3>;
        if (line.startsWith("# "))   return <h2 key={i} className="cogi-md-h2">{line.slice(2)}</h2>;
        if (line.startsWith("---")) return <hr key={i} className="cogi-md-hr" />;
        if (line.startsWith("- ") || line.startsWith("* "))
          return <li key={i} className="cogi-md-li">{renderInline(line.slice(2))}</li>;
        if (/^\d+\. /.test(line))
          return <li key={i} className="cogi-md-li">{renderInline(line.replace(/^\d+\. /, ""))}</li>;
        if (line === "") return <div key={i} className="cogi-md-spacer" />;
        return <p key={i} className="cogi-md-p">{renderInline(line)}</p>;
      })}
    </div>
  );
};

const renderInline = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`")  && p.endsWith("`"))  return <code key={i} className="cogi-code">{p.slice(1, -1)}</code>;
    return p;
  });
};

/* ─── Document bubble ──────────────────────────────────────── */
const DocBubble = ({ content, onShare }) => {
  const url = useMemo(() => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    return URL.createObjectURL(blob);
  }, [content]);

  return (
    <div className="cogi-doc-bubble">
      <div className="cogi-doc-header">
        <span className="cogi-doc-icon">📄</span>
        <strong>Document généré</strong>
      </div>
      <div className="cogi-doc-preview">
        <RenderMarkdown text={content.slice(0, 600) + (content.length > 600 ? "\n\n…" : "")} />
      </div>
      <div className="cogi-doc-actions">
        <button className="cogi-action-btn cogi-action-dl" onClick={() => downloadFile(url, "document-cogito.txt")}>
          ⬇ Télécharger (.txt)
        </button>
        <button className="cogi-action-btn cogi-action-share" onClick={() => onShare(content, "doc")}>
          ✉ Envoyer au chat
        </button>
      </div>
    </div>
  );
};

/* ─── Image bubble ─────────────────────────────────────────── */
const LegacyImgBubble = ({ prompt, desc, onShare }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  
  const finalUrl = useMemo(() => {
    const encoded = encodeURIComponent(prompt.trim() || "creative educational concept");
    return `https://image.pollinations.ai/prompt/${encoded}?width=640&height=400&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
  }, [prompt]);

  return (
    <div className="cogi-img-bubble">
      <div className="cogi-doc-header">
        <span className="cogi-doc-icon">🖼️</span>
        <strong>Image générée</strong>
      </div>
      <p className="cogi-img-desc">{desc}</p>
      
      {loading && !error && <div className="cogi-img-loading"><TypingBubble /></div>}
      {error && <p className="cogi-img-error">❌ Impossible de générer l'image. (Le serveur IA est surchargé)</p>}
      
      {!error && (
        <a href={finalUrl} target="_blank" rel="noopener noreferrer" style={{ display: loading ? "none" : "block" }}>
          <img 
            src={finalUrl} 
            alt={desc} 
            className="cogi-gen-img"
            style={{ cursor: "pointer" }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </a>
      )}

      {(!loading && !error) && (
        <div className="cogi-doc-actions">
          <button className="cogi-action-btn cogi-action-dl" onClick={() => downloadFile(finalUrl, "image-cogito.jpg")}>
            ⬇ Télécharger
          </button>
          <button className="cogi-action-btn cogi-action-share" onClick={() => onShare(finalUrl, "img")}>
            ✉ Envoyer au chat
          </button>
        </div>
      )}
    </div>
  );
};

void LegacyImgBubble;

const ImgBubble = ({ prompt, desc, imageUrl, onShare }) => {
  const [loading, setLoading] = useState(!imageUrl);
  const [error, setError] = useState("");
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const fallbackUrls = useMemo(
    () => buildImageFallbackUrls(desc || prompt, { width: 640, height: 400 }),
    [desc, prompt]
  );
  const [finalUrl, setFinalUrl] = useState(imageUrl || fallbackUrls[0]);
  const isPlaceholderView = !loading && (!finalUrl || finalUrl.startsWith("data:image/svg+xml"));
  const placeholderLabel = (desc || prompt || "Image generee").trim();

  useEffect(() => {
    let active = true;
    const previewUrl = fallbackUrls[0];

    if (imageUrl) {
      setFinalUrl(imageUrl);
      setLoading(false);
      setError("");
      setFallbackIndex(0);
      return undefined;
    }

    setLoading(true);
    setError("");
    setFallbackIndex(0);
    setFinalUrl(previewUrl);

    generateImageFromText(prompt.trim() || "creative educational concept", {
      width: 640,
      height: 400,
      retries: 4,
    })
      .then((url) => {
        if (!active) return;
        setFinalUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setFinalUrl(previewUrl);
        setError("");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fallbackUrls, imageUrl, prompt]);

  return (
    <div className="cogi-img-bubble">
      <div className="cogi-doc-header">
        <span className="cogi-doc-icon">Image</span>
        <strong>Image generee</strong>
      </div>
      <p className="cogi-img-desc">{desc}</p>

      {loading && !error && <div className="cogi-img-loading"><TypingBubble /></div>}
      {error && <p className="cogi-img-error">Impossible de generer l'image. {error}</p>}

      {!error && finalUrl && !isPlaceholderView && (
        <a href={finalUrl} target="_blank" rel="noopener noreferrer" style={{ display: loading ? "none" : "block" }}>
          <img
            src={finalUrl}
            alt={desc}
            className="cogi-gen-img"
            style={{ cursor: "pointer" }}
            referrerPolicy="no-referrer"
            onLoad={() => setLoading(false)}
            onError={() => {
              const nextIndex = fallbackIndex + 1;
              if (nextIndex < fallbackUrls.length) {
                setFallbackIndex(nextIndex);
                setFinalUrl(fallbackUrls[nextIndex]);
                setLoading(true);
                setError("");
                return;
              }

              setLoading(false);
              setError("Le fichier image n'a pas pu etre affiche");
            }}
          />
        </a>
      )}

      {!error && isPlaceholderView && (
        <div className="cogi-image-placeholder" aria-label={placeholderLabel}>
          <span className="cogi-image-placeholder-kicker">Illustration demandee</span>
          <strong>{placeholderLabel}</strong>
        </div>
      )}

      {!loading && !error && finalUrl && (
        <div className="cogi-doc-actions">
          <a className="cogi-action-btn cogi-action-dl" href={finalUrl} download="image-cogito.jpg" target="_blank" rel="noopener noreferrer">
            Telecharger
          </a>
          <button className="cogi-action-btn cogi-action-share" onClick={() => onShare(finalUrl, "img")}>
            Envoyer au chat
          </button>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COGI COMPONENT
══════════════════════════════════════════════════════════════ */
const Cogi = () => {
  const { darkMode }          = useChatStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  const endRef      = useRef(null);
  const textareaRef = useRef(null);
  const fileImgRef  = useRef(null);
  const fileDocRef  = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    resizeTextarea();
  };

  /* ─── Parse AI response ─── */
  const parseResponse = (text) => {
    // Check for DOC
    const docMatch = text.match(/---DOC---([\s\S]*)/i);
    if (docMatch) {
      const prefix = text.slice(0, docMatch.index).trim();
      return { type: "doc", content: docMatch[1].trim(), prefix };
    }
    
    // Check for IMAGE
    const imgMatch = text.match(/---IMAGE---/i);
    if (imgMatch) {
      const block = text.slice(imgMatch.index + 11);
      const prefix = text.slice(0, imgMatch.index).trim();
      
      const pMatch = block.match(/PROMPT:\s*([\s\S]+?)(?:\n|DESC:|$)/i);
      const dMatch = block.match(/DESC:\s*([\s\S]+?)(?:\n|$)/i);
      
      const prompt = pMatch ? pMatch[1].trim() : "creative educational illustration";
      const desc = dMatch ? dMatch[1].trim() : "Image générée";
      
      return { type: "img", prompt, desc, prefix };
    }
    return { type: "text", content: text };
  };

  /* ─── Handle share to chat placeholder ─── */
  const handleShare = (content, type) => {
    const msg = type === "img"
      ? `🖼️ Image partagée depuis Cogi IA : ${content}`
      : `📄 Document partagé depuis Cogi IA :\n\n${content.slice(0, 300)}…`;
    navigator.clipboard.writeText(msg).then(() =>
      alert("✅ Contenu copié ! Collez-le dans n'importe quelle conversation.")
    );
  };

  /* ─── Send message with Fallback Logic ─── */
  const sendMessage = async (override) => {
    const trimmed = (override !== undefined ? override : input).trim();
    if (!trimmed || isLoading) return;

    // DIRECT IMAGE GENERATION - bypass AI model
    if (trimmed.toLowerCase().startsWith("crée une image") || trimmed.toLowerCase().startsWith("génère une image") || trimmed.toLowerCase().includes("crée image") || trimmed.toLowerCase().includes("génère image")) {
      const promptMatch = trimmed.match(/image[s]?\s*(?:de|du|d'|de la)?\s*(.+)/i);
      const imagePrompt = promptMatch ? promptMatch[1].trim() : "creative beautiful illustration";
      
      const userMsg = { role: "user", content: trimmed, displayContext: trimmed };
      setMessages([...messages, userMsg]);
      setInput("");
      setIsLoading(true);
      setMessages(p => [...p, { role: "assistant", content: "🎨 Génération de l'image...", isInfo: true }]);
      
      try {
        setMessages(p => [
          ...p.filter(m => !m.isInfo),
          { role: "assistant", parsed: { type: "img", prompt: imagePrompt, desc: `Image: ${imagePrompt}`, prefix: "Voici l'image générée!" } }
        ]);
      } catch (imgErr) {
        setMessages(p => [
          ...p.filter(m => !m.isInfo),
          { role: "assistant", content: `❌ Erreur génération: ${imgErr.message}`, isError: true }
        ]);
      }
      setIsLoading(false);
      return;
    }

    const userMsg = { role: "user", content: trimmed, displayContext: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);
    setAttachOpen(false);

    if (trimmed.length > 50) {
      setMessages(p => [...p, { role: "assistant", content: "🔍 Analyse intelligente en cours...", isInfo: true }]);
    }

    try {
      let reply = "";
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      const geminiKey = import.meta.env.VITE_API_KEY;

      // Prepare a clean history array
      const cleanHistory = history.map(m => {
        let textContent = m.content;
        if (!textContent && m.parsed) {
          textContent = m.parsed.content || m.parsed.desc || "Image/Document généré.";
        }
        return { role: m.role, content: textContent };
      });

      // ENGINE 1: GROQ (Llama 3 70B)
      if (groqKey) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              "Authorization": `Bearer ${groqKey}` 
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...cleanHistory,
              ],
              temperature: 0.7,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            reply = data.choices?.[0]?.message?.content;
          } else {
            console.warn(`Groq error: ${res.status}`);
          }
        } catch (e) { console.warn("Groq failed, falling back to Gemini..."); }
      }

      // ENGINE 2: GEMINI FALLBACK
      if (!reply && geminiKey) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nContext:\n" + cleanHistory.map(m => `${m.role}: ${m.content}`).join("\n") }] }
              ],
            }),
          });
          if (res.ok) {
            const data = await res.json();
            reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          }
        } catch (e) { console.warn("Gemini fallback failed."); }
      }

      if (!reply) throw new Error("Toutes les connexions IA ont échoué. Vérifiez vos clés API dans le fichier .env");

      const parsed = parseResponse(reply);
      setMessages(p => [
        ...p.filter(m => !m.isInfo),
        { role: "assistant", parsed },
      ]);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("image") || msg.includes("vision") || msg.includes("input") || msg.includes("read")) {
        setMessages(p => [
          ...p.filter(m => !m.isInfo),
          { role: "assistant", content: `❌ Ce modèle IA ne supporte pas les images.\n\n✅ Alternatives disponibles:\n• Utilisez le bouton "Image IA" dans le chat pour générer\n• Tapez "crée une image de [description]" pour une génération IA` }
        ]);
      } else {
        setMessages(p => [
          ...p.filter(m => !m.isInfo),
          { role: "assistant", content: `❌ Erreur : ${err.message}`, isError: true },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleClear = () => {
    // If we have messages, clear and return to suggestion page smoothly without a blocking alert
    if (messages.length) {
      setMessages([]);
      setInput("");
      setIsLoading(false);
    }
  };

  /* ─── File upload (image) ─── */
  const handleFileImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAttachOpen(false);
    setMessages(p => [...p, { role: "user", content: "🖼️ J'envoie une image pour analyse..." }]);
    setIsLoading(true);
    
    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      
      setMessages(p => [...p, { role: "assistant", content: "🔍 Analyse de l'image...", isInfo: true }]);
      
      // Try Pollinations for simple image display
      const displayUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent("image to analyze")}?width=400&height=400&nologo=true`;
      setMessages(p => [
        ...p.filter(m => !m.isInfo),
        { role: "assistant", parsed: { type: "img", prompt: "image to analyze", desc: "Image uploadée pour analyse", prefix: "Image reçue. Analyse en cours..." } }
      ]);
      
      // Try Gemini for actual analysis
      const geminiKey = import.meta.env.VITE_API_KEY;
      if (geminiKey && geminiKey !== "your_api_key") {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [
                { text: "Décris cette image en détail. Qué vois-tu? Quels sont les éléments principaux?" },
                { inlineData: { mimeType: file.type, data: base64Data.split(",")[1] } }
              ]
            }]
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            setMessages(p => [
              ...p.filter(m => !m.isInfo && !m.parsed),
              { role: "assistant", content: reply }
            ]);
            return;
          }
        }
      }
      
      // Fallback: Show image with description request
      setMessages(p => [
        ...p.filter(m => !m.isInfo && !m.parsed),
        { role: "assistant", content: `🖼️ Image reçue!\n\nJe ne peux pas analyser cette image car le modèle Groq utilisé ne supporte pas les images.\n\nPour analyser des images, ajoutez votre clé API Gemini dans le fichier .env:\nVITE_API_KEY=votre_cle_gemini` }
      ]);
      
    } catch (err) {
      setMessages(p => [
        ...p.filter(m => !m.isInfo),
        { role: "assistant", content: `❌ Erreur lors de l'analyse: ${err.message}`, isError: true }
      ]);
} finally {
      setIsLoading(false);
    }
  };

  /* ─── Render one message ─── */
  const renderMsg = (msg, i) => {
    if (msg.role === "user") {
      return (
        <div key={i} className="cogi-message-wrap cogi-msg-user" style={{ animationDelay: `${i * 0.02}s` }}>
          <div className="chat-bubble cogi-own-bubble">
            <p>{msg.displayContext || msg.content}</p>
            <span className="chat-msg-time">{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      );
    }

    // AI message
    if (msg.isInfo) {
      return (
        <div key={i} className="cogi-message-wrap cogi-msg-ai">
          <div className="cogi-ai-avatar">✦</div>
          <div className="chat-bubble cogi-ai-bubble cogi-bubble-info"><p>{msg.content}</p></div>
        </div>
      );
    }
    if (msg.isError) {
      return (
        <div key={i} className="cogi-message-wrap cogi-msg-ai">
          <div className="cogi-ai-avatar">✦</div>
          <div className="chat-bubble cogi-ai-bubble cogi-bubble-error"><p>{msg.content}</p></div>
        </div>
      );
    }

    const p = msg.parsed;
    if (!p) return null;

    if (p.type === "doc") {
      return (
        <div key={i} className="cogi-message-wrap cogi-msg-ai">
          <div className="cogi-ai-avatar">✦</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {p.prefix && (
              <div className="chat-bubble cogi-ai-bubble">
                <RenderMarkdown text={p.prefix} />
                <span className="chat-msg-time">{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            )}
            <DocBubble content={p.content} onShare={handleShare} />
          </div>
        </div>
      );
    }
    if (p.type === "img") {
      return (
        <div key={i} className="cogi-message-wrap cogi-msg-ai">
          <div className="cogi-ai-avatar">✦</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {p.prefix && (
              <div className="chat-bubble cogi-ai-bubble">
                <RenderMarkdown text={p.prefix} />
                <span className="chat-msg-time">{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            )}
            <ImgBubble prompt={p.prompt} desc={p.desc} imageUrl={p.imageUrl} onShare={handleShare} />
          </div>
        </div>
      );
    }

    // plain text
    return (
      <div key={i} className="cogi-message-wrap cogi-msg-ai" style={{ animationDelay: `${i * 0.02}s` }}>
        <div className="cogi-ai-avatar">✦</div>
        <div className="chat-bubble cogi-ai-bubble">
          <RenderMarkdown text={p.content} />
          <span className="chat-msg-time">{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
    );
  };

  const handleStructuredAction = (type) => {
    const text = input.trim();
    if (text) {
      if (type === "doc") sendMessage(`Génère un rapport documenté et complet en Markdown sur : ${text}`);
      if (type === "img") sendMessage(`Crée une image illustrant : ${text}`);
    } else {
      if (type === "doc") setInput("Génère un rapport documenté et complet en Markdown sur : ");
      if (type === "img") setInput("Crée une image illustrant : ");
      setTimeout(() => textareaRef.current?.focus(), 10);
    }
    setAttachOpen(false);
  };

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div
      className="cogi-root"
      style={{
        backgroundImage: darkMode ? "url('/darke.png')" : "url('/backround.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* dismiss attach menu */}
      {attachOpen && <div className="dismiss-overlay" onClick={() => setAttachOpen(false)} />}

      {/* hidden file inputs */}
      <input ref={fileImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileImg} />
      <input ref={fileDocRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }} onChange={() => setAttachOpen(false)} />

      {/* ── Messages ── */}
      <div className="cogi-messages chat-centre">

        {/* Floating Return Button */}
        {messages.length > 0 && (
          <button className="cogi-return-btn" onClick={handleClear} title="Nouvelle discussion / Retour aux suggestions">
            <span>‹</span> Retour aux suggestions
          </button>
        )}

        {/* Welcome */}
        {messages.length === 0 && !isLoading && (
          <div className="cogi-welcome">
            <h2 className="cogi-welcome-title">
              welcome to <span className="cogi-brand-script">COGITO</span> IA
            </h2>
            <p className="cogi-welcome-sub">Un assistant universel — éducation, sport, culture, informatique&nbsp;…</p>
            <div className="cogi-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="cogi-suggestion-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => {
                    if (s.autoSend) sendMessage(s.prompt);
                    else {
                      setInput(s.prompt);
                      textareaRef.current?.focus();
                    }
                  }}
                >
                  <span className="cogi-sug-icon" style={{ background: s.color + "22", color: s.color }}>
                    {s.icon}
                  </span>
                  <span className="cogi-sug-label">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map(renderMsg)}

        {/* Typing */}
        {isLoading && (
          <div className="cogi-message-wrap cogi-msg-ai">
            <div className="cogi-ai-avatar">✦</div>
            <TypingBubble />
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ── Input bar — identical structure to Chat ── */}
      <div className="chat-bottom cogi-bottom">
        <div className="chat-input-wrap cogi-input-wrap-inner">

          {/* Plus / attach */}
          <div className="attach-wrap">
            <button
              className="icon-btn plus-btn"
              onClick={() => setAttachOpen(o => !o)}
              title="Joindre"
            >
              {/* Same PlusSVG as Chat */}
              <svg
                className={`plus-svg${attachOpen ? " rotated" : ""}`}
                viewBox="0 0 24 24" width="22" height="22"
                stroke={attachOpen ? "#C5A059" : "currentColor"}
                strokeWidth="2.5" fill="none" strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5"  y1="12" x2="19" y2="12" />
              </svg>
            </button>

            {/* Attach menu */}
            {attachOpen && (
              <div className="attach-menu">
                <button className="attach-item" onClick={() => { fileImgRef.current?.click(); }}>
                  <span className="attach-icon-circle" style={{ background: "#ede9fe" }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="#8b5cf6" strokeWidth="1.8" fill="none" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </span>
                  Image
                </button>
                <button className="attach-item" onClick={() => handleStructuredAction("doc")}>
                  <span className="attach-icon-circle" style={{ background: "#dcfce7" }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="#16a34a" strokeWidth="1.8" fill="none" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </span>
                  Générer document
                </button>
                <button className="attach-item" onClick={() => handleStructuredAction("img")}>
                  <span className="attach-icon-circle" style={{ background: "#fef3c7" }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="#d97706" strokeWidth="1.8" fill="none" strokeLinecap="round">
                      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    </svg>
                  </span>
                  Générer image
                </button>
              </div>
            )}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            className="cogi-textarea"
            rows={1}
            placeholder="hey how are you, need a help?"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />

          {/* Clear (only with messages) */}
          {messages.length > 0 && (
            <button className="icon-btn" onClick={handleClear} title="Effacer la conversation"
              style={{ fontSize: 16, color: "#94a3b8" }}>
              🗑
            </button>
          )}

          {/* Send — identical to Chat's send-btn */}
          <button
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            title="Envoyer (Entrée)"
          >
            <div className={`send-icon-container${isLoading ? "" : ""}`}>
              {isLoading ? (
                <span className="cogi-spinner" />
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                  stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#fff" />
                </svg>
              )}
            </div>
          </button>
        </div>

        <p className="cogi-input-hint">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
      </div>
    </div>
  );
};

export default Cogi;
