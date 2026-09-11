"use client";
import { ArrowUpRight, Flame, Sparkles, Check } from "lucide-react";
import { statistics } from "../../lib/workspace";
export default function Overview({ tasks }) {
  const stats = statistics(tasks),
    percent = stats.total
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;
  const max = Math.max(...stats.days.map((d) => d.count), 1);
  return (
    <div className="overview-grid">
      <section className="progress-card">
        <div className="card-top">
          <span>
            <span className="tiny-icon">
              <Check size={12} />
            </span>
            Today’s progress
          </span>
          <span className="subtle">
            You’ve got this <Sparkles size={12} />
          </span>
        </div>
        <div className="progress-value">
          <strong>
            {stats.completed}
            <span> / {stats.total}</span>
          </strong>
          <span>tasks completed</span>
          <b>{percent}%</b>
        </div>
        <progress
          value={percent}
          max={100}
          aria-label="Today's task completion"
        />
        <p>
          {percent === 100
            ? "A little celebration is in order. You did it."
            : "One task at a time. You’re making progress."}
          <ArrowUpRight size={14} />
        </p>
      </section>
      <section className="streak-card">
        <div className="card-top">
          <span>
            <Flame size={15} />
            Your momentum
          </span>
        </div>
        <div className="streak-number">
          {stats.streak}
          <span>day streak</span>
          <span className="flame-circle">
            <Flame size={25} />
          </span>
        </div>
        <div className="streak-days">
          {stats.days.map((d) => (
            <span
              key={d.date}
              className={d.count ? "done" : ""}
              title={`${d.label}: ${d.count} completed`}
            >
              {d.count ? <Check size={11} /> : d.label[0]}
            </span>
          ))}
        </div>
        <p>Consistency looks good on you.</p>
      </section>
      <section className="week-card">
        <div className="card-top">
          <span>This week</span>
          <span className="weekly-total">{stats.week} completed</span>
        </div>
        <div
          className="bar-chart"
          role="img"
          aria-label={`Weekly completed tasks: ${stats.days.map((d) => `${d.label} ${d.count}`).join(", ")}`}
        >
          {stats.days.map((d, i) => (
            <div className="bar-column" key={d.date}>
              <div className="bar-track">
                <div
                  className={i === 6 ? "bar current" : "bar"}
                  style={{ height: `${Math.max((d.count / max) * 100, 3)}%` }}
                  title={`${d.count} tasks`}
                />
              </div>
              <span>{d.label[0]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
