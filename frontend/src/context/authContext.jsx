import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ensureUserProfile,
  getCurrentSession,
  getProfileByUserId,
  onAuthStateChange,
  signInWithPassword,
  signOutUser,
  signUpWithPassword,
  updateUserProfile,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const { data, error: sessionError } = await getCurrentSession();
      if (!isMounted) return;
      if (sessionError) {
        setError(sessionError);
        setLoading(false);
        return;
      }

      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setLoading(false);

      if (data?.session?.user?.id) {
        void hydrateProfile(data.session.user, isMounted);
      } else {
        setProfile(null);
      }
    }

    bootstrap();

    const { data: listener } = onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession?.user?.id) {
        void hydrateProfile(nextSession.user, isMounted);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function hydrateProfile(authUser, isMounted = true) {
    const { data, error: profileError } = await getProfileByUserId(authUser.id);
    if (!isMounted) return;
    if (profileError) {
      setError(profileError);
      return;
    }

    if (data) {
      setProfile(data);
      return;
    }

    const ensuredProfile = await ensureUserProfile(authUser);
    if (!isMounted) return;

    if (ensuredProfile.error) {
      setError(ensuredProfile.error);
      return;
    }

    setProfile(ensuredProfile.data ?? null);
  }

  async function signUp({ email, fullName, password }) {
    setError("");
    const result = await signUpWithPassword({ email, fullName, password });
    if (result.error) {
      setError(result.error);
      return result;
    }
    const nextSession = result.data?.session ?? null;
    const nextUser = nextSession?.user ?? null;
    setSession(nextSession);
    setUser(nextUser);
    if (nextUser?.id) {
      void hydrateProfile(nextUser);
    } else {
      setProfile(null);
    }
    return result;
  }

  async function signIn(email, password) {
    setError("");
    const result = await signInWithPassword({ email, password });
    if (result.error) {
      setError(result.error);
      return result;
    }
    const nextSession = result.data?.session ?? null;
    const nextUser = nextSession?.user ?? result.data?.user ?? null;
    setSession(nextSession);
    setUser(nextUser);
    if (nextUser?.id) {
      void hydrateProfile(nextUser);
    }
    return result;
  }

  async function signOut() {
    const result = await signOutUser();
    setSession(null);
    setUser(null);
    setProfile(null);
    if (result.error) setError(result.error);
    return result;
  }

  async function refreshProfile() {
    if (!user?.id) return { data: null, error: null };
    const result = await getProfileByUserId(user.id);
    if (!result.error) {
      setProfile(result.data ?? null);
    } else {
      setError(result.error);
    }
    return result;
  }

  async function saveProfile(updates) {
    if (!user?.id) {
      return { data: null, error: "No authenticated user was found." };
    }
    const result = await updateUserProfile(user.id, updates);
    if (!result.error) {
      setProfile(result.data ?? null);
    } else {
      setError(result.error);
    }
    return result;
  }

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      error,
      setProfile,
      refreshProfile,
      saveProfile,
      signIn,
      signOut,
      signUp,
    }),
    [session, user, profile, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
