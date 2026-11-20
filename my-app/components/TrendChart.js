"use client";

import { useState } from "react";
import { currency } from "@/lib/format";

const formatDay = (isoDate) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

// Dependency-free bar chart of daily verified contribution totals.
const TrendChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const maxAmount = Math.max(...data.map((day) => day.amount), 0);
  const total = data.reduce((sum, day) => sum + day.amount, 0);
  const count = data.reduce((sum, day) => sum + day.count, 0);
  const active = activeIndex === null ? null : data[activeIndex];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm text-slate-400">Last 30 days</p>
          <p className="mt-1 text-2xl font-bold">{currency.format(total)}</p>
        </div>
        <p className="text-sm text-slate-400" aria-live="polite">
          {active
            ? `${formatDay(active.date)} · ${currency.format(active.amount)} · ${active.count} ${active.count === 1 ? "contribution" : "contributions"}`
            : `${count} ${count === 1 ? "contribution" : "contributions"}`}
        </p>
      </div>

      {maxAmount === 0 ? (
        <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-400">
          No verified contributions in the last 30 days.
        </div>
      ) : (
        <div
          className="mt-4 flex h-40 items-end gap-[3px]"
          role="img"
          aria-label={`Daily contributions over the last 30 days, totalling ${currency.format(total)}`}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {data.map((day, index) => {
            const height = day.amount === 0 ? 2 : Math.max(6, (day.amount / maxAmount) * 100);

            return (
              <div
                key={day.date}
                className="flex h-full flex-1 items-end"
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div
                  className={`w-full rounded-t transition-colors ${
                    day.amount === 0
                      ? "bg-slate-700"
                      : activeIndex === index
                        ? "bg-blue-400"
                        : "bg-gradient-to-t from-purple-600 to-blue-500"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{formatDay(data[0].date)}</span>
        <span>{formatDay(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
};

export default TrendChart;
