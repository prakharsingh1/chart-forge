import { useState } from "react";
import { useAuth } from "./useAuth.js";

export default function AuthScreen({ onClose, onSuccess, variant = "modal" }) {
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
        onSuccess?.();
        onClose?.();
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setMsg("Workspace created. If email confirmation is on, check your inbox, then log in.");
      }
    } catch (err) {
      setMsg(err.message || "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  const form = (
    <div className="auth-panel">
      <div className="auth-panel-head">
        <h3>{mode === "login" ? "Log in to ChartForge" : "Create your workspace"}</h3>
        <p className="muted">
          {mode === "login"
            ? "Same email you used to sign up. Decks save to your Supabase workspace."
            : "For consulting, corp strat, and IR teams. Takes under a minute."}
        </p>
      </div>
      {!configured && (
        <p className="error">Supabase is not configured. Set the project URL and publishable key, then redeploy.</p>
      )}
      <form onSubmit={submit} className="auth-form">
        <label className="muted">Work email</label>
        <input className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" />
        <label className="muted">Password</label>
        <input className="field" type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} disabled={busy || !configured}>
          {busy ? "Working…" : mode === "login" ? "Log in" : "Create workspace"}
        </button>
      </form>
      {msg && (
        <p className={/fail|invalid|error/i.test(msg) ? "error" : "muted"} style={{ marginTop: 12 }}>
          {msg}
        </p>
      )}
      <p className="muted" style={{ marginTop: 16 }}>
        {mode === "login" ? (
          <>
            No workspace yet?{" "}
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
  );

  if (variant === "page") {
    return (
      <div className="auth-page">
        <div className="auth-side">
          <div className="mark">C</div>
          <h2>The exhibit layer for serious decks.</h2>
          <p>
            Drop a PPTX. Get Think-Cell-quality charts prefilled from the file — fonts and colors included — plus
            industry exhibits from the web.
          </p>
          <ul>
            <li>No spreadsheet rebuild on the first draft</li>
            <li>Native PowerPoint objects, not flattened images</li>
            <li>Team cloud save when you are logged in</li>
          </ul>
          {onClose && (
            <button className="btn btn-ghost" type="button" onClick={onClose}>
              ← Back to product
            </button>
          )}
        </div>
        {form}
      </div>
    );
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{mode === "login" ? "Welcome back" : "Create your workspace"}</h3>
          <button className="btn btn-sm" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        {form}
      </div>
    </div>
  );
}
