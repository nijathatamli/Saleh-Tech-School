"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateScholarshipCodes, type GenerateState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="app" disabled={pending}>
      {pending ? "Yaradılır..." : "Kod yarat"}
    </Button>
  );
}

export function GenerateCodesForm() {
  const [state, action] = useFormState<GenerateState, FormData>(generateScholarshipCodes, { status: "idle" });

  return (
    <div className="space-y-4">
      <form action={action} className="flex flex-wrap items-end gap-4">
        <div className="w-28">
          <Label htmlFor="count">Say</Label>
          <Input id="count" name="count" type="number" min={1} max={200} defaultValue={10} required />
        </div>
        <div className="min-w-[14rem] flex-1">
          <Label htmlFor="note">Qeyd (qrup, məsələn “Python 5-6 sinif”)</Label>
          <Input id="note" name="note" maxLength={80} placeholder="İstəyə bağlı" />
        </div>
        <Submit />
      </form>
      {state.status === "error" && <p role="alert" className="text-sm font-semibold text-red-500">{state.message}</p>}
      {state.status === "ok" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-900">{state.codes.length} kod yaradıldı. Hər kod yalnız bir dəfə işləyir — kursun tələbələrinə paylayın:</p>
          <textarea readOnly rows={Math.min(12, state.codes.length + 1)} value={state.codes.join("\n")} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-xl border border-navy-100 bg-navy-50 p-4 font-mono text-xs" />
          <button type="button" onClick={() => navigator.clipboard?.writeText(state.codes.join("\n"))} className="text-xs font-bold uppercase tracking-widest text-electric-600 hover:underline">
            Hamısını kopyala
          </button>
        </div>
      )}
    </div>
  );
}
