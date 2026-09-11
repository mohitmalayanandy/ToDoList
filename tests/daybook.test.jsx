import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Daybook from "../components/daybook";
import { parseTasks, selectTasks, STORAGE_KEY, validDate } from "../lib/tasks";

async function add(user, title) {
  await user.type(screen.getByRole("textbox", { name: "Task title" }), title);
  await user.click(screen.getByRole("button", { name: /Add task/ }));
}

const task = {
  id: "legacy-1",
  title: "Existing task",
  priority: "high",
  dueDate: "2026-09-20",
  completed: false,
  createdAt: 1,
};

describe("Daybook React workflows", () => {
  it("loads existing storage without overwriting it, and persists edits", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([task]));
    const user = userEvent.setup();
    const view = render(<Daybook />);
    expect(await screen.findByText("Existing task")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([task]);
    await user.click(
      screen.getByRole("button", { name: "Edit Existing task" }),
    );
    await user.clear(screen.getByRole("textbox", { name: "Task title" }));
    await user.type(
      screen.getByRole("textbox", { name: "Task title" }),
      "Updated task{Enter}",
    );
    expect(screen.getByText("Updated task")).toBeInTheDocument();
    view.unmount();
    render(<Daybook />);
    expect(await screen.findByText("Updated task")).toBeInTheDocument();
  });

  it("creates, completes, filters, deletes, and restores tasks", async () => {
    const user = userEvent.setup();
    render(<Daybook />);
    await add(user, "Ship release");
    await user.click(
      screen.getByRole("checkbox", { name: "Mark Ship release complete" }),
    );
    expect(screen.getByRole("progressbar")).toHaveValue(100);
    await user.click(
      screen.getByRole("button", { name: "Active", exact: true }),
    );
    expect(screen.queryByText("Ship release")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Completed", exact: true }),
    );
    await user.click(
      screen.getByRole("button", { name: "Delete Ship release" }),
    );
    expect(screen.queryByText("Ship release")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText("Ship release")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear completed" }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText("Ship release")).toBeInTheDocument();
  });

  it("searches safely rendered titles and cancels edits", async () => {
    const user = userEvent.setup();
    render(<Daybook />);
    await add(user, "<script>alert(1)</script>");
    await add(user, "Review");
    await user.type(screen.getByRole("searchbox"), "SCRIPT");
    expect(screen.queryByText("Review")).not.toBeInTheDocument();
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Edit <script>alert(1)</script>" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel edit" }));
    expect(screen.getByRole("textbox", { name: "Task title" })).toHaveValue("");
  });

  it("reports corrupt storage and save failures while preserving in-memory undo", async () => {
    localStorage.setItem(STORAGE_KEY, "{bad");
    const user = userEvent.setup();
    render(<Daybook />);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Saved tasks could not be loaded",
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota");
    });
    await add(user, "Unsaved task");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Could not save changes",
    );
    await user.click(
      screen.getByRole("button", { name: "Delete Unsaved task" }),
    );
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText("Unsaved task")).toBeInTheDocument();
  });
});

describe("saved data and ordering", () => {
  it("rejects invalid dates and duplicate task IDs", () => {
    expect(validDate("2026-02-30")).toBe(false);
    expect(validDate("2028-02-29")).toBe(true);
    expect(() => parseTasks(JSON.stringify([task, task]))).toThrow();
    expect(() =>
      parseTasks(JSON.stringify([{ ...task, completed: "yes" }])),
    ).toThrow();
  });
  it("sorts by priority and due date without mutating the source", () => {
    const data = [
      { ...task, id: "low", priority: "low", dueDate: "", createdAt: 3 },
      task,
    ];
    expect(selectTasks(data, "all", "", "priority")[0].id).toBe(task.id);
    expect(selectTasks(data, "all", "", "due")[0].id).toBe(task.id);
    expect(data[0].id).toBe("low");
    expect(selectTasks(data, "completed", "", "newest")).toEqual([]);
  });
});
