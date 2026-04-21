import { useState, useEffect } from "react";
import {
  Shield, Users, Save, Plus, X, Pencil, Trash2,
} from "lucide-react";
import {
  getSystemSettings, updateSystemSettings,
  getHolidays, createHoliday, deleteHoliday,
  getAdminUsers, deleteAdminUser, createAdminUser,
  updateAdminUser,
} from "../services/settings.service";
import type { SystemSettings, Holiday, AdminUser, CreateHolidayPayload } from "../types/settings.types";

const errMsg = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

const Settings = () => {
  const [activeTab, setActiveTab] = useState("system");

  // ── System settings state ─────────────────────────────────────────────
  const [settings, setSettings] = useState<SystemSettings>({
    confidenceThreshold: 80,
    duplicateWindow: 30,
    gracePeriod: 15,
    overtimeAfter: 9,
  });
  const [editModal, setEditModal]       = useState(false);
  const [editingUser, setEditingUser]   = useState<AdminUser | null>(null);
  const [editForm, setEditForm]         = useState({
    name: "", email: "", role: "admin", status: "Active",
  });

  // ── Holidays state ────────────────────────────────────────────────────
  const [holidays, setHolidays]         = useState<Holiday[]>([]);
  const [showHolidays, setShowHolidays] = useState(false);
  const [holidayModal, setHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm]   = useState<CreateHolidayPayload>({
    name: "", holiday_date: "", type: "Public",
  });
  const [holidayTypeOpen, setHolidayTypeOpen] = useState(false);
  const [savingHoliday, setSavingHoliday]     = useState(false);

  // ── Users state ───────────────────────────────────────────────────────
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [adminModal, setAdminModal]     = useState(false);
  const [adminForm, setAdminForm]       = useState({
    name: "", email: "", role: "Admin", password: "",
  });
  const [creatingAdmin, setCreatingAdmin]   = useState(false);
  const [updatingUser, setUpdatingUser]     = useState(false);
  const [adminRoleOpen, setAdminRoleOpen]   = useState(false);
  const [editRoleOpen, setEditRoleOpen]     = useState(false);
  const [editStatusOpen, setEditStatusOpen] = useState(false);

  // ── Fetch on mount ────────────────────────────────────────────────────
  useEffect(() => {
    getSystemSettings()
      .then(setSettings)
      .catch(err => console.error("Failed to load settings:", err));

    getHolidays()
      .then(setHolidays)
      .catch(err => console.error("Failed to load holidays:", err));

    getAdminUsers()
      .then(setUsers)
      .catch(err => console.error("Failed to load users:", err));
  }, []);

  useEffect(() => {
    const close = () => {
      setHolidayTypeOpen(false);
      setAdminRoleOpen(false);
      setEditRoleOpen(false);
      setEditStatusOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // ── Save system settings ──────────────────────────────────────────────
  const handleSaveSettings = async () => {
    if (settings.duplicateWindow < 1) {
      alert("Duplicate window must be at least 1 second");
      return;
    }
    if (settings.gracePeriod < 0) {
      alert("Grace period cannot be negative");
      return;
    }
    if (settings.overtimeAfter < 1) {
      alert("Overtime hours must be at least 1");
      return;
    }

    try {
      await updateSystemSettings({
        confidence_threshold:     settings.confidenceThreshold / 100,
        duplicate_window_seconds: settings.duplicateWindow,
        grace_minutes:            settings.gracePeriod,
        working_hours:            settings.overtimeAfter,
        overtime_after_minutes:   settings.overtimeAfter * 60,
      });
      alert("✅ Settings saved successfully!");
    } catch (err: unknown) {
      alert("Failed to save settings: " + errMsg(err));
    }
  };

  // ── Add holiday ───────────────────────────────────────────────────────
  const handleAddHoliday = async () => {
    if (!holidayForm.name.trim()) {
      alert("Holiday name is required");
      return;
    }
    if (!holidayForm.holiday_date) {
      alert("Please select a holiday date");
      return;
    }
    if (new Date(holidayForm.holiday_date) < new Date(new Date().toDateString())) {
      alert("Holiday date cannot be in the past");
      return;
    }

    setSavingHoliday(true);
    try {
      const created = await createHoliday(holidayForm);
      setHolidays(prev => [...prev, created]);
      setHolidayModal(false);
      setHolidayForm({ name: "", holiday_date: "", type: "Public" });
    } catch (err: unknown) {
      alert("Failed to add holiday: " + errMsg(err));
    } finally {
      setSavingHoliday(false);
    }
  };

  // ── Delete holiday ────────────────────────────────────────────────────
  const handleDeleteHoliday = async (id: number) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await deleteHoliday(id);
      setHolidays(prev => prev.filter(h => h.id !== id));
    } catch (err: unknown) {
      alert("Failed to delete holiday: " + errMsg(err));
    }
  };

  // ── Create admin ──────────────────────────────────────────────────────
  const handleCreateAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      alert("Please fill all fields");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminForm.email)) {
      alert("Please enter a valid email address");
      return;
    }
    if (adminForm.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    if (adminForm.name.trim().length < 3) {
      alert("Name must be at least 3 characters");
      return;
    }

    setCreatingAdmin(true);
    try {
      await createAdminUser(adminForm);
      const updatedUsers = await getAdminUsers();
      setUsers(updatedUsers);
      setAdminModal(false);
      setAdminForm({ name: "", email: "", role: "admin", password: "" });
    } catch (err: unknown) {
      alert("Failed to create admin: " + errMsg(err));
    } finally {
      setCreatingAdmin(false);
    }
  };

  // ── Delete user ───────────────────────────────────────────────────────
  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteAdminUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: unknown) {
      alert("Failed to delete user: " + errMsg(err));
    }
  };

  // ── Update user ───────────────────────────────────────────────────────
  const handleUpdateUser = async () => {
    if (!editingUser || updatingUser) return;

    if (!editForm.name.trim()) {
      alert("Name is required");
      return;
    }
    if (!editForm.email.trim()) {
      alert("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      alert("Please enter a valid email address");
      return;
    }

    setUpdatingUser(true);
    try {
      await updateAdminUser(editingUser.id, {
        name:   editForm.name,
        email:  editForm.email,
        role:   editForm.role,
        status: editForm.status,
      });
      const updatedUsers = await getAdminUsers();
      setUsers(updatedUsers);
      setEditModal(false);
      setEditingUser(null);
    } catch (err: unknown) {
      alert("Failed to update user: " + errMsg(err));
    } finally {
      setUpdatingUser(false);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm">System configuration and user management</p>
      </div>

      {/* TABS */}
      <div className="mb-6">
        <div className="inline-flex bg-gray-200 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition ${
              activeTab === "system" ? "bg-white shadow-sm text-slate-900" : "text-gray-600"
            }`}
          >
            <Shield size={16} /> System
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition ${
              activeTab === "users" ? "bg-white shadow-sm text-slate-900" : "text-gray-600"
            }`}
          >
            <Users size={16} /> Users
          </button>
        </div>
      </div>

      {/* SYSTEM TAB */}
      {activeTab === "system" && (
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm p-4 sm:p-5 space-y-6">

          {/* CONFIDENCE */}
          <div>
            <label className="block mb-2 text-sm font-semibold">
              Recognition Confidence Threshold
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range" min="50" max="100"
                value={settings.confidenceThreshold}
                onChange={e => setSettings({ ...settings, confidenceThreshold: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
              <span className="text-sm whitespace-nowrap">{settings.confidenceThreshold}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Minimum confidence score for accepting face recognition (default: 80%)
            </p>
          </div>

          {/* INPUT GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">Duplicate Window (seconds)</label>
              <input
                type="number"
                value={settings.duplicateWindow}
                onChange={e => setSettings({ ...settings, duplicateWindow: Number(e.target.value) })}
                className="w-full rounded-lg px-3 py-2 text-sm bg-gray-100 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Grace Period (minutes)</label>
              <input
                type="number"
                value={settings.gracePeriod}
                onChange={e => setSettings({ ...settings, gracePeriod: Number(e.target.value) })}
                className="w-full rounded-lg px-3 py-2 text-sm bg-gray-100 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Overtime After (hours)</label>
              <input
                type="number"
                value={settings.overtimeAfter}
                onChange={e => setSettings({ ...settings, overtimeAfter: Number(e.target.value) })}
                className="w-full rounded-lg px-3 py-2 text-sm bg-gray-100 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* HOLIDAY CONFIG */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold">Holiday Configuration</h3>
              <button
                onClick={() => setShowHolidays(prev => !prev)}
                className="text-xs bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200 transition"
              >
                {showHolidays ? "Hide Holidays" : `View Holidays (${holidays.length})`}
              </button>
            </div>
            <div className="bg-gray-100 text-gray-600 text-xs rounded-lg px-4 py-3 mb-4">
              Configure public holidays and company-specific holidays. Attendance on holidays will be tracked as overtime.
            </div>

            {/* HOLIDAYS LIST */}
            {showHolidays && holidays.length > 0 && (
              <div className="mb-4 space-y-2">
                {holidays.map((h, index) => (
                  <div
                    key={h.id ?? `holiday-${index}`}
                    className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg text-sm gap-2"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{h.name}</span>
                      <span className="text-gray-500 text-xs">{h.date}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{h.type}</span>
                      <button
                        onClick={() => handleDeleteHoliday(h.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setHolidayModal(true)}
              className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm bg-white hover:bg-gray-100 transition"
            >
              <Plus size={14} /> Add Holiday
            </button>
          </div>

          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 bg-[#0B1E3F] text-white px-5 py-2 rounded-lg text-sm hover:opacity-90 transition"
          >
            <Save size={14} /> Save Settings
          </button>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex sm:justify-end">
            <button
              onClick={() => setAdminModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0B1E3F] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition"
            >
              <Plus size={16} /> Create Admin
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">No users found</td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-900 font-medium">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        user.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-4">
                      <Pencil
                        size={18}
                        className="cursor-pointer text-slate-900 hover:text-blue-600"
                        onClick={() => {
                          setEditingUser(user);
                          setEditForm({
                            name:   user.name,
                            email:  user.email,
                            role:   user.role,
                            status: user.status,
                          });
                          setEditModal(true);
                        }}
                      />
                      <Trash2
                        size={18}
                        className="cursor-pointer text-red-600 hover:text-red-800"
                        onClick={() => handleDeleteUser(user.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HOLIDAY MODAL */}
      {holidayModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center sm:items-start justify-center z-[9999] px-4 pt-6 sm:pt-10 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative my-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setHolidayModal(false)} className="absolute right-4 top-4 text-gray-500">
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Holiday</h2>
            <div className="space-y-4">
              <input
                placeholder="Holiday Name"
                value={holidayForm.name}
                onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <label className="text-sm font-medium text-gray-600 mb-1 block">Holiday Date</label>
              <input
                type="date"
                value={holidayForm.holiday_date}
                onChange={e => setHolidayForm({ ...holidayForm, holiday_date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700"
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setHolidayTypeOpen(!holidayTypeOpen); }}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white text-left flex justify-between items-center"
                >
                  {holidayForm.type}
                  <span className="text-gray-400">▼</span>
                </button>
                {holidayTypeOpen && (
                  <div
                    className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {["Public", "Company"].map((type) => (
                      <div
                        key={type}
                        onClick={() => { setHolidayForm({ ...holidayForm, type }); setHolidayTypeOpen(false); }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setHolidayModal(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleAddHoliday}
                disabled={savingHoliday}
                className="bg-[#0B1E3F] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
              >
                {savingHoliday ? "Saving..." : "Save Holiday"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN MODAL */}
      {adminModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setAdminModal(false)} className="absolute top-4 right-4 text-gray-500">
              <X size={18} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Create Admin</h2>
            <div className="space-y-4">
              <input
                placeholder="Full Name"
                value={adminForm.name}
                onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                placeholder="Email"
                value={adminForm.email}
                onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAdminRoleOpen(!adminRoleOpen); }}
                  className="w-full border rounded-lg px-3 py-2 bg-white text-left flex justify-between items-center"
                >
                  {adminForm.role}
                  <span className="text-gray-400">▼</span>
                </button>
                {adminRoleOpen && (
                  <div
                    className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[
                      { label: "Admin",       value: "admin"       },
                      { label: "HR",          value: "hr"          },
                      { label: "Super Admin", value: "super_admin" },
                    ].map((role) => (
                      <div
                        key={role.value}
                        onClick={() => { setAdminForm({ ...adminForm, role: role.value }); setAdminRoleOpen(false); }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {role.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="password"
                placeholder="Password"
                value={adminForm.password}
                onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setAdminModal(false)}
                className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdmin}
                disabled={creatingAdmin}
                className="flex-1 bg-[#0B1E3F] text-white rounded-lg py-2 text-sm hover:opacity-90 disabled:opacity-50"
              >
                {creatingAdmin ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setEditModal(false)} className="absolute top-4 right-4 text-gray-500">
              <X size={18} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Edit User</h2>
            <div className="space-y-4">
              <input
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />

              {/* ROLE */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditRoleOpen(!editRoleOpen); }}
                  className="w-full border rounded-lg px-3 py-2 bg-white text-left flex justify-between items-center"
                >
                  {editForm.role}
                  <span className="text-gray-400">▼</span>
                </button>
                {editRoleOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">
                    {[
                      { label: "Admin",       value: "admin"       },
                      { label: "HR",          value: "hr"          },
                      { label: "Super Admin", value: "super_admin" },
                    ].map((role) => (
                      <div
                        key={role.value}
                        onClick={() => { setEditForm({ ...editForm, role: role.value }); setEditRoleOpen(false); }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {role.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* STATUS */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditStatusOpen(!editStatusOpen); }}
                  className="w-full border rounded-lg px-3 py-2 bg-white text-left flex justify-between items-center"
                >
                  {editForm.status}
                  <span className="text-gray-400">▼</span>
                </button>
                {editStatusOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">
                    {["Active", "Inactive"].map((status) => (
                      <div
                        key={status}
                        onClick={() => { setEditForm({ ...editForm, status }); setEditStatusOpen(false); }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {status}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditModal(false)}
                className="flex-1 border rounded-lg py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={updatingUser}
                className="flex-1 bg-[#0B1E3F] text-white rounded-lg py-2 text-sm disabled:opacity-50"
              >
                {updatingUser ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;