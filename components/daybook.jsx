"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { motion, MotionConfig } from "framer-motion";
import {
  Search,
  Plus,
  Menu,
  Bell,
  Headphones,
  ChevronRight,
  LayoutList,
  Columns3,
  CalendarDays,
  SlidersHorizontal,
  ArrowDownUp,
  X,
  Check,
  Sun,
  Sparkles,
  ArrowUpRight,
  Inbox,
  Settings2,
  Archive,
  Trash2,
  Command,
  CheckCircle2,
  Hash,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useWorkspace } from "../store/taskStore";
import { dateKey, filteredTasks, COLORS } from "../lib/workspace";
import Sidebar from "./layout/Sidebar";
import CommandPalette from "./layout/CommandPalette";
import TaskForm from "./tasks/TaskForm";
import { TaskViews } from "./views/TaskViews";
import Overview from "./dashboard/Overview";
import FocusTimer from "./dashboard/FocusTimer";
import Settings from "./dashboard/Settings";
import Modal from "./ui/Modal";

const names = {
  inbox: "Inbox",
  today: "Today",
  tomorrow: "Tomorrow",
  upcoming: "Upcoming",
  overdue: "Overdue",
  pinned: "Pinned",
  completed: "Completed",
  archived: "Archived",
  settings: "Settings",
  all: "All tasks",
};
const subtitles = {
  today: "A fresh day. A little focus. A lot of possibility.",
  inbox: "A home for your thoughts, before they become plans.",
  tomorrow: "A little preparation for a lighter tomorrow.",
  upcoming: "See what’s ahead. Make room for what matters.",
  overdue: "No judgment. Just your next small step.",
  pinned: "Keep the important things close.",
  completed: "Take a moment to see how far you’ve come.",
  archived: "Out of the way. Here when you need them.",
  settings: "Make this little corner of the world your own.",
  all: "Your plans, all in one place.",
};

