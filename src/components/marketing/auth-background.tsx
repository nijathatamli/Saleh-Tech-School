const particles = [
  { top: "12%", left: "18%", size: 6, delay: "0s", duration: "7s" },
  { top: "70%", left: "10%", size: 4, delay: "1.2s", duration: "8s" },
  { top: "25%", left: "82%", size: 5, delay: "0.6s", duration: "6.5s" },
  { top: "60%", left: "88%", size: 3, delay: "2s", duration: "9s" },
  { top: "85%", left: "45%", size: 4, delay: "1.6s", duration: "7.5s" },
  { top: "8%", left: "55%", size: 3, delay: "2.4s", duration: "6s" },
];

export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-32 -left-32 h-96 w-96 animate-blob rounded-full bg-electric-500/20 blur-[120px] motion-reduce:animate-none" />
      <div
        className="absolute -bottom-32 -right-32 h-96 w-96 animate-blob rounded-full bg-amber-500/20 blur-[120px] motion-reduce:animate-none"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-blob rounded-full bg-violet-500/10 blur-[120px] motion-reduce:animate-none"
        style={{ animationDelay: "8s" }}
      />

      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-electric-400/60 animate-drift motion-reduce:animate-none"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
