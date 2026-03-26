// Use the environment variable, but ensure it ends with /api if we are on the DigitalOcean domain
const envApiUrl = import.meta.env.VITE_API_URL || "";
export const API_BASE_URL = envApiUrl 
  ? (envApiUrl.endsWith("/api") ? envApiUrl : `${envApiUrl}/api`)
  : (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:8000" : "http://127.0.0.1:8000");
