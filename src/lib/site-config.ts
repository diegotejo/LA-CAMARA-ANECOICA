import { normalizePublicOrigin, sanitizeExternalUrl } from "@/lib/url-safety";

const DEFAULT_PORT = "3000";
const DEFAULT_SITE_URL = `http://localhost:${DEFAULT_PORT}`;
const DEFAULT_YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@CamaraAnecoica";
const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/anecoicacamara/";

const YOUTUBE_HOSTS = ["youtube.com", "youtu.be"] as const;
const INSTAGRAM_HOSTS = ["instagram.com"] as const;

export const siteConfig = {
  name: "La Cámara Anecoica",
  description:
    "Si estás cansado del ruido político, las consignas vacías y las trincheras ideológicas, La Cámara Anecoica es tu sitio. Analizamos política, ideologías y conflictos actuales con calma, perspectiva histórica y herramientas filosóficas.",
  defaultPort: DEFAULT_PORT,
  siteUrl: normalizePublicOrigin(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL, DEFAULT_SITE_URL),
  youtubeChannelUrl: sanitizeExternalUrl(
    process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || DEFAULT_YOUTUBE_CHANNEL_URL,
    {
      fallback: DEFAULT_YOUTUBE_CHANNEL_URL,
      allowedHosts: YOUTUBE_HOSTS,
      requireHttpsInProd: true,
    },
  ),
  instagramUrl: sanitizeExternalUrl(
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || DEFAULT_INSTAGRAM_URL,
    {
      fallback: DEFAULT_INSTAGRAM_URL,
      allowedHosts: INSTAGRAM_HOSTS,
      requireHttpsInProd: true,
    },
  ),
};
