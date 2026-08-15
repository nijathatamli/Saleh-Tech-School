"use client";

import { useState, useTransition } from "react";
import { Check, X, Clock, FileCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { markAttendance } from "./actions";

type Status = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

const options: { status: Status; label: string; icon: typeof Check; activeClass: string }[] = [
  { status: "PRESENT", label: "İştirak", icon: Check, activeClass: "bg-emerald-500 text-white" },
  { status: "ABSENT", label: "Qayıb", icon: X, activeClass: "bg-red-500 text-white" },
  { status: "LATE", label: "Gecikmə", icon: Clock, activeClass: "bg-amber-500 text-white" },
  { status: "EXCUSED", label: "İcazəli", icon: FileCheck, activeClass: "bg-navy-400 text-white" },
];

export function AttendanceRow({
  lessonId,
  classId,
  studentId,
  name,
  avatarUrl,
  initialStatus,
  initialNote,
}: {
  lessonId: string;
  classId: string;
  studentId: string;
  name: string;
  avatarUrl?: string | null;
  initialStatus: Status | null;
  initialNote: string | null;
}) {
  const [status, setStatus] = useState<Status | null>(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [showNote, setShowNote] = useState(!!initialNote);
  const [isPending, startTransition] = useTransition();

  function handleSet(newStatus: Status) {
    setStatus(newStatus);
    startTransition(() => {
      markAttendance(lessonId, classId, studentId, newStatus, note || undefined);
    });
  }

  function handleNoteBlur() {
    if (status) {
      startTransition(() => {
        markAttendance(lessonId, classId, studentId, status, note || undefined);
      });
    }
  }

  return (
    <div className="flex flex-col gap-3 border-b border-navy-50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={name} src={avatarUrl} size={36} />
        <span className="font-bold text-navy-900">{name}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {options.map((o) => (
          <button
            key={o.status}
            disabled={isPending}
            onClick={() => handleSet(o.status)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border border-navy-100 px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-60",
              status === o.status ? o.activeClass : "bg-white text-navy-400 hover:bg-navy-50"
            )}
          >
            <o.icon className="h-3.5 w-3.5" />
            {o.label}
          </button>
        ))}
        <button
          onClick={() => setShowNote((s) => !s)}
          className="text-xs font-bold text-electric-600 underline-offset-2 hover:underline"
        >
          Qeyd
        </button>
      </div>

      {showNote && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder="Qeyd əlavə et..."
          className="w-full rounded-lg border border-navy-100 px-3 py-1.5 text-xs sm:w-56"
        />
      )}
    </div>
  );
}
