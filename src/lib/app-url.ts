export function appUrl(path = "") {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.replace(/^\//, "");
  return new URL(`${normalizedBase}${normalizedPath}`, window.location.origin).toString();
}

export function appLinkLine(path = "boss") {
  return `App: ${appUrl(path)}`;
}
