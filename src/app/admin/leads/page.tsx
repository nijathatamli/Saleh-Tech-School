import { ArrowRight, Phone, Calendar } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeadsByStage } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { advanceLeadStage } from "./actions";

export const dynamic = "force-dynamic";

const columns = [
  { stage: "NEW", label: "Yeni", color: "bg-electric-500" },
  { stage: "CONTACTED", label: "Əlaqə saxlanılıb", color: "bg-cyan-500" },
  { stage: "TRIAL_LESSON", label: "Sınaq dərsi", color: "bg-violet-500" },
  { stage: "TRIAL_COMPLETED", label: "Sınaq bitib", color: "bg-amber-500" },
  { stage: "INTERESTED", label: "Maraqlıdır", color: "bg-orange-500" },
  { stage: "REGISTERED", label: "Qeydiyyatdan keçib", color: "bg-emerald-500" },
] as const;

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions);
  const leads = await getLeadsByStage();

  return (
    <div>
      <AppTopbar title="CRM / Leads" userName={session?.user?.name ?? "Admin"} userEmail={session?.user?.email ?? ""} />

      <div className="p-6 md:p-10">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const items = leads.filter((l) => l.stage === col.stage);
            return (
              <div key={col.stage} className="w-72 shrink-0">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-navy-900">{col.label}</h3>
                  <span className="ml-auto rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-bold text-navy-600">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((lead) => (
                    <div key={lead.id} className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm shadow-navy-900/[0.03]">
                      <p className="text-sm font-bold text-navy-900">{lead.parentName}</p>
                      <p className="text-xs text-navy-400">{lead.studentName} · {lead.studentAge} yaş</p>
                      {lead.course && (
                        <p className="mt-2 rounded-lg bg-navy-50 px-2 py-1 text-[11px] font-bold text-electric-600">
                          {lead.course.name}
                        </p>
                      )}
                      <div className="mt-3 space-y-1 text-[11px] text-navy-400">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> {lead.parentPhone}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" /> {formatDate(lead.preferredDate)} · {lead.preferredTime}
                        </div>
                      </div>
                      {col.stage !== "REGISTERED" && (
                        <form action={advanceLeadStage.bind(null, lead.id)} className="mt-3">
                          <Button type="submit" variant="app-outline" size="sm" className="w-full">
                            <span className="flex items-center justify-center gap-1">
                              İrəli <ArrowRight className="h-3 w-3" />
                            </span>
                          </Button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
