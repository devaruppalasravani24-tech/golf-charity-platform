import { assertSupabaseConfigured } from "./supabaseClient";
import { validateScoreEntry } from "../utils/validation";

function formatError(error) {
  return error?.message || "Unable to complete the score request.";
}

export async function listScoresByUser(userId) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("golf_scores")
      .select("*")
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .limit(5);

    if (error) {
      return { data: [], error: formatError(error) };
    }

    return { data: data ?? [], error: null };
  } catch (error) {
    return { data: [], error: formatError(error) };
  }
}

export async function createScore({ playedAt, score, userId }) {
  const validationError = validateScoreEntry({ playedAt, score });
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = assertSupabaseConfigured();
    const existing = await listScoresByUser(userId);

    if (existing.error) {
      return { data: null, error: existing.error };
    }

    if (existing.data.length >= 5) {
      const oldestScore = [...existing.data].sort(
        (left, right) =>
          new Date(left.played_at).getTime() - new Date(right.played_at).getTime()
      )[0];

      if (oldestScore?.id) {
        await removeScoreById(oldestScore.id);
      }
    }

    const { data, error } = await supabase
      .from("golf_scores")
      .insert({ played_at: playedAt, score, user_id: userId })
      .select("*")
      .single();

    if (error) {
      return { data: null, error: formatError(error) };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function updateScoreById({ playedAt, score, scoreId }) {
  const validationError = validateScoreEntry({ playedAt, score });
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("golf_scores")
      .update({ played_at: playedAt, score })
      .eq("id", scoreId)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: formatError(error) };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function removeScoreById(scoreId) {
  try {
    const supabase = assertSupabaseConfigured();
    const { error } = await supabase.from("golf_scores").delete().eq("id", scoreId);
    return { data: null, error: error ? formatError(error) : null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export function subscribeToScoreChanges(userId, onChange) {
  try {
    const supabase = assertSupabaseConfigured();
    const channel = supabase
      .channel(`golf_scores:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `user_id=eq.${userId}`,
          schema: "public",
          table: "golf_scores",
        },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}
