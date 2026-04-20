import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { getRecognitionLogs } from "../services/recognitionLogs.service";
import type { RecognitionLog } from "../types/recognitionLogs.types";

const RecognitionLogs = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [statusOpen, setStatusOpen] = useState(false);
  const [logs, setLogs] = useState<RecognitionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const close = () => setStatusOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // ── Fetch recognition logs ────────────────────────────────────────────────
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getRecognitionLogs();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch recognition logs:", err);
        setError("Failed to load recognition logs. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // ── Filter logs ───────────────────────────────────────────────────────────
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.name.toLowerCase().includes(search.toLowerCase()) ||
      log.employeeId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All Status" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Recognition Logs</h1>
        <p className="text-gray-500 text-sm">AI facial recognition audit trail</p>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">

        {/* SEARCH */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          />
        </div>

        {/* STATUS FILTER DROPDOWN */}
        <div className="relative w-full md:w-48">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setStatusOpen(!statusOpen);
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm flex items-center justify-between"
          >
            {statusFilter}
            <span className="text-gray-400">▼</span>
          </button>

          {statusOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">
              {["All Status", "Accepted", "Rejected", "Duplicate"].map((status) => (
                <div
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setStatusOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading recognition logs...
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Employee ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Camera</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Confidence</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No recognition logs available
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">

                    {/* TIMESTAMP */}
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {log.timestamp}
                    </td>

                    {/* EMPLOYEE ID */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.employeeId}
                    </td>

                    {/* NAME */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      {log.name || "Unknown"}
                    </td>

                    {/* CAMERA BADGE */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium
                          ${
                            log.camera.toLowerCase().includes("entry")
                              ? "bg-blue-100 text-blue-600"
                              : "bg-sky-100 text-sky-600"
                          }`}
                      >
                        {log.camera}
                      </span>
                    </td>

                    {/* CONFIDENCE BAR */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              log.confidence >= 80
                                ? "bg-green-500"
                                : log.confidence >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${log.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm">{log.confidence}%</span>
                      </div>
                    </td>

                    {/* STATUS BADGE */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium
                          ${
                            log.status === "Accepted"
                              ? "bg-green-100 text-green-600"
                              : log.status === "Rejected"
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                      >
                        {log.status}
                      </span>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default RecognitionLogs;