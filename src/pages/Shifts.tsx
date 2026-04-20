import { useState, useEffect } from "react";
import { Plus, Clock, Building2, X, Pencil, Trash2 } from "lucide-react";
import {
  getShifts, createShift, updateShift, deleteShift,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
} from "../services/shifts.service";
import type { Shift, Department, CreateShiftPayload, CreateDepartmentPayload } from "../types/shifts.types";

const Shifts = () => {
  const [activeTab, setActiveTab] = useState("shifts");
  const [openModal, setOpenModal] = useState(false);

  // ── State ─────────────────────────────────────────────────────────────────
  const [shifts, setShifts]           = useState<Shift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  const [editingShift, setEditingShift]           = useState<Shift | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const [shiftForm, setShiftForm] = useState<CreateShiftPayload>({
    shift_name: "", start_time: "", end_time: "", grace_minutes: 0, overtime_minutes: 0,
  });

  const [deptForm, setDeptForm] = useState<CreateDepartmentPayload>({
    name: "", head: "", employee_count: 0,
  });

  // ── Fetch on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getShifts(), getDepartments()])
      .then(([s, d]) => { setShifts(s); setDepartments(d); })
      .catch(err => {
        console.error("Failed to load:", err);
        setError("Failed to load data. Please refresh."); // ✅ inside .catch()
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Open modal helpers ────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingShift(null);
    setEditingDepartment(null);
    setShiftForm({ shift_name: "", start_time: "", end_time: "", grace_minutes: 0, overtime_minutes: 0 });
    setDeptForm({ name: "", head: "", employee_count: 0 });
    setOpenModal(true);
  };

  const openEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShiftForm({
      shift_name:       shift.name,
      start_time:       shift.startTime,
      end_time:         shift.endTime,
      grace_minutes:    shift.graceMinutes,
      overtime_minutes: Number(shift.overtimeRule) || 0,
    });
    setOpenModal(true);
  };

  const openEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setDeptForm({
      name:           dept.name,
      head:           dept.head,
      employee_count: dept.employeeCount,
    });
    setOpenModal(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {

    // ✅ Shift validations
    if (activeTab === "shifts") {
      if (!shiftForm.shift_name.trim()) {
        alert("Shift name is required");
        return;
      }
      if (!shiftForm.start_time) {
        alert("Start time is required");
        return;
      }
      if (!shiftForm.end_time) {
        alert("End time is required");
        return;
      }
      const start = new Date(`1970-01-01T${shiftForm.start_time}`);
      let end = new Date(`1970-01-01T${shiftForm.end_time}`);

      // 👉 Handle overnight shift (cross midnight)
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
 
      // ❗ Prevent same time
      if (start.getTime() === end.getTime()) {
        alert("Start and end time cannot be same");
        return;
      }
      if (shiftForm.grace_minutes < 0) {
        alert("Grace minutes cannot be negative");
        return;
      }
      if ((shiftForm.overtime_minutes ?? 0) < 0) {
         alert("Overtime minutes cannot be negative");
         return;
     } 
    }

    // ✅ Department validations
    if (activeTab === "departments") {
      if (!deptForm.name.trim()) {
        alert("Department name is required");
        return;
      }
      if (deptForm.employee_count < 0) {
        alert("Employee count cannot be negative");
        return;
      }
    }

    setSaving(true);

    try {
      if (activeTab === "shifts") {
        if (editingShift) {
          // ✅ Update existing shift
          const updated = await updateShift(editingShift.id, shiftForm);
          setShifts(prev => prev.map(s => s.id === editingShift.id ? updated : s));
        } else {
          // ✅ Duplicate check only for new shifts
          const duplicate = shifts.find(
            s => s.name.toLowerCase() === shiftForm.shift_name.toLowerCase()
          );
          if (duplicate) {
            alert(`⚠️ Shift "${shiftForm.shift_name}" already exists.`);
            return;
          }
          const created = await createShift(shiftForm);
          setShifts(prev => [...prev, created]);
        }
      } else {
        if (editingDepartment) {
          // ✅ Update existing department
          const updated = await updateDepartment(editingDepartment.id, deptForm);
          setDepartments(prev => prev.map(d => d.id === editingDepartment.id ? updated : d));
        } else {
          // ✅ Duplicate check only for new departments
          const duplicate = departments.find(
            d => d.name.toLowerCase() === deptForm.name.toLowerCase()
          );
          if (duplicate) {
            alert(`⚠️ Department "${deptForm.name}" already exists.`);
            return;
          }
          const created = await createDepartment(deptForm);
          setDepartments(prev => [...prev, created]);
        }
      }
      setOpenModal(false);
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false); // ✅ always resets
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteShift = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this shift?")) return;
    try {
      await deleteShift(id);
      setShifts(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert("Failed to delete shift: " + err.message);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      alert("Failed to delete department: " + err.message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Shifts & Departments</h1>
        <p className="text-gray-500 text-sm">Manage work shifts and organizational departments</p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* TABS + BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">

        {/* TABS */}
        <div className="w-fit bg-gray-200 rounded-xl p-1 order-1">
          <div className="flex">
            <button
              onClick={() => setActiveTab("shifts")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "shifts"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-gray-600 hover:text-slate-900"
              }`}
            >
              <Clock size={16} /> Shifts
            </button>
            <button
              onClick={() => setActiveTab("departments")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "departments"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-gray-600 hover:text-slate-900"
              }`}
            >
              <Building2 size={16} /> Departments
            </button>
          </div>
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={openAddModal}
          className="order-2 w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0B1E3F] text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition text-sm"
        >
          <Plus size={16} />
          {activeTab === "shifts" ? "Add Shift" : "Add Department"}
        </button>
      </div>

      {/* CONTENT */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-10">Loading...</p>
        ) : activeTab === "shifts" ? (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Shift Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Start</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">End</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Grace (min)</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Overtime Rule</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">No shifts found</td></tr>
              ) : shifts.map(shift => (
                <tr key={shift.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{shift.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{shift.startTime}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{shift.endTime}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{shift.graceMinutes}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {shift.overtimeRule && shift.overtimeRule !== "0" ? `After ${shift.overtimeRule} min` : "-"}
                  </td>
                  <td className="px-4 py-3 flex gap-4">
                    <button onClick={() => openEditShift(shift)} className="cursor-pointer text-slate-700 hover:text-black transition">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDeleteShift(shift.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {departments.length === 0 ? (
              <p className="text-gray-400 col-span-3 text-center py-10">No departments found</p>
            ) : departments.map(dept => (
              <div key={dept.id} className="bg-white border border-gray-50 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
                    <Building2 size={18} className="text-[#0B1E3F]" />
                    {dept.name}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => openEditDepartment(dept)} className="text-slate-700 hover:text-black">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDeleteDepartment(dept.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 text-gray-600 text-sm space-y-1">
                  <p>Head: <span className="text-slate-800">{dept.head || "-"}</span></p>
                  <p>Employees: <span className="text-slate-800">{dept.employeeCount}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 relative">
            <button onClick={() => setOpenModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black">
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-6">
              {activeTab === "shifts"
                ? editingShift ? "Edit Shift" : "Add New Shift"
                : editingDepartment ? "Edit Department" : "Add New Department"}
            </h2>

            {activeTab === "shifts" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Shift Name</label>
                  <input
                    placeholder="Shift Name"
                    value={shiftForm.shift_name}
                    onChange={e => setShiftForm({ ...shiftForm, shift_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Start Time</label>
                    <input
                      type="time"
                      value={shiftForm.start_time}
                      onChange={e => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">End Time</label>
                    <input
                      type="time"
                      value={shiftForm.end_time}
                      onChange={e => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Grace Minutes</label>
                  <input
                    placeholder="Grace Minutes"
                    type="number"
                    value={shiftForm.grace_minutes}
                    onChange={e => setShiftForm({ ...shiftForm, grace_minutes: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Overtime Minutes</label>
                  <input
                    placeholder="Overtime Minutes (e.g. 540)"
                    type="number"
                    value={shiftForm.overtime_minutes}
                    onChange={e => setShiftForm({ ...shiftForm, overtime_minutes: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Department Name</label>
                  <input
                    placeholder="Department Name"
                    value={deptForm.name}
                    onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Department Head</label>
                  <input
                    placeholder="Department Head"
                    value={deptForm.head}
                    onChange={e => setDeptForm({ ...deptForm, head: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Number of Employees</label>
                  <input
                    placeholder="Number of Employees"
                    type="number"
                    value={deptForm.employee_count}
                    onChange={e => setDeptForm({ ...deptForm, employee_count: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setOpenModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-[#0B1E3F] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Shifts;