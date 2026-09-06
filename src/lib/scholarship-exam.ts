export type ScholarshipQuestion = {
  id: string;
  section: string;
  text: string;
  options: string[];
  correctIndex: number;
};

// Server-side source of truth. Correct answers never leave this file — the
// public GET endpoint strips `correctIndex` before sending questions to the client.
export const SCHOLARSHIP_EXAM: ScholarshipQuestion[] = [
  {
    id: "q1",
    section: "Məntiqi düşüncə",
    text: "Ardıcıllığı davam etdirin: 2, 4, 8, 16, ...",
    options: ["20", "24", "32", "30"],
    correctIndex: 2,
  },
  {
    id: "q2",
    section: "Məntiqi düşüncə",
    text: "Əgər bütün pişiklər heyvandırsa və Fındıq bir pişikdirsə, aşağıdakılardan hansı doğrudur?",
    options: [
      "Fındıq heyvandır",
      "Fındıq pişik deyil",
      "Bütün heyvanlar pişikdir",
      "Bunu müəyyən etmək mümkün deyil",
    ],
    correctIndex: 0,
  },
  {
    id: "q3",
    section: "Proqramlaşdırma",
    text: "Bir dəyişənin dəyərini müvəqqəti yadda saxlayıb sonra istifadə etmək üçün nə istifadə olunur?",
    options: ["Dövr (loop)", "Dəyişən (variable)", "Şərt (condition)", "Funksiya çağırışı"],
    correctIndex: 1,
  },
  {
    id: "q4",
    section: "Proqramlaşdırma",
    text: "`for` və `while` strukturları proqramlaşdırmada nəyi ifadə edir?",
    options: ["Verilənlərin saxlanmasını", "Şərti keçidləri", "Təkrarlanan əməliyyatları (dövrləri)", "Fayl oxumağı"],
    correctIndex: 2,
  },
  {
    id: "q5",
    section: "Kibertəhlükəsizlik",
    text: "Aşağıdakılardan hansı güclü parol nümunəsidir?",
    options: ["123456", "salamdunya", "T3qaud!2026#Az", "parolparol"],
    correctIndex: 2,
  },
  {
    id: "q6",
    section: "Kibertəhlükəsizlik",
    text: "Naməlum göndəricidən gələn, sizdən bank məlumatlarınızı təcili tələb edən e-poçt necə adlanır?",
    options: ["Firewall", "Phishing (fişinq)", "VPN", "Backup"],
    correctIndex: 1,
  },
  {
    id: "q7",
    section: "Kibertəhlükəsizlik",
    text: "İki addımlı doğrulama (2FA) hesabınıza əlavə olaraq nə təmin edir?",
    options: ["Daha sürətli giriş", "Əlavə təhlükəsizlik qatı", "Daha az yaddaş istifadəsi", "Pulsuz internet"],
    correctIndex: 1,
  },
  {
    id: "q8",
    section: "Problem həlli",
    text: "Bir proqram gözlənilməz nəticə verirsə, ilk növbədə nə etmək məntiqlidir?",
    options: [
      "Kodun hamısını silib yenidən yazmaq",
      "Xətanı təkrarlayıb addım-addım yoxlamaq (debug)",
      "Kompüteri yenidən başlatmaq",
      "Heç nə etməmək",
    ],
    correctIndex: 1,
  },
  {
    id: "q9",
    section: "Problem həlli",
    text: "Böyük bir məsələni həll edərkən ən effektiv yanaşma hansıdır?",
    options: [
      "Məsələni kiçik hissələrə bölmək",
      "Bütün məsələni bir dəfəyə həll etməyə çalışmaq",
      "Məsələni nəzərə almamaq",
      "Təsadüfi həll cəhd etmək",
    ],
    correctIndex: 0,
  },
  {
    id: "q10",
    section: "Yaradıcılıq",
    text: "Yeni bir mobil tətbiq ideyası hazırlayarkən ən vacib ilk addım nədir?",
    options: [
      "Dərhal kod yazmağa başlamaq",
      "İstifadəçinin problemini müəyyən etmək",
      "Loqonu dizayn etmək",
      "Reklam büdcəsi ayırmaq",
    ],
    correctIndex: 1,
  },
];

export const SCHOLARSHIP_PASS_RATIO = 0.7;

export function generateApplicationCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `STS-${year}-${random}`;
}
