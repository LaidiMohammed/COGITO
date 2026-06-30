import "./Welcome.css";
import { useRef, useEffect, useState } from "react";
import { ChatIcon } from "../icons/ChatIcon";
import { GroupsIcon } from "../icons/GroupsIcon";
import { MeetIcon } from "../icons/MeetIcon";
import { CoursIcon } from "../icons/CoursIcon";
import { CogiIcon } from "../icons/CogiIcon";
import { MessageCircle, Users, Video, BookOpen, Bot, Calendar, Clock, Shield, Monitor } from "lucide-react";

const LEVELS = ["L1", "L2", "L3"];
const SEMESTERS = ["Semestre 1", "Semestre 2"];

const SAMPLE_MODULES = {
  L1: { s1: ["Analyse 1", "Algèbre 1", "Algorithmique 1", "Structure machine", "Terminologie", "Anglais 1"], s2: ["Analyse 2", "Algèbre 2", "Algorithmique 2", "Probabilité", "Physique", "PO" ] },
  L2: { s1: ["Architecture", "ADS 3", "Systèmes d'information", "Logique mathématique", "Théorie des Graphes", "Anglais 2"], s2: ["POO", "Développement web", "Réseau", "SE 1", "BDD", "Théorie des Langages"] },
  L3: { s1: ["SE 2", "Compilation", "PL", "Génie Logiciel", "IHM", "Économie Numérique"], s2: ["IA", "Données structurées", "Sécurité", "Application Mobile", "Startup"] },
};

const FEATURES = [
  {
    key: "chat", icon: ChatIcon, title: "Messagerie",
    desc: "Discutez en temps réel avec vos camarades. Partagez des fichiers, des images et bien plus.",
    details: ["Messages instantanés", "Partage de fichiers", "Notifications en temps réel"],
  },
  {
    key: "groups", icon: GroupsIcon, title: "Groupes",
    desc: "Créez des espaces de travail collaboratifs pour vos projets et travaux d'équipe.",
    details: ["Espaces dédiés", "Calendrier partagé", "Gestion des membres"],
  },
  {
    key: "meet", icon: MeetIcon, title: "Meet",
    desc: "Lancez des visioconférences en un clic avec partage d'écran et tableau blanc.",
    details: ["Visioconférence HD", "Partage d'écran", "Tableau blanc interactif"],
  },
  {
    key: "cours", icon: CoursIcon, title: "Cours",
    desc: "Accédez à toutes vos ressources pédagogiques organisées par niveau et semestre.",
    details: ["Cours par niveau", "Exercices et TD", "Ressources téléchargeables"],
  },
  {
    key: "cogi", icon: CogiIcon, title: "Cogi IA",
    desc: "Votre assistant intelligent alimenté par l'IA pour vous aider dans vos études.",
    details: ["Assistant IA", "Réponses instantanées", "Aide à la révision"],
  },
];

