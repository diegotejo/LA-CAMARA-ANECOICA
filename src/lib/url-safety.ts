interface SanitizeUrlOptions {
  fallback: string;
  allowedHosts?: readonly string[];
  requireHttpsInProd?: boolean;
}

function hasAllowedHost(hostname: string, allowedHosts: readonly string[]) {
  return allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

export function sanitizeExternalUrl(input: string, options: SanitizeUrlOptions) {
  const trimmed = input.trim();

  try {
    const parsed = new URL(trimmed);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";

    if (!isHttp) {
      return options.fallback;
    }

    if (options.allowedHosts && !hasAllowedHost(parsed.hostname, options.allowedHosts)) {
      return options.fallback;
    }

    if (
      options.requireHttpsInProd &&
      process.env.NODE_ENV === "production" &&
      parsed.protocol !== "https:"
    ) {
      return options.fallback;
    }

    return parsed.toString();
  } catch {
    return options.fallback;
  }
}

export function normalizePublicOrigin(input: string, fallback: string) {
  const safe = sanitizeExternalUrl(input, {
    fallback,
    requireHttpsInProd: true,
  });

  return safe.replace(/\/+$/, "");
}

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function getSafeYouTubeEmbedUrl(embedId: string) {
  const id = embedId.trim();

  if (!YOUTUBE_ID_RE.test(id)) {
    return null;
  }

  return `https://www.youtube-nocookie.com/embed/${id}`;
}
