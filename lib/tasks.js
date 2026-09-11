export const STORAGE_KEY = "daybook.tasks.v1";
export const priorities = { high: 0, normal: 1, low: 2 };

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function validDate(value) {
  return (
    value === "" ||
    (typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value)
  );
}

export function parseTasks(raw) {
  if (raw === null) return [];
  const tasks = JSON.parse(raw);
  if (
    !Array.isArray(tasks) ||
    !tasks.every(
      (task) =>
        task &&
        typeof task.id === "string" &&
        task.id.length > 0 &&
        typeof task.title === "string" &&
        task.title.trim().length > 0 &&
        task.title.length <= 300 &&
        typeof task.completed === "boolean" &&
        Object.hasOwn(priorities, task.priority) &&
        validDate(task.dueDate) &&
        Number.isFinite(task.createdAt),
    ) ||
    new Set(tasks.map((task) => task.id)).size !== tasks.length
  ) {
    throw new Error("Invalid saved tasks");
  }
  return tasks;
}

export function selectTasks(tasks, filter, search, sort) {
  const query = search.trim().toLocaleLowerCase();
  return tasks
    .filter(
      (task) =>
        (filter === "all" || task.completed === (filter === "completed")) &&
        task.title.toLocaleLowerCase().includes(query),
    )
    .sort(
      (a, b) =>
        (sort === "priority"
          ? priorities[a.priority] - priorities[b.priority]
          : sort === "due"
            ? (a.dueDate || "9999").localeCompare(b.dueDate || "9999")
            : 0) || b.createdAt - a.createdAt,
    );
}
