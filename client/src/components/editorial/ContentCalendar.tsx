import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarProject {
  id: number;
  title: string;
  type: string;
  status: string;
  assignedTo?: string;
  dueDate?: string;
  scheduledAt?: string;
  publishedAt?: string;
  coverImage?: string;
  tags?: string[];
}

const STATUS_DOT: Record<string, string> = {
  planning:      "bg-gray-400",
  "in-progress": "bg-blue-500",
  "copy-edit":   "bg-orange-400",
  ready:         "bg-green-500",
  published:     "bg-purple-500",
  featured:      "bg-yellow-500",
};

const TYPE_COLOR: Record<string, string> = {
  photoshoot:           "border-l-pink-400",
  interview:            "border-l-blue-400",
  essay:                "border-l-amber-400",
  "community-spotlight":"border-l-green-400",
};

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function ContentCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { data: projects = [] } = useQuery<CalendarProject[]>({
    queryKey: ["/api/editorial/calendar", monthKey(year, month)],
    queryFn: () =>
      fetch(`/api/editorial/calendar?month=${monthKey(year, month)}`, { credentials: "include" })
        .then(r => r.json()),
    refetchInterval: 60000,
  });

  // Build a map: dateKey → CalendarProject[]
  const byDate: Record<string, CalendarProject[]> = {};
  for (const p of projects) {
    const dateStr = p.scheduledAt || p.publishedAt || p.dueDate;
    if (!dateStr) continue;
    const k = dateKey(new Date(dateStr));
    if (!byDate[k]) byDate[k] = [];
    byDate[k].push(p);
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete weeks
  while (cells.length % 7 !== 0) cells.push(null);

  // Unscheduled projects (no dueDate, scheduledAt, or publishedAt)
  const unscheduled = projects.filter(p => !p.scheduledAt && !p.publishedAt && !p.dueDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-mono font-bold text-lg text-gray-900">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={prevMonth} className="h-7 w-7 p-0">
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={nextMonth} className="h-7 w-7 p-0">
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
            className="font-mono text-xs h-7 px-2 text-gray-500">
            Today
          </Button>
        </div>

        {/* Legend */}
        <div className="flex gap-3">
          {Object.entries(STATUS_DOT).map(([status, dot]) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="font-mono text-[10px] text-gray-500 capitalize">{status.replace("-", " ")}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_NAMES.map(d => (
            <div key={d} className="py-2 text-center font-mono text-[10px] uppercase tracking-widest text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const k = day ? dateKey(new Date(year, month, day)) : "";
            const dayProjects = day ? (byDate[k] || []) : [];
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;

            return (
              <div
                key={idx}
                className={`min-h-[90px] border-b border-r border-gray-100 p-1.5 ${!day ? "bg-gray-50/50" : isWeekend ? "bg-gray-50/30" : "bg-white"}`}
              >
                {day && (
                  <>
                    <div className={`w-6 h-6 flex items-center justify-center mb-1 rounded-full font-mono text-xs
                      ${isToday ? "bg-navy text-white font-bold" : "text-gray-500"}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayProjects.slice(0, 3).map(p => (
                        <Link key={p.id} href={`/admin/editorial/projects/${p.id}`}>
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border-l-2 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${TYPE_COLOR[p.type] || "border-l-gray-300"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[p.status] || "bg-gray-400"}`} />
                            <p className="font-mono text-[9px] text-gray-700 truncate leading-tight">{p.title}</p>
                          </div>
                        </Link>
                      ))}
                      {dayProjects.length > 3 && (
                        <p className="font-mono text-[9px] text-gray-400 pl-1">+{dayProjects.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled items */}
      {unscheduled.length > 0 && (
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-gray-400 mb-3">
            Unscheduled ({unscheduled.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {unscheduled.map(p => (
              <Link key={p.id} href={`/admin/editorial/projects/${p.id}`}>
                <div className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg hover:border-gray-300 cursor-pointer transition-colors border-l-4 ${TYPE_COLOR[p.type] || "border-l-gray-300"}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[p.status] || "bg-gray-400"}`} />
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-gray-800 truncate">{p.title}</p>
                    {p.assignedTo && <p className="font-mono text-[10px] text-gray-400 truncate">{p.assignedTo}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center">
          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="font-mono text-sm text-gray-400">No editorial projects yet</p>
          <p className="font-mono text-xs text-gray-300 mt-1">Projects with due dates or schedules will appear here</p>
        </div>
      )}
    </div>
  );
}
