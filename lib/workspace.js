import {
  addDays,
  addWeeks,
  addMonths,
  format,
  parseISO,
  isValid,
  startOfDay,
  differenceInCalendarDays,
} from "date-fns";

export const KEY = "daybook.workspace.v2";
export const PRIORITIES = ["urgent", "high", "medium", "low"];
export const COLORS = ["#7c6ae6", "#dd9462", "#60a38c", "#6999d5", "#d7759e"];
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const dateKey = (date = new Date()) => format(date, "yyyy-MM-dd");
export const initialProjects = [
  { id: "personal", name: "Personal", color: COLORS[0] },
  { id: "work", name: "Work", color: COLORS[1] },
  { id: "learning", name: "Learning", color: COLORS[2] },
];
export const initialSettings = {
  theme: "system",
  name: "Alex",
  focusMinutes: 25,
  reminders: true,
};

export function makeTask(values = {}) {
  return {
    id: uid(),
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    dueTime: "",
    recurrence: "none",
    projectId: "",
    tags: [],
    color: "",
    status: "todo",
    completed: false,
    completedAt: null,
    archived: false,
    pinned: false,
    subtasks: [],
    attachments: [],
    createdAt: Date.now(),
    ...values,
  };
}
export function nextRecurring(task) {
  if (!task.dueDate || task.recurrence === "none") return null;
  const date = parseISO(task.dueDate);
  const next =
    task.recurrence === "daily"
      ? addDays(date, 1)
      : task.recurrence === "weekly"
        ? addWeeks(date, 1)
        : addMonths(date, 1);
  return makeTask({
    ...task,
    id: uid(),
    dueDate: dateKey(next),
    status: "todo",
    completed: false,
    completedAt: null,
    createdAt: Date.now(),
    subtasks: task.subtasks.map((s) => ({ ...s, id: uid(), completed: false })),
  });
}
export function demoWorkspace() {
  const today = dateKey();
  const tasks = [
    {
      title: "Design the next chapter of Daybook",
      projectId: "work",
      priority: "high",
      tags: ["Design"],
      dueDate: today,
      dueTime: "10:30",
      pinned: true,
      status: "doing",
      description:
        "A calmer workspace for our most meaningful work. Explore the dashboard, refine the details, and make it feel effortless.",
      subtasks: [
        { id: uid(), title: "Explore visual direction", completed: true },
        { id: uid(), title: "Build the component library", completed: true },
        { id: uid(), title: "Polish mobile interactions", completed: false },
      ],
    },
    {
      title: "A little reading, a new perspective",
      projectId: "personal",
      priority: "low",
      tags: ["Personal"],
      dueDate: today,
      dueTime: "12:00",
      recurrence: "daily",
    },
    {
      title: "Review the website launch checklist",
      projectId: "work",
      priority: "urgent",
      tags: ["Development"],
      dueDate: today,
      dueTime: "14:00",
    },
    {
      title: "Make time for a 30-minute walk",
      projectId: "personal",
      priority: "medium",
      tags: ["Wellness"],
      dueDate: today,
      dueTime: "17:30",
      recurrence: "daily",
    },
    {
      title: "Finish the React patterns chapter",
      projectId: "learning",
      priority: "medium",
      tags: ["Development"],
      dueDate: today,
      dueTime: "18:00",
      status: "doing",
    },
    {
      title: "Plan a slow weekend",
      projectId: "personal",
      priority: "low",
      dueDate: dateKey(addDays(new Date(), 1)),
      tags: ["Personal"],
    },
    {
      title: "Collect inspiration for the portfolio",
      projectId: "work",
      priority: "medium",
      dueDate: dateKey(addDays(new Date(), 3)),
      tags: ["Design"],
    },
    {
      title: "Send the project proposal",
      projectId: "work",
      priority: "high",
      dueDate: dateKey(addDays(new Date(), -1)),
    },
    {
      title: "Write down three things that went well",
      projectId: "personal",
      dueDate: today,
      completed: true,
      status: "done",
      completedAt: Date.now(),
      tags: ["Wellness"],
    },
    {
      title: "Clear the inbox",
      dueDate: today,
      completed: true,
      status: "done",
      completedAt: Date.now(),
    },
    {
      title: "Set intentions for the week",
      projectId: "personal",
      dueDate: today,
      completed: true,
      status: "done",
      completedAt: Date.now(),
    },
  ].map(makeTask);
  for (let day = 1; day < 7; day++)
    for (let i = 0; i < (day % 3) + 2; i++)
      tasks.push(
        makeTask({
          title: [
            "Review daily notes",
            "Practice something new",
            "Take a mindful break",
            "Organize the workspace",
          ][i],
          projectId: "personal",
          completed: true,
          status: "done",
          archived: true,
          completedAt: addDays(new Date(), -day).getTime(),
        }),
      );
  return {
    tasks,
    projects: initialProjects,
    settings: initialSettings,
    demo: true,
  };
}
const isDate = (value) =>
  typeof value === "string" &&
  (value === "" ||
    (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
      isValid(parseISO(value)) &&
      dateKey(parseISO(value)) === value));
