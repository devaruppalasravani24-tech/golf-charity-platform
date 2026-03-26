import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CartButton from "../components/CartButton";
import Footer from "../components/Footer";
import InputField from "../components/InputField";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";
import {
  getSupabaseEnvError,
  isSupabaseConfigured,
} from "../services/supabaseClient";
import { validateLoginForm } from "../utils/validation";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const message = location.state?.message || "";

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateLoginForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);
    const result = await signIn(form.email, form.password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
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
            Welcome back
          </p>
          <h1 className="mt-3 font-display text-3xl font-black text-white sm:text-4xl">
            Sign in to your GolfGives account
          </h1>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              label="Password"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="Minimum 8 characters"
              type="password"
              value={form.password}
            />

            {message ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {message}
              </div>
            ) : null}

            {error || !isSupabaseConfigured ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error || getSupabaseEnvError()}
              </div>
            ) : null}

            <CartButton
              className="w-full"
              disabled={submitting || !isSupabaseConfigured}
              type="submit"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </CartButton>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <span>Need an account?</span>
            <CartButton className="w-full sm:w-auto" to="/signup" variant="secondary">
              Create account
            </CartButton>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
