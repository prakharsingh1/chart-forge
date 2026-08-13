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

export async function deleteDeck(id) {
  const { error } = await requireClient().from("decks").delete().eq("id", id);
  if (error) throw error;
}
