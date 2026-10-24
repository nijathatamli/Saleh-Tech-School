-- Teacher notification preferences used to live only in the browser (localStorage) and changed nothing.
-- They are real now: submissions and the attendance warning check these columns. Idempotent.
ALTER TABLE "TeacherProfile" ADD COLUMN IF NOT EXISTS "notifySubmissions" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TeacherProfile" ADD COLUMN IF NOT EXISTS "notifyAttendanceWarnings" BOOLEAN NOT NULL DEFAULT true;
