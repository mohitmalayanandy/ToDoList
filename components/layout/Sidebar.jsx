"use client";
import Link from "next/link";
import { useDroppable } from "@dnd-kit/core";
import {
  Inbox,
  Sun,
  CalendarDays,
  CalendarRange,
  AlertCircle,
  Pin,
  CheckCircle2,
  Archive,
  Plus,
  Settings2,
  ChevronDown,
  Sparkles,
  PanelLeftClose,
  Hash,
} from "lucide-react";
import { useWorkspace } from "../../store/taskStore";
import { filteredTasks } from "../../lib/workspace";
export const navigation = [
  ["inbox", "Inbox", Inbox, "/"],
  ["today", "Today", Sun, "/today"],
  ["tomorrow", "Tomorrow", CalendarDays, "/tomorrow"],
  ["upcoming", "Upcoming", CalendarRange, "/upcoming"],
  ["overdue", "Overdue", AlertCircle, "/overdue"],
  ["pinned", "Pinned", Pin, "/pinned"],
];
export const sectionHref = (s) =>
  navigation.find((n) => n[0] === s)?.[3] || `/${s}`;
function ProjectLink({ project, active, onClose }) {
  const { setNodeRef, isOver } = useDroppable({ id: `project:${project.id}` });
  return (
    <Link
      ref={setNodeRef}
      href={`/projects/${project.id}`}
      onClick={onClose}
      className={`nav-link ${active ? "active" : ""} ${isOver ? "drop-active" : ""}`}
    >
      <span className="project-dot" style={{ background: project.color }} />
      {project.name}
    </Link>
  );
}
export default function Sidebar({
  section,
  projectId,
  onNewProject,
  onTag,
  onClose,
}) {
  const { tasks, projects, settings, demo } = useWorkspace();
  const tags = [...new Set(tasks.flatMap((t) => t.tags))].slice(0, 8);
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-symbol">
          <CheckCircle2 size={22} />
        </span>
        daybook<span className="brand-dot">.</span>
        <button
          className="icon-button sidebar-close"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <PanelLeftClose size={18} />
        </button>
      </div>
      <div className="workspace-switch">
        <span className="workspace-avatar">
          {settings.name.slice(0, 1).toUpperCase() || "A"}
        </span>
        <span>
          {settings.name || "My"}’s workspace<small>Personal workspace</small>
        </span>
        <ChevronDown size={14} />
      </div>
      <div className="sidebar-scroll">
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(([key, label, Icon, href]) => (
            <Link
              key={key}
              href={href}
              onClick={onClose}
              className={`nav-link ${section === key ? "active" : ""}`}
            >
              <Icon size={17} />
              {label}
              <span className="nav-count">
                {filteredTasks(tasks, { section: key }).filter(
                  (t) => !t.completed,
                ).length || ""}
              </span>
            </Link>
          ))}
        </nav>
        <div className="nav-label with-action">
          PROJECTS
          <button aria-label="Create project" onClick={onNewProject}>
            <Plus size={14} />
          </button>
        </div>
        <nav aria-label="Projects">
          {projects.map((p) => (
            <ProjectLink
              key={p.id}
              project={p}
              active={projectId === p.id}
              onClose={onClose}
            />
          ))}
        </nav>
        <button className="nav-link new-list" onClick={onNewProject}>
          <Plus size={16} />
          New list
        </button>
        <div className="nav-label">TAGS</div>
        <div className="sidebar-tags">
          {tags.map((tag, i) => (
            <button
              key={tag}
              onClick={() => {
                onTag(tag);
                onClose?.();
              }}
            >
              <Hash
                size={13}
                style={{ color: ["#9b88dd", "#78a0d3", "#80a992"][i % 3] }}
              />
              {tag}
            </button>
          ))}
        </div>
        <div className="nav-divider" />
        <nav aria-label="History">
          {[
            ["completed", "Completed", CheckCircle2],
            ["archived", "Archived", Archive],
          ].map(([key, label, Icon]) => (
            <Link
              key={key}
              onClick={onClose}
              href={`/${key}`}
              className={`nav-link ${section === key ? "active" : ""}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="sidebar-bottom">
        <div className="personal-note">
          <Sparkles size={17} />
          <strong>A little better, every day.</strong>
          <p>Small steps. Meaningful progress.</p>
          {demo && <span className="demo-label">DEMO WORKSPACE</span>}
        </div>
        <Link
          href="/settings"
          onClick={onClose}
          className={`nav-link ${section === "settings" ? "active" : ""}`}
        >
          <Settings2 size={17} />
          Settings & preferences
        </Link>
        <div className="sidebar-foot">
          <i />
          All your space. All on your device.
        </div>
      </div>
    </aside>
  );
}
