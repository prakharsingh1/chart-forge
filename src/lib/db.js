import { supabase } from "./supabase.js";

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export async function listDecks() {
  const { data, error } = await requireClient()
    .from("decks")
    .select("id, name, palette, updated_at, created_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function loadDeck(id) {
  const { data, error } = await requireClient().from("decks").select("*").eq("id", id).single();
  if (error) throw error;
  const payload = data.payload || {};
  return {
    remoteId: data.id,
    name: data.name,
    insights: data.insights || payload.insights || null,
    slides: payload.slides || [],
    palette: data.palette,
  };
}

export async function saveDeck({ remoteId, name, insights, slides, palette }) {
  const client = requireClient();
  const row = {
    name: name || "Untitled deck",
    palette: palette || "forge",
    insights: insights || null,
    payload: { slides: slides || [], insights: insights || null, name },
    updated_at: new Date().toISOString(),
  };
  if (remoteId) {
    const { data, error } = await client.from("decks").update(row).eq("id", remoteId).select("id").single();
    if (error) throw error;
    return data.id;
  }
  const { data: userData } = await client.auth.getUser();
  if (!userData?.user?.id) throw new Error("Not logged in");
  const { data, error } = await client
    .from("decks")
    .insert({ ...row, user_id: userData.user.id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function loadGeminiKey() {
  const client = requireClient();
  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return "";
  const { data } = await client.from("profiles").select("gemini_api_key").eq("id", user.id).maybeSingle();
  return String(data?.gemini_api_key || user.user_metadata?.gemini_api_key || "").trim();
}

export async function saveGeminiKey(key) {
  const client = requireClient();
  const trimmed = String(key || "").trim();
  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not logged in");
  const { error } = await client.from("profiles").update({ gemini_api_key: trimmed }).eq("id", user.id);
  if (error) {
    const { error: metaErr } = await client.auth.updateUser({ data: { gemini_api_key: trimmed } });
    if (metaErr) throw error;
  }
}

export async function deleteDeck(id) {
  const { error } = await requireClient().from("decks").delete().eq("id", id);
  if (error) throw error;
}
