import { useState } from "react";
import { useAuth } from "./useAuth.js";

export default function AuthScreen({ onClose, onSuccess, variant = "modal", initialMode = "signup" }) {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState(initialMode);
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
        return;
      }
      const { data, error } = await signUp(email, password);
      if (error) throw error;
      if (data?.session) {
        onSuccess?.();
        onClose?.();
        return;
      }
      const login = await signIn(email, password);
      if (login.error || !login.data?.session) {
        setMsg("Account created. If you cannot log in yet, turn off Confirm email in Supabase (Authentication → Providers → Email).");
        setMode("login");
        return;
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setMsg(err.message || "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  const form = (
    <div className="auth-panel">
      <div className="auth-panel-head">
        <h3>{mode === "login" ? "Log in" : "Create your account"}</h3>
        <p className="muted">
          {mode === "login"
            ? "Email and password. No invite needed."
            : "Any email works. No one has to approve or contact you first."}
        </p>
      </div>
      {!configured && (
        <p className="error">Supabase is not configured. Set the project URL and publishable key, then redeploy.</p>
      )}
      <form onSubmit={submit} className="auth-form">
        <label className="muted">Email</label>
        <input className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" />
        <label className="muted">Password</label>
        <input className="field" type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} disabled={busy || !configured}>
          {busy ? "Working…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
      {msg && (
        <p className={/fail|invalid|error|cannot/i.test(msg) ? "error" : "muted"} style={{ marginTop: 12 }}>
          {msg}
        </p>
      )}
      <p className="muted" style={{ marginTop: 16 }}>
        {mode === "login" ? (
          <>
            New here?{" "}
            <button type="button" className="linkish" onClick={() => setMode("signup")}>
              Create an account
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
          <h2>Create an account, add your key, upload the pack.</h2>
          <p>Then we draft the charts. Your Gemini key stays on your account.</p>
          <ul>
            <li>Sign up with any email and password</li>
            <li>Paste your Gemini API key (yours only)</li>
            <li>Upload PPTX, files, or a folder — then pick charts</li>
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
          <h3>{mode === "login" ? "Log in" : "Create your account"}</h3>
          <button className="btn btn-sm" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        {form}
      </div>
    </div>
  );
}
