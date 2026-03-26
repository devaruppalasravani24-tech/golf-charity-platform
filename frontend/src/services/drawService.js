import { assertSupabaseConfigured } from "./supabaseClient";

function formatError(error) {
  return error?.message || "Unable to complete the draw request.";
}

export async function getPublishedDraws(limit = 12) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .in("status", ["published", "completed"])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error: formatError(error) };
    }

    return { data: data ?? [], error: null };
  } catch (error) {
    return { data: [], error: formatError(error) };
  }
}

export async function getLatestDrawResult(userId) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data: draw, error } = await supabase
      .from("draws")
      .select("*")
      .in("status", ["published", "completed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatError(error) };
    }

    if (!draw) {
      return { data: null, error: null };
    }

    let entry = null;

    if (userId) {
      const response = await supabase
        .from("draw_entries")
        .select("*")
        .eq("draw_id", draw.id)
        .eq("user_id", userId)
        .maybeSingle();

      entry = response.data ?? null;
    }

    return {
      data: {
        draw,
        entry,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function getUserDrawHistory(userId) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("draw_entries")
      .select("*, draws(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      return { data: [], error: formatError(error) };
    }

    return { data: data ?? [], error: null };
  } catch (error) {
    return { data: [], error: formatError(error) };
  }
}

export async function getUserWinners(userId) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("winners")
      .select("*, draws(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: formatError(error) };
    }

    return { data: data ?? [], error: null };
  } catch (error) {
    return { data: [], error: formatError(error) };
  }
}

export async function getAllDraws() {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: formatError(error) };
    }

    return { data: data ?? [], error: null };
  } catch (error) {
    return { data: [], error: formatError(error) };
  }
}

export async function createDrawRecord(payload) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("draws")
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
      })
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

export async function updateDrawRecord(drawId, updates) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("draws")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", drawId)
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

export async function getAllWinners() {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("winners")
      .select("*, users(full_name, email), draws(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: formatError(error) };
    }

    return { data: data ?? [], error: null };
  } catch (error) {
    return { data: [], error: formatError(error) };
  }
}

export async function updateWinnerStatus(winnerId, updates) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("winners")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", winnerId)
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
