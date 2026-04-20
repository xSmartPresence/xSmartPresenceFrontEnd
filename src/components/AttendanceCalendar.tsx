import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { getAttendanceCalendar, type CalendarDay } from "../services/attendanceCalendar.service";

const STATUS_COLORS: Record<string, string> = {
  Present:   "bg-green-100 text-green-700 border border-green-200",
  Late:      "bg-yellow-100 text-yellow-700 border border-yellow-200",
  EarlyExit: "bg-sky-100 text-sky-700 border border-sky-200",
  Overtime:  "bg-indigo-100 text-indigo-700 border border-indigo-200",
  Absent:    "bg-red-100 text-red-700 border border-red-200",
};

const STATUS_DOT: Record<string, string> = {
  Present:   "bg-green-500",
  Late:      "bg-yellow-500",
  EarlyExit: "bg-sky-500",
  Overtime:  "bg-indigo-500",
  Absent:    "bg-red-500",
};

export default function AttendanceCalendar() {
  const [employeeId, setEmployeeId] = useState("");
  const [inputValue, setInputValue]   = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<string, CalendarDay>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [selectedDay, setSelectedDay] = useState<{ date: string; day: CalendarDay } | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        setError("");
        const month = format(currentMonth, "yyyy-MM");
        const data  = await getAttendanceCalendar(month, employeeId);
        setCalendarData(data);
      } catch {
        setError("Failed to load calendar. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [employeeId, currentMonth]);

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setEmployeeId(trimmed);
    setSelectedDay(null);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end:   endOfMonth(currentMonth),
  });

  const startPadding = getDay(startOfMonth(currentMonth));

  const prevMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const summary = Object.values(calendarData).reduce(
    (acc, d) => {
      if (d.status) acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">

      {/* SEARCH */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Enter Employee ID or Name..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-72 bg-white"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition"
        >
          Search
        </button>
      </div>

      {!employeeId && (
        <div className="text-center py-20 text-gray-400 text-sm">
          Enter an Employee ID or Name to view their monthly attendance calendar.
        </div>
      )}

      {employeeId && (
        <>
          {/* SUMMARY BADGES */}
          {!loading && Object.keys(summary).length > 0 && (
            <div className="flex flex-wrap gap-3">
              {Object.entries(summary).map(([status, count]) => (
                <span key={status} className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status] || ""}`}>
                  {status}: {count}
                </span>
              ))}
            </div>
          )}

          {/* CALENDAR */}
          <div className="bg-white rounded-xl shadow-sm p-4">

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition">‹</button>
              <h2 className="text-base font-semibold text-gray-800">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition">›</button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Error */}
            {error && <p className="text-red-500 text-sm text-center py-4">{error}</p>}

            {/* Loading */}
            {loading && (
              <div className="text-center text-gray-400 text-sm py-10">Loading...</div>
            )}

            {/* Grid */}
            {!loading && (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {days.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const info    = calendarData[dateStr];
                  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
                  const isSelected = selectedDay?.date === dateStr;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => info ? setSelectedDay(isSelected ? null : { date: dateStr, day: info }) : null}
                      className={`relative flex flex-col items-center justify-center rounded-lg p-2 min-h-[52px] text-sm transition
                        ${info ? "cursor-pointer hover:bg-gray-50" : ""}
                        ${isSelected ? "ring-2 ring-gray-400" : ""}
                        ${isToday ? "ring-2 ring-blue-400" : ""}
                      `}
                    >
                      <span className={`text-xs font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                        {format(day, "d")}
                      </span>
                      {info?.status && (
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[info.status] || "bg-gray-400"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LEGEND */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {Object.entries(STATUS_DOT).map(([status, dot]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                {status}
              </div>
            ))}
          </div>

          {/* DAY DETAIL */}
          {selectedDay && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  {format(new Date(selectedDay.date), "dd MMMM yyyy")}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedDay.day.status || ""] || ""}`}>
                  {selectedDay.day.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div><span className="text-gray-400 text-xs">Punch In</span><p className="font-medium">{selectedDay.day.punch_in || "-"}</p></div>
                <div><span className="text-gray-400 text-xs">Punch Out</span><p className="font-medium">{selectedDay.day.punch_out || "-"}</p></div>
                <div><span className="text-gray-400 text-xs">Working Hours</span><p className="font-medium">{selectedDay.day.working_hours ? `${selectedDay.day.working_hours}h` : "-"}</p></div>
                <div><span className="text-gray-400 text-xs">Overtime</span><p className="font-medium">{selectedDay.day.overtime_minutes ? `${selectedDay.day.overtime_minutes}m` : "-"}</p></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}