import { Search, Download, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { getAttendance } from "../services/attendance.service";
import type { AttendanceRecord } from "../types/attendance.types";
import "react-datepicker/dist/react-datepicker.css";

function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [department, setDepartment] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deptOpen, setDeptOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("")

  useEffect(() => {
  const close = () => setDeptOpen(false);
  document.addEventListener("mousedown", close);
  return () => document.removeEventListener("click", close);
}, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAttendance({
          date: format(selectedDate, "yyyy-MM-dd"),
          department: department !== "All" ? department : "",
          search: searchTerm,
        });

        setRecords(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
        setError("Failed to load attendance. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, department, searchTerm]);

  useEffect(() => {
  const timer = setTimeout(() => {
    setSearchTerm(searchInput);
  }, 400); // ✅ waits 400ms after user stops typing
  return () => clearTimeout(timer);
}, [searchInput]);

  const getStatusBadge = (status: string) => {
    const base = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "Present":
        return `${base} bg-green-100 text-green-600`;
      case "Late":
        return `${base} bg-yellow-100 text-yellow-600`;
      case "Early Exit":
      case "EarlyExit": 
        return `${base} bg-sky-100 text-sky-500`;
      case "Overtime":
        return `${base} bg-indigo-100 text-indigo-600`;
      case "Absent":
        return `${base} bg-red-100 text-red-600`;
      default:
        return base;
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      alert("No records to export");
      return;
    }

    const headers = [
      "Code",
      "Name",
      "Department",
      "Date",
      "Shift",
      "In",
      "Out",
      "Hours",
      "Status",
      "Anomaly",
    ];

    const rows = records.map((r) => [
      r.code,
      r.name,
      r.department,
      r.date,
      r.shift,
      r.in,
      r.out,
     calculateHours(r.in, r.out),
      r.status,
      r.anomaly || "-",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${format(selectedDate, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
 
const calculateHours = (inTime: string, outTime: string): string => {
  if (!inTime || !outTime || inTime === "-" || outTime === "-") return "-";

  const parseTime = (t: string) => {
    const [time, modifier] = t.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const inMinutes = parseTime(inTime);
  const outMinutes = parseTime(outTime);

  if (outMinutes <= inMinutes) return "-"; // handles midnight edge case

  const diff = outMinutes - inMinutes;
  const h = Math.floor(diff / 60);
  const m = diff % 60;

  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
    <p className="text-gray-500 text-sm">
      Manage and review employee attendance
    </p>
  </div>
      <div className="relative inline-block">
  <DatePicker
    selected={selectedDate}
   onChange={(date: Date | null) => {
  if (date && date > new Date()) {
    alert("Cannot select a future date");
    return;
  }
  if (date) setSelectedDate(date);
}}
    popperPlacement="bottom-start"
    popperClassName="z-50"
    customInput={
      <button
        type="button"
        className="flex items-center gap-3 bg-white border border-gray-300 rounded-xl px-5 py-2.5 shadow-sm hover:shadow-md transition"
      >
        <Calendar size={18} className="text-gray-600" />
        <span className="font-medium text-gray-700">
          {format(selectedDate, "dd-MM-yyyy")}
        </span>
      </button>
    }
  />
</div>
</div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm w-64"
          />
        </div>

        <div className="relative">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setDeptOpen(!deptOpen);
    }}
    className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm flex items-center justify-between min-w-[180px]"
  >
    {department}
    <span className="text-gray-400 ml-2">▼</span>
  </button>

  {deptOpen && (
    <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">
      {["All", "Engineering", "Marketing", "HR", "Finance", "Sales"].map((dept) => (
        <div
          key={dept}
          onClick={() => {
            setDepartment(dept);
            setDeptOpen(false);
          }}
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
        >
          {dept}
        </div>
      ))}
    </div>
  )}
</div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading attendance...
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">
                  Code
                </th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Shift</th>
                <th className="px-4 py-3 text-left">In</th>
                <th className="px-4 py-3 text-left">Out</th>
                <th className="px-4 py-3 text-left">Hours</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Anomaly</th>
              </tr>
            </thead>

            <tbody>
              {records.map((r) => (
                <tr
                  key={`${r.code}-${r.date}`}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                    {r.code}
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.department}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                   {r.date
                     ? (() => {
                    try { return format(new Date(r.date), "dd-MM-yyyy"); }
                    catch { return "-"; }
                    })()
                    : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.shift}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.in}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.out}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                  {calculateHours(r.in, r.out)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={getStatusBadge(r.status)}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.anomaly || "-"}
                  </td>
                </tr>
              ))}

              {records.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Attendance;