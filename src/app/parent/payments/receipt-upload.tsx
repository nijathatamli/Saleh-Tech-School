"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DashFileUpload } from "@/components/dash/file-upload";
import { submitPaymentReceipt } from "./actions";

export function ReceiptUpload({
  paymentId,
  label,
  submittedLabel,
  alreadySubmitted,
}: {
  paymentId: string;
  label: string;
  submittedLabel: string;
  alreadySubmitted: boolean;
}) {
  const [done, setDone] = useState(alreadySubmitted);

  if (done) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> {submittedLabel}
      </span>
    );
  }

  return (
    <DashFileUpload
      label={label}
      accept="image/png,image/jpeg,image/webp"
      onUploaded={async (url) => {
        await submitPaymentReceipt(paymentId, url);
        setDone(true);
      }}
    />
  );
}
