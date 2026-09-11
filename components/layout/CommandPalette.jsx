"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Sun,
  CalendarRange,
  Settings2,
  Headphones,
  FileText,
} from "lucide-react";
import Modal from "../ui/Modal";
import { useWorkspace } from "../../store/taskStore";
export default function CommandPalette({ onClose, onAdd, onEdit, onFocus }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { tasks } = useWorkspace();
  const [index, setIndex] = useState(0);
  const commands = [
    { label: "Create a task", icon: Plus, action: onAdd },
    { label: "Go to Today", icon: Sun, action: () => router.push("/today") },
    {
      label: "Go to Upcoming",
      icon: CalendarRange,
      action: () => router.push("/upcoming"),
    },
    { label: "Start a focus session", icon: Headphones, action: onFocus },
    {
      label: "Open settings",
      icon: Settings2,
      action: () => router.push("/settings"),
    },
    ...tasks
      .filter((t) => !t.archived)
      .map((t) => ({
        label: t.title,
        icon: FileText,
        action: () => onEdit(t),
      })),
  ]
    .filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10);
  function run(command) {
    onClose();
    command.action();
  }
  return (
    <Modal open onClose={onClose} title="Find your next step">
      <div className="command-search">
        <Search size={19} />
        <input
          autoFocus
          role="combobox"
          aria-label="Search commands and tasks"
          aria-expanded="true"
          aria-controls="command-results"
          aria-activedescendant={
            commands[index] ? `command-${index}` : undefined
          }
          placeholder="Search tasks or type a command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(i + 1, commands.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(0, i - 1));
            }
            if (e.key === "Enter" && commands[index]) {
              e.preventDefault();
              run(commands[index]);
            }
          }}
        />
      </div>
      <div role="listbox" id="command-results" className="command-results">
        {commands.map((c, i) => (
          <button
            role="option"
            aria-selected={i === index}
            id={`command-${i}`}
            key={`${c.label}-${i}`}
            onMouseEnter={() => setIndex(i)}
            onClick={() => run(c)}
          >
            <c.icon size={17} />
            {c.label}
            <span>↵</span>
          </button>
        ))}
        {!commands.length && <p>No matching tasks or commands.</p>}
      </div>
      <div className="command-hints">
        <span>↑ ↓ to navigate</span>
        <span>↵ to select</span>
        <span>esc to close</span>
      </div>
    </Modal>
  );
}