export function validateWorkspace(data) {
  if (
    !data ||
    !Array.isArray(data.tasks) ||
    !Array.isArray(data.projects) ||
    data.tasks.length > 10000 ||
    data.projects.length > 200
  )
    throw Error("Invalid workspace file.");
  const projectIds = new Set();
  const projects = data.projects.map((p) => {
    if (
      !p ||
      typeof p.id !== "string" ||
      !p.id ||
      projectIds.has(p.id) ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      p.name.length > 60 ||
      !/^#[0-9a-f]{6}$/i.test(p.color)
    )
      throw Error("Invalid project data.");
    projectIds.add(p.id);
    return { id: p.id, name: p.name, color: p.color };
  });
  const ids = new Set();
  const tasks = data.tasks.map((t) => {
    if (
      !t ||
      typeof t.id !== "string" ||
      !t.id ||
      ids.has(t.id) ||
      typeof t.title !== "string" ||
      !t.title.trim() ||
      t.title.length > 300 ||
      !PRIORITIES.includes(t.priority) ||
      !isDate(t.dueDate) ||
      typeof t.completed !== "boolean" ||
      !Number.isFinite(t.createdAt)
    )
      throw Error("Invalid task data.");
    ids.add(t.id);
    const task = makeTask(t);
    if (
      !["todo", "doing", "done"].includes(task.status) ||
      !["none", "daily", "weekly", "monthly"].includes(task.recurrence) ||
      typeof task.description !== "string" ||
      task.description.length > 20000 ||
      !/^$|^([01]\d|2[0-3]):[0-5]\d$/.test(task.dueTime) ||
      (task.color && !/^#[0-9a-f]{6}$/i.test(task.color)) ||
      typeof task.archived !== "boolean" ||
      typeof task.pinned !== "boolean" ||
      (task.completedAt !== null && !Number.isFinite(task.completedAt))
    )
      throw Error("Invalid task details.");
    if (
      !Array.isArray(task.tags) ||
      task.tags.length > 20 ||
      !task.tags.every(
        (tag) => typeof tag === "string" && tag.length > 0 && tag.length <= 40,
      )
    )
      throw Error("Invalid tags.");
    if (
      !Array.isArray(task.subtasks) ||
      task.subtasks.length > 100 ||
      !task.subtasks.every(
        (s) =>
          s &&
          typeof s.id === "string" &&
          typeof s.title === "string" &&
          s.title.trim() &&
          s.title.length <= 300 &&
          typeof s.completed === "boolean",
      ) ||
      new Set(task.subtasks.map((s) => s.id)).size !== task.subtasks.length
    )
      throw Error("Invalid subtasks.");
    if (
      !Array.isArray(task.attachments) ||
      task.attachments.length > 5 ||
      !task.attachments.every(
        (a) =>
          a &&
          typeof a.id === "string" &&
          typeof a.name === "string" &&
          a.name.length <= 255 &&
          typeof a.data === "string" &&
          a.data.length <= 700000 &&
          /^data:(image\/(png|jpeg|webp|gif)|application\/pdf|text\/plain);base64,[A-Za-z0-9+/=]*$/.test(
            a.data,
          ),
      )
    )
      throw Error("Invalid attachments.");
    task.projectId = projectIds.has(task.projectId) ? task.projectId : "";
    task.status = task.completed
      ? "done"
      : task.status === "done"
        ? "todo"
        : task.status;
    return task;
  });
  const settings = { ...initialSettings };
  if (data.settings) {
    if (["light", "dark", "system"].includes(data.settings.theme))
      settings.theme = data.settings.theme;
    if (typeof data.settings.name === "string")
      settings.name = data.settings.name.slice(0, 50);
    if (
      Number.isInteger(data.settings.focusMinutes) &&
      data.settings.focusMinutes >= 1 &&
      data.settings.focusMinutes <= 120
    )
      settings.focusMinutes = data.settings.focusMinutes;
    if (typeof data.settings.reminders === "boolean")
      settings.reminders = data.settings.reminders;
  }
  return { tasks, projects, settings, demo: data.demo === true };
}
export function migrateLegacy(raw) {
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) throw Error("Invalid legacy tasks.");
  return validateWorkspace({
    tasks: items.map((t) =>
      makeTask({
        ...t,
        priority: t.priority === "normal" ? "medium" : t.priority,
        status: t.completed ? "done" : "todo",
      }),
    ),
    projects: initialProjects,
    settings: initialSettings,
  });
}
export function filteredTasks(
  tasks,
  {
    section = "today",
    projectId = "",
    search = "",
    priority = "",
    tag = "",
    status = "",
    sort = "manual",
    day = "",
  } = {},
) {
  const today = dateKey(),
    tomorrow = dateKey(addDays(new Date(), 1));
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let result = tasks.filter((t) => {
    if (section === "archived" ? !t.archived : t.archived) return false;
    if (section === "completed" && !t.completed) return false;
    if (section === "inbox" && (t.projectId || t.completed)) return false;
    if (section === "today" && t.dueDate !== today) return false;
    if (section === "tomorrow" && t.dueDate !== tomorrow) return false;
    if (
      section === "upcoming" &&
      (!t.dueDate || t.dueDate <= today || t.completed)
    )
      return false;
    if (
      section === "overdue" &&
      (!t.dueDate || t.dueDate >= today || t.completed)
    )
      return false;
    if (section === "pinned" && !t.pinned) return false;
    if (section === "project" && t.projectId !== projectId) return false;
    if (
      (priority && t.priority !== priority) ||
      (tag && !t.tags.includes(tag)) ||
      (status && t.status !== status) ||
      (day && t.dueDate !== day)
    )
      return false;
    return terms.every((term) =>
      term.startsWith("#")
        ? t.tags.some((tag) => tag.toLowerCase().includes(term.slice(1)))
        : term.startsWith("!")
          ? t.priority.startsWith(term.slice(1))
          : `${t.title} ${t.description} ${t.tags.join(" ")}`
              .toLowerCase()
              .includes(term),
    );
  });
  if (sort !== "manual")
    result.sort((a, b) =>
      sort === "priority"
        ? PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority)
        : sort === "name"
          ? a.title.localeCompare(b.title)
          : sort === "created"
            ? b.createdAt - a.createdAt
            : `${a.dueDate || "9999"}${a.dueTime}`.localeCompare(
                `${b.dueDate || "9999"}${b.dueTime}`,
              ),
    );
  return result;
}
export function statistics(tasks) {
  const today = dateKey();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i - 6);
    return {
      label: format(date, "EEE"),
      date: dateKey(date),
      count: tasks.filter(
        (t) =>
          t.completedAt && dateKey(new Date(t.completedAt)) === dateKey(date),
      ).length,
    };
  });
  const completeDays = new Set(
    tasks
      .filter((t) => t.completedAt)
      .map((t) => dateKey(new Date(t.completedAt))),
  );
  let streak = 0,
    cursor = completeDays.has(today) ? new Date() : addDays(new Date(), -1);
  while (completeDays.has(dateKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  const daily = tasks.filter((t) => !t.archived && t.dueDate === today);
  return {
    days,
    streak,
    completed: daily.filter((t) => t.completed).length,
    total: daily.length,
    week: days.reduce((sum, d) => sum + d.count, 0),
  };
}
