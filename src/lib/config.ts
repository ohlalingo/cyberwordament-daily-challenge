// Normalize backend base URL; default to local backend if unset
const rawBase = import.meta.env.VITE_API_BASE as string | undefined;
export const API_BASE = (rawBase || "http://localhost:4000").replace(/\/$/, "");
