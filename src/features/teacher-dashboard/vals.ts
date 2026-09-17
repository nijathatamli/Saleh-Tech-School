// Every value the template binds. Style members are CSS strings, exactly as
// teacher-dashboard.html's logic produces them (converted with sx() at render).

type Handler = () => void;

export type NavItemVal = { label: string; icon: string; badge: string; style: string; badgeStyle: string; onGo: Handler };
export type SegTabVal = { label: string; style: string; onGo: Handler };
export type PickVal = { label: string; style: string; onPick: Handler };
export type StatVal = { label: string; value: string };
export type KvVal = { k: string; v: string };
export type RosterVal = {
  name: string;
  initials: string;
  grade: string;
  hw: string;
  att: string;
  rowStyle: string;
  attStyle: string;
  onOpen: Handler;
  avatarDetail: string;
  avatarAttendance: string;
  avatarDay: string;
  avatarList: string;
  avatarDayMobile: string;
  avatarListMobile: string;
  mobileRowStyle: string;
  meta: string;
};
export type SkillVal = { name: string; pctLabel: string; barStyle: string };
export type AttendanceRowVal = { name: string; initials: string; avatarAttendance: string; rowStyle: string; options: PickVal[] };
export type GradeRowVal = {
  id: string;
  name: string;
  initials: string;
  avatar: string;
  submitted: string;
  file: string;
  fileStyle: string;
  feedback: string;
  inputName: string;
  scores: PickVal[];
};
export type QueueVal = { title: string; count: string; chipStyle: string; onOpen: Handler };
export type ScheduleVal = { time: string; title: string; meta: string; status: string; rowStyle: string; timeStyle: string; chipStyle: string; onOpen: Handler };
export type ClassRateVal = { name: string; pctLabel: string; barStyle: string };
export type RiskVal = { name: string; initials: string; avatar: string; avatarMobile: string; reason: string; metric: string; chipStyle: string; onOpen: Handler };
export type CalendarCellVal = { label: string; style: string; dotStyle: string; onPick: Handler };
export type DayLessonVal = {
  time: string;
  className: string;
  meta: string;
  timeStyle: string;
  onOpen: Handler;
  onAttendance: Handler;
  onRemove: Handler;
  roster: RosterVal[];
};
export type ClassCardVal = {
  name: string;
  course: string;
  code: string;
  tagStyle: string;
  stats: KvVal[];
  barStyle: string;
  onOpen: Handler;
  onAttendance: Handler;
};
export type HwRowVal = { title: string; meta: string; due: string; status: string; rowStyle: string; icon: string; iconStyle: string; chipStyle: string; onOpen: Handler };
export type FieldVal = { label: string; value: string; name: string; readOnly: boolean };
export type ToggleVal = { label: string; desc: string; trackStyle: string; knobStyle: string; onToggle: Handler };
export type MobileNavVal = { label: string; icon: string; style: string; labelStyle: string; dotStyle: string; onGo: Handler };

export interface TemplateVals {
  // chrome
  pageTitle: string;
  pageSub: string;
  today: string;
  navItems: NavItemVal[];
  weekLessonsLabel: string;
  weekSummary: string;
  teacherInitials: string;
  teacherAvatar0: string;
  teacherAvatar1: string;
  teacherAvatar2: string;
  teacherAvatar3: string;
  teacherAvatar4: string;
  teacherName: string;
  teacherPosition: string;
  unreadDotStyle: string;
  onLogout: Handler;
  inDetail: boolean;
  backLabel: string;
  goBack: Handler;

  // screens
  atHome: boolean;
  atClasses: boolean;
  atHomework: boolean;
  atStudents: boolean;
  atProfile: boolean;
  atClassDetail: boolean;
  atStudentDetail: boolean;
  atAttendance: boolean;
  atGrading: boolean;
  atNewHw: boolean;

  // class / student detail
  detailStats: StatVal[];
  detailRoster: RosterVal[];
  openAttendance: Handler;
  openNewHw: Handler;
  studentSkills: SkillVal[];
  noSkills: boolean;
  onSendNote: Handler;
  onWriteParent: Handler;

  // attendance
  markedLabel: string;
  saveLabel: string;
  markAllPresent: Handler;
  saveAttendance: Handler;
  attendanceRoster: AttendanceRowVal[];
  noAttendanceLesson: boolean;

  // grading
  gradeTitle: string;
  gradeMeta: string;
  gradedLabel: string;
  gradeRoster: GradeRowVal[];
  noGradeRoster: boolean;
  saveGradesLabel: string;
  onSaveGrades: Handler;

  // new homework
  newHwClasses: PickVal[];
  hwDefaultDue: string;
  onCreateHw: Handler;

  // home
  hasNextLesson: boolean;
  noNextLesson: boolean;
  nextLessonTitle: string;
  nextLessonWhen: string;
  nextLessonClass: string;
  nextLessonCount: string;
  nextLessonMeta: string;
  pendingTotal: string;
  queueMeta: string;
  gradingQueue: QueueVal[];
  noQueue: boolean;
  openGrading: Handler;
  stats: StatVal[];
  scheduleCountLabel: string;
  schedule: ScheduleVal[];
  noSchedule: boolean;
  classRates: ClassRateVal[];
  noClasses: boolean;
  atRisk: RiskVal[];
  noRisk: boolean;

  // classes / calendar
  monthLabel: string;
  prevMonth: Handler;
  nextMonth: Handler;
  weekDays: string[];
  calendar: CalendarCellVal[];
  calendarMobile: CalendarCellVal[];
  dayHeading: string;
  daySummary: string;
  dayHasLessons: boolean;
  dayEmpty: boolean;
  isAdding: boolean;
  notAdding: boolean;
  startAdd: Handler;
  cancelAdd: Handler;
  confirmAdd: Handler;
  addLabel: string;
  draftClasses: PickVal[];
  draftClassCodes: PickVal[];
  draftTimes: PickVal[];
  dayLessons: DayLessonVal[];
  classes: ClassCardVal[];

  // homework
  hwTabs: SegTabVal[];
  hwList: HwRowVal[];
  hwEmpty: boolean;

  // students
  classTabs: SegTabVal[];
  students: RosterVal[];
  noStudents: boolean;

  // profile
  profileStats: KvVal[];
  fields: FieldVal[];
  toggles: ToggleVal[];
  onChangeAvatar: Handler;
  onSaveProfile: Handler;
  onCancelProfile: Handler;

  // mobile
  mAtHome: boolean;
  mAtClasses: boolean;
  mAtHomework: boolean;
  mAtStudents: boolean;
  mAtProfile: boolean;
  mTitle: string;
  mSub: string;
  mobileNav: MobileNavVal[];
}
