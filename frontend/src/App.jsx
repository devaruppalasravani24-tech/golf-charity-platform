import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/authContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import AdminDashboard from "./pages/AdminDashboard";
import CharitySelection from "./pages/CharitySelection";
import Dashboard from "./pages/Dashboard";
import DrawResults from "./pages/DrawResults";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ScoreEntry from "./pages/ScoreEntry";
import Signup from "./pages/Signup";
import Subscription from "./pages/Subscription";

function ProtectedRoute({ adminOnly = false, children }) {
  const { loading, profile, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-white">
        <div>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-accent" />
          <p className="mt-5 text-sm uppercase tracking-[0.28em] text-slate-400">
            Checking access
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (adminOnly && profile?.role !== "admin") {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Home />} path="/" />
      <Route
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
        path="/login"
      />
      <Route
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
        path="/signup"
      />
      <Route
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
        path="/dashboard"
      />
      <Route
        element={
          <ProtectedRoute>
            <ScoreEntry />
          </ProtectedRoute>
        }
        path="/scores"
      />
      <Route
        element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        }
        path="/subscription"
      />
      <Route
        element={
          <ProtectedRoute>
            <CharitySelection />
          </ProtectedRoute>
        }
        path="/charity"
      />
      <Route
        element={
          <ProtectedRoute>
            <DrawResults />
          </ProtectedRoute>
        }
        path="/draw-results"
      />
      <Route
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
        path="/admin"
      />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <BrowserRouter
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          }}
        >
          <AppRoutes />
        </BrowserRouter>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
