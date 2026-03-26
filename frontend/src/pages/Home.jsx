import CartButton from "../components/CartButton";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function Home() {
  const steps = [
    {
      title: "Subscribe",
      body: "Choose a monthly or yearly plan and connect your giving to a charity you care about.",
    },
    {
      title: "Track scores",
      body: "Save and edit your latest five Stableford scores with live Supabase-backed updates.",
    },
    {
      title: "See results",
      body: "Follow monthly draws, winner verification, and payout progress from one dashboard.",
    },
  ];

  const highlights = [
    "Supabase authentication and live data",
    "Razorpay checkout handoff",
    "Charity selection with contribution tracking",
    "Admin controls for users, draws, and winners",
  ];

  return (
    <div className="min-h-screen bg-bg text-white">
      <Navbar />
      <main className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,_rgba(0,229,160,0.18),_transparent_52%),radial-gradient(circle_at_right,_rgba(245,200,66,0.12),_transparent_28%)]" />
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
          <div className="relative z-10">
            <p className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              Golf Charity Subscription Platform
            </p>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              Golf that funds impact, not just prizes.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Manage subscriptions, scores, draws, charities, and winner
              verification in one responsive platform built for golfers and
              administrators.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CartButton to="/signup">Create account</CartButton>
              <CartButton to="/login" variant="secondary">
                Sign in
              </CartButton>
            </div>
            <ul className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              {highlights.map((highlight) => (
                <li
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl"
                  key={highlight}
                >
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-gold">
              How it works
            </p>
            <div className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <div
                  className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                  key={step.title}
                >
                  <p className="text-xs uppercase tracking-[0.28em] text-accent">
                    Step {index + 1}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-white">
                    {step.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
