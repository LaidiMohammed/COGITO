import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import {
  createImageDataUrlFallback,
  createFileDataUrlFallback,
} from "./imageFallback";

const sanitizeFileName = (name = "file") => name.replace(/[^\w.-]/g, "_");

const upload = async (file, folder = "images", options = {}) => {
  if (!(file instanceof File || file instanceof Blob)) {
    throw new Error("Fichier invalide pour l'envoi");
  }

  const date = Date.now();
  const fileName =
    file instanceof File ? sanitizeFileName(file.name) : `upload_${date}`;
  const storageRef = ref(storage, `${folder}/${date}_${fileName}`);

  // Create a timeout promise - very short for fast fallback to data URL
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 5000),
  );

  try {
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    })();

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error) {
    if (options.allowDataUrlFallback && file instanceof File) {
      if (file.type.startsWith("image/")) {
        return await createImageDataUrlFallback(file, {
          maxWidth: options.maxWidth,
          maxHeight: options.maxHeight,
          quality: options.quality,
          maxLength: options.maxLength,
        });
      }

      return await createFileDataUrlFallback(file, {
        maxLength: options.maxLength,
      });
    }

    throw error;
  }
};

export { upload };
