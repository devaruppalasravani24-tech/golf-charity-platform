import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

function itemClassName({ isActive }) {
  return `shrink-0 rounded-2xl px-4 py-3 text-center text-sm font-medium transition-colors lg:text-left ${
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
    <aside className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5 lg:sticky lg:top-24 lg:w-72 lg:self-start">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">
        {isAdmin ? "Admin workspace" : "Member workspace"}
      </p>
      <h2 className="mt-3 break-words font-display text-2xl font-black text-white sm:text-3xl">
        {profile?.full_name || "GolfGives"}
      </h2>
      <p className="mt-2 truncate text-sm text-slate-400">
        {profile?.email || "Signed in member"}
      </p>

      <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
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
