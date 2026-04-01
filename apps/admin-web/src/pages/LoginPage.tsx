import { Link } from "react-router-dom";

import { hasSupabaseConfig } from "../config/env";

export function LoginPage() {
  return (
    <div className="login">
      <div className="login-card">
        <h1>Sign in</h1>
        {hasSupabaseConfig ? (
          <p>TODO: Supabase Auth (email magic link or SSO) once client is wired.</p>
        ) : (
          <p>
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{" "}
            in <code>.env</code> (see <code>.env.example</code>).
          </p>
        )}
        <Link to="/dashboard" className="text-link">
          Continue to shell (dev)
        </Link>
      </div>
    </div>
  );
}
