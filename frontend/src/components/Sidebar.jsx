import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

function itemClassName({ isActive }) {
  return `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
    isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
  }`;
}

export default function Sidebar({ isAdmin = false }) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const items = isAdmin
    ? [
        { label: "Admin", path: "/admin" },
        { label: "Dashboard", path: "/dashboard" },
        { label: "Draw results", path: "/draw-results" },
      ]
    : [
        { label: "Overview", path: "/dashboard" },
        { label: "Scores", path: "/scores" },
        { label: "Subscription", path: "/subscription" },
        { label: "Charity", path: "/charity" },
        { label: "Draw results", path: "/draw-results" },
      ];

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <aside className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:sticky lg:top-24 lg:w-72 lg:self-start">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">
        {isAdmin ? "Admin workspace" : "Member workspace"}
      </p>
      <h2 className="mt-3 font-display text-3xl font-black text-white">
        {profile?.full_name || "GolfGives"}
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        {profile?.email || "Signed in member"}
      </p>

      <nav className="mt-6 space-y-2">
        {items.map((item) => (
          <NavLink className={itemClassName} key={item.path} to={item.path}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        className="mt-6 w-full rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
        onClick={handleSignOut}
        type="button"
      >
        Sign out
      </button>
    </aside>
  );
}
