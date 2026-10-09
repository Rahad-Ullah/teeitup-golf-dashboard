import { getClientToken } from "./apiToken";
import { BASE_URL, CLIENT_APP_HEADER, CLIENT_APP } from "./config";

// Re-exports for backward compatibility
export { BASE_URL, CLIENT_APP_HEADER, CLIENT_APP, API_ORIGIN } from "./config";
export { getMediaUrl } from "./media";

export interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: any;
}

export interface ApiError {
  status: number;
  message: string;
  data: any;
}

/**
 * Parses response body and formats errors into a unified shape.
 */
async function parseResponse<T>(response: Response): Promise<T> {
  const rawText = await response.text();
  let data: any;

  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText };
  }

  if (!response.ok) {
    const fieldErrors = Array.isArray(data?.errors) ? data.errors : null;
    const message = fieldErrors?.length
      ? fieldErrors
          .map((e: { field?: string; message: string }) => (e.field ? `${e.field}: ${e.message}` : e.message))
          .join(" — ")
      : data?.message || "Request failed";

    const error: ApiError = {
      status: response.status,
      message,
      data,
    };
    throw error;
  }

  return data as T;
}

/**
 * Core HTTP client for API requests.
 */
export async function fetchUrl<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set(CLIENT_APP_HEADER, CLIENT_APP);

  const token = getClientToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
    body: options.body && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body,
  });

  return parseResponse<T>(response);
}
