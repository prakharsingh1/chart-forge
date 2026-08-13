import { useState } from "react";

export default function OnboardView({
  step,
  userEmail,
  apiKey,
  setApiKey,
  onSaveKey,
  savingKey,
  keyError,
  dragOver,
  setDragOver,
  onFiles,
  loading,
  loadMsg,
  error,
}) {
  return (
    <div className="onboard">
      <ol className="onboard-steps">
        <li className="done">1 Account</li>
        <li className={step === "key" ? "current" : "done"}>2 Gemini key</li>
        <li className={step === "upload" ? "current" : ""}>3 Upload</li>
        <li>4 Charts</li>
      </ol>

      {step === "key" && (
        <section className="onboard-card">
          <div className="eyebrow">Your key · not shared</div>
          <h2>Add your Gemini API key</h2>
          <p>
            ChartForge calls Gemini with <strong>your</strong> key. It is saved on your account only — other visitors never
            see it. Other model providers are not supported yet.
          </p>
          <p className="muted">{userEmail}</p>
          <label className="muted">Gemini API key</label>
          <input
            className="field"
            type="password"
            autoComplete="off"
            placeholder="AIza…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apiKey.trim() && onSaveKey()}
          />
          <p className="muted" style={{ marginTop: 8 }}>
            Create a key in{" "}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              Google AI Studio
            </a>
            . Paste it here once.
          </p>
          {keyError && <div className="error">{keyError}</div>}
          <button className="btn btn-primary" style={{ marginTop: 18 }} disabled={savingKey || !apiKey.trim()} onClick={onSaveKey}>
            {savingKey ? "Saving…" : "Save key and continue"}
          </button>
        </section>
      )}

      {step === "upload" && (
        <section className="onboard-card">
          <div className="eyebrow">Then we draft the exhibits</div>
          <h2>Upload a deck, files, or a folder</h2>
          <p>PowerPoint is best. Excel, CSV, or PDF also work. After this you land in charts.</p>
          <div
            className={`hero-drop ${dragOver ? "over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
            }}
          >
            <div className="hero-drop-mark">PPTX · files · folder</div>
            <strong>Drop files here</strong>
            <span>or use the buttons below</span>
          </div>
          <div className="hero-cta">
            <label className="btn btn-primary">
              Upload PowerPoint
              <input
                type="file"
                accept=".pptx,.pptm"
                hidden
                onChange={(e) => e.target.files?.length && onFiles(e.target.files)}
              />
            </label>
            <label className="btn">
              Files
              <input
                type="file"
                multiple
                accept=".pptx,.pptm,.csv,.tsv,.xlsx,.xls,.pdf,.txt,.md"
                hidden
                onChange={(e) => e.target.files?.length && onFiles(e.target.files)}
              />
            </label>
            <label className="btn btn-ghost">
              Folder
              <input
                type="file"
                multiple
                webkitdirectory=""
                directory=""
                hidden
                onChange={(e) => e.target.files?.length && onFiles(e.target.files)}
              />
            </label>
          </div>
          {loading && (
            <p className="muted" style={{ marginTop: 16 }}>
              <span className="spin" /> {loadMsg || "Reading…"}
            </p>
          )}
          {error && <div className="error">{error}</div>}
        </section>
      )}
    </div>
  );
}
