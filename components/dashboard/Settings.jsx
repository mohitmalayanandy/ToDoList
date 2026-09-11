"use client";
import { useRef, useState } from "react";
import {
  Download,
  Upload,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useWorkspace } from "../../store/taskStore";
import Modal from "../ui/Modal";
export default function Settings() {
  const store = useWorkspace();
  const input = useRef(null);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 2,
            tasks: store.tasks,
            projects: store.projects,
            settings: store.settings,
            demo: store.demo,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daybook-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function read(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 20000000) {
      setError("Choose a JSON backup smaller than 20 MB.");
      return;
    }
    try {
      const data = JSON.parse(await file.text());
      const { validateWorkspace } = await import("../../lib/workspace");
      setPending({ type: "import", data: validateWorkspace(data) });
      setError("");
    } catch {
      setError(
        "This is not a valid Daybook workspace backup. No data was changed.",
      );
    }
  }
  return (
    <div className="settings-grid">
      <section className="settings-card">
        <h2>Your space, your way</h2>
        <p>The details that make Daybook feel like you.</p>
        <label className="field">
          Your name
          <input
            maxLength={50}
            value={store.settings.name}
            onChange={(e) => store.updateSettings({ name: e.target.value })}
          />
        </label>
        <label className="field">
          Focus session length
          <select
            value={store.settings.focusMinutes}
            onChange={(e) =>
              store.updateSettings({ focusMinutes: Number(e.target.value) })
            }
          >
            {[15, 25, 45, 60].map((n) => (
              <option key={n} value={n}>
                {n} minutes
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          Appearance
          <div className="theme-options">
            {[
              ["light", Sun],
              ["dark", Moon],
              ["system", Monitor],
            ].map(([theme, Icon]) => (
              <button
                key={theme}
                aria-pressed={store.settings.theme === theme}
                onClick={() => store.updateSettings({ theme })}
              >
                <Icon size={22} />
                {theme}
              </button>
            ))}
          </div>
        </div>
        <label className="setting-toggle">
          <span>
            In-app reminders
            <small>
              Show tasks when their due time arrives while this tab is open.
            </small>
          </span>
          <input
            type="checkbox"
            checked={store.settings.reminders}
            onChange={(e) =>
              store.updateSettings({ reminders: e.target.checked })
            }
          />
        </label>
      </section>
      <section className="settings-card">
        <h2>A workspace you own</h2>
        <p>
          <ShieldCheck size={15} /> Your data stays in this browser. No account
          needed.
        </p>
        <div className="settings-action">
          <div>
            <h3>Export your workspace</h3>
            <p>Tasks, projects, notes, and local attachments.</p>
          </div>
          <button className="button" onClick={exportData}>
            <Download size={16} />
            Export JSON
          </button>
        </div>
        <div className="settings-action">
          <div>
            <h3>Import a backup</h3>
            <p>Replace this workspace with a Daybook JSON export.</p>
          </div>
          <button className="button" onClick={() => input.current.click()}>
            <Upload size={16} />
            Import JSON
          </button>
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={read}
          />
        </div>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="settings-action">
          <div>
            <h3>Reset the demo</h3>
            <p>Replace your tasks with a fresh sample workspace.</p>
          </div>
          <button
            className="button"
            onClick={() => setPending({ type: "reset" })}
          >
            <RotateCcw size={16} />
            Reset demo
          </button>
        </div>
        <div className="privacy-note">
          Local storage is specific to this browser and website address. Export
          regularly to keep a backup. Clearing browser data removes this
          workspace. Attachments share the browser’s storage limit.
        </div>
      </section>
      {pending && (
        <Modal
          open
          onClose={() => setPending(null)}
          title={
            pending.type === "import"
              ? "Replace this workspace?"
              : "Start fresh with demo data?"
          }
          description="This replaces all current tasks, projects, and preferences. Export a backup first if you want to keep them."
        >
          <div className="modal-footer">
            <button className="button" onClick={exportData}>
              <Download size={15} />
              Export current data
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (pending.type === "import") store.importData(pending.data);
                else store.resetDemo();
                setPending(null);
              }}
            >
              Replace workspace
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
