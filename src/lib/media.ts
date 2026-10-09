import { API_ORIGIN } from "./config";

/**
 * Resolves relative or absolute media paths to fully-qualified URLs.
 */
export const getMediaUrl = (path?: string | null): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
};
