import { paymentStatusSchema, setPaymentStatus } from "@/lib/admin/payments";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

// Only admins change payment state — a teacher's session gets 403 here.
export const PATCH = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const { status } = paymentStatusSchema.parse(await readJson(req));
    const payment = await setPaymentStatus(admin.id, params.id, status);
    revalidateDashboards();
    return ok(payment);
  },
  { mutating: true }
);
