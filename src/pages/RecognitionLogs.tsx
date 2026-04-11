import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

interface Log {
  id: string;
  timestamp: string;
  employeeId: string;
  name: string;
  camera: string;
  confidence: number;
  status: "Accepted" | "Rejected" | "Duplicate";
}

const RecognitionLogs = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  // 🔹 Empty array — ready for backend API
  const logs: Log[] = [];

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
        <h1 className="text-2xl font-bold text-gray-800">
          Recognition Logs
        </h1>
        <p className="text-gray-500 text-sm">
          AI facial recognition audit trail
        </p>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">

        {/* SEARCH */}
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm
              focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* STATUS FILTER */}
        <div className="relative w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none border rounded-lg px-4 py-2 text-sm bg-white
              focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option>All Status</option>
            <option>Accepted</option>
            <option>Rejected</option>
            <option>Duplicate</option>
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">

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
                <td
                  colSpan={6}
                 className="text-center py-10 text-gray-500"
                >
                  No recognition logs available
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{log.employeeId}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                         {log.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{log.camera}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${log.confidence}%` }}
                        />
                      </div>
                      <span>{log.confidence}%</span>
                    </div>
                  </td>
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
      </div>

    </div>
  );
};

export default RecognitionLogs;