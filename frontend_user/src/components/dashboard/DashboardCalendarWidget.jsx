import { useMemo, useState } from "react";

function getMonthDays(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const days = [];
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, monthIndex, day));
  }

  return days;
}

function toDateKey(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardCalendarWidget({ items = [], title = "Event Calendar" }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const visibleYear = visibleMonth.getFullYear();
  const visibleMonthIndex = visibleMonth.getMonth();
  const todayKey = toDateKey(new Date());

  const eventsByDate = useMemo(() => {
    return items.reduce((accumulator, item) => {
      const key = toDateKey(item.eventDate);

      if (!key) {
        return accumulator;
      }

      if (!accumulator[key]) {
        accumulator[key] = [];
      }

      accumulator[key].push(item);
      return accumulator;
    }, {});
  }, [items]);

  const monthDays = useMemo(
    () => getMonthDays(visibleYear, visibleMonthIndex),
    [visibleMonthIndex, visibleYear],
  );

  const upcomingEvents = useMemo(() => {
    return [...items]
      .filter((item) => !Number.isNaN(new Date(item.eventDate).getTime()))
      .sort((left, right) => new Date(left.eventDate) - new Date(right.eventDate))
      .slice(0, 4);
  }, [items]);

  function shiftMonth(offset) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-lg shadow-slate-200/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Dashboard Calendar</p>
          <h3 className="mt-2 text-2xl font-extrabold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">
            Dates get marked here automatically whenever events are added in the calendar section.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            Prev
          </button>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {visibleMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </div>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div key={day} className="pb-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {day}
              </div>
            ))}

            {monthDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square rounded-2xl bg-transparent" />;
              }

              const key = toDateKey(date);
              const dayEvents = eventsByDate[key] || [];
              const isToday = key === todayKey;

              return (
                <div
                  key={key}
                  className={`relative aspect-square rounded-2xl border p-2 transition ${
                    dayEvents.length
                      ? "border-teal-200 bg-teal-50 shadow-sm shadow-teal-100/70"
                      : "border-slate-100 bg-white"
                  } ${isToday ? "ring-2 ring-sky-200" : ""}`}
                  title={dayEvents.map((item) => item.eventName).join(", ")}
                >
                  <div className="flex h-full flex-col justify-between">
                    <span className={`text-sm font-bold ${dayEvents.length ? "text-teal-800" : "text-slate-700"}`}>
                      {date.getDate()}
                    </span>

                    {dayEvents.length ? (
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((item) => (
                          <div
                            key={item._id || `${item.eventName}-${item.eventDate}`}
                            className="truncate rounded-full bg-teal-600/10 px-2 py-1 text-[10px] font-semibold text-teal-700"
                          >
                            {item.eventName}
                          </div>
                        ))}
                        {dayEvents.length > 2 ? (
                          <div className="text-[10px] font-semibold text-teal-700">+{dayEvents.length - 2} more</div>
                        ) : null}
                      </div>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-200" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Upcoming Events</p>
          <div className="mt-4 space-y-3">
            {upcomingEvents.length ? (
              upcomingEvents.map((item) => (
                <div
                  key={item._id || `${item.eventName}-${item.eventDate}`}
                  className="rounded-2xl border border-white bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                    {item.eventDate}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-950">{item.eventName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.venue || "Venue TBA"}{item.eventType ? ` | ${item.eventType}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No event dates have been added yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
