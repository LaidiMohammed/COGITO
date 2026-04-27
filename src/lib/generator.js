import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { upload } from "./upload";

const sanitizeFileName = (name = "file") =>
  name.replace(/[^\w.-]/g, "_");

const isConfiguredKey = (value, placeholder) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  value.trim() !== placeholder;

const fetchWithTimeout = async (url, options = {}, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchJsonWithTimeout = async (url, options = {}, timeoutMs = 30000) => {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  if (!response.ok) {
    throw new Error(`Requete indisponible (${response.status})`);
  }
  return await response.json();
};

const uploadGeneratedBlob = async (blob, width, height) => {
  if (!blob?.size) {
    throw new Error("Image vide recue depuis le service IA");
  }

  const contentType = blob.type || "image/png";
  const extension = contentType.includes("png") ? "png" : "jpg";
  const imageFile = new File([blob], `ai-generated-${Date.now()}.${extension}`, {
    type: contentType,
  });

  return await upload(imageFile, "images", {
    allowDataUrlFallback: true,
    maxWidth: width,
    maxHeight: height,
    quality: 0.92,
    maxLength: 900000,
  });
};

const IMAGE_STOPWORDS = new Set([
  "a", "an", "and", "are", "avec", "background", "beautiful", "by", "create",
  "crée", "dans", "de", "des", "du", "en", "for", "generate", "generated",
  "generating", "high", "high-quality", "hq", "image", "illustration", "la",
  "le", "les", "of", "photo", "photorealistic", "portrait", "quality", "sur",
  "the", "ultra", "une", "with"
]);

const normalizePromptSubject = (prompt) => {
  if (typeof prompt !== "string") return "";

  return prompt
    .replace(/^[^:]*:\s*/i, "")
    .replace(/^(generate|create|make|draw)\s+(a|an)?\s*(high[-\s]?quality)?\s*(image|illustration|photo)\s+(of|showing)\s+/i, "")
    .replace(/^(une|un)?\s*(image|illustration|photo)\s+(de|du|des|d')\s+/i, "")
    .trim();
};

const getWikipediaSearchCandidates = (prompt) => {
  const normalized = normalizePromptSubject(prompt);
  if (!normalized) return [];

  const compact = normalized
    .replace(/[.,;:!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const shorter = compact
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 4)
    .join(" ");

  return [...new Set([compact, shorter].filter(Boolean))];
};

const getPromptKeywords = (prompt) => {
  const cleaned = normalizePromptSubject(prompt)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter((word) => word && !IMAGE_STOPWORDS.has(word))
    .slice(0, 5);

  return cleaned.length ? cleaned : ["creative", "illustration"];
};

export const buildImageGenerationUrl = (prompt, options = {}) => {
  const cleanedPrompt = typeof prompt === "string" ? prompt.trim() : "";
  const {
    width = 768,
    height = 768,
    seed = Date.now() % 100000,
  } = options;

  const encoded = encodeURIComponent(cleanedPrompt || "creative educational concept");
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
};

export const buildImagePlaceholderUrl = (prompt, options = {}) => {
  const { width = 640, height = 400 } = options;
  const safePrompt = (prompt || "Image generee")
    .replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0b2947"/>
          <stop offset="100%" stop-color="#c5a059"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" rx="24"/>
      <circle cx="${width - 90}" cy="80" r="42" fill="rgba(255,255,255,0.14)"/>
      <circle cx="80" cy="${height - 70}" r="56" fill="rgba(255,255,255,0.10)"/>
      <text x="48" y="${height / 2 - 10}" fill="#ffffff" font-family="Georgia, serif" font-size="20">Illustration demandee</text>
      <text x="48" y="${height / 2 + 28}" fill="#f8ecd3" font-family="Arial, sans-serif" font-size="28">${safePrompt}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const buildImageFallbackUrls = (prompt, options = {}) => {
  const { width = 640, height = 400 } = options;
  const fallbackSeed = Date.now() % 100000;

  return [
    buildImageGenerationUrl(prompt, { width, height, seed: fallbackSeed }),
    buildImageGenerationUrl(prompt, { width, height, seed: fallbackSeed + 17 }),
    buildImagePlaceholderUrl(prompt, { width, height }),
  ];
};

const generateWithOpenAI = async (prompt, options = {}) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!isConfiguredKey(apiKey, "your_openai_api_key")) {
    return null;
  }

  const { width = 1024, height = 1024, timeoutMs = 45000 } = options;
  const size = width === height ? `${width}x${height}` : "1024x1024";

  const response = await fetchWithTimeout("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size,
    }),
  }, timeoutMs);

  if (!response.ok) {
    throw new Error(`OpenAI image indisponible (${response.status})`);
  }

  const data = await response.json();
  const base64 = data?.data?.[0]?.b64_json;
  const remoteUrl = data?.data?.[0]?.url;

  if (base64) {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return await uploadGeneratedBlob(new Blob([bytes], { type: "image/png" }), width, height);
  }

  if (remoteUrl) {
    return remoteUrl;
  }

  throw new Error("OpenAI n'a pas retourne d'image");
};

