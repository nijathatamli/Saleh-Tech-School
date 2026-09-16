// Every value the template binds. Style members are CSS strings, exactly as
// parent-dashboard.html's logic produces them (converted with sx() at render).

type Handler = () => void;

export type NavItemVal = { label: string; icon: string; badge: string; style: string; badgeStyle: string; onGo: Handler };
export type SegTabVal = { label: string; style: string; onGo: Handler };
export type DotRowVal = { label: string; value: string; dotStyle: string };
export type StatVal = { label: string; value: string };
export type SubjectVal = { name: string; pctLabel: string; barStyle: string };
export type ChartDotVal = { x: string; y: string; r: number; sw: number };
export type HomeworkVal = { title: string; meta: string; rowStyle: string; dotStyle: string; metaStyle: string };
export type AchievementVal = { name: string; date: string; icon: string; iconText: string; medalStyle: string };
export type ActivityVal = { when: string; what: string; dotStyle: string };
export type ChildVal = {
  name: string;
  initials: string;
  avatarCard: string;
  avatarList: string;
  meta: string;
  tag: string;
  cardStyle: string;
  tagStyle: string;
  stats: { v: string; k: string }[];
  barStyle: string;
  onDetail: Handler;
  onReport: Handler;
};
export type CalendarCellVal = { label: string; style: string };
export type LegendVal = { label: string; dotStyle: string };
export type TileVal = { v: string; k: string };
export type HwRowVal = {
  title: string;
  subject: string;
  due: string;
  status: string;
  rowStyle: string;
  icon: string;
  iconStyle: string;
  chipStyle: string;
};
export type NotificationVal = {
  title: string;
  body: string;
  when: string;
  icon: string;
  rowStyle: string;
  iconStyle: string;
  titleStyle: string;
  dotStyle: string;
  onOpen: Handler;
};
export type FieldVal = { label: string; value: string; name: string; readOnly: boolean };
export type ToggleVal = { label: string; desc: string; trackStyle: string; knobStyle: string; onToggle: Handler };
export type MobileNavVal = { label: string; icon: string; style: string; labelStyle: string; dotStyle: string; onGo: Handler };

export interface TemplateVals {
  // chrome
  parentInitials: string;
  parentAvatar0: string;
  parentAvatar1: string;
  parentAvatar2: string;
  parentAvatar3: string;
  parentAvatar4: string;
  parentName: string;
  parentEmail: string;
  pageTitle: string;
  pageSub: string;
  today: string;
  navItems: NavItemVal[];
  onLogout: Handler;

  // desktop screens
  atHome: boolean;
  atChildren: boolean;
  atAttendance: boolean;
  atHomework: boolean;
  atNotifications: boolean;
  atSettings: boolean;

  // home
  childInitials: string;
  childAvatar: string;
  childName: string;
  childMeta: string;
  childLevel: string;
  childYear: string;
  onSwitchChild: Handler;
  attendancePct: number;
  attendanceStanding: string;
  attendanceOffset: string | number;
  attendanceRows: DotRowVal[];
  minorStats: StatVal[];
  progressSub: string;
  subjects: SubjectVal[];
  chartTitle: string;
  chartRange: string;
  chartDelta: string;
  hasTrend: boolean;
  noTrend: boolean;
  chartLine: string;
  chartArea: string;
  chartDots: ChartDotVal[];
  chartLabels: string[];
  hasNextLesson: boolean;
  noNextLesson: boolean;
  lessonTitle: string;
  lessonWhen: string;
  lessonDuration: string;
  lessonDurationShort: string;
  lessonTeacherInitials: string;
  lessonTeacherAvatar: string;
  lessonTeacher: string;
  lessonTeacherRole: string;
  onGoLesson: Handler;
  hasNote: boolean;
  noNote: boolean;
  noteText: string;
  noteTeacherInitials: string;
  noteTeacherAvatar: string;
  noteTeacher: string;
  noteTeacherRole: string;
  noteDate: string;
  homeworkActiveLabel: string;
  hasHomework: boolean;
  noHomework: boolean;
  homework: HomeworkVal[];
  hasAchievements: boolean;
  noAchievements: boolean;
  achievements: AchievementVal[];
  activity: ActivityVal[];

  // children
  children: ChildVal[];

  // attendance
  monthTabs: SegTabVal[];
  attLegend: LegendVal[];
  weekDays: string[];
  calendar: CalendarCellVal[];
  calendarMobile: CalendarCellVal[];
  attMonthSummary: string;
  attMonthSummaryShort: string;
  attTiles: TileVal[];
  attNote: string;

  // homework
  hwTabs: SegTabVal[];
  hwList: HwRowVal[];
  hwEmpty: boolean;

  // notifications
  unreadLabel: string;
  onMarkAllRead: Handler;
  notifications: NotificationVal[];
  noNotifications: boolean;

  // settings
  fields: FieldVal[];
  toggles: ToggleVal[];
  langTabs: SegTabVal[];
  onSaveProfile: Handler;
  onCancelProfile: Handler;
  onChangeAvatar: Handler;

  // mobile
  mAtHome: boolean;
  mAtProgress: boolean;
  mAtAtt: boolean;
  mAtHw: boolean;
  mAtMe: boolean;
  mTitle: string;
  mSub: string;
  progressPct: number;
  mobileAttBar: string;
  mobileProgBar: string;
  mobileNav: MobileNavVal[];
}
