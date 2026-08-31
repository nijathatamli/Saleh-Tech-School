"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "uploading" | "success" | "error";

export function DashFileUpload({
  label,
  onUploaded,
  accept = "image/png,image/jpeg,image/webp",
  className,
}: {
  label: string;
  onUploaded: (url: string) => void | Promise<void>;
  accept?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      await onUploaded(data.url);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" id={`file-${label}`} />
      <label
        htmlFor={`file-${label}`}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dash-rule bg-white px-3.5 py-2 text-xs font-semibold text-dash-ink transition-colors hover:bg-dash-paper-2",
          "dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
          status === "uploading" && "pointer-events-none opacity-60"
        )}
      >
        {status === "uploading" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : status === "success" ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : status === "error" ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {label}
      </label>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
