let runtimeGeminiKey = "";

export function setRuntimeGeminiKey(key) {
  runtimeGeminiKey = String(key || "").trim();
}

export function getRuntimeGeminiKey() {
  return runtimeGeminiKey;
}

export function aiHeaders(extra = {}) {
  const key = getRuntimeGeminiKey();
  return {
    "Content-Type": "application/json",
    ...(key ? { "x-cf-gemini-key": key } : {}),
    ...extra,
  };
}
