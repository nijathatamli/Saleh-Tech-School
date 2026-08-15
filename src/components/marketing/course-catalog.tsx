"use client";

import { useState } from "react";
import type { Course } from "@prisma/client";
import { CourseCard } from "./course-card";

const categories = [
  { key: "all", label: "Hamısı" },
  { key: "cybersecurity", label: "Kibertəhlükəsizlik" },
  { key: "programming", label: "Proqramlaşdırma" },
  { key: "python", label: "Python" },
  { key: "web", label: "Web" },
  { key: "robotics", label: "Robotexnika" },
  { key: "electronics", label: "Elektronika" },
  { key: "ai", label: "Süni İntellekt" },
  { key: "game", label: "Oyun" },
  { key: "linux", label: "Linux" },
  { key: "iot", label: "IoT" },
];

export function CourseCatalog({ courses }: { courses: Course[] }) {
  const [active, setActive] = useState("all");
  const filtered = active === "all" ? courses : courses.filter((c) => c.category === active);

  return (
    <div>
      <div className="no-scrollbar mb-12 flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setActive(c.key)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              active === c.key
                ? "bg-primary text-white shadow-md"
                : "bg-grey-100 text-grey-500 hover:bg-grey-200 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-grey-500">Bu kateqoriyada hələ kurs yoxdur.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
