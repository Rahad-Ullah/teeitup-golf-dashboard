export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
export const CLIENT_APP_HEADER = "X-Client-App";
export const CLIENT_APP = "dashboard";
export const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, "");