const generateWithStability = async (prompt, options = {}) => {
  const apiKey = import.meta.env.VITE_STABILITY_API_KEY;
  if (!isConfiguredKey(apiKey, "your_stability_api_key")) {
    return null;
  }

  const { width = 1024, height = 1024, timeoutMs = 45000 } = options;
  const body = new FormData();
  body.append("prompt", prompt);
  body.append("output_format", "png");
  body.append("aspect_ratio", width >= height ? "1:1" : "3:4");

  const response = await fetchWithTimeout("https://api.stability.ai/v2beta/stable-image/generate/core", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "image/*",
    },
    body,
  }, timeoutMs);

  if (!response.ok) {
    throw new Error(`Stability image indisponible (${response.status})`);
  }

  const blob = await response.blob();
  return await uploadGeneratedBlob(blob, width, height);
};

const generateWithPollinations = async (prompt, options = {}) => {
  const { width = 768, height = 768, timeoutMs = 30000, retries = 3 } = options;
  const baseSeed = Date.now() % 100000;
  const candidateUrls = Array.from({ length: retries }, (_, index) =>
    buildImageGenerationUrl(prompt, {
      width,
      height,
      seed: baseSeed + index,
    })
  );

  let lastError = null;

  for (const sourceUrl of candidateUrls) {
    try {
      const response = await fetchWithTimeout(sourceUrl, {
        method: "GET",
        headers: { Accept: "image/*" },
        cache: "no-store",
      }, timeoutMs);

      if (!response.ok) {
        if (response.status === 403) {
          return sourceUrl;
        }
        throw new Error(`Service image indisponible (${response.status})`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        throw new Error("La reponse recue n'est pas une image valide");
      }

      const blob = await response.blob();
      return await uploadGeneratedBlob(blob, width, height);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Impossible de generer l'image pour le moment");
};

const generateWithWikipediaSubject = async (prompt, options = {}) => {
  const { timeoutMs = 15000 } = options;
  const queries = getWikipediaSearchCandidates(prompt);
  if (!queries.length) {
    return null;
  }

  const languages = ["fr", "en"];

  for (const language of languages) {
    for (const query of queries) {
      try {
        const searchUrl = `https://${language}.wikipedia.org/w/api.php?origin=*&action=opensearch&limit=1&namespace=0&format=json&search=${encodeURIComponent(query)}`;
        const searchData = await fetchJsonWithTimeout(searchUrl, {}, timeoutMs);
        const title = searchData?.[1]?.[0];

        if (!title) {
          continue;
        }

        const summaryUrl = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const summaryData = await fetchJsonWithTimeout(summaryUrl, {}, timeoutMs);
        const imageUrl = summaryData?.originalimage?.source || summaryData?.thumbnail?.source;

        if (imageUrl) {
          return imageUrl;
        }
      } catch (error) {
        continue;
      }
    }
  }

  return null;
};

export const generateImageFromText = async (prompt, options = {}) => {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt requis pour la generation d'image");
  }

  const cleanedPrompt = prompt.trim();
  if (cleanedPrompt.length < 3) {
    throw new Error("Le prompt doit contenir au moins 3 caracteres");
  }

  const {
    width = 768,
    height = 768,
    timeoutMs = 30000,
    retries = 3,
  } = options;

  const providers = [
    () => generateWithStability(cleanedPrompt, { width, height, timeoutMs }),
    () => generateWithOpenAI(cleanedPrompt, { width, height, timeoutMs }),
    () => generateWithWikipediaSubject(cleanedPrompt, { width, height, timeoutMs }),
    () => generateWithPollinations(cleanedPrompt, { width, height, timeoutMs, retries }),
  ];

  let lastError = null;

  for (const provider of providers) {
    try {
      const result = await provider();
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.name === "AbortError"
    ? "Le service de generation d'image a expire. Reessayez."
    : lastError?.message || "Impossible de generer l'image pour le moment");
};

export const generateDocument = async (content, options = {}) => {
  const { title = "Document", type = "txt" } = options;

  if (!content || typeof content !== "string") {
    throw new Error("Contenu requis pour la generation du document");
  }

  const date = Date.now();
  const name = sanitizeFileName(title) || `doc_${date}`;
  const fileName = `${name}.${type}`;
  const storageRef = ref(storage, `documents/${fileName}`);

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

  const snapshot = await uploadBytes(storageRef, blob);
  return await getDownloadURL(snapshot.ref);
};

export const generateChatExport = async (chatData, options = {}) => {
  const { format = "txt", includeMedia = true } = options;
  const { messages = [], title = "Export Chat" } = chatData;

  const content = messages.map(m => {
    const time = m.createdAt ? new Date(m.createdAt).toLocaleString("fr-FR") : "";
    let attach = "";
    if (m.img && includeMedia) attach = "[IMAGE]";
    else if (m.document) attach = "[DOCUMENT]";
    else if (m.audio) attach = "[AUDIO]";
    else if (m.location) attach = "[LOCALISATION]";
    return `[${time}] ${m.senderName}: ${m.text || ""} ${attach}`;
  }).join("\n\n");

  return generateDocument(content, { title, type: format });
};

export const generateDocFromTemplate = async (template, data, options = {}) => {
  if (!template || typeof template !== "object") {
    throw new Error("Modele requis");
  }

  let content = template.content || "";
  for (const [key, value] of Object.entries(data || {})) {
    content = content.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }

  return generateDocument(content, {
    ...options,
    title: template.title || options.title || "Document"
  });
};
