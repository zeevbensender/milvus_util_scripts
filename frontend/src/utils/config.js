// src/utils/config.js

export const CONFIG = {
  BACKEND_PORT: import.meta.env.VITE_BACKEND_PORT || 8080,
  POLL_INTERVAL_MS: parseInt(import.meta.env.VITE_POLL_INTERVAL_MS || '30000'),
};
