import { useState, useEffect } from "react";
import { AlertTriangle, Eye, ArrowLeftRight, X, Pencil, Trash2 } from "lucide-react";
import { getAnomalies, resolveAnomaly, deleteAnomaly, updateAnomaly, correctAnomaly } from "../services/anomalies.service";
import AppDialog from "../components/AppDialog";
import { useDialog } from "../hooks/useDialog";
import type { Anomaly } from "../types/anomalies.types";

const severityStyle = {
  CRITICAL: "border-red-600 bg-red-50",
  HIGH:     "border-red-500 bg-red-50",
  MEDIUM:   "border-yellow-500 bg-yellow-50",
  LOW:      "border-blue-500 bg-blue-50",
};

const correctionReasons = [
  "Wrong detection",
  "Camera error",
  "Employee was present",
  "System glitch",
  "Other",
];

const errMsg = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

const formatTitle = (title: string) =>
  title.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const Anomalies = () => {
  const [showResolved, setShowResolved]         = useState(false);
  const [data, setData]                         = useState<Anomaly[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [correctingId, setCorrectingId]         = useState<number | null>(null);
  const [correctionReason, setCorrectionReason] = useState(correctionReasons[0]);
  const [correctionNotes, setCorrectionNotes]   = useState("");
  const [submitting, setSubmitting]             = useState(false);
  const [editingAnomaly, setEditingAnomaly]     = useState<Anomaly | null>(null);
  const [editForm, setEditForm]                 = useState({
    title: "", description: "", severity: "MEDIUM", employee: "",
  });
  const [severityOpen, setSeverityOpen] = useState(false);
  const [reasonOpen, setReasonOpen]     = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const { dialog, confirm, alert, close } = useDialog();

useEffect(() => {
  const closeDropdowns = () => {
    setReasonOpen(false);
    setSeverityOpen(false);
  };
  document.addEventListener("click", closeDropdowns);
  return () => document.removeEventListener("click", closeDropdowns);
}, []);

  // ── Fetch anomalies on mount ──────────────────────────────────────────────
  useEffect(() => {
  let mounted = true;

  const fetchData = () => {
    getAnomalies()
      .then(incoming => {
        if (!mounted) return;
        setData(incoming);
        setLastUpdated(new Date());
      })
      .catch(() => {
        if (mounted) setFetchError("Failed to load anomalies. Please try again.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
  };

  fetchData();                               // immediate first load
  const interval = setInterval(fetchData, 15_000);  // then every 15s

  return () => {
    mounted = false;
    clearInterval(interval);
  };
}, []);

  // ── Mark resolved ─────────────────────────────────────────────────────────
  const markResolved = async (id: number) => {
    try {
      await resolveAnomaly(id);
      setData(prev =>
        prev.map(item => item.id === id ? { ...item, resolved: true } : item)
      );
    } catch (err: unknown) {
      alert("Error", "Failed to resolve anomaly: " + errMsg(err));
    }
  };

  // ── Manual correct submit ─────────────────────────────────────────────────
 const handleManualCorrect = async () => {
  if (!correctingId) return;

  if (!correctionReason.trim()) {
    alert("Validation", "Please select a correction reason");
    return;
  }

  setSubmitting(true);
  try {
    await correctAnomaly(correctingId, {
      correction_reason: correctionReason,
      correction_notes: correctionNotes,
    });
    setData(prev =>
      prev.map(item => item.id === correctingId ? { ...item, resolved: true } : item)
    );
    setCorrectingId(null);
    setCorrectionReason(correctionReasons[0]);
    setCorrectionNotes("");
  } catch (err: unknown) {
    alert("Error", "Failed to correct anomaly: " + errMsg(err));
  } finally {
    setSubmitting(false);
  }
};

  // ── Delete anomaly ────────────────────────────────────────────────────────
 const handleDeleteAnomaly = (id: number) => {
  confirm(
    "Delete Anomaly",
    "Are you sure you want to delete this anomaly? This action cannot be undone.",
    async () => {
      try {
        await deleteAnomaly(id);
        setData(prev => prev.filter(item => item.id !== id));
      } catch (err: unknown) {
        alert("Error", "Failed to delete anomaly: " + errMsg(err));
      }
    },
    { type: "danger", confirmLabel: "Delete" }
  );
};

  // ── Edit anomaly submit ───────────────────────────────────────────────────
  const handleEditSubmit = async () => {
    if (!editingAnomaly) return;

    if (!editForm.title.trim()) {
  alert("Validation", "Title is required");
  return;
}
if (/_/.test(editForm.title)) {
  alert("Validation", "Title should not contain underscores — use spaces instead");
  return;
}
if (/\d/.test(editForm.title)) {
  alert("Validation", "Title should not contain numbers");
  return;
}
if (editForm.title.trim().length < 3) {
  alert("Validation", "Title must be at least 3 characters");
  return;
}
if (!editForm.description.trim()) {
  alert("Validation", "Description is required");
  return;
}
if (editForm.description.trim().length < 5) {
  alert("Validation", "Description must be at least 5 characters");
  return;
}
if (editForm.description.trim().length > 300) {
  alert("Validation", "Description cannot exceed 300 characters");
  return;
}
if (!editForm.employee.trim()) {
  alert("Validation", "Employee is required");
  return;
}

    setEditSubmitting(true);
    try {
      const updated = await updateAnomaly(editingAnomaly.id, {
        title:       editForm.title,
        description: editForm.description,
        severity:    editForm.severity as Anomaly["severity"],
        employee:    editForm.employee,
      });
      setData(prev =>
        prev.map(item => item.id === editingAnomaly.id ? updated : item)
      );
      setEditingAnomaly(null);
    } catch (err: unknown) {
      alert("Error", "Failed to update anomaly: " + errMsg(err));
    } finally {
      setEditSubmitting(false);
    }
  };

  const filtered = data
  .filter(item => showResolved ? item.resolved : !item.resolved)
  .filter(item => severityFilter === "ALL" ? true : item.severity === severityFilter);

  return (
    <div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
       <div>
  <h1 className="text-2xl font-bold text-gray-800">Anomaly Monitoring</h1>
  <p className="text-gray-500 text-sm">Detect and resolve attendance anomalies</p>
  {lastUpdated && (
    <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1.5">
      <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      Live · updated {lastUpdated.toLocaleTimeString()}
    </p>
  )}
</div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">

          {/* ADD ANOMALY */}
          <button
            disabled
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0B1E3F] text-white px-4 py-2 text-sm rounded-lg opacity-50 cursor-not-allowed"
          >
            + Add Anomaly
          </button>

          {/* SHOW RESOLVED */}
          <button
            onClick={() => setShowResolved(!showResolved)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition"
          >
            {showResolved ? "Hide Resolved" : "Show Resolved"}
          </button>

        </div>
      </div>

      {/* SEVERITY FILTER */}
<div className="flex flex-wrap gap-2 mb-4">
  {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(level => (
    <button
      key={level}
      onClick={() => setSeverityFilter(level)}
      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition
        ${severityFilter === level
          ? "bg-[#0B1E3F] text-white border-[#0B1E3F]"
          : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
        }`}
    >
      {level === "ALL" ? "All" : level.charAt(0) + level.slice(1).toLowerCase()}
    </button>
  ))}
</div>
      
      {fetchError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {fetchError}
        </div>
      )}

      {/* ALERT BAR */}
      {!showResolved && filtered.length > 0 && (
        <div className="mb-6 border border-red-300 bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          {filtered.length} anomalies require attention
        </div>
      )}

      {/* ANOMALY CARDS */}
      {loading ? (
        <div className="bg-white p-10 rounded-xl shadow-sm text-center text-gray-400">
          Loading anomalies...
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white p-10 rounded-xl shadow-sm text-center text-gray-400">
              No anomalies available
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                className={`border-l-4 rounded-xl p-5 shadow-sm bg-white flex flex-col md:flex-row justify-between gap-4
                ${severityStyle[item.severity as keyof typeof severityStyle]}`}
              >
                {/* LEFT CONTENT */}
                <div className="flex gap-4">
                  <div className="mt-1">
                    {item.title.includes("Exit") || item.title.includes("Entry") ? (
                      <ArrowLeftRight size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {formatTitle(item.title)}
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {item.severity}
                      </span>
                    </h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    <p className="text-gray-500 text-sm mt-1">{item.employee} • {item.time}</p>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">

                  {/* VIEW FACE */}
                  <button
                    onClick={() => item.image ? setViewingImage(item.image) : alert("Info", "No image available for this anomaly")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md transition
                    ${item.image
                      ? "border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer"
                      : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Eye size={14} />
                    View Face
                  </button>

                  {!item.resolved && (
                    <>
                      <button
                        onClick={() => {
                          setCorrectingId(item.id);
                          setCorrectionReason(correctionReasons[0]);
                          setCorrectionNotes("");
                        }}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition"
                      >
                        Manual Correct
                      </button>
                      <button
                        onClick={() => markResolved(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#0B1E3F] text-white rounded-md hover:opacity-90 transition"
                      >
                        ✓ Resolve
                      </button>
                    </>
                  )}

                  {/* EDIT + DELETE — always visible */}
                  <Pencil
                    size={18}
                    className="cursor-pointer text-slate-700 hover:text-black transition"
                    onClick={() => {
                      setEditingAnomaly(item);
                      setEditForm({
                        title:       item.title,
                        description: item.description,
                        severity:    item.severity,
                        employee:    item.employee,
                      });
                    }}
                  />
                  <Trash2
                    size={18}
                    className="cursor-pointer text-red-500 hover:text-red-700 transition"
                    onClick={() => handleDeleteAnomaly(item.id)}
                  />

                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MANUAL CORRECT MODAL */}
      {correctingId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 relative p-6">
            <button
              onClick={() => setCorrectingId(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-semibold mb-1">Manual Correction</h2>
            <p className="text-sm text-gray-500 mb-6">Provide correction details for this anomaly</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Correction Reason</label>
                <div className="relative mt-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setReasonOpen(!reasonOpen); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-[#0B1E3F]"
                  >
                    {correctionReason}
                    <span className="text-gray-400">▼</span>
                  </button>
                  {reasonOpen && (
                    <div
                      className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {correctionReasons.map((reason) => (
                        <div
                          key={reason}
                          onClick={() => { setCorrectionReason(reason); setReasonOpen(false); }}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                          {reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                <textarea
                  value={correctionNotes}
                  onChange={e => setCorrectionNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/30 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCorrectingId(null)}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleManualCorrect}
                disabled={submitting}
                className="flex-1 bg-[#0B1E3F] text-white rounded-lg py-2 text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Correction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ANOMALY MODAL */}
      {editingAnomaly !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 relative p-6">
            <button
              onClick={() => setEditingAnomaly(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-semibold mb-1">Edit Anomaly</h2>
            <p className="text-sm text-gray-500 mb-6">Update anomaly details</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/30 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Severity</label>
                <div className="relative mt-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSeverityOpen(!severityOpen); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-[#0B1E3F]"
                  >
                    {editForm.severity}
                    <span className="text-gray-400">▼</span>
                  </button>
                  {severityOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => (
                        <div
                          key={level}
                          onClick={() => { setEditForm({ ...editForm, severity: level }); setSeverityOpen(false); }}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                          {level.charAt(0) + level.slice(1).toLowerCase()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Employee</label>
                <input
                  value={editForm.employee}
                  onChange={e => setEditForm({ ...editForm, employee: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingAnomaly(null)}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editSubmitting}
                className="flex-1 bg-[#0B1E3F] text-white rounded-lg py-2 text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW FACE MODAL */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative p-6">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Face Image</h2>
            <img
              src={`data:image/jpeg;base64,${viewingImage}`}
              alt="Anomaly face"
              className="w-full rounded-xl object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "";
                alert("Error", "Failed to load image");
              }}
            />
            <button
              onClick={() => setViewingImage(null)}
              className="mt-4 w-full border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

   <AppDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        onConfirm={dialog.onConfirm}
        onClose={close}
      />

    </div>
  );
};

export default Anomalies;