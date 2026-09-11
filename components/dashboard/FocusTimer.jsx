"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Headphones, Coffee } from "lucide-react";
import Modal from "../ui/Modal";
import { useWorkspace } from "../../store/taskStore";
export default function FocusTimer({ open, onClose }) {
  const { settings, notify } = useWorkspace();
  const [mode, setMode] = useState("focus");
  const [remaining, setRemaining] = useState(settings.focusMinutes * 60);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        notify(
          mode === "focus"
            ? "Focus session complete. Time for a little break."
            : "Break finished. Ready for a fresh start?",
        );
      }
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [running, mode, notify]);
  useEffect(() => {
    if (!running && mode === "focus") setRemaining(settings.focusMinutes * 60);
  }, [settings.focusMinutes]);
  const reset = (next) => {
    setRunning(false);
    setMode(next);
    setRemaining(next === "focus" ? settings.focusMinutes * 60 : 5 * 60);
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="A little space to focus"
      description="One thing. Your full attention."
    >
      <div className="focus-panel">
        <div className="segmented">
          <button
            aria-pressed={mode === "focus"}
            onClick={() => reset("focus")}
          >
            <Headphones size={15} />
            Focus
          </button>
          <button
            aria-pressed={mode === "break"}
            onClick={() => reset("break")}
          >
            <Coffee size={15} />
            Short break
          </button>
        </div>
        <div className={`timer-face ${running ? "running" : ""}`}>
          <span>
            {String(Math.floor(remaining / 60)).padStart(2, "0")}
            <i>:</i>
            {String(remaining % 60).padStart(2, "0")}
          </span>
          <small>
            {running
              ? "You’re right where you need to be."
              : "Take a breath. Begin when you’re ready."}
          </small>
        </div>
        <div className="timer-controls">
          <button
            className="button primary"
            onClick={() => {
              if (running) setRunning(false);
              else {
                deadline.current =
                  Date.now() +
                  (remaining ||
                    (mode === "focus" ? settings.focusMinutes * 60 : 300)) *
                    1000;
                setRunning(true);
              }
            }}
          >
            {running ? <Pause size={17} /> : <Play size={17} />}{" "}
            {running ? "Pause" : "Start session"}
          </button>
          <button
            className="icon-button"
            aria-label="Reset timer"
            onClick={() => reset(mode)}
          >
            <RotateCcw size={18} />
          </button>
        </div>
        <p className="field-hint">
          The timer continues while this dialog is closed. Keep this tab open.
        </p>
      </div>
    </Modal>
  );
}
