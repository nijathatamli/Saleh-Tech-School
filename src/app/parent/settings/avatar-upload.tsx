"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { DashFileUpload } from "@/components/dash/file-upload";
import { updateAvatar } from "./actions";

export function AvatarUpload({
  name,
  initialUrl,
  label,
}: {
  name: string;
  initialUrl: string | null;
  label: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} src={url} size={64} />
      <DashFileUpload
        label={label}
        onUploaded={async (uploadedUrl) => {
          setUrl(uploadedUrl);
          await updateAvatar(uploadedUrl);
          router.refresh();
        }}
      />
    </div>
  );
}
