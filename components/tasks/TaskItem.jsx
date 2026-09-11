"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  GripVertical,
  Pin,
  Copy,
  Archive,
  Trash2,
  CalendarDays,
  Repeat2,
  ListChecks,
  Paperclip,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useWorkspace } from "../../store/taskStore";
import { dateKey } from "../../lib/workspace";

export default function TaskItem({
  task,
  onEdit,
  selected,
  onSelect,
  board = false,
  draggable = true,
}) {
  const { projects, completeTask, updateTask, duplicate, deleteTasks } =
    useWorkspace();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !draggable });
  const project = projects.find((p) => p.id === task.projectId);
  const overdue = task.dueDate && task.dueDate < dateKey() && !task.completed;
  const done = task.subtasks.filter((s) => s.completed).length;
  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderLeftColor: task.color || undefined,
      }}
      className={`task-row ${board ? "board-card" : ""} ${task.completed ? "is-complete" : ""} ${selected ? "is-selected" : ""} ${isDragging ? "dragging" : ""}`}
    >
      <button
        className="drag-handle"
        aria-label={`Move ${task.title}`}
        disabled={!draggable}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={15} />
      </button>
      <input
        className="bulk-check"
        type="checkbox"
        aria-label={`Select ${task.title}`}
        checked={selected}
        onChange={onSelect}
      />
      <button
        className={`task-check ${task.completed ? "checked" : ""}`}
        aria-label={`Mark ${task.title} ${task.completed ? "active" : "complete"}`}
        onClick={() => completeTask(task.id, !task.completed)}
      >
        {task.completed && <Check size={13} />}
      </button>
      <button className="task-copy" onClick={() => onEdit(task)}>
        <span className="task-title">
          {task.title}
          {task.pinned && <Pin size={12} className="pin-mark" />}
        </span>
        <span className="task-meta">
          {project && (
            <span className="project-label">
              <i style={{ background: project.color }} />
              {project.name}
            </span>
          )}
          {task.tags.map((tag) => (
            <span
              className={`tag tag-${tag.toLowerCase() === "design" ? "purple" : tag.toLowerCase() === "development" ? "blue" : "green"}`}
              key={tag}
            >
              {tag}
            </span>
          ))}
          {task.subtasks.length > 0 && (
            <span className="subtask-count">
              <ListChecks size={12} />
              {done}/{task.subtasks.length}
              <span className="mini-progress">
                <i
                  style={{ width: `${(done / task.subtasks.length) * 100}%` }}
                />
              </span>
            </span>
          )}
          {task.attachments.length > 0 && (
            <span>
              <Paperclip size={12} />
              {task.attachments.length}
            </span>
          )}
        </span>
      </button>
      <div className="task-trailing">
        <span className={`priority ${task.priority}`}>
          <i />
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={`due ${overdue ? "overdue" : ""}`}>
            <CalendarDays size={12} />
            {task.dueDate === dateKey()
              ? task.dueTime || "Today"
              : format(parseISO(task.dueDate), "MMM d")}
            {task.recurrence !== "none" && <Repeat2 size={12} />}
          </span>
        )}
      </div>
      <details className="task-menu">
        <summary aria-label={`Actions for ${task.title}`}>
          <MoreHorizontal size={18} />
        </summary>
        <div className="task-menu-popover">
          <button onClick={() => onEdit(task)}>Edit details</button>
          <button onClick={() => updateTask(task.id, { pinned: !task.pinned })}>
            <Pin size={14} />
            {task.pinned ? "Unpin" : "Pin"}
          </button>
          <button onClick={() => duplicate(task.id)}>
            <Copy size={14} />
            Duplicate
          </button>
          <button
            onClick={() => updateTask(task.id, { archived: !task.archived })}
          >
            {task.archived ? <RotateCcw size={14} /> : <Archive size={14} />}{" "}
            {task.archived ? "Restore" : "Archive"}
          </button>
          <button className="danger" onClick={() => deleteTasks([task.id])}>
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </details>
    </article>
  );
}