const Welcome = ({ setPage }) => {
  const [scrollY, setScrollY] = useState(0);
  const [activeLevel, setActiveLevel] = useState("L1");

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="Welcome">
      {/* ── Hero ── */}
      <section className="welcome-hero">
        <div className="welcome-hero-bg" style={{ transform: `scale(${1 + scrollY * 0.0006}) translateY(${scrollY * 0.15}px)` }} />
        <div className="welcome-hero-content" style={{ opacity: Math.max(0, 1 - scrollY * 0.002) }}>
          <img src={`${import.meta.env.BASE_URL}image/logo.png`} alt="Cogito" className="welcome-logo" />
          <h1 className="welcome-title">Bienvenue sur <span>Cogito</span></h1>
          <p className="welcome-sub">
            La plateforme intelligente conçue pour les étudiants.<br />
            Collaborez, apprenez et réussissez ensemble.
          </p>
          <div className="welcome-cta">
            <button className="welcome-btn-primary" onClick={() => setPage("chat")}>Commencer</button>
            <button className="welcome-btn-outline" onClick={() => document.getElementById("w-details")?.scrollIntoView({ behavior: "smooth" })}>Découvrir</button>
          </div>
        </div>
        <div className="welcome-scroll-hint">Défiler pour découvrir</div>
      </section>

      {/* ── Section Détails ── */}
      <section id="w-details" className="w-details">

        {/* -- Cours détail -- */}
        <div className="w-detail-block">
          <div className="w-detail-header">
            <BookOpen size={28} strokeWidth={1.5} />
            <div>
              <h2>Cours disponibles</h2>
              <p>Ressources organisées par niveau et semestre</p>
            </div>
          </div>
          <div className="w-level-tabs">
            {LEVELS.map(l => (
              <button key={l} className={activeLevel === l ? "active" : ""} onClick={() => setActiveLevel(l)}>{l}</button>
            ))}
          </div>
          <div className="w-semester-grid">
            {SEMESTERS.map((sem, si) => (
              <div key={si} className="w-semester-card">
                <h4><Calendar size={14} /> {sem}</h4>
                <ul>
                  {SAMPLE_MODULES[activeLevel][si === 0 ? "s1" : "s2"].map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button className="w-detail-cta" onClick={() => setPage("cours")}>Voir tous les cours →</button>
        </div>

        {/* -- Meet détail -- */}
        <div className="w-detail-block">
          <div className="w-detail-header">
            <Video size={28} strokeWidth={1.5} />
            <div>
              <h2>Visioconférence Meet</h2>
              <p>Réunions en ligne avec une qualité HD</p>
            </div>
          </div>
          <div className="w-meet-grid">
            <div className="w-meet-card"><Video size={24} /><h4>HD</h4><p>Qualité audio et vidéo haute définition</p></div>
            <div className="w-meet-card"><Monitor size={24} /><h4>Partage d'écran</h4><p>Présentez vos travaux en temps réel</p></div>
            <div className="w-meet-card"><Users size={24} /><h4>Multi-utilisateurs</h4><p>Jusqu'à 50 participants par session</p></div>
            <div className="w-meet-card"><Clock size={24} /><h4>Planning</h4><p>Programmez vos réunions à l'avance</p></div>
          </div>
          <button className="w-detail-cta" onClick={() => setPage("meet")}>Rejoindre un meet →</button>
        </div>

        {/* -- Cogi IA détail -- */}
        <div className="w-detail-block">
          <div className="w-detail-header">
            <Bot size={28} strokeWidth={1.5} />
            <div>
              <h2>Assistant COGI</h2>
              <p>Intelligence artificielle au service de vos études</p>
            </div>
          </div>
          <div className="w-cogi-features">
            <div className="w-cogi-item"><Shield size={18} /><span>Réponses instantanées à vos questions</span></div>
            <div className="w-cogi-item"><Shield size={18} /><span>Aide à la révision et aux examens</span></div>
            <div className="w-cogi-item"><Shield size={18} /><span>Explications détaillées de concepts</span></div>
            <div className="w-cogi-item"><Shield size={18} /><span>Disponible 24h/24 et 7j/7</span></div>
          </div>
          <button className="w-detail-cta" onClick={() => setPage("cogi")}>Discuter avec COGI →</button>
        </div>

        {/* -- Groups détail -- */}
        <div className="w-detail-block">
          <div className="w-detail-header">
            <Users size={28} strokeWidth={1.5} />
            <div>
              <h2>Groupes de travail</h2>
              <p>Collaborez efficacement en équipe</p>
            </div>
          </div>
          <div className="w-groups-features">
            <div className="w-group-card"><MessageCircle size={20} /><h4>Chat de groupe</h4><p>Discussions partagées</p></div>
            <div className="w-group-card"><Calendar size={20} /><h4>Calendrier</h4><p>Planification d'équipe</p></div>
            <div className="w-group-card"><Users size={20} /><h4>Membres</h4><p>Gestion des rôles</p></div>
          </div>
          <button className="w-detail-cta" onClick={() => setPage("groups")}>Créer un groupe →</button>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="welcome-stats">
        <div className="welcome-stat"><span className="welcome-stat-num">5+</span><span className="welcome-stat-label">Fonctionnalités</span></div>
        <div className="welcome-stat"><span className="welcome-stat-num">∞</span><span className="welcome-stat-label">Messages illimités</span></div>
        <div className="welcome-stat"><span className="welcome-stat-num">24/7</span><span className="welcome-stat-label">Disponible</span></div>
      </section>

      {/* ── Company Logos Banner ── */}
      <div className="logo-banner">
        <div className="logo-banner-track logo-banner-track-1">
          {[...Array(2)].map((_, i) => (
            <div className="logo-banner-group" key={i}>
              <img src={`${import.meta.env.BASE_URL}logos/sonatrach.svg`} alt="Sonatrach" />
              <img src={`${import.meta.env.BASE_URL}logos/djezzy.svg`} alt="Djezzy" />
              <img src={`${import.meta.env.BASE_URL}logos/mobilis.svg`} alt="Mobilis" />
              <img src={`${import.meta.env.BASE_URL}logos/sotramo.png`} alt="Sotramo" />
              <img src={`${import.meta.env.BASE_URL}logos/ifri.svg`} alt="Ifri" />
              <img src={`${import.meta.env.BASE_URL}logos/naftal.svg`} alt="Naftal" />
              <img src={`${import.meta.env.BASE_URL}logos/algerie_poste.svg`} alt="Algérie Poste" />
              <img src={`${import.meta.env.BASE_URL}logos/air_algerie.svg`} alt="Air Algérie" />
              <img src={`${import.meta.env.BASE_URL}logos/tosyali.svg`} alt="Tosyali" />
            </div>
          ))}
        </div>
        <div className="logo-banner-track logo-banner-track-2">
          {[...Array(2)].map((_, i) => (
            <div className="logo-banner-group" key={i}>
              <img src={`${import.meta.env.BASE_URL}logos/tosyali.svg`} alt="Tosyali" />
              <img src={`${import.meta.env.BASE_URL}logos/air_algerie.svg`} alt="Air Algérie" />
              <img src={`${import.meta.env.BASE_URL}logos/algerie_poste.svg`} alt="Algérie Poste" />
              <img src={`${import.meta.env.BASE_URL}logos/naftal.svg`} alt="Naftal" />
              <img src={`${import.meta.env.BASE_URL}logos/ifri.svg`} alt="Ifri" />
              <img src={`${import.meta.env.BASE_URL}logos/sotramo.png`} alt="Sotramo" />
              <img src={`${import.meta.env.BASE_URL}logos/mobilis.svg`} alt="Mobilis" />
              <img src={`${import.meta.env.BASE_URL}logos/djezzy.svg`} alt="Djezzy" />
              <img src={`${import.meta.env.BASE_URL}logos/sonatrach.svg`} alt="Sonatrach" />
            </div>
          ))}
        </div>
      </div>

      <footer className="welcome-footer">
        <p>COGITO — Plateforme collaborative pour étudiants</p>
      </footer>
    </div>
  );
};

export default Welcome;