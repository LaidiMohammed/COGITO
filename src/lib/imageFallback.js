const readImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Impossible de lire l'image"));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });

const getResizeDimensions = (width, height, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
};

export const createImageDataUrlFallback = async (
  file,
  {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.78,
    maxLength = 450000,
  } = {},
) => {
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    throw new Error("Fallback disponible uniquement pour les images");
  }

  const image = await readImageFile(file);
  const { width, height } = getResizeDimensions(
    image.width,
    image.height,
    maxWidth,
    maxHeight,
  );
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");

  ctx.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", quality);

  if (!dataUrl || dataUrl.length > maxLength) {
    throw new Error("Image trop grande pour le mode de secours");
  }

  return dataUrl;
};

export const createFileDataUrlFallback = async (
  file,
  { maxLength = 450000 } = {},
) => {
  if (!(file instanceof File)) {
    throw new Error("Fallback disponible uniquement pour les fichiers");
  }

  const dataUrl = await readFileAsDataUrl(file);

  if (!dataUrl || dataUrl.length > maxLength) {
    throw new Error("Fichier trop volumineux pour le mode de secours");
  }

  return dataUrl;
};
