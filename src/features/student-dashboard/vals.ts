// Every value the template binds. Style members are CSS strings, exactly as
// student-dashboard.html's logic produces them (converted with sx() at render).

type Handler = () => void;

export type NavItemVal = { label: string; icon: string; badge: string; style: string; badgeStyle: string; onGo: Handler };
export type SegTabVal = { label: string; style: string; onGo: Handler };
export type XpSourceVal = { label: string; xp: string; icon: string };
export type StreakDayVal = { day: string; icon: string; cellStyle: string; pipStyle: string };
export type ProjectVal = {
  name: string;
  tech: string;
  status: string;
  icon: string;
  pctLabel: string;
  barStyle: string;
  artStyle: string;
  iconStyle: string;
  chipArtStyle: string;
  statusStyle: string;
};
export type AchievementVal = { name: string; meta: string; icon: string; medalStyle: string; nameStyle: string };
export type ActivityVal = { when: string; what: string; xp: string; dotStyle: string; xpStyle: string };
export type SubjectVal = { name: string; pctLabel: string; barStyle: string };
export type ChartDotVal = { x: string; y: string; r: number; sw: number };
export type TileVal = { v: string; k: string };
export type CalendarCellVal = { label: string; style: string };
export type LessonVal = {
  course: string;
  teacher: string;
  day: string;
  dayShort: string;
  time: string;
  rowStyle: string;
  dayStyle: string;
  timeStyle: string;
};
export type HwRowVal = {
  title: string;
  subject: string;
  due: string;
  status: string;
  rowStyle: string;
  icon: string;
  iconStyle: string;
  chipStyle: string;
  canSubmit: boolean;
  onSubmit: Handler;
};
export type LeaderboardVal = {
  rank: string;
  name: string;
  initials: string;
  meta: string;
  points: string;
  rowStyle: string;
  rankStyle: string;
  avatarStyle: string;
  nameStyle: string;
};
export type StatVal = { k: string; v: string };
export type MobileNavVal = { label: string; icon: string; style: string; labelStyle: string; dotStyle: string; onGo: Handler };

export interface TemplateVals {
  // chrome
  pageTitle: string;
  pageSub: string;
  navItems: NavItemVal[];
  levelLabel: string;
  levelPctLabel: string;
  levelBar: string;
  xpProgressLabel: string;
  studentInitials: string;
  studentAvatar0: string;
  studentAvatar1: string;
  studentAvatar2: string;
  studentAvatar3: string;
  studentAvatar4: string;
  studentAvatar5: string;
  studentName: string;
  studentMeta: string;
  levelTitle: string;
  unreadDotStyle: string;
  onLogout: Handler;

  // desktop screens
  atHome: boolean;
  atProgress: boolean;
  atLessons: boolean;
  atTasks: boolean;
  atPortfolio: boolean;
  atLeaderboard: boolean;
  atProfile: boolean;

  // home
  hasNextLesson: boolean;
  noNextLesson: boolean;
  lessonTitle: string;
  lessonWhen: string;
  lessonTeacherInitials: string;
  lessonTeacherAvatar: string;
  lessonTeacher: string;
  lessonTeacherRole: string;
  onGoLesson: Handler;
  hasTask: boolean;
  noTask: boolean;
  taskTitle: string;
  taskDue: string;
  taskStatus: string;
  taskPctLabel: string;
  taskBar: string;
  taskXp: string;
  onStartTask: Handler;
  hasCourse: boolean;
  courseName: string;
  courseModuleLabel: string;
  courseModuleShort: string;
  coursePctLabel: string;
  courseLeftLabel: string;
  courseBar: string;
  onContinue: Handler;
  xpDisplay: string;
  xpMonthLabel: string;
  nextLevelLabel: string;
  xpSources: XpSourceVal[];
  levelNumber: string;
  levelOffset: string | number;
  streakDays: string;
  streakLabel: string;
  streak: StreakDayVal[];
  hasRecommendation: boolean;
  recoIntro: string;
  recoTitle: string;
  recoDuration: string;
  recoXp: string;
  onReco: Handler;
  projectsCountLabel: string;
  projects: ProjectVal[];
  noProjects: boolean;
  achievements: AchievementVal[];
  achievementsTop: AchievementVal[];
  noAchievements: boolean;
  activity: ActivityVal[];
  noActivity: boolean;
  hasChallenge: boolean;

  // progress
  overallPct: number;
  overallOffset: string | number;
  overallNote: string;
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

  // attendance
  attendancePct: number;
  attendanceOffset: string | number;
  attendanceStanding: string;
  attMonthSummary: string;
  attMonthSummaryShort: string;
  attMonthName: string;
  attTiles: TileVal[];
  weekDays: string[];
  attCalendar: CalendarCellVal[];
  lessons: LessonVal[];
  noLessons: boolean;

  // tasks
  hwTabs: SegTabVal[];
  hwList: HwRowVal[];
  hwEmpty: boolean;

  // portfolio / profile
  enrollments: string[];
  skills: SubjectVal[];
  leaderboard: LeaderboardVal[];
  profileStats: StatVal[];
  onChangeAvatar: Handler;

  // mobile
  mAtHome: boolean;
  mAtProgress: boolean;
  mAtLessons: boolean;
  mAtTasks: boolean;
  mAtProfile: boolean;
  mTitle: string;
  mSub: string;
  mobileNav: MobileNavVal[];
}
