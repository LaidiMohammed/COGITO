import "./Login.css";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
auth.languageCode = "fr";
import { doc, setDoc } from "firebase/firestore";
import { upload } from "../../lib/upload";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  // 1. AJOUT DE L'ETAT LOADING ICI
  const [loading, setLoading] = useState(false);

  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); // Correction de l'orthographe (L majuscule)
    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const avatarUrl = avatar.file
        ? await upload(avatar.file, "avatars", {
            allowDataUrlFallback: true,
            maxWidth: 512,
            maxHeight: 512,
            quality: 0.8,
            maxLength: 250000,
          })
        : "./Avatar.png";

      await setDoc(doc(db, "users", res.user.uid), {
        name: username,
        username,
        email,
        id: res.user.uid,
        avatar: avatarUrl,
        blocked: [],
      });

      await setDoc(doc(db, "userschats", res.user.uid), {
        chats: [],
      });

      toast.success("Compte créé ! Connexion...");
      // Auto login after register
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      let msg = "Erreur inscription";
      if (err.code === "auth/email-already-in-use") msg = "Email déjà utilisé";
      if (err.code === "auth/weak-password") msg = "Mot de passe trop faible";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      toast.success("Bienvenue ! Vous allez être redirigé...");
      // Force userStore fetch
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      let msg = "Erreur login";
      if (err.code === "auth/user-not-found")
        msg = "Utilisateur non trouvé - créez un compte";
      else if (err.code === "auth/wrong-password")
        msg = "Mot de passe incorrect (ldldld?)";
      else if (err.code === "auth/invalid-credential")
        msg = "Email/mdp incorrects ou Firebase non configuré";
      else if (err.code === "auth/network-request-failed")
        msg = "Pas de connexion internet";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="item">
        <img src="/image/logo.png" alt="logo" />
        <div className="toggle-header">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => setIsLogin(true)}
            type="button"
          >
            Sign In
          </button>
          <button
            className={!isLogin ? "active" : ""}
            onClick={() => setIsLogin(false)}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {isLogin ? (
          <>
            <h2>Rebonjour !</h2>
            <form onSubmit={handleLogin}>
              <input type="email" placeholder="Email" name="email" required />
              <input
                type="password"
                placeholder="Password"
                name="password"
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Chargement..." : "Sign In"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2>Créer un Compte</h2>
            <form onSubmit={handleRegister}>
              <label htmlFor="file">
                <img src={avatar.url || "./Avatar.png"} alt="avatar" />
                <span>Choisi une photo</span>
              </label>
              <input
                type="file"
                id="file"
                style={{ display: "none" }}
                onChange={handleAvatar}
              />
              <input
                type="text"
                placeholder="Username"
                name="username"
                required
              />
              <input type="email" placeholder="Email" name="email" required />
              <input
                type="password"
                placeholder="Password"
                name="password"
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Chargement..." : "Sign Up"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
