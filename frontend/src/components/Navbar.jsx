import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import CartButton from "./CartButton";

function navClassName({ isActive }) {
  return `rounded-full px-4 py-2 text-sm transition-colors ${
    isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
  }`;
}

export default function Navbar() {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NavLink className="font-display text-2xl font-black text-white" to="/">
          GolfGives
        </NavLink>
        <div className="flex items-center gap-2">
          <NavLink className={navClassName} to="/">
            Home
          </NavLink>
          {user ? (
            <>
              <NavLink className={navClassName} to="/dashboard">
                Dashboard
              </NavLink>
              <NavLink className={navClassName} to="/draw-results">
                Draws
              </NavLink>
              {profile?.role === "admin" ? (
                <NavLink className={navClassName} to="/admin">
                  Admin
                </NavLink>
              ) : null}
              <CartButton onClick={handleSignOut} variant="secondary">
                Sign out
              </CartButton>
            </>
          ) : (
            <>
              <CartButton to="/login" variant="secondary">
                Login
              </CartButton>
              <CartButton to="/signup">Join now</CartButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
