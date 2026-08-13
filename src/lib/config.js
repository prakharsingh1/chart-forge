export function appConfig() {
  if (typeof window === "undefined") return {};
  return window.__CF_CONFIG__ || {};
}

export function aiEnabled() {
  return Boolean(appConfig().aiEnabled);
}

export const AI_UNAVAILABLE = "AI is not enabled on this server.";
