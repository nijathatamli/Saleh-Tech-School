-- Indexes on foreign-key columns that had none (joins, per-student lookups and ON DELETE checks scan the whole table without them).
-- Additive and idempotent; mirrored by @@index in prisma/schema.prisma.
CREATE INDEX IF NOT EXISTS "Attendance_markedById_idx" ON "Attendance"("markedById");
CREATE INDEX IF NOT EXISTS "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");
CREATE INDEX IF NOT EXISTS "Course_teacherId_idx" ON "Course"("teacherId");
CREATE INDEX IF NOT EXISTS "CourseModule_courseId_idx" ON "CourseModule"("courseId");
CREATE INDEX IF NOT EXISTS "Enrollment_courseId_idx" ON "Enrollment"("courseId");
CREATE INDEX IF NOT EXISTS "Project_studentId_idx" ON "Project"("studentId");
CREATE INDEX IF NOT EXISTS "ScholarshipStudent_categoryKey_idx" ON "ScholarshipStudent"("categoryKey");
CREATE INDEX IF NOT EXISTS "SkillProgress_studentId_idx" ON "SkillProgress"("studentId");
CREATE INDEX IF NOT EXISTS "StudentBadge_badgeId_idx" ON "StudentBadge"("badgeId");
CREATE INDEX IF NOT EXISTS "StudentBadge_studentId_idx" ON "StudentBadge"("studentId");
CREATE INDEX IF NOT EXISTS "StudentNote_studentId_idx" ON "StudentNote"("studentId");
CREATE INDEX IF NOT EXISTS "StudentNote_teacherId_idx" ON "StudentNote"("teacherId");
CREATE INDEX IF NOT EXISTS "TrialBooking_convertedStudentId_idx" ON "TrialBooking"("convertedStudentId");
CREATE INDEX IF NOT EXISTS "TrialBooking_courseId_idx" ON "TrialBooking"("courseId");
