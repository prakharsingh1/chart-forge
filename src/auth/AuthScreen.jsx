import { useState } from "react";
import { useAuth } from "./useAuth.js";

export default function AuthScreen({ onClose }) {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        onClose?.();
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setMsg("Account created. Check your email if confirmation is on, then log in.");
      }
    } catch (err) {
      setMsg(err.message || "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{mode === "login" ? "Welcome back" : "Create your workspace"}</h3>
          <button className="btn btn-sm" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        {!configured && (
          <p className="error">
            Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.
          </p>
        )}
        <form onSubmit={submit} className="auth-form">
          <label className="muted">Work email</label>
          <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          <label className="muted">Password</label>
          <input className="field" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} disabled={busy || !configured}>
            {busy ? "Working…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
        {msg && <p className={msg.includes("failed") || msg.includes("Invalid") ? "error" : "muted"} style={{ marginTop: 12 }}>{msg}</p>}
        <p className="muted" style={{ marginTop: 16 }}>
          {mode === "login" ? (
            <>
              No account?{" "}
              <button type="button" className="linkish" onClick={() => setMode("signup")}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have one?{" "}
              <button type="button" className="linkish" onClick={() => setMode("login")}>
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
