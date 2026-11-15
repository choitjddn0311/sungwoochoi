// 작업물 등록 화면(WorkManager, ProjectForm)이 함께 쓰는 입력 칸과 폼 아래 버튼.

export const inputClass =
  "min-w-0 w-full border-b border-line bg-transparent py-2 text-[16px] outline-none placeholder:text-muted focus:border-foreground";

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="grid min-w-0 gap-1">
      <span className="flex justify-between gap-3">
        <span className="text-[13.5px]">{label}</span>
        {hint && <span className="meta text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function FormFoot({
  error,
  onCancel,
  onConfirm,
  confirmLabel,
}: {
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
}) {
  return (
    <div className="grid gap-3 border-t border-line pt-4">
      {error && (
        <p role="alert" className="text-[14px]">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className="tap border border-line px-5 text-[15px]" onClick={onCancel}>
          취소
        </button>
        <button type="button" className="tap bg-foreground px-6 text-[15px] text-background" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
