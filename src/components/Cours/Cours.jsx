import { useState } from "react";
import "./Cours.css";
import Settings from "../settings/settings";
import { useChatStore } from "../../lib/chatStore";

const Cours = () => {
  const [level, setLevel] = useState("L1");
  const { showSettings } = useChatStore();
  const modulesData = {
    L1: {
      s1: [
        {
          name: "Analyse 1",
          link: "https://drive.google.com/drive/folders/1-7sOh8LJuJcUa2XOrixAvRrteTnaNMYe",
        },
        {
          name: "Algorithmique 1",
          link: "https://drive.google.com/drive/folders/1xqLqdRF6TAa51z31cNlKPa5kaUXX_kzT",
        },
        {
          name: "Algèbre 1",
          link: "https://drive.google.com/drive/folders/1-8mUAX142veDr2jg0H22I4AvC-05OpO6",
        },
        {
          name: "Structure machine 1",
          link: "https://drive.google.com/drive/folders/1-Px6qDXs5erJQb8TSAaQozCL-JwBrt0p",
        },
        {
          name: "Terminologie",
          link: "https://drive.google.com/drive/folders/1-An0sjYV6iXZtCykPz7cUR7F-05PSjT8",
        },
        {
          name: "Composants",
          link: "https://drive.google.com/drive/folders/1-PJFbI-h9e7NztIM7WVwVhD4BdtqBofk",
        },
        {
          name: "Anglais 1",
          link: "https://drive.google.com/drive/folders/1-I-o1JzewObsV9FbGSn6wtG1h5CxzpQA",
        },
      ],
      s2: [
        { name: "Analyse 2", link: "#" },
        { name: "Algorithmique 2", link: "#" },
        { name: "Algèbre 2", link: "#" },
        { name: "Structure machine 2", link: "#" },
        { name: "Probabilité", link: "#" },
        { name: "Physique", link: "#" },
        { name: "Outile de programation", link: "#" },
        { name: "Technologies de l'informatique", link: "#" },
      ],
    },
    L2: {
      s1: [
        {
          name: "Architecture des ordinateurs",
          link: "https://drive.google.com/drive/folders/1yWq5H8p_1xAYxltx7U1pGbUuzRFORDNw?usp=drive_link",
        },
        {
          name: "Algorithmique et Structures de données 3",
          link: "https://drive.google.com/drive/folders/1Ov0jmj_MYSaMWQinA-_deftE8Pb---0c?usp=drive_link",
        },
        {
          name: "Systèmes d’informations",
          link: "https://drive.google.com/drive/folders/1DXm7z4X1tNhzCMMYzOEE3ChVXe0pBicE",
        },
        {
          name: "Logique mathématique",
          link: "https://drive.google.com/drive/folders/13iThfiY7MnGAndrUdQ-0P8bVK5B1oCL7",
        },
        {
          name: "Théorie des Graphes",
          link: "https://drive.google.com/drive/folders/1I8uVCmANrsuoZ3PrOK8DSIYtLOySj8x8",
        },
        {
          name: "Anglais 2",
          link: "https://drive.google.com/drive/folders/1qzZUuql08msVfqlo9H8Zwkucl5wbGLx5?usp=drive_link",
        },
      ],
      s2: [
        {
          name: "Programmation Orienté Objet",
          link: "https://drive.google.com/drive/folders/1RhBQuNF-_0_BhNgL1nE6Acln32ekBp1y?usp=drive_link",
        },
        {
          name: "Développement web",
          link: "https://drive.google.com/drive/folders/1MzmFRRVC6aRk_a38vCMgs_OSdnGKKGb5?usp=drive_link",
        },
        {
          name: "Réseau",
          link: "https://drive.google.com/drive/folders/15EpG2jpkgzbcp5CfZXSMzX2EdMSj9swb",
        },
        {
          name: "Système d'exploitation 1",
          link: "https://drive.google.com/drive/folders/1uPULKQWZ6B4FUiL5wetYWZkPb1_H6E6N",
        },
        {
          name: "Théorie des Langages",
          link: "https://drive.google.com/drive/folders/1u8I6FvGTdDRCYvwXQ-f6i2MqkIacSw8Z",
        },
        {
          name: "Base de Données",
          link: "https://drive.google.com/drive/folders/11P8v92jeYFdaVtaPL6NvxLd9yY7RenG4",
        },
        {
          name: "Anglais 3",
          link: "https://drive.google.com/drive/folders/1gxWM-Man1DyyitCMpks0N6hwqwHbXxMS",
        },
      ],
    },
    L3: {
      s1: [
        {
          name: "Système d'exploitation 2",
          link: "https://drive.google.com/drive/folders/1Ggr1oMmIn8GAafSLrbzi-S_f4i8ia-Ss",
        },
        {
          name: "Compilation",
          link: "https://drive.google.com/drive/folders/1KQ2f0BHyi8UB9MUt4jNLnlkqtm7VRCSU",
        },
        {
          name: "Programmation linéaire",
          link: "https://drive.google.com/drive/folders/1UfSYKy18jnb9w1tes5cRZ-zWIF1-NstO",
        },
        {
          name: "Génie Logiciel",
          link: "https://drive.google.com/drive/folders/1O27TrHuMc-vzwklt-saa2Gf-Hkm3Zvs_",
        },
        {
          name: "Probabilité",
          link: "https://drive.google.com/drive/folders/1vj7-XDEUlxIiegj_HGBCajtX7FArScUi",
        },
        {
          name: "Interface Homme Machine",
          link: "https://drive.google.com/drive/folders/17arh0w6sEWHJjyzIrLG-UNI24Htx2D3s",
        },
        {
          name: "Economie Numérique",
          link: "https://drive.google.com/drive/folders/1eNvEtsufF5a6W4ee6SNO12GU5TbofGGA",
        },
      ],
      s2: [
        {
          name: "IA",
          link: "https://drive.google.com/drive/folders/1WqEdWR7xpfs-69l9aN0duArsnBlcKJv5",
        },
        {
          name: "Données semi-structurées",
          link: "https://drive.google.com/drive/folders/15y-PY18h7WT40zGRkIm2758PzRsTLqvX",
        },
        {
          name: "Sécurite informatique",
          link: "https://drive.google.com/drive/folders/1gqiXjUJtBt4aKAy5I9HCxkeZINY5l5Ae",
        },
        {
          name: "Application Mobile",
          link: "https://drive.google.com/drive/folders/106gG63NHjxAavPqUd3yVzrjUtSMYsPlF",
        },
        {
          name: "Rédaction Scientifique",
          link: "https://drive.google.com/drive/folders/1m9ingn-VOiXA7cP0NAyX1jaVMXqes5uO",
        },
        {
          name: "Startup",
          link: "https://drive.google.com/drive/folders/1U9DNwH5hh_TZl4nX6VYt_hsPlc9S0pFs",
        },
      ],
    },
  };

  return (
    <div className="cours-page">
      <h1 className="title">Select Your Study Level</h1>

      <div className="level-selector">
        {["L1", "L2", "L3"].map((lvl) => (
          <button
            key={lvl}
            className={level === lvl ? "active" : ""}
            onClick={() => setLevel(lvl)}
          >
            {lvl}
          </button>
        ))}
      </div>

      <div className="level-title">Licence {level}</div>

      <div className="semesters">
        <div className="semester-card">
          <h2>Semestre 1</h2>
          <ul>
            {modulesData[level].s1.map((module, index) => (
              <li key={index}>
                <a href={module.link} target="_blank" rel="noreferrer">
                  {module.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="semester-card">
          <h2>Semestre 2</h2>
          <ul>
            {modulesData[level].s2.map((module, index) => (
              <li key={index}>
                <a href={module.link} target="_blank" rel="noreferrer">
                  {module.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {showSettings && <Settings />}
    </div>
  );
};

export default Cours;
