"use client";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  addMonths,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Circle } from "lucide-react";
import TaskItem from "../tasks/TaskItem";
import { dateKey } from "../../lib/workspace";

function Column({ status, title, tasks, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `status:${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`board-column ${isOver ? "drop-active" : ""}`}
    >
      <h3>
        <Circle size={10} className={`status-${status}`} />
        {title}
        <span>{tasks.length}</span>
      </h3>
      {children}
    </div>
  );
}
export function TaskViews({
  view,
  tasks,
  onEdit,
  selected,
  onSelect,
  sort,
  onAdd,
}) {
  const [month, setMonth] = useState(new Date());
  const item = (t) => (
    <TaskItem
      key={t.id}
      task={t}
      onEdit={onEdit}
      selected={selected.includes(t.id)}
      onSelect={() => onSelect(t.id)}
      board={view === "board"}
      draggable={view === "board" || sort === "manual"}
    />
  );
  if (view === "board")
    return (
      <div className="board">
        {[
          ["todo", "To do"],
          ["doing", "In progress"],
          ["done", "Done"],
        ].map(([status, title]) => {
          const group = tasks.filter((t) => t.status === status);
          return (
            <Column key={status} status={status} title={title} tasks={group}>
              <SortableContext
                items={group.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {group.map(item)}
              </SortableContext>
              <button
                className="board-add"
                onClick={() =>
                  onAdd({
                    status,
                    completed: status === "done",
                    completedAt: status === "done" ? Date.now() : null,
                  })
                }
              >
                <Plus size={14} />
                Add task
              </button>
            </Column>
          );
        })}
      </div>
    );
  if (view === "calendar") {
    const days = eachDayOfInterval({
      start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
    });
    const undated = tasks.filter((t) => !t.dueDate);
    return (
      <div>
        <div className="calendar-toolbar">
          <h3>{format(month, "MMMM yyyy")}</h3>
          <div>
            <button
              className="icon-button"
              aria-label="Previous month"
              onClick={() => setMonth(addMonths(month, -1))}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="button small"
              onClick={() => setMonth(new Date())}
            >
              Today
            </button>
            <button
              className="icon-button"
              aria-label="Next month"
              onClick={() => setMonth(addMonths(month, 1))}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
        <div className="calendar-scroll">
          <div className="calendar-grid">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div className="calendar-weekday" key={d}>
                {d}
              </div>
            ))}
            {days.map((day) => (
              <div
                key={dateKey(day)}
                className={`calendar-day ${!isSameMonth(day, month) ? "outside" : ""} ${dateKey(day) === dateKey() ? "is-today" : ""}`}
              >
                <button
                  className="day-number"
                  aria-label={`Add task on ${format(day, "MMMM d, yyyy")}`}
                  onClick={() => onAdd({ dueDate: dateKey(day) })}
                >
                  {format(day, "d")}
                </button>
                {tasks
                  .filter((t) => t.dueDate === dateKey(day))
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onEdit(t)}
                      className={`calendar-task ${t.completed ? "strike" : ""}`}
                    >
                      <i className={`priority-dot ${t.priority}`} />
                      {t.title}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
        {undated.length > 0 && (
          <div className="undated">
            <h3>No due date · {undated.length}</h3>
            {undated.map((t) => (
              <button key={t.id} className="button" onClick={() => onEdit(t)}>
                {t.title}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <SortableContext
      items={tasks.map((t) => t.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="task-list">{tasks.map(item)}</div>
    </SortableContext>
  );
}
