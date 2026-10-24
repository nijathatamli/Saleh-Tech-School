import { paymentBlockSchema, setStudentBlockedForPayment } from "@/lib/admin/payments";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

// Block / unblock the student's login because of this payment. Admin only.
export const PATCH = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const { blocked } = paymentBlockSchema.parse(await readJson(req));
    const payment = await setStudentBlockedForPayment(admin.id, params.id, blocked);
    revalidateDashboards();
    return ok(payment);
  },
  { mutating: true }
);
