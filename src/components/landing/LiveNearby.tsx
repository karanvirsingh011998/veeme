"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LIVE_PLANS } from "@/lib/constants";
import styles from "./LiveNearby.module.css";

const AUTO_SPEED = 0.45;
const RESUME_MS = 1400;

/**
 * Nearby-plans strip. Auto-scrolls, and the user can drag or scroll it.
 */
export function LiveNearby() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const resumeRef = useRef<number | null>(null);
  const originRef = useRef({ x: 0, scroll: 0 });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let ignoreScrollUntil = 0;

    function loopWidth() {
      const track = viewport?.firstElementChild;
      if (!track) return 0;
      const first = track.children[0] as HTMLElement | undefined;
      const second = track.children[LIVE_PLANS.length] as HTMLElement | undefined;
      if (!first || !second) return 0;
      return second.offsetLeft - first.offsetLeft;
    }

    function wrap() {
      const width = loopWidth();
      if (!viewport || width <= 0) return;
      if (viewport.scrollLeft >= width) viewport.scrollLeft -= width;
      else if (viewport.scrollLeft < 0) viewport.scrollLeft += width;
    }

    function pause() {
      pausedRef.current = true;
      if (resumeRef.current) window.clearTimeout(resumeRef.current);
      resumeRef.current = window.setTimeout(() => {
        if (!draggingRef.current) pausedRef.current = false;
      }, RESUME_MS);
    }

    function tick() {
      if (!reduced && !pausedRef.current && viewport) {
        ignoreScrollUntil = performance.now() + 80;
        viewport.scrollLeft += AUTO_SPEED;
        wrap();
      }
      frame = window.requestAnimationFrame(tick);
    }

    function onScroll() {
      if (performance.now() < ignoreScrollUntil) return;
      pause();
      wrap();
    }

    function onWheel(event: WheelEvent) {
      if (!viewport) return;
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (delta === 0) return;
      event.preventDefault();
      pause();
      viewport.scrollLeft += delta;
      wrap();
    }

    frame = window.requestAnimationFrame(tick);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    viewport.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.cancelAnimationFrame(frame);
      if (resumeRef.current) window.clearTimeout(resumeRef.current);
      viewport.removeEventListener("scroll", onScroll);
      viewport.removeEventListener("wheel", onWheel);
    };
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    draggingRef.current = true;
    movedRef.current = false;
    pausedRef.current = true;
    originRef.current = { x: event.clientX, scroll: viewport.scrollLeft };
    try {
      viewport.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is unavailable for some synthetic events.
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const delta = event.clientX - originRef.current.x;
    if (Math.abs(delta) > 4) movedRef.current = true;
    viewport.scrollLeft = originRef.current.scroll - delta;
  }

  function endDrag() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (resumeRef.current) window.clearTimeout(resumeRef.current);
    resumeRef.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_MS);
  }

  function onClickCapture(event: React.MouseEvent) {
    if (!movedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    movedRef.current = false;
  }

  const loop = [...LIVE_PLANS, ...LIVE_PLANS];

  return (
    <section
      id="nearby"
      className={`section ${styles.section}`}
      aria-labelledby="nearby-heading"
    >
      <div className="container">
        <h2 id="nearby-heading" className={styles.title}>
          Live nearby plans
        </h2>
      </div>

      <div
        ref={viewportRef}
        className={styles.viewport}
        aria-label="Live nearby plans carousel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        <div className={styles.track}>
          {loop.map((plan, index) => (
            <Link
              key={`${plan.title}-${index}`}
              href="/signup"
              className={styles.card}
              draggable={false}
              tabIndex={index >= LIVE_PLANS.length ? -1 : undefined}
              aria-hidden={index >= LIVE_PLANS.length ? true : undefined}
            >
              <span className={styles.category}>{plan.category}</span>
              <strong className={styles.cardTitle}>{plan.title}</strong>
              <span className={styles.meta}>{plan.meta}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
