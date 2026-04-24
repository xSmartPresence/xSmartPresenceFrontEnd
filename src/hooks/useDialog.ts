import { useState, useCallback } from "react";

interface DialogState {
  open: boolean;
  title: string;
  message: string;
  type: "confirm" | "alert" | "danger";
  confirmLabel: string;
  onConfirm: () => void;
}

const DEFAULT: DialogState = {
  open: false, title: "", message: "",
  type: "confirm", confirmLabel: "Confirm",
  onConfirm: () => {},
};

export const useDialog = () => {
  const [dialog, setDialog] = useState<DialogState>(DEFAULT);

  const confirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { type?: "confirm" | "danger"; confirmLabel?: string }
  ) => {
    setDialog({
      open: true, title, message,
      type: options?.type ?? "confirm",
      confirmLabel: options?.confirmLabel ?? "Confirm",
      onConfirm,
    });
  }, []);

  const alert = useCallback((title: string, message: string) => {
    setDialog({
      open: true, title, message,
      type: "alert", confirmLabel: "OK",
      onConfirm: () => {},
    });
  }, []);

  const close = useCallback(() =>
    setDialog(prev => ({ ...prev, open: false }))
  , []);

  return { dialog, confirm, alert, close };
};