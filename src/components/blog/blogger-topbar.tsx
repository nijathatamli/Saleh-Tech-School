import { AppTopbar } from "@/components/app/topbar";

export function BloggerTopbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return <AppTopbar title={title} subtitle={subtitle} />;
}
