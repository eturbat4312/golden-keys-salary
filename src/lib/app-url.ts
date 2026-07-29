export function appUrl(path = "") {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.replace(/^\//, "");
  const url = new URL(normalizedBase, window.location.origin);
  url.hash = `/${normalizedPath}`;
  return url.toString();
}

export function appLinkLine(path = "boss") {
  return `App: ${appUrl(path)}`;
}
