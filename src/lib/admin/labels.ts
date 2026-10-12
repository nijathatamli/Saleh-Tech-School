// Display labels shared by server pages and client dialogs. Kept out of "use client" modules on purpose:
// a server component cannot read a constant that is exported from a client module.
export const CATEGORY_LABEL: Record<string, string> = { cybersecurity: "Kibertəhlükəsizlik", python: "Python", programming: "Proqramlaşdırma", robotics: "Robototexnika", electronics: "Elektronika", web: "Veb", ai: "Süni intellekt", iot: "IoT", linux: "Linux", game: "Oyun yaratma", other: "Digər" };
export const LEVEL_LABEL: Record<string, string> = { BEGINNER: "Başlanğıc", INTERMEDIATE: "Orta", ADVANCED: "Qabaqcıl" };
export const STAGE_LABEL: Record<string, string> = { NEW: "Yeni", CONTACTED: "Əlaqə saxlanılıb", TRIAL_LESSON: "Sınaq dərsi", TRIAL_COMPLETED: "Sınaq bitib", INTERESTED: "Maraqlıdır", REGISTERED: "Tələbə yaradılıb", REJECTED: "Rədd edilib" };
