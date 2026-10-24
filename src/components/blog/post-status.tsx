import { Badge } from "@/components/ui/badge";

/** DRAFT, live, or scheduled (published with a future date). */
export function PostStatusBadge({ status, publishedAt }: { status: string; publishedAt: Date | string | null }) {
  if (status !== "PUBLISHED") return <Badge variant="default">Qaralama</Badge>;
  if (publishedAt && new Date(publishedAt) > new Date()) return <Badge variant="warning">Planlanıb</Badge>;
  return <Badge variant="success">Dərc olunub</Badge>;
}
