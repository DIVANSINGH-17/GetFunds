// Top-level routes that would be shadowed by a creator page at /[username].
export const RESERVED_USERNAMES = new Set([
  "about",
  "api",
  "dashboard",
  "explore",
  "login",
  "logout",
  "support",
]);

export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export const normalizeUsername = (value) =>
  String(value || "").trim().toLowerCase();

export const validateUsername = (value) => {
  const username = normalizeUsername(value);

  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      error: "Username must be 3-30 characters using lowercase letters, numbers, or underscores.",
    };
  }

  if (RESERVED_USERNAMES.has(username)) {
    return {
      ok: false,
      error: "That username is reserved by the application.",
    };
  }

  return { ok: true, value: username };
};

export const validateOptionalUrl = (value, label) => {
  const url = String(value || "").trim();

  if (!url) {
    return { ok: true, value: "" };
  }

  if (url.length > 300) {
    return { ok: false, error: `${label} must contain at most 300 characters.` };
  }

  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Unsupported protocol");
    }

    return { ok: true, value: url };
  } catch {
    return {
      ok: false,
      error: `${label} must be a valid http or https URL.`,
    };
  }
};
