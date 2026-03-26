import { assertSupabaseConfigured } from "./supabaseClient";

function formatError(error) {
  return error?.message || "Something went wrong. Please try again.";
}

async function ensureProfileRow({
  fallbackEmail,
  fallbackFullName,
  user,
}) {
  if (!user?.id) {
    return { data: null, error: null };
  }

  try {
    const supabase = assertSupabaseConfigured();
    const fullName =
      user.user_metadata?.full_name ||
      fallbackFullName ||
      user.email?.split("@")[0] ||
      fallbackEmail?.split("@")[0] ||
      "";

    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          id: user.id,
          email: user.email || fallbackEmail || null,
          full_name: fullName,
          role: "subscriber",
          subscription_status: "inactive",
          charity_percentage: 10,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("*")
      .maybeSingle();

    if (error) {
      return { data: null, error: formatError(error) };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function getCurrentSession() {
  try {
    const supabase = assertSupabaseConfigured();
    const result = await supabase.auth.getSession();
    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function getProfileByUserId(userId) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatError(error) };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function updateUserProfile(userId, updates) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
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

export async function signUpWithPassword({ email, fullName, password }) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      return { data: null, error: formatError(error) };
    }

    // When email confirmation is enabled Supabase returns a user without a
    // session. Wait until the user signs in before writing the profile row.
    if (data?.session?.user?.id) {
      const { error: profileError } = await ensureProfileRow({
        fallbackEmail: email,
        fallbackFullName: fullName,
        user: data.session.user,
      });
      if (profileError) {
        return { data, error: formatError(profileError) };
      }
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function signInWithPassword({ email, password }) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error: formatError(error) };
    }

    if (data?.session?.user?.id) {
      const { error: profileError } = await ensureProfileRow({
        fallbackEmail: email,
        user: data.session.user,
      });

      if (profileError) {
        return { data: null, error: profileError };
      }
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export async function signOutUser() {
  try {
    const supabase = assertSupabaseConfigured();
    const { error } = await supabase.auth.signOut();
    return { data: null, error: error ? formatError(error) : null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}

export function onAuthStateChange(callback) {
  try {
    const supabase = assertSupabaseConfigured();
    return supabase.auth.onAuthStateChange(callback);
  } catch {
    return { data: null };
  }
}

export async function listUsers() {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("users")
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

export async function updateUserStatus(userId, updates) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
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

export async function ensureUserProfile(user) {
  return ensureProfileRow({ user });
}
