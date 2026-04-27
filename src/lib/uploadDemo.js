/**
 * uploadDemo.js
 * ─────────────────────────────────────────────────────────────
 * Upload fichiers SANS Firebase — retourne une Data URL locale.
 * Utilisé en mode démonstration (aucune connexion Firebase requise).
 *
 * // @FIXME: Link to Firebase — remplacez uploadDemo par upload.js
 *           dès que firebase.js est configuré avec votre projet.
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Compress une image via Canvas et retourne une Data URL.
 * @param {File} file
 * @param {{ maxWidth?: number, maxHeight?: number, quality?: number }} opts
 * @returns {Promise<string>}
 */
const compressImageToDataUrl = (file, opts = {}) => {
  const { maxWidth = 800, maxHeight = 800, quality = 0.75 } = opts;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
      resolve(canvas.toDataURL(mimeType, quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de charger l'image"));
    };

    img.src = objectUrl;
  });
};

/**
 * Lit un fichier quelconque et retourne une Data URL brute.
 * @param {File} file
 * @param {{ maxLength?: number }} opts
 * @returns {Promise<string>}
 */
const readFileAsDataUrl = (file, opts = {}) => {
  const { maxLength = 2_000_000 } = opts; // 2 MB par défaut

  return new Promise((resolve, reject) => {
    if (file.size > maxLength) {
      return reject(
        new Error(
          `Fichier trop volumineux (max ${Math.round(maxLength / 1024)} Ko en mode démo)`,
        ),
      );
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    reader.readAsDataURL(file);
  });
};

/**
 * Entrée principale — remplace `upload()` de upload.js en mode démo.
 *
 * @param {File} file      — fichier sélectionné
 * @param {string} _folder — ignoré en mode démo (pour compatibilité API)
 * @param {object} opts    — options de compression (maxWidth, maxHeight, quality, maxLength)
 * @returns {Promise<string>} Data URL
 *
 * // @FIXME: Link to Firebase — quand Firebase Storage est opérationnel,
 *            importez `upload` depuis ./upload.js à la place de uploadDemo.
 */
export const uploadDemo = async (file, _folder = "images", opts = {}) => {
  if (!(file instanceof File || file instanceof Blob)) {
    throw new Error("Fichier invalide pour l'envoi");
  }

  const isImage = file.type?.startsWith("image/");

  if (isImage) {
    return compressImageToDataUrl(file, {
      maxWidth: opts.maxWidth ?? 800,
      maxHeight: opts.maxHeight ?? 800,
      quality: opts.quality ?? 0.75,
    });
  }

  return readFileAsDataUrl(file, {
    maxLength: opts.maxLength ?? 2_000_000,
  });
};
