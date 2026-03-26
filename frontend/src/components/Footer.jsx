import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>GolfGives helps golfers subscribe, support charities, and track draw activity.</p>
        <div className="flex items-center gap-4">
          <Link className="hover:text-white" to="/login">
            Login
          </Link>
          <Link className="hover:text-white" to="/signup">
            Signup
          </Link>
          <Link className="hover:text-white" to="/draw-results">
            Draws
          </Link>
        </div>
      </div>
    </footer>
  );
}
