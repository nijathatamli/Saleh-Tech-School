import { AppTopbar } from "@/components/app/topbar";

/** The admin page heading (title + one muted line). */
export function AdminTopbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return <AppTopbar title={title} subtitle={subtitle} />;
}
