import {
  Shield, GraduationCap, MessageCircle, Users, BookOpen, Bot, Video, Briefcase,
  Target, Heart, Star, ChevronRight
} from "lucide-react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="about-logo-wrap">
            <img src={`${import.meta.env.BASE_URL}image/logo.png`} alt="Cogito" className="about-logo" />
          </div>
          <h1 className="about-title">À propos de <span>Cogito</span></h1>
          <p className="about-subtitle">
            La plateforme intelligente conçue pour les étudiants algériens.
            Collaborez, apprenez, trouvez des opportunités et réussissez ensemble.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="about-section">
        <div className="about-section-icon"><Target size={28} /></div>
        <h2>Notre Mission</h2>
        <p>
          Cogito est née d'un constat simple : les étudiants manquent d'une plateforme unifiée
          pour leurs besoins académiques et professionnels. Nous combinons messagerie, groupes
          d'étude, cours, visioconférence, intelligence artificielle et offres d'emploi dans
          un seul espace sécurisé et moderne.
        </p>
      </section>

      {/* Features */}
      <section className="about-section">
        <div className="about-section-icon"><Star size={28} /></div>
        <h2>Ce que nous offrons</h2>
        <div className="about-features-grid">
          <div className="about-feature-card">
            <MessageCircle size={24} />
            <h3>Chat</h3>
            <p>Messagerie en temps réel avec vos contacts</p>
          </div>
          <div className="about-feature-card">
            <Users size={24} />
            <h3>Groupes</h3>
            <p>Espaces de collaboration par matière ou projet</p>
          </div>
          <div className="about-feature-card">
            <Video size={24} />
            <h3>Meet</h3>
            <p>Réunions vidéo intégrées</p>
          </div>
          <div className="about-feature-card">
            <BookOpen size={24} />
            <h3>Cours</h3>
            <p>Ressources pédagogiques organisées</p>
          </div>
          <div className="about-feature-card">
            <Bot size={24} />
            <h3>Cogi IA</h3>
            <p>Assistant intelligent pour vos études</p>
          </div>
          <div className="about-feature-card">
            <Briefcase size={24} />
            <h3>Jobs</h3>
            <p>Offres de stage, emploi et bourses</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-section">
        <div className="about-section-icon"><Heart size={28} /></div>
        <h2>Nos Valeurs</h2>
        <div className="about-values">
          <div className="about-value-item">
            <Shield size={20} />
            <span>Sécurité et confidentialité</span>
          </div>
          <div className="about-value-item">
            <GraduationCap size={20} />
            <span>Excellence académique</span>
          </div>
          <div className="about-value-item">
            <Users size={20} />
            <span>Collaboration et entraide</span>
          </div>
          <div className="about-value-item">
            <Star size={20} />
            <span>Innovation continue</span>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="about-section about-contact">
        <div className="about-section-icon"><MessageCircle size={28} /></div>
        <h2>Nous contacter</h2>
        <p>
          Une question, une suggestion ou un problème ? Notre équipe est à votre écoute.
        </p>
        <a href="mailto:support@cogito.edu.dz" className="about-contact-btn">
          <ChevronRight size={18} /> support@cogito.edu.dz
        </a>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <p>&copy; {new Date().getFullYear()} Cogito. Tous droits réservés.</p>
        <p className="about-footer-meta">Plateforme étudiante intelligente</p>
      </footer>
    </div>
  );
};

export default About;
