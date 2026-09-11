"use client";
import { useState } from "react";
import {
  Plus,
  Trash2,
  Paperclip,
  FileText,
  X,
  Repeat2,
  AlignLeft,
} from "lucide-react";
import Modal from "../ui/Modal";
import { useWorkspace } from "../../store/taskStore";
import { makeTask, PRIORITIES, COLORS, uid } from "../../lib/workspace";

export default function TaskForm({ task, onClose, defaults = {} }) {
  const { projects, addTask, updateTask, notify } = useWorkspace();
  const [draft, setDraft] = useState(() => makeTask(task || defaults));
  const [tags, setTags] = useState(draft.tags.join(", "));
  const [subtask, setSubtask] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const change = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  async function attach(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length + draft.attachments.length > 5) {
      setError("Up to five attachments per task.");
      return;
    }
    if (
      files.some(
        (f) =>
          f.size > 500000 ||
          ![
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
            "application/pdf",
            "text/plain",
          ].includes(f.type),
      )
    ) {
      setError("Choose an image, PDF, or text file under 500 KB.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const attachments = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({ id: uid(), name: file.name, data: reader.result });
              reader.onerror = reject;
              reader.readAsDataURL(file);
            }),
        ),
      );
      setDraft((d) => ({
        ...d,
        attachments: [...d.attachments, ...attachments],
      }));
    } catch {
      setError("Could not read that file. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  function submit(event) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    const list = [
      ...new Set(
        tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ];
    if (list.length > 20 || list.some((t) => t.length > 40)) {
      setError("Use up to 20 tags, each at most 40 characters.");
      return;
    }
    const values = { ...draft, title: draft.title.trim(), tags: list };
    if (task) updateTask(task.id, values);
    else addTask(values);
    onClose();
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={task ? "Task details" : "A little step forward"}
      description={
        task
          ? "Make space for the details."
          : "Capture it now. Make it happen in your own time."
      }
      wide
    >
      <form onSubmit={submit} className="task-form">
        <label className="field task-name">
          Task title
          <input
            autoFocus
            required
            maxLength={300}
            placeholder="What would you like to get done?"
            value={draft.title}
            onChange={(e) => change("title", e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            Project
            <select
              value={draft.projectId}
              onChange={(e) => change("projectId", e.target.value)}
            >
              <option value="">Inbox</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Priority
            <select
              value={draft.priority}
              onChange={(e) => change("priority", e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Due date
            <input
              type="date"
              value={draft.dueDate}
              onChange={(e) => change("dueDate", e.target.value)}
            />
          </label>
          <label className="field">
            Due time
            <input
              type="time"
              value={draft.dueTime}
              onChange={(e) => change("dueTime", e.target.value)}
            />
          </label>
          <label className="field">
            Repeat
            <select
              value={draft.recurrence}
              onChange={(e) => change("recurrence", e.target.value)}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Every day</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </select>
          </label>
          <label className="field">
            Tags, separated by commas
            <input
              placeholder="Design, Personal…"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </label>
        </div>
        {draft.recurrence !== "none" && (
          <p className="field-hint">
            <Repeat2 size={13} /> Set a due date. Completing this task creates
            the next occurrence.
          </p>
        )}
        <label className="field">
          <span>
            <AlignLeft size={14} /> Notes
          </span>
          <textarea
            rows={3}
            maxLength={20000}
            placeholder="Ideas, links, a little more context…"
            value={draft.description}
            onChange={(e) => change("description", e.target.value)}
          />
        </label>
        <div className="subtask-editor">
          <div className="section-label">
            Subtasks{" "}
            <span>
              {draft.subtasks.filter((s) => s.completed).length}/
              {draft.subtasks.length}
            </span>
          </div>
          {draft.subtasks.map((s) => (
            <div className="subtask-line" key={s.id}>
              <input
                type="checkbox"
                aria-label={`Complete subtask ${s.title}`}
                checked={s.completed}
                onChange={() =>
                  change(
                    "subtasks",
                    draft.subtasks.map((item) =>
                      item.id === s.id
                        ? { ...item, completed: !item.completed }
                        : item,
                    ),
                  )
                }
              />
              <span className={s.completed ? "strike" : ""}>{s.title}</span>
              <button
                className="icon-button"
                type="button"
                aria-label={`Remove subtask ${s.title}`}
                onClick={() =>
                  change(
                    "subtasks",
                    draft.subtasks.filter((item) => item.id !== s.id),
                  )
                }
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <div className="subtask-line">
            <Plus size={16} />
            <input
              aria-label="New subtask"
              placeholder="Break it into a smaller step"
              maxLength={300}
              value={subtask}
              onChange={(e) => setSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (subtask.trim() && draft.subtasks.length < 100) {
                    change("subtasks", [
                      ...draft.subtasks,
                      { id: uid(), title: subtask.trim(), completed: false },
                    ]);
                    setSubtask("");
                  }
                }
              }}
            />
            <button
              type="button"
              disabled={!subtask.trim() || draft.subtasks.length >= 100}
              onClick={() => {
                change("subtasks", [
                  ...draft.subtasks,
                  { id: uid(), title: subtask.trim(), completed: false },
                ]);
                setSubtask("");
              }}
            >
              Add
            </button>
          </div>
        </div>
        <div className="attachment-list">
          {draft.attachments.map((a) => (
            <div className="attachment" key={a.id}>
              {a.data.startsWith("data:image/") ? (
                <img src={a.data} alt={a.name} />
              ) : (
                <FileText size={24} />
              )}
              <a href={a.data} download={a.name}>
                {a.name}
              </a>
              <button
                type="button"
                aria-label={`Remove ${a.name}`}
                className="icon-button"
                onClick={() =>
                  change(
                    "attachments",
                    draft.attachments.filter((x) => x.id !== a.id),
                  )
                }
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="form-extras">
          <label className="attachment-button">
            <Paperclip size={15} />
            {loading ? "Reading files…" : "Attach a file"}
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain"
              onChange={attach}
              disabled={loading}
              className="sr-only"
            />
          </label>
          <div className="color-picker" aria-label="Task color label">
            {["", ...COLORS].map((color) => (
              <button
                type="button"
                key={color}
                style={{ background: color || "var(--line)" }}
                aria-label={color ? `Color ${color}` : "No color"}
                aria-pressed={draft.color === color}
                onClick={() => change("color", color)}
              />
            ))}
          </div>
          <label className="pin-option">
            <input
              type="checkbox"
              checked={draft.pinned}
              onChange={(e) => change("pinned", e.target.checked)}
            />{" "}
            Pin task
          </label>
        </div>
        <p className="field-hint">
          Attachments stay on this device. Images preview here; other files
          download locally.
        </p>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit" disabled={loading}>
            {task ? "Save changes" : "Create task"}
            <Plus size={15} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