export default function Daybook({ children }) {
  const store = useWorkspace();
  const path = usePathname();
  const router = useRouter();
  const projectId = path.startsWith("/projects/")
    ? decodeURIComponent(path.split("/")[2])
    : "";
  const section = projectId ? "project" : path.slice(1) || "today";
  const project = store.projects.find((p) => p.id === projectId);
  const title = project?.name || names[section] || "Workspace";
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("manual");
  const [filters, setFilters] = useState(false);
  const [selected, setSelected] = useState([]);
  const [editor, setEditor] = useState(null);
  const [palette, setPalette] = useState(false);
  const [focus, setFocus] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [newProject, setNewProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState(COLORS[0]);
  const [reminders, setReminders] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [quick, setQuick] = useState("");
  const [now, setNow] = useState(null);
  const searchRef = useRef(null);
  const notified = useRef(new Set());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  useEffect(() => {
    store.hydrate();
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setSelected([]);
    setSearch("");
    setPriority("");
    setTag("");
    setStatus("");
    setDrawer(false);
  }, [path]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      (document.documentElement.dataset.theme =
        store.settings.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : store.settings.theme);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [store.settings.theme]);
  useEffect(() => {
    if (!store.toast || store.toast.removed) return;
    const timer = setTimeout(store.dismiss, 7000);
    return () => clearTimeout(timer);
  }, [store.toast]);
  useEffect(() => {
    const handler = (event) => {
      const typing =
        /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) ||
        event.target.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((p) => !p);
        return;
      }
      if (typing || editor || palette || newProject || shortcuts) return;
      if (event.key === "n") {
        event.preventDefault();
        openNew();
      }
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "?") {
        setShortcuts(true);
      }
      if (event.key === "Escape") {
        setSelected([]);
        setDrawer(false);
      }
      if (event.key === "f") {
        setFocus(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  useEffect(() => {
    if (!now || !store.settings.reminders) return;
    const due = store.tasks.filter(
      (t) =>
        !t.completed &&
        !t.archived &&
        t.dueDate &&
        t.dueTime &&
        new Date(`${t.dueDate}T${t.dueTime}`).getTime() <= now.getTime() &&
        new Date(`${t.dueDate}T${t.dueTime}`).getTime() >
          now.getTime() - 60000 &&
        !notified.current.has(`${t.id}:${t.dueDate}:${t.dueTime}`),
    );
    if (due.length) {
      due.forEach((t) =>
        notified.current.add(`${t.id}:${t.dueDate}:${t.dueTime}`),
      );
      store.notify(`Time for: ${due.map((t) => t.title).join(", ")}`);
    }
  }, [now, store.tasks, store.settings.reminders]);
  function defaults() {
    return {
      projectId: projectId || "",
      dueDate: ["today", "tomorrow"].includes(section)
        ? dateKey(addDays(new Date(), section === "tomorrow" ? 1 : 0))
        : "",
    };
  }
  function openNew(extra = {}) {
    setEditor({ defaults: { ...defaults(), ...extra } });
  }
  function select(id) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }
  const visible = filteredTasks(store.tasks, {
    section,
    projectId,
    search,
    priority,
    tag,
    status,
    sort,
  });
  const selectedVisible = selected.filter((id) =>
    visible.some((t) => t.id === id),
  );
  const tags = [...new Set(store.tasks.flatMap((t) => t.tags))];
  const dueTasks = store.tasks.filter(
    (t) => !t.completed && !t.archived && t.dueDate && t.dueDate <= dateKey(),
  );
  function dragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const target = String(over.id);
    if (target.startsWith("project:")) {
      store.updateTask(active.id, { projectId: target.slice(8) });
      store.notify("Task moved to project.");
    } else if (target.startsWith("status:")) {
      const next = target.slice(7);
      if (next === "done") store.completeTask(active.id, true);
      else
        store.updateTask(active.id, {
          status: next,
          completed: false,
          completedAt: null,
        });
    } else {
      const other = store.tasks.find((t) => t.id === over.id),
        task = store.tasks.find((t) => t.id === active.id);
      if (view === "board" && other && task && other.status !== task.status) {
        if (other.status === "done") store.completeTask(active.id, true);
        else
          store.updateTask(active.id, {
            status: other.status,
            completed: false,
            completedAt: null,
          });
      }
      store.reorder(active.id, over.id);
    }
  }
  const greeting = now
    ? now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 18
        ? "Good afternoon"
        : "Good evening"
    : "Welcome back";
  return (
    <MotionConfig reducedMotion="user">
      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          const hits = pointerWithin(args);
          return hits.length ? hits : rectIntersection(args);
        }}
        onDragEnd={dragEnd}
      >
        <div className="app-shell">
          <div className="desktop-sidebar">
            <Sidebar
              section={section}
              projectId={projectId}
              onNewProject={() => setNewProject(true)}
              onTag={(value) => {
                setTag(value);
                setFilters(true);
              }}
            />
          </div>
          <Modal
            open={drawer}
            onClose={() => setDrawer(false)}
            title="Your workspace"
          >
            <Sidebar
              section={section}
              projectId={projectId}
              onNewProject={() => {
                setDrawer(false);
                setNewProject(true);
              }}
              onTag={(value) => {
                setTag(value);
                setFilters(true);
              }}
              onClose={() => setDrawer(false)}
            />
          </Modal>
          <div className="main-shell">
            <header className="topbar">
              <button
                className="icon-button mobile-menu"
                aria-label="Open navigation"
                onClick={() => setDrawer(true)}
              >
                <Menu size={20} />
              </button>
              <div className="breadcrumb">
                <span>My workspace</span>
                <ChevronRight size={13} />
                <strong>{title}</strong>
              </div>
              <button
                className="global-search"
                onClick={() => setPalette(true)}
              >
                <Search size={15} />
                <span>Search anything...</span>
                <kbd>⌘ K</kbd>
              </button>
              <div className="topbar-actions">
                <button
                  className="focus-trigger"
                  onClick={() => setFocus(true)}
                >
                  <Headphones size={16} />
                  <span>Focus</span>
                </button>
                <span className="topbar-divider" />
                <button
                  className="icon-button notification-trigger"
                  aria-label="Open reminders"
                  onClick={() => setReminders(true)}
                >
                  <Bell size={18} />
                  {dueTasks.length > 0 && <i />}
                </button>
                <Link
                  className="profile-avatar"
                  href="/settings"
                  aria-label="Profile settings"
                >
                  {store.settings.name.slice(0, 1).toUpperCase() || "A"}
                </Link>
              </div>
            </header>
            <main className="main-content">
              {children}
              {store.storageError && (
                <div role="alert" className="storage-warning">
                  {store.storageError}
                  <Link href="/settings">
                    Export backup <ArrowUpRight size={13} />
                  </Link>
                </div>
              )}
              <div className="page-heading">
                <div>
                  <div className="date-eyebrow">
                    <span className="eyebrow-line" />
                    {now
                      ? format(now, "EEEE, MMMM d, yyyy")
                      : "YOUR DAILY SPACE"}
                  </div>
                  <h1>
                    {section === "today" ? (
                      <>
                        {greeting}, {store.settings.name || "friend"}{" "}
                        <span className="greeting-sun">✳</span>
                      </>
                    ) : (
                      title
                    )}
                  </h1>
                  <p>
                    {project
                      ? "A place for the plans that move you forward."
                      : subtitles[section]}
                  </p>
                </div>
                {section !== "settings" && (
                  <button
                    disabled={!store.ready}
                    className="button primary add-top"
                    onClick={() => openNew()}
                  >
                    <Plus size={17} />
                    Create task<kbd>N</kbd>
                  </button>
                )}
              </div>
              {!store.ready ? (
                <div
                  className="skeleton-layout"
                  aria-label="Loading workspace"
                  role="status"
                >
                  <div />
                  <div />
                  <div />
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="skeleton-row" />
                  ))}
                </div>
              ) : section === "settings" ? (
                <Settings />
              ) : (
                <>
                  {section === "today" && <Overview tasks={store.tasks} />}
                  <section className="tasks-section">
                    <div className="section-heading">
                      <div>
                        <h2>
                          {section === "today" ? "Today’s plan" : title}
                          <span className="count-badge">{visible.length}</span>
                        </h2>
                        <p>
                          {section === "today"
                            ? "Make it a day that feels good."
                            : `${visible.length} tasks · ${visible.filter((t) => t.completed).length} completed`}
                        </p>
                      </div>
                      <div
                        className="view-toggle"
                        role="group"
                        aria-label="Task view"
                      >
                        {[
                          ["list", LayoutList, "List"],
                          ["board", Columns3, "Board"],
                          ["calendar", CalendarDays, "Calendar"],
                        ].map(([value, Icon, label]) => (
                          <button
                            key={value}
                            aria-pressed={view === value}
                            onClick={() => setView(value)}
                          >
                            <Icon size={15} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="task-toolbar">
                      <div className="task-filter-tabs">
                        <button
                          className={!status ? "active" : ""}
                          onClick={() => setStatus("")}
                        >
                          All tasks{" "}
                          <span>
                            {
                              filteredTasks(store.tasks, { section, projectId })
                                .length
                            }
                          </span>
                        </button>
                        <button
                          className={status === "todo" ? "active" : ""}
                          onClick={() => setStatus("todo")}
                        >
                          To do
                        </button>
                        <button
                          className={status === "doing" ? "active" : ""}
                          onClick={() => setStatus("doing")}
                        >
                          In progress
                        </button>
                        <button
                          className={status === "done" ? "active" : ""}
                          onClick={() => setStatus("done")}
                        >
                          Done
                        </button>
                      </div>
                      <div className="toolbar-controls">
                        <label className="inline-search">
                          <Search size={14} />
                          <input
                            ref={searchRef}
                            aria-label="Search tasks"
                            placeholder="Search tasks"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </label>
                        <button
                          className={`button small ${filters ? "pressed" : ""}`}
                          onClick={() => setFilters(!filters)}
                        >
                          <SlidersHorizontal size={14} />
                          Filter
                          {(priority || tag) && <i className="active-dot" />}
                        </button>
                        <label className="sort-select">
                          <ArrowDownUp size={14} />
                          <select
                            aria-label="Sort tasks"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                          >
                            <option value="manual">Manual</option>
                            <option value="date">Due date</option>
                            <option value="priority">Priority</option>
                            <option value="name">Name</option>
                            <option value="created">Newest</option>
                          </select>
                        </label>
                      </div>
                    </div>
                    {filters && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="filter-panel"
                      >
                        <label>
                          Priority
                          <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                          >
                            <option value="">All priorities</option>
                            {["urgent", "high", "medium", "low"].map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Tag
                          <select
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                          >
                            <option value="">All tags</option>
                            {tags.map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                        </label>
                        <span>Search with #tag or !priority</span>
                        <button
                          onClick={() => {
                            setPriority("");
                            setTag("");
                            setStatus("");
                            setSearch("");
                          }}
                        >
                          Clear filters
                        </button>
                      </motion.div>
                    )}
                    {selectedVisible.length > 0 && (
                      <div className="bulk-toolbar">
                        <label>
                          <input
                            type="checkbox"
                            aria-label="Select all visible tasks"
                            checked={selectedVisible.length === visible.length}
                            onChange={() =>
                              setSelected(
                                selectedVisible.length === visible.length
                                  ? []
                                  : visible.map((t) => t.id),
                              )
                            }
                          />
                          {selectedVisible.length} selected
                        </label>
                        <button
                          onClick={() => {
                            selectedVisible.forEach((id) =>
                              store.completeTask(id, true),
                            );
                            setSelected([]);
                          }}
                        >
                          <Check size={14} />
                          Complete
                        </button>
                        <select
                          aria-label="Move selected to project"
                          value=""
                          onChange={(e) => {
                            store.bulk(selectedVisible, {
                              projectId:
                                e.target.value === "inbox"
                                  ? ""
                                  : e.target.value,
                            });
                            setSelected([]);
                          }}
                        >
                          <option value="" disabled>
                            Move to…
                          </option>
                          <option value="inbox">Inbox</option>
                          {store.projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            store.bulk(selectedVisible, {
                              archived: section !== "archived",
                            });
                            setSelected([]);
                          }}
                        >
                          <Archive size={14} />
                          {section === "archived" ? "Restore" : "Archive"}
                        </button>
                        <button
                          onClick={() => {
                            store.deleteTasks(selectedVisible);
                            setSelected([]);
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                        <button
                          className="icon-button"
                          aria-label="Clear selection"
                          onClick={() => setSelected([])}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {view === "list" && visible.length > 0 && (
                      <div className="list-caption">
                        <span>
                          <input
                            type="checkbox"
                            aria-label="Select all tasks"
                            checked={selectedVisible.length === visible.length}
                            onChange={() =>
                              setSelected(
                                selectedVisible.length === visible.length
                                  ? []
                                  : visible.map((t) => t.id),
                              )
                            }
                          />
                          TASK
                        </span>
                        <span>
                          PRIORITY <i /> DUE
                        </span>
                      </div>
                    )}
                    <TaskViews
                      view={view}
                      tasks={visible}
                      onEdit={(task) => setEditor({ task })}
                      selected={selectedVisible}
                      onSelect={select}
                      sort={sort}
                      onAdd={openNew}
                    />
                    {!visible.length && view === "list" && (
                      <div className="empty-state">
                        <span>
                          <CheckCircle2 size={28} />
                        </span>
                        <h3>
                          {search || priority || tag
                            ? "A little too specific?"
                            : "A little breathing room."}
                        </h3>
                        <p>
                          {search || priority || tag
                            ? "Try another search or clear your filters."
                            : "No tasks here yet. Start with one small thing."}
                        </p>
                        <button className="button" onClick={() => openNew()}>
                          <Plus size={15} />
                          Add a task
                        </button>
                      </div>
                    )}
                    {view === "list" && (
                      <form
                        className="quick-add"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (quick.trim()) {
                            store.addTask({
                              ...defaults(),
                              title: quick.trim(),
                            });
                            setQuick("");
                          }
                        }}
                      >
                        <Plus size={17} />
                        <input
                          maxLength={300}
                          aria-label="Quick add task"
                          placeholder="Add a task…"
                          value={quick}
                          onChange={(e) => setQuick(e.target.value)}
                        />
                        {quick ? (
                          <button className="button small" type="submit">
                            Add ↵
                          </button>
                        ) : (
                          <kbd>↵</kbd>
                        )}
                      </form>
                    )}
                    <div className="list-bottom">
                      <span>
                        {visible.filter((t) => !t.completed).length} tasks
                        remaining
                      </span>
                      <span>
                        {sort === "manual"
                          ? "Drag the handle to reorder · Drop on a project to move"
                          : "Choose Manual to reorder tasks"}
                      </span>
                    </div>
                  </section>
                  {section === "today" && (
                    <div className="daily-note">
                      <div className="daily-note-icon">
                        <Sparkles size={19} />
                      </div>
                      <div>
                        <span>A GENTLE REMINDER</span>
                        <p>
                          You don’t have to do it all. Just the next right
                          thing.
                        </p>
                      </div>
                      <span className="note-doodle">✧</span>
                    </div>
                  )}
                </>
              )}
              <footer className="page-footer">
                <span>
                  <span className="saved-dot" />
                  {store.storageError
                    ? "Unsaved changes"
                    : store.demo
                      ? "Demo workspace · Saved locally"
                      : "Your workspace · Saved locally"}
                </span>
                <button onClick={() => setShortcuts(true)}>
                  <Command size={12} />
                  Keyboard shortcuts
                </button>
              </footer>
            </main>
          </div>
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <Link href="/inbox" className={section === "inbox" ? "active" : ""}>
              <Inbox size={19} />
              Inbox
            </Link>
            <Link href="/today" className={section === "today" ? "active" : ""}>
              <Sun size={19} />
              Today
            </Link>
            <button
              className="floating-add"
              aria-label="Create task"
              onClick={() => openNew()}
            >
              <Plus size={24} />
            </button>
            <Link
              href="/upcoming"
              className={section === "upcoming" ? "active" : ""}
            >
              <CalendarDays size={19} />
              Upcoming
            </Link>
            <button onClick={() => setDrawer(true)}>
              <Menu size={19} />
              More
            </button>
          </nav>
          {editor && (
            <TaskForm
              key={editor.task?.id || "new"}
              task={editor.task}
              defaults={editor.defaults}
              onClose={() => setEditor(null)}
            />
          )}
          {palette && (
            <CommandPalette
              onClose={() => setPalette(false)}
              onAdd={() => openNew()}
              onEdit={(task) => setEditor({ task })}
              onFocus={() => setFocus(true)}
            />
          )}
          {store.ready && (
            <FocusTimer open={focus} onClose={() => setFocus(false)} />
          )}
          {newProject && (
            <Modal
              open
              onClose={() => setNewProject(false)}
              title="A space for your next idea"
              description="Give your new project a name and a little color."
            >
              <form
                className="project-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (projectName.trim()) {
                    const id = store.addProject(projectName, projectColor);
                    setProjectName("");
                    setNewProject(false);
                    router.push(`/projects/${id}`);
                  }
                }}
              >
                <label className="field">
                  Project name
                  <input
                    autoFocus
                    required
                    maxLength={60}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Something worth working on"
                  />
                </label>
                <div className="color-picker">
                  {COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      aria-label={`Project color ${c}`}
                      aria-pressed={projectColor === c}
                      style={{ background: c }}
                      onClick={() => setProjectColor(c)}
                    />
                  ))}
                </div>
                <div className="modal-footer">
                  <button className="button primary" type="submit">
                    <Plus size={15} />
                    Create project
                  </button>
                </div>
              </form>
            </Modal>
          )}
          {reminders && (
            <Modal
              open
              onClose={() => setReminders(false)}
              title="A little heads-up"
              description="Tasks due today or earlier. Reminders appear in-app while this tab is open."
            >
              <div className="reminder-list">
                {dueTasks.length ? (
                  dueTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setReminders(false);
                        setEditor({ task: t });
                      }}
                    >
                      <span className={`priority-dot ${t.priority}`} />
                      <span>
                        {t.title}
                        <small>
                          {t.dueDate} {t.dueTime}
                        </small>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))
                ) : (
                  <div className="empty-state">
                    <CheckCircle2 size={25} />
                    <p>You’re all caught up.</p>
                  </div>
                )}
              </div>
            </Modal>
          )}
          {shortcuts && (
            <Modal
              open
              onClose={() => setShortcuts(false)}
              title="A few helpful shortcuts"
            >
              <div className="shortcut-list">
                {[
                  ["⌘ / Ctrl K", "Open command palette"],
                  ["N", "Create a task"],
                  ["/", "Search tasks"],
                  ["F", "Open focus timer"],
                  ["?", "Show keyboard shortcuts"],
                  ["Esc", "Close dialog or clear selection"],
                  ["Space + arrows", "Move a focused drag handle"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <span>{label}</span>
                    <kbd>{key}</kbd>
                  </div>
                ))}
              </div>
            </Modal>
          )}
          {store.toast && (
            <div className="toast" role="status">
              <CheckCircle2 size={17} />
              <span>{store.toast.message}</span>
              {store.toast.removed && (
                <button onClick={store.undo}>Undo</button>
              )}
              <button
                className="icon-button"
                aria-label="Dismiss notification"
                onClick={store.dismiss}
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      </DndContext>
    </MotionConfig>
  );
}
