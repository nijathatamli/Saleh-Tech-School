"use client";

import { useOpenFromQuery } from "@/components/admin/use-open-from-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client-api";
import { StudentPicker, TeacherPicker, type StudentOption, type TeacherOption } from "./pickers";

const wide = "max-w-2xl max-h-[92vh] overflow-y-auto";
const fieldErr = (m?: string) => (m ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-500">{m}</p> : null);
const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-900 focus:border-electric-500" />
);

export type CourseOption = { id: string; name: string; price: number };

/** "Yeni sinif yarat" — name, course, teacher, students; one backend call creates everything. */
export function CreateClassDialog({ courses }: { courses: CourseOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useOpenFromQuery("sinif", setOpen);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [schedule, setSchedule] = useState("");
  const [teacher, setTeacher] = useState<TeacherOption | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  function reset() {
    setName(""); setCourseId(""); setSchedule(""); setTeacher(null); setStudents([]); setError(null); setFields({});
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    const local: Record<string, string> = {};
    if (name.trim().length < 2) local.name = "Sinif adı ən az 2 simvol olmalıdır.";
    if (!courseId) local.courseId = "Kurs seçin.";
    if (!teacher) local.teacherId = "Müəllim seçin.";
    if (Object.keys(local).length) return setFields(local);

    setBusy(true);
    const r = await api<{ id: string }>("POST", "/api/admin/classes", { name, courseId, teacherId: teacher!.id, studentIds: students.map((s) => s.id), schedule: schedule || undefined });
    setBusy(false);
    if (!r.ok) {
      setFields(r.fields ?? {});
      return setError(r.status === 401 || r.status === 0 ? r.error : `Sinif yaratmaq mümkün olmadı. ${r.error}`);
    }
    setOpen(false);
    reset();
    router.push(`/admin/classes/${r.data.id}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild><Button variant="app">Yeni sinif yarat</Button></DialogTrigger>
      <DialogContent className={wide}>
        <DialogTitle>Yeni sinif</DialogTitle>
        <DialogDescription className="mb-6 text-sm text-navy-400">Müəllim təyin edildikdən və tələbələr əlavə olunduqdan sonra sinif müəllimin və tələbələrin panelində görünəcək.</DialogDescription>
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div>
            <Label htmlFor="cname">Sinif adı</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Python Beginner" maxLength={80} />
            {fieldErr(fields.name)}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="ccourse">Kurs</Label>
              <Select id="ccourse" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">Kurs seçin</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.price} AZN</option>)}
              </Select>
              {fieldErr(fields.courseId)}
            </div>
            <div>
              <Label htmlFor="cschedule">Cədvəl (istəyə bağlı)</Label>
              <Input id="cschedule" value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Ç.a - Cümə, 18:00" maxLength={80} />
            </div>
          </div>
          <div>
            <Label>Müəllim seç</Label>
            <TeacherPicker value={teacher} onChange={setTeacher} />
            {fieldErr(fields.teacherId)}
          </div>
          <div>
            <Label>Tələbə əlavə et</Label>
            <StudentPicker selected={students} onChange={setStudents} />
            {fieldErr(fields.studentIds)}
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="app-outline" onClick={() => setOpen(false)}>Ləğv et</Button>
            <Button type="submit" variant="app" disabled={busy}>{busy ? "Yaradılır..." : "Sinifi yarat"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ClassLite = { id: string; name: string; schedule: string; lessonsPerCycle: number; capacity?: number | null; status: "ACTIVE" | "ARCHIVED" };

export function EditClassDialog({ cls }: { cls: ClassLite }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(cls.name);
  const [schedule, setSchedule] = useState(cls.schedule);
  const [cycle, setCycle] = useState(String(cls.lessonsPerCycle));
  const [capacity, setCapacity] = useState(cls.capacity ? String(cls.capacity) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api("PATCH", `/api/admin/classes/${cls.id}`, { name, schedule, lessonsPerCycle: Number(cycle), capacity: capacity ? Number(capacity) : null });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app-outline" size="sm">Redaktə et</Button></DialogTrigger>
      <DialogContent>
        <DialogTitle>Sinifi redaktə et</DialogTitle>
        <DialogDescription className="sr-only">Sinfin adı, cədvəli və ödəniş dövrü</DialogDescription>
        <form onSubmit={submit} className="space-y-5">
          <div><Label htmlFor="ename">Sinif adı</Label><Input id="ename" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
          <div><Label htmlFor="eschedule">Cədvəl</Label><Input id="eschedule" value={schedule} onChange={(e) => setSchedule(e.target.value)} maxLength={80} /></div>
          <div><Label htmlFor="ecycle">Ödəniş dövrü (tamamlanmış dərs sayı)</Label><Input id="ecycle" type="number" min={1} max={40} value={cycle} onChange={(e) => setCycle(e.target.value)} /></div>
          <div><Label htmlFor="ecap">Tutum (boş = limitsiz)</Label><Input id="ecap" type="number" min={1} max={500} value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div>
          {error && <p role="alert" className="text-sm font-semibold text-red-500">{error}</p>}
          <div className="flex justify-end gap-3"><Button type="button" variant="app-outline" onClick={() => setOpen(false)}>Ləğv et</Button><Button type="submit" variant="app" disabled={busy}>{busy ? "Saxlanılır..." : "Yadda saxla"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ChangeTeacherDialog({ classId, current }: { classId: string; current: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [teacher, setTeacher] = useState<TeacherOption | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!teacher) return setError("Müəllim seçin.");
    setBusy(true);
    setError(null);
    const r = await api("PUT", `/api/admin/classes/${classId}/teacher`, { teacherId: teacher.id });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setOpen(false);
    setTeacher(null);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app-outline" size="sm">Müəllimi dəyiş</Button></DialogTrigger>
      <DialogContent>
        <DialogTitle>Müəllimi dəyiş</DialogTitle>
        <DialogDescription className="mb-5 text-sm text-navy-400">Hazırkı müəllim: {current}. Köhnə müəllim sinfi artıq görməyəcək, yeni müəllim isə bütün tələbələri görəcək.</DialogDescription>
        <div className="space-y-4">
          <TeacherPicker value={teacher} onChange={setTeacher} />
          {error && <p role="alert" className="text-sm font-semibold text-red-500">{error}</p>}
          <div className="flex justify-end gap-3"><Button type="button" variant="app-outline" onClick={() => setOpen(false)}>Ləğv et</Button><Button type="button" variant="app" disabled={busy} onClick={submit}>{busy ? "Dəyişdirilir..." : "Təyin et"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AddStudentsDialog({ classId }: { classId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!students.length) return setError("Ən azı bir tələbə seçin.");
    setBusy(true);
    setError(null);
    const r = await api("POST", `/api/admin/classes/${classId}/students`, { studentIds: students.map((s) => s.id) });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setOpen(false);
    setStudents([]);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app" size="sm">Tələbə əlavə et</Button></DialogTrigger>
      <DialogContent className={wide}>
        <DialogTitle>Sinfə tələbə əlavə et</DialogTitle>
        <DialogDescription className="mb-5 text-sm text-navy-400">Yalnız bu sinifdə olmayan tələbələr göstərilir.</DialogDescription>
        <div className="space-y-4">
          <StudentPicker selected={students} onChange={setStudents} excludeClassId={classId} />
          {error && <p role="alert" className="text-sm font-semibold text-red-500">{error}</p>}
          <div className="flex justify-end gap-3"><Button type="button" variant="app-outline" onClick={() => setOpen(false)}>Ləğv et</Button><Button type="button" variant="app" disabled={busy} onClick={submit}>{busy ? "Əlavə edilir..." : `Əlavə et (${students.length})`}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RemoveStudentButton({ classId, studentId, name }: { classId: string; studentId: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function remove() {
    if (!window.confirm(`${name} sinifdən çıxarılsın? Tələbə hesabı və keçmiş qeydlər saxlanılacaq.`)) return;
    setBusy(true);
    const r = await api("DELETE", `/api/admin/classes/${classId}/students/${studentId}`);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.refresh();
  }
  return (
    <>
      <button onClick={remove} disabled={busy} className="text-xs font-bold text-red-500 hover:underline disabled:opacity-50">{busy ? "..." : "Çıxar"}</button>
      {error && <span role="alert" className="ml-2 text-xs text-red-500">{error}</span>}
    </>
  );
}

export function ArchiveClassButton({ classId, status }: { classId: string; status: "ACTIVE" | "ARCHIVED" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function toggle() {
    const archiving = status === "ACTIVE";
    if (archiving && !window.confirm("Sinif arxivə göndərilsin? Müəllim və tələbələr onu panellərində görməyəcək; dərs və ödəniş tarixçəsi saxlanılır.")) return;
    setBusy(true);
    const r = await api("PATCH", `/api/admin/classes/${classId}`, { status: archiving ? "ARCHIVED" : "ACTIVE" });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.refresh();
  }
  return (
    <>
      <Button variant={status === "ACTIVE" ? "app-outline" : "app"} size="sm" onClick={toggle} disabled={busy}>{status === "ACTIVE" ? "Arxivlə" : "Bərpa et"}</Button>
      {error && <span role="alert" className="text-xs text-red-500">{error}</span>}
    </>
  );
}
