const UNSAFE_RAW_URL_CHARACTER = /[\p{White_Space}\p{Cc}\p{Cf}]/u;

/**
 * Keep source links absolute, credential-free, and parseable in both API and UI paths.
 */
export function safeHttpUrl(value: string | null): string | null {
  if (!value
    || !/^https?:\/\//u.test(value)
    || value.includes("\\")
    || UNSAFE_RAW_URL_CHARACTER.test(value)) return null;

  try {
    const url = new URL(value);
    const authority = value.slice(value.indexOf("://") + 3).split(/[/?#]/u, 1)[0];
    const port = url.port === "" ? null : Number(url.port);

    if ((url.protocol !== "http:" && url.protocol !== "https:")
      || !authority
      || authority.endsWith(":")
      || authority.includes("%")
      || url.username.length > 0
      || url.password.length > 0
      || !isValidHostname(url.hostname)
      || (port !== null && (!Number.isInteger(port) || port < 1 || port > 65_535))) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

function isValidHostname(hostname: string) {
  if (hostname.startsWith("[") && hostname.endsWith("]")) return true;

  const normalized = hostname.endsWith(".") ? hostname.slice(0, -1) : hostname;
  if (!normalized || normalized.length > 253) return false;

  return normalized.split(".").every((label) => (
    label.length >= 1
    && label.length <= 63
    && !label.startsWith("-")
    && !label.endsWith("-")
    && /^[a-z0-9-]+$/iu.test(label)
  ));
}
