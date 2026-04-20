import {
  Search, Plus, X, Pencil, Trash2, Camera,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../services/employees.service";
import type { Employee } from "../types/employees.types";
import { apiFetch } from "../api/apiClient";
import { API_BASE } from "../config/api";

// ── Types for dropdowns ───────────────────────────────────────────────────
interface Department { id: number; name: string; }
interface Shift      { id: number; name: string; }

const Employees = () => {
  const [openModal, setOpenModal]             = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [search, setSearch]                   = useState("");
  const [employees, setEmployees]             = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  
  // ── Dropdown data ─────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts]           = useState<Shift[]>([]);

  const [openCamera, setOpenCamera]         = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing]       = useState(false);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const rafRef      = useRef<number>(0);

  const [modelReady,   setModelReady]   = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentPose,  setCurrentPose]  = useState<string | null>(null);
  const [tfStatus,     setTfStatus]     = useState("Loading face model…");

  const angles = [
    { label: "Look Straight (Front)",  check: "straight"       },
    { label: "Turn Slightly Left",     check: "slightly-left"  },
    { label: "Turn Left",              check: "left"           },
    { label: "Turn Slightly Right",    check: "slightly-right" },
    { label: "Turn Right",             check: "right"          },
  ];

  const currentStep = capturedImages.length;
  const targetPose  = angles[currentStep]?.check ?? null;
  const poseMatch   = faceDetected && currentPose === targetPose;
  const allCaptured = capturedImages.length >= angles.length;

  const [formData, setFormData] = useState({
    code: "", name: "", department_id: 0, shift_id: 0, faceRegistered: false,
  });
  
  const [deptOpen, setDeptOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // ── Fetch employees, departments, shifts on mount ────────────────────────
  useEffect(() => {
    getEmployees()
      .then(data => Array.isArray(data) ? setEmployees(data) : setEmployees([]))
      .catch(() => {})
      .finally(() => setLoadingEmployees(false));

  apiFetch<any[]>("/departments/")
  .then(data => {
    setDepartments(Array.isArray(data) ? data.map(d => ({ id: d.id, name: d.name ?? d.department_name })) : [])
  })
  .catch(err => console.error("Departments error:", err));

apiFetch<any[]>("/shifts/")
  .then(data => {
    setShifts(Array.isArray(data) ? data.map(s => ({ id: s.id, name: s.shift_name ?? s.name })) : [])
  })
  .catch(err => console.error("Shifts error:", err));
  }, []);

  useEffect(() => {
  const close = () => {
    setDeptOpen(false);
    setShiftOpen(false);
  };

  document.addEventListener("click", close);
  return () => document.removeEventListener("click", close);
}, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return ((parts[0]?.charAt(0) || "") + (parts[1]?.charAt(0) || "")).toUpperCase();
  };

  const detectPose = (keypoints: { x: number; y: number }[]): string | null => {
    const nose     = keypoints[1];
    const leftEye  = keypoints[33];
    const rightEye = keypoints[263];
    if (!nose || !leftEye || !rightEye) return null;
    const faceWidth  = Math.abs(rightEye.x - leftEye.x);
    const faceCenter = (leftEye.x + rightEye.x) / 2;
    const offset     = (faceCenter - nose.x) / faceWidth;
    if (offset > 0.25)  return "right";
    if (offset > 0.10)  return "slightly-right";
    if (offset < -0.25) return "left";
    if (offset < -0.10) return "slightly-left";
    return "straight";
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  // ── Load TF model once ───────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      await tf.setBackend("webgl");
      await tf.ready();
      const detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        { runtime: "tfjs", refineLandmarks: false, maxFaces: 1 }
      );
      detectorRef.current = detector;
      setModelReady(true);
      setTfStatus("");
    };
    load();
  }, []);

  // ── Start webcam ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!openCamera) return;
     navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
      if (videoRef.current) videoRef.current.srcObject = stream;
     })
     .catch(() => {
       alert("Camera access denied. Please allow camera permission and try again.");
       setOpenCamera(false);
    });
    return () => stopCamera();
  }, [openCamera]);

  // ── Detection loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!openCamera || !modelReady || allCaptured) return;

    const loop = async () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      const det    = detectorRef.current;

      if (video && canvas && det && video.readyState === 4) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d")!;

        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0);
        ctx.restore();

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width  = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        tempCanvas.getContext("2d")!.drawImage(video, 0, 0);
        const faces = await det.estimateFaces(tempCanvas);

        if (faces.length === 1) {
          const kps  = faces[0].keypoints;
          const pose = detectPose(kps);
          setFaceDetected(true);
          setCurrentPose(pose);
          setTfStatus("");

          const xs    = kps.map(k => k.x);
          const ys    = kps.map(k => k.y);
          const bx    = canvas.width - Math.max(...xs);
          const by    = Math.min(...ys);
          const bw    = Math.max(...xs) - Math.min(...xs);
          const bh    = Math.max(...ys) - Math.min(...ys);
          const color = pose === targetPose ? "#22c55e" : "#f59e0b";

          ctx.strokeStyle = color;
          ctx.lineWidth   = 3;
          ctx.strokeRect(bx - 10, by - 10, bw + 20, bh + 20);
          ctx.fillStyle = color;
          ctx.font      = "bold 14px sans-serif";
          ctx.fillText(
            pose === targetPose ? "✓ Good Position" : `Adjust: ${angles[currentStep]?.label}`,
            bx - 10, by - 15
          );
        } else {
          setFaceDetected(false);
          setCurrentPose(null);
          setTfStatus(faces.length === 0 ? "No face detected — move closer" : "Multiple faces — one person only");
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [openCamera, modelReady, currentStep, targetPose, allCaptured]);

  // ── Capture ───────────────────────────────────────────────────────────────
  const handleCapture = () => {
    if (!poseMatch || isCapturing || allCaptured) return;
    const video = videoRef.current;
    if (!video) return;
    setIsCapturing(true);
    const snap = document.createElement("canvas");
    snap.width  = video.videoWidth;
    snap.height = video.videoHeight;
    snap.getContext("2d")!.drawImage(video, 0, 0);
    const base64 = snap.toDataURL("image/jpeg", 0.8).split(",")[1];
    setCapturedImages(prev => [...prev, base64]);
    setIsCapturing(false);
  };

  // ── Enroll after 5 captures ──────────────────────────────────────────────
  useEffect(() => {
  const processEnrollment = async () => {
    if (capturedImages.length !== 5) return;

    // ✅ Add flow — just store photos, enroll after Save
    if (!editingEmployee) {
        alert("✅ 5 photos captured! Click Save to create employee and register face.");
        setOpenCamera(false);
        setOpenModal(true);
        return;
    }

    // ✅ Edit flow — employee exists, enroll immediately
    const result = await enrollEmployee(editingEmployee.code, capturedImages);

    if (!result.success) {
      const msg = result.message || "";
      if (msg.toLowerCase().includes("expected 5 photos"))
        alert("⚠️ Photo count error: " + msg);
      else if (msg.toLowerCase().includes("no face detected"))
        alert("😶 No face detected. Please retake — ensure your face is clearly visible.");
      else if (msg.toLowerCase().includes("multiple faces"))
        alert("👥 Multiple faces detected. Please ensure only one person is in frame.");
      else
        alert("Enrollment failed: " + msg);
      setCapturedImages([]);
      return;
    }

    setEmployees(prev =>
      prev.map(emp => emp.id === editingEmployee.id ? { ...emp, faceRegistered: true } : emp)
    );
    alert("✅ Face registered successfully!");
    setOpenCamera(false);
    setCapturedImages([]);
  };
  processEnrollment();
}, [capturedImages]);

  const enrollEmployee = async (employeeId: string, photos: string[]) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
       `${API_BASE}/employees/${employeeId}/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ photos }),
        }
      );
      const data = await response.json();
if (data.message === "Face registered" || data.status === "success") return { success: true };
if (data.message === "Face registered") return { success: true };
throw new Error("Enrollment failed");
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {

   if (!formData.code.trim()) {
    alert("Employee code is required");
    return;
  }

  if (!/^[A-Za-z0-9]+$/.test(formData.code.trim())) {
   alert("Employee code can only contain letters and numbers");
   return;
  }

  if (!formData.name.trim()) {
    alert("Employee name is required");
    return;
  }

 if (formData.name.trim().length < 3) {
  alert("Employee name must be at least 3 characters");
  return;
 }

  if (!formData.department_id) {
    alert("Please select a department");
    return;
  }
  if (!formData.shift_id) {
    alert("Please select a shift");
    return;
  }  

  const confirmed = window.confirm(
    editingEmployee
      ? `Are you sure you want to update ${formData.name}?`
      : `Are you sure you want to add ${formData.name}?`
  );
  if (!confirmed) return;
  setSaving(true);
  try {
      const payload: any = {
        employee_id:   formData.code,
        full_name:     formData.name,
        department_id: formData.department_id,  
        shift_id:      formData.shift_id,       
        is_active: editingEmployee ? editingEmployee.active : true,
      };

     if (editingEmployee) {
  await updateEmployee(editingEmployee.code, payload);
  const fresh = await getEmployees();
  setEmployees(Array.isArray(fresh) ? fresh : []);
} else {
  try {
    await createEmployee(payload);
    if (capturedImages.length === 5) {
      const result = await enrollEmployee(formData.code, capturedImages);
      if (result.success) {
        alert("✅ Face registered successfully!");
      } else {
        alert("Employee created but face enrollment failed: " + result.message);
      }
    }
    const fresh = await getEmployees();
    setEmployees(Array.isArray(fresh) ? fresh : []);
    setCapturedImages([]);
  } catch (err: any) {
    if (err.message.includes("400") || err.message.includes("409")) {
      alert(`⚠️ Employee with code "${formData.code}" already exists. Please use a different code.`);
    } else {
      alert("Failed to create employee: " + err.message);
    }
    return;
  }
}

      setOpenModal(false);
      setEditingEmployee(null);
      setFormData({ code: "", name: "", department_id: 0, shift_id: 0, faceRegistered: false });

   
  } catch (err: any) {
    alert("Failed to save employee: " + err.message);
  } finally {
    setSaving(false);  
  }
};

  const handleDelete = async (code: string) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete employee ${code}? This action cannot be undone.`
  );
  if (!confirmed) return;

  try {
    await deleteEmployee(code);
    setEmployees(prev => prev.filter(emp => emp.code !== code));
  } catch (err: any) {
    alert("Failed to delete employee: " + err.message);
  }
};

  const filteredEmployees = employees.filter(
    emp =>
      (emp.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (emp.code ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
  setFormData({
    code: "",
    name: "",
    department_id: 0,
    shift_id: 0,
    faceRegistered: false,
  });
  setEditingEmployee(null);
};

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-gray-500 text-sm">Manage employee records and face registration</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

  {/* SEARCH */}
  <div className="order-2 sm:order-1 relative w-full sm:w-64">
    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
    <input
      type="text"
      placeholder="Search Employee..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
    />
  </div>

  {/* ADD BUTTON */}
  <button
    onClick={() => { setEditingEmployee(null); setOpenModal(true); }}
   className="order-1 sm:order-2 w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0B1E3F] text-white px-4 py-2 text-sm rounded-lg hover:opacity-90 transition"
  >
    <Plus size={16} /> Add Employee
  </button>

</div>

      {/* GRID */}
      {loadingEmployees ? (
        <p className="text-gray-400 text-sm">Loading employees...</p>
      ) : (
       <>
        {filteredEmployees.length === 0 ? (
           <div className="col-span-3 text-center py-10 text-gray-400">
              {search ? "No employees match your search" : "No employees found"}
          </div>
      ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
       {filteredEmployees.map(emp => (
            <div key={emp.id} className="bg-white p-4 rounded-xl shadow relative">
              <span className={`absolute top-4 right-4 w-3 h-3 rounded-full ${emp.active ? "bg-green-500" : "bg-gray-400"}`} />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-[#0B1E3F]">
                  {getInitials(emp.name)}
                </div>
                <div>
                  <h3 className="font-semibold">{emp.name}</h3>
                  <p className="text-xs text-gray-500">{emp.code}</p>
                </div>
              </div>
              <p className="text-xs mt-3">Dept: <span className="font-medium">{emp.department}</span></p>
              <p className="text-xs">Shift: <span className="font-medium">{emp.shift}</span></p>
              <p className="text-xs mt-2">
                Face:{" "}
                <span className={emp.faceRegistered ? "text-green-600" : "text-yellow-600"}>
                  {emp.faceRegistered ? "Registered" : "Pending"}
                </span>
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    const deptId  = departments.find(d => d.name === emp.department)?.id ?? 0;
                    const shiftId = shifts.find(s => s.name === emp.shift)?.id ?? 0;
                    setEditingEmployee(emp);
                    setFormData({
                      code: emp.code,
                      name: emp.name,
                      department_id: deptId,
                      shift_id: shiftId,
                      faceRegistered: emp.faceRegistered,
                    });
                    setOpenModal(true);
                  }}
                  className="flex-1 bg-gray-100 rounded py-1 text-sm flex items-center justify-center gap-1"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(emp.code)} className="bg-red-100 text-red-600 px-2 rounded">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
  )}
  </> 
)}
        

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 relative p-6">
            <button onClick={() => {
                  setOpenModal(false);
                     resetForm();
            }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <X size={18} />
            </button>
            <h2 className="text-xl font-semibold mb-6">
              {editingEmployee ? "Edit Employee" : "Add New Employee"}
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">Employee Code</label>
                <input
  value={formData.code}
  onChange={e => setFormData({ ...formData, code: e.target.value })}
  placeholder="EMP001"
 className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B1E3F]/30"
/>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B1E3F]/30"
                />
              </div>

              {/* DEPARTMENT DROPDOWN */}
              <div>
                <label className="text-sm font-medium text-gray-700">Department</label>
                <div className="relative mt-1">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setDeptOpen(!deptOpen);
    }}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-left flex justify-between items-center"
  >
    {departments.find(d => d.id === formData.department_id)?.name || "Select Department"}
    <span className="text-gray-400">▼</span>
  </button>

  {deptOpen && (
    <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">
      {departments.map((d) => (
        <div
          key={d.id}
          onClick={() => {
            setFormData({ ...formData, department_id: d.id });
            setDeptOpen(false);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
        >
          {d.name}
        </div>
      ))}
    </div>
  )}
</div>
              </div>

              {/* SHIFT DROPDOWN */}
              <div>
                <label className="text-sm font-medium text-gray-700">Shift</label>
                <div className="relative mt-1">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setShiftOpen(!shiftOpen);
    }}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-left flex justify-between items-center"
  >
    {shifts.find(s => s.id === formData.shift_id)?.name || "Select Shift"}
    <span className="text-gray-400">▼</span>
  </button>

  {shiftOpen && (
    <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">
      {shifts.map((s) => (
        <div
          key={s.id}
          onClick={() => {
            setFormData({ ...formData, shift_id: s.id });
            setShiftOpen(false);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
        >
          {s.name}
        </div>
      ))}
    </div>
  )}
</div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
  onClick={() => {
    if (editingEmployee?.faceRegistered || formData.faceRegistered) {
      alert("✅ Face already registered for this employee.");
      return;
    }
    setCapturedImages([]);
    setOpenModal(false);
    setOpenCamera(true);
  }}
  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg py-2 transition"
>
  <Camera size={16} />
  {editingEmployee?.faceRegistered || formData.faceRegistered ? "Face Registered ✅" : "Register Face"}
</button>
            
<button
  onClick={handleSave}
  disabled={saving}
  className="flex-1 bg-[#0B1E3F] text-white rounded-lg py-2 hover:opacity-90 transition disabled:opacity-50"
>
  {saving ? "Saving..." : "Save"}
</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA */}
      {openCamera && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg relative">
            <button
              onClick={() => { stopCamera(); setCapturedImages([]); setOpenCamera(false); }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition"
            >
              <X size={20} />
            </button>
            <div className="relative w-full rounded overflow-hidden bg-black">
              <video ref={videoRef} autoPlay muted className="w-full" style={{ transform: "scaleX(-1)" }} />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            </div>
            <div className="flex gap-1 mt-3">
              {angles.map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
                  i < capturedImages.length ? "bg-green-500" : i === currentStep ? "bg-blue-500" : "bg-gray-200"
                }`} />
              ))}
            </div>
            <div className="mt-3 text-center">
              {!allCaptured ? (
                <>
                  <p className="font-semibold text-base">
                    Step {currentStep + 1} / {angles.length}: {angles[currentStep]?.label}
                  </p>
                  <p className={`text-sm mt-1 font-medium ${poseMatch ? "text-green-600" : "text-amber-500"}`}>
                    {!modelReady ? "Loading model…"
                      : !faceDetected ? tfStatus || "No face detected — move closer"
                      : poseMatch ? "✅ Perfect! Press Capture"
                      : `↩️ ${angles[currentStep]?.label}`}
                  </p>
                </>
              ) : (
                <p className="font-semibold text-green-600">All angles captured — sending to server…</p>
              )}
            </div>
            {!allCaptured && (
              <button
                onClick={handleCapture}
                disabled={!poseMatch || isCapturing}
                className={`mt-4 w-full py-2 rounded-lg text-white font-medium transition ${
                  poseMatch && !isCapturing ? "bg-[#0B1E3F] hover:opacity-90" : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Capture ({capturedImages.length} / {angles.length})
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Employees;
