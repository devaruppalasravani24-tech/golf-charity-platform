import { assertSupabaseConfigured } from "./supabaseClient";

function formatError(error) {
  return error?.message || "Unable to complete the charity request.";
}

export async function getCharities({ includeInactive = false } = {}) {
  try {
    const supabase = assertSupabaseConfigured();
    let query = supabase.from("charities").select("*").order("name");

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: formatError(error) };
    }

    return { data: data ?? [], error: null };
  } catch (error) {
    return { data: [], error: formatError(error) };
  }
}

export async function getUserCharitySelection(userId) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("charity_selections")
      .select("*, charities(*)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatError(error) };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function saveCharitySelection({
  charityId,
  charityPercentage,
  userId,
}) {
  try {
    const supabase = assertSupabaseConfigured();
    const timestamp = new Date().toISOString();

    const { data, error } = await supabase
      .from("charity_selections")
      .upsert(
        {
          charity_id: charityId,
          updated_at: timestamp,
          user_id: userId,
        },
        { onConflict: "user_id" }
      )
      .select("*, charities(*)")
      .single();

    if (error) {
      return { data: null, error: formatError(error) };
    }

    await supabase
      .from("users")
      .update({
        charity_id: charityId,
        charity_percentage: charityPercentage,
        updated_at: timestamp,
      })
      .eq("id", userId);

    return { data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function getCharityContributionSummary() {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("charity_selections")
      .select("charity_id, contribution_percentage, charities(name, slug, logo_url)");

    if (error) {
      return { data: [], error: formatError(error) };
    }

    const summaryMap = new Map();

    for (const row of data ?? []) {
      const existing = summaryMap.get(row.charity_id) || {
        activeSubscribers: 0,
        averagePercentage: 0,
        charity_id: row.charity_id,
        charities: row.charities,
        totalPercentage: 0,
      };

      existing.activeSubscribers += 1;
      existing.totalPercentage += Number(row.contribution_percentage || 0);
      summaryMap.set(row.charity_id, existing);
    }

    const summary = [...summaryMap.values()].map((item) => ({
      ...item,
      averagePercentage:
        item.activeSubscribers > 0
          ? item.totalPercentage / item.activeSubscribers
          : 0,
    }));

    return { data: summary, error: null };
  } catch (error) {
    return { data: [], error: formatError(error) };
  }
}

export async function upsertCharity(payload) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("charities")
      .upsert(
        {
          ...payload,
          updated_at: new Date().toISOString(),
        },
        payload.id ? { onConflict: "id" } : undefined
      )
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

export async function toggleCharityStatus(charityId, isActive) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("charities")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", charityId)
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
