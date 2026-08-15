import "dotenv/config";
import { PrismaClient, Level, AttendanceStatus, SubmissionStatus, PaymentStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("Seeding...");

  // ---------- Teachers ----------
  const teacherSeeds = [
    {
      name: "Tural Zeynalov",
      email: "tural.zeynalov@salehtech.az",
      position: "Kiber Təhlükəsizlik üzrə Baş Mütəxəssis",
      bio: "10 ildən artıq beynəlxalq kibertəhlükəsizlik təcrübəsinə malik, bir neçə CTF yarışının qalibi.",
      experienceYears: 10,
      specializations: ["Linux", "Şəbəkə", "Kibertəhlükəsizlik", "CTF"],
      photoUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg",
    },
    {
      name: "Emin Qasımov",
      email: "emin.qasimov@salehtech.az",
      position: "Full-Stack Proqramçı",
      bio: "Texniki Təlim Direktoru, 8 illik proqramlaşdırma və məhsul inkişafı təcrübəsi.",
      experienceYears: 8,
      specializations: ["JavaScript", "Python", "React", "Node.js"],
      photoUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-9.jpg",
    },
    {
      name: "Nigar Əliyeva",
      email: "nigar.aliyeva@salehtech.az",
      position: "Robototexnika Mühəndisi",
      bio: "Süni intellekt üzrə tədqiqatçı, robototexnika yarışlarında məşqçi.",
      experienceYears: 6,
      specializations: ["Arduino", "Robotexnika", "Süni İntellekt"],
      photoUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg",
    },
    {
      name: "Səbinə Hüseynova",
      email: "sebine.huseynova@salehtech.az",
      position: "Elektronika və IoT Mütəxəssisi",
      bio: "Elektronika mühəndisi, IoT sistemləri üzrə 5 illik sənaye təcrübəsi.",
      experienceYears: 5,
      specializations: ["Elektronika", "IoT", "Arduino", "Sensor sistemləri"],
      photoUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg",
    },
  ];

  const teacherPasswordHash = await bcrypt.hash("teacher123", 10);
  const teachers = [];
  for (const t of teacherSeeds) {
    const user = await prisma.user.create({
      data: {
        name: t.name,
        email: t.email,
        passwordHash: teacherPasswordHash,
        role: "TEACHER",
        avatarUrl: t.photoUrl,
        teacherProfile: {
          create: {
            position: t.position,
            bio: t.bio,
            experienceYears: t.experienceYears,
            specializations: t.specializations,
            photoUrl: t.photoUrl,
          },
        },
      },
      include: { teacherProfile: true },
    });
    teachers.push(user.teacherProfile!);
  }
  const [tural, emin, nigar, sebine] = teachers;

  // ---------- Courses ----------
  const courseSeeds = [
    {
      slug: "kibertehlukesizlik",
      name: "Kibertəhlükəsizlik",
      category: "cybersecurity",
      shortDesc: "Rəqəmsal dünyanı təhlükəsiz et!",
      longDesc:
        "Tələbələr şəbəkə təhlükəsizliyi, etik hakerlik və rəqəmsal müdafiə prinsiplərini praktiki CTF tapşırıqları ilə öyrənirlər.",
      minAge: 12,
      maxAge: 18,
      level: Level.ADVANCED,
      durationMonths: 8,
      lessonsPerWeek: 2,
      lessonMinutes: 90,
      price: 220,
      tags: ["linux", "şəbəkə", "ctf", "etik hakerlik"],
      skills: ["Şəbəkə təhlükəsizliyi", "Linux əməliyyat sistemi", "Kriptoqrafiya əsasları", "Etik hakerlik", "CTF strategiyaları"],
      teacherId: tural.id,
      featured: true,
      modules: [
        { order: 1, title: "Networking", summary: "Şəbəkə protokolları və infrastrukturun əsasları." },
        { order: 2, title: "Linux", summary: "Linux əməliyyat sistemi və komanda sətri." },
        { order: 3, title: "Cybersecurity Fundamentals", summary: "Təhlükəsizliyin əsas prinsipləri və hədəf modelləri." },
        { order: 4, title: "Web Security", summary: "Veb tətbiqlərdə ən çox rast gəlinən zəifliklər." },
        { order: 5, title: "Cryptography", summary: "Şifrələmə alqoritmləri və praktiki tətbiqləri." },
        { order: 6, title: "CTF", summary: "Capture The Flag formatında komanda yarışlarına hazırlıq." },
        { order: 7, title: "Ethical Hacking", summary: "Nüfuzetmə testi metodologiyası və alətləri." },
      ],
    },
    {
      slug: "proqramlashdirma",
      name: "Proqramlaşdırma",
      category: "programming",
      shortDesc: "Texnologiya dünyasına ilk addımını at!",
      longDesc: "JavaScript əsasında məntiqi düşüncə, alqoritmlər və interaktiv veb layihələr qurmağı öyrədən əsas proqramlaşdırma kursu.",
      minAge: 10,
      maxAge: 15,
      level: Level.BEGINNER,
      durationMonths: 15,
      lessonsPerWeek: 2,
      lessonMinutes: 90,
      price: 180,
      tags: ["javascript", "html", "css", "alqoritm"],
      skills: ["Alqoritmik düşüncə", "JavaScript əsasları", "HTML/CSS", "Git/GitHub", "Debug etmə"],
      teacherId: emin.id,
      featured: true,
      modules: [
        { order: 1, title: "Əsas Anlayışlar", summary: "Dəyişənlər, şərtlər və dövrlər." },
        { order: 2, title: "Funksiyalar", summary: "Kodun təkrar istifadə oluna bilən hissələri." },
        { order: 3, title: "HTML & CSS", summary: "Veb səhifələrin strukturu və dizaynı." },
        { order: 4, title: "DOM & İnteraktivlik", summary: "İstifadəçi ilə dinamik qarşılıqlı əlaqə." },
        { order: 5, title: "Yekun Layihə", summary: "Baştan-başa interaktiv veb tətbiqi." },
      ],
    },
    {
      slug: "python",
      name: "Python ilə Proqramlaşdırma",
      category: "python",
      shortDesc: "Dünyanın ən populyar dilini əyləncəli layihələrlə öyrən!",
      longDesc: "Python dilinin əsaslarından tutmuş məlumat analizinə qədər geniş spektrdə praktiki layihələr üzərində iş.",
      minAge: 9,
      maxAge: 14,
      level: Level.BEGINNER,
      durationMonths: 6,
      lessonsPerWeek: 2,
      lessonMinutes: 75,
      price: 160,
      tags: ["python", "data", "avtomatlaşdırma"],
      skills: ["Python sintaksisi", "Data strukturları", "Fayl əməliyyatları", "Kiçik oyunlar yaratmaq"],
      teacherId: emin.id,
      featured: false,
      modules: [
        { order: 1, title: "Python Əsasları", summary: "Sintaksis, dəyişənlər və tiplər." },
        { order: 2, title: "İdarəetmə Strukturları", summary: "Şərtlər, dövrlər və funksiyalar." },
        { order: 3, title: "Data Strukturları", summary: "Siyahılar, lüğətlər və çoxluqlar." },
        { order: 4, title: "Mini Layihələr", summary: "Kiçik konsol oyunları və alətlər." },
      ],
    },
    {
      slug: "robotexnika",
      name: "Robotexnika",
      category: "robotics",
      shortDesc: "Öz robotunu yarat, proqramla və idarə et!",
      longDesc: "Arduino və sensor sistemləri ilə tanışlıqdan başlayaraq, tələbələr öz avtonom robotlarını qururlar.",
      minAge: 8,
      maxAge: 12,
      level: Level.BEGINNER,
      durationMonths: 6,
      lessonsPerWeek: 2,
      lessonMinutes: 90,
      price: 170,
      tags: ["arduino", "sensor", "steam"],
      skills: ["Arduino proqramlaşdırma", "Sensor inteqrasiyası", "Elektrik dövrələri", "Komanda işi"],
      teacherId: nigar.id,
      featured: true,
      modules: [
        { order: 1, title: "Arduino Əsasları", summary: "Mikrokontroller və əsas komponentlər." },
        { order: 2, title: "Sensorlar", summary: "İşıq, məsafə və hərəkət sensorları." },
        { order: 3, title: "Motorlar", summary: "Hərəkət mexanizmləri və idarəetmə." },
        { order: 4, title: "Avtonom Robot", summary: "Bütün komponentləri birləşdirən yekun layihə." },
      ],
    },
    {
      slug: "elektronika",
      name: "Elektronika",
      category: "electronics",
      shortDesc: "Elektrik dövrələrinin sirlərini kəşf et!",
      longDesc: "Əsas elektronika komponentləri, dövrə qurma və lehimləmə bacarıqları praktiki tapşırıqlarla öyrədilir.",
      minAge: 10,
      maxAge: 16,
      level: Level.INTERMEDIATE,
      durationMonths: 5,
      lessonsPerWeek: 1,
      lessonMinutes: 90,
      price: 150,
      tags: ["dövrə", "lehimləmə", "komponentlər"],
      skills: ["Dövrə sxemləri", "Lehimləmə", "Rezistor/kondensator hesablamaları", "Breadboard prototipləmə"],
      teacherId: sebine.id,
      featured: false,
      modules: [
        { order: 1, title: "Əsas Komponentlər", summary: "Rezistor, kondensator, diod." },
        { order: 2, title: "Dövrə Qurma", summary: "Breadboard üzərində praktiki dövrələr." },
        { order: 3, title: "Lehimləmə", summary: "Təhlükəsiz lehimləmə texnikaları." },
        { order: 4, title: "Layihə", summary: "Funksional elektron qurğu hazırlamaq." },
      ],
    },
    {
      slug: "web-development",
      name: "Web Development",
      category: "web",
      shortDesc: "Müasir, cavabdehli veb saytlar qur!",
      longDesc: "HTML, CSS və JavaScript-dən React-a qədər müasir veb inkişaf stekini əhatə edən qabaqcıl kurs.",
      minAge: 13,
      maxAge: 18,
      level: Level.INTERMEDIATE,
      durationMonths: 7,
      lessonsPerWeek: 2,
      lessonMinutes: 90,
      price: 200,
      tags: ["html", "css", "react", "javascript"],
      skills: ["Responsive dizayn", "JavaScript ES6+", "React əsasları", "API inteqrasiyası"],
      teacherId: emin.id,
      featured: false,
      modules: [
        { order: 1, title: "Semantik HTML", summary: "Strukturlaşdırılmış, əlçatan veb səhifələr." },
        { order: 2, title: "Müasir CSS", summary: "Flexbox, Grid və responsive dizayn." },
        { order: 3, title: "JavaScript ES6+", summary: "Müasir JavaScript sintaksisi və konsepsiyaları." },
        { order: 4, title: "React Əsasları", summary: "Komponent əsaslı interfeys qurma." },
        { order: 5, title: "Yekun Layihə", summary: "Tam funksional veb tətbiqi." },
      ],
    },
    {
      slug: "suni-intellekt",
      name: "Süni İntellekt Mühəndisliyi",
      category: "ai",
      shortDesc: "Gələcəyin texnologiyasını öyrən!",
      longDesc: "Maşın öyrənməsi əsaslarından kompüter görməsinə qədər müasir süni intellekt konsepsiyalarına giriş.",
      minAge: 14,
      maxAge: 18,
      level: Level.ADVANCED,
      durationMonths: 8,
      lessonsPerWeek: 2,
      lessonMinutes: 90,
      price: 240,
      tags: ["ai", "machine learning", "computer vision"],
      skills: ["Python üçün ML kitabxanaları", "Neyron şəbəkələr əsasları", "Data hazırlama", "Model qiymətləndirmə"],
      teacherId: nigar.id,
      featured: true,
      modules: [
        { order: 1, title: "Python üçün Data Elmi", summary: "NumPy və Pandas ilə iş." },
        { order: 2, title: "Maşın Öyrənməsi Əsasları", summary: "Nəzarətli və nəzarətsiz öyrənmə." },
        { order: 3, title: "Neyron Şəbəkələr", summary: "Dərin öyrənmənin əsasları." },
        { order: 4, title: "Kompüter Görməsi", summary: "Şəkil tanıma tətbiqləri." },
        { order: 5, title: "Yekun Layihə", summary: "Real data ilə ML modeli qurmaq." },
      ],
    },
    {
      slug: "oyun-yaratma",
      name: "Oyun Yaratma",
      category: "game",
      shortDesc: "Öz kompüter oyununu yarat!",
      longDesc: "Tələbələr oyun dizaynı prinsiplərini öyrənir və özlərinin 2D oyunlarını hazırlayırlar.",
      minAge: 11,
      maxAge: 16,
      level: Level.INTERMEDIATE,
      durationMonths: 6,
      lessonsPerWeek: 2,
      lessonMinutes: 90,
      price: 190,
      tags: ["oyun dizaynı", "javascript", "yaradıcılıq"],
      skills: ["Oyun dizaynı prinsipləri", "Sprite və animasiya", "Kollizyon aşkarlama", "Səviyyə dizaynı"],
      teacherId: emin.id,
      featured: false,
      modules: [
        { order: 1, title: "Oyun Dizaynı Əsasları", summary: "Mexanika, qaydalar və məqsədlər." },
        { order: 2, title: "Sprite və Animasiya", summary: "Xarakter və obyekt hərəkəti." },
        { order: 3, title: "Fizika və Kollizyon", summary: "Toqquşma aşkarlama sistemləri." },
        { order: 4, title: "Yekun Oyun", summary: "Tam oynanıla bilən 2D oyun." },
      ],
    },
    {
      slug: "linux",
      name: "Linux",
      category: "linux",
      shortDesc: "Açıq mənbəli əməliyyat sistemini mənimsə!",
      longDesc: "Linux komanda sətri, fayl sistemi idarəçiliyi və server administrasiyası əsasları.",
      minAge: 13,
      maxAge: 18,
      level: Level.INTERMEDIATE,
      durationMonths: 4,
      lessonsPerWeek: 1,
      lessonMinutes: 90,
      price: 160,
      tags: ["linux", "terminal", "server"],
      skills: ["Bash skriptləşdirmə", "Fayl sistemi idarəçiliyi", "İstifadəçi icazələri", "Server əsasları"],
      teacherId: tural.id,
      featured: false,
      modules: [
        { order: 1, title: "Terminal Əsasları", summary: "Əsas komandalar və naviqasiya." },
        { order: 2, title: "Fayl Sistemi", summary: "İcazələr və qovluq strukturu." },
        { order: 3, title: "Bash Skriptləri", summary: "Tapşırıqların avtomatlaşdırılması." },
        { order: 4, title: "Server Əsasları", summary: "Xidmətlərin idarə edilməsi." },
      ],
    },
    {
      slug: "iot",
      name: "IoT Sistemləri",
      category: "iot",
      shortDesc: "Əşyaların internetini kəşf et!",
      longDesc: "Sensor məlumatlarının internetə ötürülməsi və ağıllı ev sistemlərinin qurulması üzrə praktiki kurs.",
      minAge: 13,
      maxAge: 18,
      level: Level.ADVANCED,
      durationMonths: 6,
      lessonsPerWeek: 2,
      lessonMinutes: 90,
      price: 210,
      tags: ["iot", "wifi", "sensor"],
      skills: ["Sensor məlumatlarının toplanması", "Bulud inteqrasiyası", "Ağıllı ev protokolları", "Real vaxt monitorinq"],
      teacherId: sebine.id,
      featured: false,
      modules: [
        { order: 1, title: "IoT Əsasları", summary: "Cihazlar arası kommunikasiya." },
        { order: 2, title: "Sensor Şəbəkələri", summary: "Məlumat toplama sistemləri." },
        { order: 3, title: "Bulud İnteqrasiyası", summary: "Real vaxt data ötürülməsi." },
        { order: 4, title: "Ağıllı Ev Layihəsi", summary: "Tam funksional IoT sistemi." },
      ],
    },
  ];

  const courses: Record<string, Awaited<ReturnType<typeof prisma.course.create>>> = {};
  for (const c of courseSeeds) {
    const { modules, ...courseData } = c;
    const course = await prisma.course.create({
      data: { ...courseData, modules: { create: modules } },
    });
    courses[c.slug] = course;
  }

  // ---------- Class groups ----------
  const cyberClass = await prisma.classGroup.create({
    data: {
      name: "Kiber-A qrupu",
      courseId: courses["kibertehlukesizlik"].id,
      teacherId: tural.id,
      schedule: "B.e - Ç.a, 18:00",
    },
  });
  const roboClass = await prisma.classGroup.create({
    data: {
      name: "Robo-B qrupu",
      courseId: courses["robotexnika"].id,
      teacherId: nigar.id,
      schedule: "Ç - Cümə, 17:00",
    },
  });

  // ---------- Demo parent + children ----------
  const parentUser = await prisma.user.create({
    data: {
      name: "Elvin Məmmədov",
      email: "elvin.memmedov@example.com",
      phone: "+994501234567",
      passwordHash: await bcrypt.hash("parent123", 10),
      role: "PARENT",
      parentProfile: { create: {} },
    },
    include: { parentProfile: true },
  });
  const parentProfile = parentUser.parentProfile!;

  const aliUser = await prisma.user.create({
    data: {
      name: "Ali Məmmədov",
      email: "ali.memmedov@example.com",
      passwordHash: await bcrypt.hash("student123", 10),
      role: "STUDENT",
    },
  });

  const ali = await prisma.studentProfile.create({
    data: {
      userId: aliUser.id,
      parentId: parentProfile.id,
      firstName: "Ali",
      lastName: "Məmmədov",
      birthDate: new Date(new Date().getFullYear() - 14, 3, 12),
      level: 14,
      xp: 2450,
      points: 870,
      streakDays: 7,
      enrollments: { create: { courseId: courses["kibertehlukesizlik"].id, classId: cyberClass.id } },
      progress: {
        create: [
          { skill: "Networking", percent: 90 },
          { skill: "Linux", percent: 85 },
          { skill: "Cryptography", percent: 70 },
          { skill: "Web Security", percent: 60 },
          { skill: "CTF", percent: 40 },
        ],
      },
    },
  });

  const aysen = await prisma.studentProfile.create({
    data: {
      parentId: parentProfile.id,
      firstName: "Ayşən",
      lastName: "Məmmədova",
      birthDate: new Date(new Date().getFullYear() - 10, 7, 3),
      level: 6,
      xp: 640,
      points: 320,
      streakDays: 3,
      enrollments: { create: { courseId: courses["robotexnika"].id, classId: roboClass.id } },
      progress: {
        create: [
          { skill: "Arduino proqramlaşdırma", percent: 65 },
          { skill: "Sensor inteqrasiyası", percent: 55 },
          { skill: "Elektrik dövrələri", percent: 45 },
        ],
      },
    },
  });

  // ---------- Extra parents + students (leaderboard / admin listings variety) ----------
  const extraParentSeeds = [
    {
      name: "Leyla Əliyeva",
      email: "leyla.aliyeva@example.com",
      phone: "+994551112233",
      children: [
        { firstName: "Nərmin", lastName: "Əliyeva", age: 13, courseSlug: "proqramlashdirma", level: 9, xp: 1600, points: 1120, streak: 12 },
      ],
    },
    {
      name: "Samir Quliyev",
      email: "samir.quliyev@example.com",
      phone: "+994557778899",
      children: [
        { firstName: "Murad", lastName: "Quliyev", age: 16, courseSlug: "suni-intellekt", level: 17, xp: 3100, points: 1540, streak: 21 },
        { firstName: "Kamran", lastName: "Quliyev", age: 11, courseSlug: "python", level: 5, xp: 520, points: 210, streak: 2 },
      ],
    },
    {
      name: "Vüqar Məmmədov",
      email: "vugar.memmedov@example.com",
      phone: "+994503334455",
      children: [
        { firstName: "Zeynəb", lastName: "Məmmədova", age: 9, courseSlug: "robotexnika", level: 4, xp: 410, points: 180, streak: 1 },
      ],
    },
  ];

  for (const p of extraParentSeeds) {
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        phone: p.phone,
        passwordHash: await bcrypt.hash("parent123", 10),
        role: "PARENT",
        parentProfile: { create: {} },
      },
      include: { parentProfile: true },
    });
    for (const c of p.children) {
      await prisma.studentProfile.create({
        data: {
          parentId: user.parentProfile!.id,
          firstName: c.firstName,
          lastName: c.lastName,
          birthDate: new Date(new Date().getFullYear() - c.age, 5, 15),
          level: c.level,
          xp: c.xp,
          points: c.points,
          streakDays: c.streak,
          enrollments: { create: { courseId: courses[c.courseSlug].id } },
        },
      });
    }
  }

  // ---------- Lessons, attendance, homework, submissions, grades ----------
  const cyberSubjects = ["Networking", "Linux", "Cybersecurity Fundamentals", "Web Security"];
  for (let i = 0; i < 8; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        classId: cyberClass.id,
        title: `${cyberSubjects[i % cyberSubjects.length]} - Dərs ${i + 1}`,
        description: "Praktiki tapşırıqlar və nəzəri icmal.",
        date: daysAgo((8 - i) * 7),
      },
    });

    const status: AttendanceStatus = i === 3 ? "ABSENT" : i === 5 ? "LATE" : "PRESENT";
    await prisma.attendance.create({
      data: {
        studentId: ali.id,
        lessonId: lesson.id,
        status,
        date: lesson.date,
        note: status === "ABSENT" ? "Xəstəlik səbəbi ilə" : null,
      },
    });

    await prisma.grade.create({
      data: {
        studentId: ali.id,
        subject: cyberSubjects[i % cyberSubjects.length],
        score: 60 + i * 4,
        maxScore: 100,
        createdAt: daysAgo((8 - i) * 7),
      },
    });

    if (i >= 5) {
      const homework = await prisma.homework.create({
        data: {
          lessonId: lesson.id,
          title: `${cyberSubjects[i % cyberSubjects.length]} tapşırığı`,
          description: "Dərsdə keçilən mövzu üzrə praktiki tapşırığı tamamlayın.",
          dueDate: daysFromNow(i - 5),
        },
      });
      const subStatus: SubmissionStatus = i === 5 ? "GRADED" : i === 6 ? "SUBMITTED" : "PENDING";
      await prisma.submission.create({
        data: {
          homeworkId: homework.id,
          studentId: ali.id,
          status: subStatus,
          score: subStatus === "GRADED" ? 88 : null,
          feedback: subStatus === "GRADED" ? "Əla iş! Şəbəkə diaqramın çox aydın idi." : null,
          submittedAt: subStatus !== "PENDING" ? daysAgo(1) : null,
        },
      });
    }
  }

  // Ayşən — a couple of lessons/attendance too
  for (let i = 0; i < 5; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        classId: roboClass.id,
        title: `Robotexnika - Dərs ${i + 1}`,
        description: "Arduino ilə praktiki tapşırıq.",
        date: daysAgo((5 - i) * 7),
      },
    });
    await prisma.attendance.create({
      data: {
        studentId: aysen.id,
        lessonId: lesson.id,
        status: i === 2 ? "LATE" : "PRESENT",
        date: lesson.date,
      },
    });
  }

  // ---------- Badges ----------
  const badgeSeeds = [
    { code: "first-project", name: "First Project", emoji: "🏅", description: "İlk layihəni tamamladı" },
    { code: "cyber-defender", name: "Cyber Defender", emoji: "🛡", description: "Kibertəhlükəsizlik əsaslarını mənimsədi" },
    { code: "python-master", name: "Python Master", emoji: "🐍", description: "Python kursu üzrə mükəmməl nəticə" },
    { code: "robot-builder", name: "Robot Builder", emoji: "🤖", description: "İlk avtonom robotu qurdu" },
    { code: "competition-winner", name: "Competition Winner", emoji: "🏆", description: "Yarışda qalib gəldi" },
    { code: "streak-10", name: "10 Classes Streak", emoji: "🔥", description: "10 dərs ardıcıl iştirak" },
  ];
  const badges = [];
  for (const b of badgeSeeds) badges.push(await prisma.badge.create({ data: b }));

  await prisma.studentBadge.createMany({
    data: [
      { studentId: ali.id, badgeId: badges[1].id },
      { studentId: ali.id, badgeId: badges[5].id },
      { studentId: aysen.id, badgeId: badges[3].id },
    ],
  });

  // ---------- Projects ----------
  await prisma.project.createMany({
    data: [
      {
        studentId: ali.id,
        title: "Şəbəkə Skaneri",
        description: "Yerli şəbəkədəki aktiv qurğuları aşkar edən Python skripti.",
        imageUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_4d78f13579_72fa6a1d65880b79.png",
        technologies: ["Python", "Nmap", "Sockets"],
        courseTag: "cybersecurity",
      },
      {
        studentId: ali.id,
        title: "Şifrə Meneceri",
        description: "Şifrələnmiş yerli şifrə saxlama tətbiqi.",
        imageUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_4d78f13579_72fa6a1d65880b79.png",
        technologies: ["Python", "Cryptography"],
        courseTag: "cybersecurity",
      },
      {
        studentId: aysen.id,
        title: "Arduino Robot",
        description: "Maneələrdən avtomatik yayınan sensor əsaslı robot.",
        imageUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_55f76a70f6_e6f3256ef5c6b526.png",
        technologies: ["Arduino", "C++", "Ultrasonic Sensor"],
        courseTag: "robotics",
      },
    ],
  });

  // ---------- Payments ----------
  await prisma.payment.createMany({
    data: [
      {
        parentId: parentProfile.id,
        title: "İyun ayı təhsil haqqı",
        amount: 220,
        status: PaymentStatus.PAID,
        dueDate: daysAgo(60),
        paidAt: daysAgo(58),
        invoiceNo: "INV-2026-0601",
      },
      {
        parentId: parentProfile.id,
        title: "İyul ayı təhsil haqqı",
        amount: 220,
        status: PaymentStatus.PAID,
        dueDate: daysAgo(30),
        paidAt: daysAgo(29),
        invoiceNo: "INV-2026-0701",
      },
      {
        parentId: parentProfile.id,
        title: "Avqust ayı təhsil haqqı",
        amount: 220,
        status: PaymentStatus.PENDING,
        dueDate: daysFromNow(5),
        invoiceNo: "INV-2026-0801",
      },
    ],
  });

  // ---------- Notifications ----------
  await prisma.notification.createMany({
    data: [
      {
        userId: parentUser.id,
        title: "Sabahkı dərs xatırlatması",
        body: "Ali-nin dərsi sabah saat 18:00-da başlayır.",
        type: "info",
        read: false,
      },
      {
        userId: parentUser.id,
        title: "Yeni ev tapşırığı",
        body: "Web Security tapşırığı təyin edildi. Son tarix 5 gün sonradır.",
        type: "info",
        read: false,
      },
      {
        userId: parentUser.id,
        title: "Aylıq hesabat hazırdır",
        body: "Ali üçün iyul ayı tərəqqi hesabatı hazırdır.",
        type: "success",
        read: true,
      },
      {
        userId: parentUser.id,
        title: "Davamiyyət bildirişi",
        body: "Ali bugünkü dərsdə qeyb kimi qeyd edildi.",
        type: "warning",
        read: true,
      },
    ],
  });

  // ---------- CRM Leads ----------
  const leadSeeds = [
    { parentName: "Rəşad Əliyev", parentPhone: "+994505551111", studentName: "Kənan Əliyev", studentAge: 12, courseSlug: "kibertehlukesizlik", stage: "NEW" as const, daysBack: 0 },
    { parentName: "Nərgiz Hüseynova", parentPhone: "+994505552222", studentName: "Aytac Hüseynova", studentAge: 9, courseSlug: "robotexnika", stage: "NEW" as const, daysBack: 1 },
    { parentName: "Elnur Babayev", parentPhone: "+994505553333", studentName: "Tofiq Babayev", studentAge: 15, courseSlug: "suni-intellekt", stage: "CONTACTED" as const, daysBack: 2 },
    { parentName: "Aygün Rzayeva", parentPhone: "+994505554444", studentName: "Sənan Rzayev", studentAge: 11, courseSlug: "python", stage: "CONTACTED" as const, daysBack: 3 },
    { parentName: "Kamran Nəbiyev", parentPhone: "+994505555555", studentName: "Elvin Nəbiyev", studentAge: 14, courseSlug: "proqramlashdirma", stage: "TRIAL_LESSON" as const, daysBack: 5 },
    { parentName: "Ülviyyə Səfərova", parentPhone: "+994505556666", studentName: "Fidan Səfərova", studentAge: 10, courseSlug: "web-development", stage: "TRIAL_LESSON" as const, daysBack: 6 },
    { parentName: "Orxan Cəfərov", parentPhone: "+994505557777", studentName: "Rauf Cəfərov", studentAge: 13, courseSlug: "elektronika", stage: "TRIAL_COMPLETED" as const, daysBack: 9 },
    { parentName: "Şəbnəm Quliyeva", parentPhone: "+994505558888", studentName: "Aysel Quliyeva", studentAge: 8, courseSlug: "robotexnika", stage: "INTERESTED" as const, daysBack: 12 },
    { parentName: "Tural Məmmədov", parentPhone: "+994505559999", studentName: "Nihad Məmmədov", studentAge: 16, courseSlug: "linux", stage: "INTERESTED" as const, daysBack: 14 },
    { parentName: "Günel İsmayılova", parentPhone: "+994505550000", studentName: "Vüsal İsmayılov", studentAge: 12, courseSlug: "oyun-yaratma", stage: "REGISTERED" as const, daysBack: 20 },
  ];
  for (const lead of leadSeeds) {
    await prisma.trialBooking.create({
      data: {
        parentName: lead.parentName,
        parentPhone: lead.parentPhone,
        studentName: lead.studentName,
        studentAge: lead.studentAge,
        courseId: courses[lead.courseSlug].id,
        preferredDate: daysFromNow(7 - lead.daysBack),
        preferredTime: "18:00",
        stage: lead.stage,
        createdAt: daysAgo(lead.daysBack),
      },
    });
  }

  // ---------- Testimonials ----------
  await prisma.testimonial.createMany({
    data: [
      {
        name: "Vüqar Məmmədov",
        role: "Valideyn",
        courseTag: "Kibertəhlükəsizlik",
        rating: 5,
        quote:
          "Oğlum hər dərsə böyük həvəslə gedir. Saleh Tech School-da öyrəndiyi proqramlaşdırma bilikləri onun məntiqi düşünməsini çox inkişaf etdirib.",
        avatarUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg",
      },
      {
        name: "Leyla Əliyeva",
        role: "Valideyn",
        courseTag: "Robotexnika",
        rating: 5,
        quote: "Qızımın texnologiyaya olan marağı burada peşəkar şəkildə yönləndirilir. Valideyn paneli isə hər şeyi şəffaf edir.",
        avatarUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg",
      },
      {
        name: "Samir Quliyev",
        role: "Valideyn",
        courseTag: "Proqramlaşdırma",
        rating: 5,
        quote: "Müasir dünyada uşaqların texnologiyanı öyrənməsi şərtdir. Bu məktəb bizə keyfiyyətli təhsil və əyləncəni bir arada təqdim edir.",
        avatarUrl: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg",
      },
    ],
  });

  // ---------- Admin ----------
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@salehtech.az",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });

  console.log("Seed complete.");
  console.log("Demo parent login: elvin.memmedov@example.com / parent123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
