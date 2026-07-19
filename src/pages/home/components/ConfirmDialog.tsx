interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '確認',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-sm rounded-xl bg-background-100 border border-background-200 overflow-hidden animate-fade-in">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-900/40 text-primary-400 flex items-center justify-center shrink-0">
              <i className="ri-alert-line text-lg"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground-950">{title}</h3>
              <p className="mt-1 text-sm text-foreground-600 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 bg-background-200 border-t border-background-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-md text-sm text-foreground-700 bg-background-100 border border-background-300 hover:bg-background-200 whitespace-nowrap"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-md text-sm text-white bg-rose-600 hover:bg-rose-500 whitespace-nowrap"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}