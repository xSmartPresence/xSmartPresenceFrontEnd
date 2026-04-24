import { X, Trash2, AlertTriangle, Info } from "lucide-react";

type DialogType = "confirm" | "alert" | "danger";

interface AppDialogProps {
  open: boolean;
  type?: DialogType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const icons = {
  confirm: <AlertTriangle size={20} className="text-yellow-500" />,
  alert:   <Info size={20} className="text-blue-500" />,
  danger:  <Trash2 size={20} className="text-red-600" />,
};

const confirmBtnStyle = {
  confirm: "bg-[#0B1E3F] text-white hover:opacity-90",
  alert:   "bg-[#0B1E3F] text-white hover:opacity-90",
  danger:  "bg-red-600 text-white hover:bg-red-700",
};

const iconBg = {
  confirm: "bg-yellow-100",
  alert:   "bg-blue-100",
  danger:  "bg-red-100",
};

const AppDialog = ({
  open, type = "confirm", title, message,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  onConfirm, onClose,
}: AppDialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] px-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
        >
          <X size={18} />
        </button>

        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-full ${iconBg[type]}`}>
            {icons[type]}
          </div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          {type !== "alert" && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${confirmBtnStyle[type]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppDialog;