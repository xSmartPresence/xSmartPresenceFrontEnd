import { useState, useEffect } from "react";
import { Download, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { getReports } from "../services/reports.service";
import type { ReportRecord } from "../types/reports.types";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const Reports = () => {
  const [activeTab, setActiveTab] = useState("daily");
  const [records, setRecords]     = useState<ReportRecord[]>([]);
  const [loading, setLoading]     = useState(false);
  const [department, setDepartment] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deptOpen, setDeptOpen] = useState(false);
  const [error, setError] = useState("");


  useEffect(() => {
  const close = () => setDeptOpen(false);
  document.addEventListener("click", close);
  return () => document.removeEventListener("click", close);
}, []);

  const tabs = [
  { label: "Daily",        value: "daily"        },
  { label: "Weekly",       value: "weekly"       },
  { label: "Monthly",      value: "monthly"      },
  { label: "Late Arrival", value: "late_arrival" },
  { label: "Early Exit",   value: "early_exit"   },
  { label: "Overtime",     value: "overtime"     },
];

  // ── Fetch reports ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getReports({
          type:       activeTab,
          department: department || undefined,
          date:       format(selectedDate, "yyyy-MM-dd"),
        });
        setRecords(data);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
        setRecords([]);
        setError("Failed to load reports. Please try again."); 
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [activeTab, department, selectedDate]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (records.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = ["Code", "Name", "Department", "Date", "Status", "Hours"];
    const rows = records.map(r => [r.code, r.name, r.department, r.date, r.status, r.hours]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `report-${activeTab}-${format(selectedDate, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
  if (records.length === 0) {
    alert("No data to export.");
    return;
  }

  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SmartPresence — Attendance Report", 14, 18);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Type: ${activeTab.replace("_", " ").toUpperCase()}`, 14, 26);
  doc.text(`Date: ${format(selectedDate, "dd-MM-yyyy")}`, 14, 32);
  doc.text(`Department: ${department || "All"}`, 14, 38);
  doc.text(`Generated: ${format(new Date(), "dd-MM-yyyy HH:mm")}`, 14, 44);

  // Table
  autoTable(doc, {
    startY: 50,
    head: [["Code", "Name", "Department", "Date", "Status", "Hours"]],
    body: records.map(r => [
      r.code,
      r.name,
      r.department,
      r.date ? (() => { try { return format(new Date(r.date), "dd-MM-yyyy"); } catch { return "-"; } })() : "-",
      r.status,
      r.hours,
    ]),
    headStyles: {
      fillColor: [11, 30, 63],  // your #0B1E3F color
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    styles: {
      cellPadding: 4,
    },
  });

  doc.save(`report-${activeTab}-${format(selectedDate, "yyyy-MM-dd")}.pdf`);
};

  return (
    <div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-500 text-sm">Generate and export attendance reports</p>
        </div>

       {/* EXPORT BUTTONS */}
<div className="flex gap-2">
  <button
    onClick={handleExportCSV}
    className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
  >
    <Download size={16} />
    Export CSV
  </button>
  <button
    onClick={handleExportPDF}
    className="flex items-center gap-2 bg-[#0B1E3F] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition"
  >
    <Download size={16} />
    Export PDF
  </button>
</div>
</div>

      {/* REPORT TYPE TABS */}
    <div className="mb-6 overflow-x-auto lg:overflow-visible">
  <div className="flex min-w-max lg:min-w-0 gap-2 bg-gray-100/80 border border-gray-200 rounded-lg p-1 lg:inline-flex">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        onClick={() => setActiveTab(tab.value)}
        className={`flex-shrink-0 whitespace-nowrap px-3 py-1 text-xs rounded-md font-semibold transition
          ${
            activeTab === tab.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-gray-600 hover:text-slate-900"
          }
        `}
      >
        {tab.label}
      </button>
    ))}
  </div>
</div>
      {/* FILTERS */}
     <div className="flex flex-wrap gap-4 mb-6 mt-2">

        {/* DEPARTMENT DROPDOWN */}
        <div className="relative">
  {/* BUTTON */}
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setDeptOpen(!deptOpen);
    }}
    className="border rounded-lg px-4 py-2 bg-white text-sm flex items-center justify-between w-full sm:w-auto min-w-[180px]"
  >
    {department || "All Departments"}
    <span className="text-gray-400 ml-2">▼</span>
  </button>

  {/* DROPDOWN */}
  {deptOpen && (
    <div
      className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      {["", "Engineering", "HR", "Finance", "Sales"].map((dept) => (
        <div
          key={dept || "all"}
          onClick={() => {
            setDepartment(dept);
            setDeptOpen(false);
          }}
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
        >
          {dept || "All Departments"}
        </div>
      ))}
    </div>
  )}
</div>

        {/* DATE PICKER */}
        <div className="relative">
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
            customInput={
              <button
                type="button"
                className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-100 transition"
              >
                <Calendar size={16} />
                {format(selectedDate, "dd-MM-yyyy")}
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

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading reports...</div>
        ) : (
         <table className="min-w-full text-sm">
           <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Dept</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Hours</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No report data available
                  </td>
                </tr>
              ) : records.map((r, i) => (
               <tr key={`${r.code}-${i}`} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">{r.code}</td>
                 <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.department}</td>
                 <td className="px-4 py-3 whitespace-nowrap">
                    {r.date
                      ? (() => {
                             try { return format(new Date(r.date), "dd-MM-yyyy"); }
                             catch { return "-"; }
                        })()
                      : "-"}
                 </td>
                  <td className="px-4 py-3 whitespace-nowrap">
  <span
    className={`px-2 py-1 text-xs rounded-full font-medium
      ${
        r.status === "Present"
          ? "bg-green-100 text-green-700"
          : r.status === "Absent"
          ? "bg-red-100 text-red-700"
          : r.status === "Late"
          ? "bg-yellow-100 text-yellow-700"
          : r.status === "EarlyExit" || r.status === "Early Exit"
          ? "bg-sky-100 text-sky-500"
          : r.status === "Overtime"
          ? "bg-indigo-100 text-indigo-600"
          : "bg-gray-100 text-gray-600"
      }
    `}
  >
    {r.status}
  </span>
</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default Reports;