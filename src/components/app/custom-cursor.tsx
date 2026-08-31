"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, label, summary, [role="button"], [role="link"], .highlight-card, .teacher-card, .course-card';

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

export function CustomCursor() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canHover = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduceMotion) return;

    document.documentElement.classList.add("custom-cursor-active");

    const el = elRef.current;
    if (!el) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let moveTilt = 0;
    let tilt = 0;
    let scaleX = 1;
    let scaleY = 1;
    let hovering = false;
    let pressed = false;
    let rafId: number;

    function render() {
      const hoverTilt = hovering ? -14 : 0;
      tilt = lerp(tilt, moveTilt + hoverTilt, 0.15);

      const targetScaleX = pressed ? 1.3 : hovering ? 1.18 : 1;
      const targetScaleY = pressed ? 0.72 : hovering ? 1.18 : 1;
      scaleX = lerp(scaleX, targetScaleX, 0.25);
      scaleY = lerp(scaleY, targetScaleY, 0.25);

      el!.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-45%, -55%) rotate(${tilt}deg) scale(${scaleX}, ${scaleY})`;
      moveTilt = lerp(moveTilt, 0, 0.1);
      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);

    function onMove(e: MouseEvent) {
      const dx = e.clientX - x;
      x = e.clientX;
      y = e.clientY;
      moveTilt = Math.max(-20, Math.min(20, moveTilt + dx * 1.2));
    }

    function onOver(e: MouseEvent) {
      const target = e.target instanceof Element ? e.target.closest(INTERACTIVE_SELECTOR) : null;
      hovering = !!target;
    }

    function onDown() {
      pressed = true;
    }
    function onUp() {
      pressed = false;
    }
    function onLeave() {
      el!.style.opacity = "0";
    }
    function onEnter() {
      el!.style.opacity = "1";
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  return (
    <div ref={elRef} className="cursor-fox" aria-hidden="true">
      🦊
    </div>
  );
}
