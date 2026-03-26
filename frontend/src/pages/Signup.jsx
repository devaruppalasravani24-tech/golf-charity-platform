import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CartButton from "../components/CartButton";
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";
import {
  getSupabaseEnvError,
  isSupabaseConfigured,
} from "../services/supabaseClient";
import { validateSignupForm } from "../utils/validation";

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    confirmPassword: "",
    email: "",
    fullName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const normalizedError = error.toLowerCase();
  const shouldSuggestSignIn =
    normalizedError.includes("rate-limit") ||
    normalizedError.includes("rate limit") ||
    normalizedError.includes("already has an account");

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateSignupForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);
    const result = await signUp({
      email: form.email,
      fullName: form.fullName,
      password: form.password,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (!result.data?.session) {
      navigate("/login", {
        replace: true,
        state: {
          message:
            "Account created. Check your email to confirm it, then sign in.",
        },
      });
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <Navbar />
      <main className="mx-auto flex max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-8">
          <p className="text-sm uppercase tracking-[0.28em] text-accent">
            Join the platform
          </p>
          <h1 className="mt-3 font-display text-3xl font-black text-white sm:text-4xl">
            Create your GolfGives account
          </h1>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <InputField
              autoComplete="name"
              label="Full name"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
              placeholder="Jordan Fairway"
              value={form.fullName}
            />
            <InputField
              autoComplete="email"
              label="Email"
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="you@example.com"
              type="email"
              value={form.email}
            />
            <InputField
              autoComplete="new-password"
              label="Password"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="At least 8 characters"
              type="password"
              value={form.password}
            />
            <InputField
              autoComplete="new-password"
              label="Confirm password"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              placeholder="Repeat your password"
              type="password"
              value={form.confirmPassword}
            />

            {error || !isSupabaseConfigured ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error || getSupabaseEnvError()}
              </div>
            ) : null}

            {shouldSuggestSignIn ? (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                Try signing in if the account was already created, or check your inbox and spam folder for a confirmation email.
              </div>
            ) : null}

            <CartButton
              className="w-full"
              disabled={submitting || !isSupabaseConfigured}
              type="submit"
            >
              {submitting ? "Creating account..." : "Create account"}
            </CartButton>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <span>Already have an account?</span>
            <CartButton className="w-full sm:w-auto" to="/login" variant="secondary">
              Sign in instead
            </CartButton>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
