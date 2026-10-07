"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LIVE_PLANS } from "@/lib/constants";
import styles from "./LiveNearby.module.css";

const AUTOPLAY_MS = 2800;
const RESUME_MS = 1600;
const SLIDE_MS = 650;

/**
 * Looping card carousel. Slides one plan at a time, and can be dragged or swiped.
 */
export function LiveNearby() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const originRef = useRef({ x: 0, scroll: 0 });
  const pauseRef = useRef<() => void>(() => {});
  const programmaticRef = useRef(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    let timer = 0;
    let resumeTimer = 0;
    let normalizeTimer = 0;

    const scroller = viewport;

    const onMotion = () => {
      reduced = motion.matches;
      arm();
    };

    const track = () => scroller.firstElementChild;

    const loopWidth = () => {
      const row = track();
      if (!row) return 0;
      const first = row.children[0] as HTMLElement | undefined;
      const second = row.children[LIVE_PLANS.length] as HTMLElement | undefined;
      if (!first || !second) return 0;
      return second.offsetLeft - first.offsetLeft;
    };

    const scrollPadding = () =>
      parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0;

    const nearestIndex = () => {
      const row = track();
      if (!row) return 0;
      const left = scroller.scrollLeft + scrollPadding();
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < row.children.length; i += 1) {
        const card = row.children[i] as HTMLElement;
        const dist = Math.abs(card.offsetLeft - left);
        if (dist < bestDist) {
          best = i;
          bestDist = dist;
        }
      }
      return best;
    };

    const normalize = () => {
      const width = loopWidth();
      if (width <= 0) return;
      if (scroller.scrollLeft >= width - 1) {
        const left = scroller.scrollLeft - width;
        programmaticRef.current = true;
        scroller.scrollTo({ left, behavior: "auto" });
      }
    };

    const snapTo = (index: number, smooth: boolean) => {
      const row = track();
      const card = row?.children[index] as HTMLElement | undefined;
      if (!card) return;
      programmaticRef.current = true;
      scroller.scrollTo({
        left: card.offsetLeft - scrollPadding(),
        behavior: smooth && !reduced ? "smooth" : "auto",
      });
      window.clearTimeout(normalizeTimer);
      normalizeTimer = window.setTimeout(() => {
        normalize();
        window.setTimeout(() => {
          programmaticRef.current = false;
        }, 80);
      }, smooth && !reduced ? SLIDE_MS : 40);
    };

    const advance = () => {
      if (draggingRef.current || reduced) return;
      normalize();
      const row = track();
      if (!row) return;
      const next = nearestIndex() + 1;
      if (next >= row.children.length) {
        snapTo(0, true);
        return;
      }
      snapTo(next, true);
    };

    const arm = () => {
      window.clearInterval(timer);
      if (reduced) return;
      timer = window.setInterval(advance, AUTOPLAY_MS);
    };

    const pause = () => {
      window.clearInterval(timer);
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        if (!draggingRef.current) arm();
      }, RESUME_MS);
    };

    pauseRef.current = pause;

    const onScrollEnd = () => {
      if (programmaticRef.current || draggingRef.current) return;
      pause();
    };

    arm();
    motion.addEventListener("change", onMotion);
    viewport.addEventListener("scrollend", onScrollEnd);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(resumeTimer);
      window.clearTimeout(normalizeTimer);
      motion.removeEventListener("change", onMotion);
      viewport.removeEventListener("scrollend", onScrollEnd);
    };
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pauseRef.current();
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    draggingRef.current = true;
    movedRef.current = false;
    originRef.current = { x: event.clientX, scroll: viewport.scrollLeft };
    viewport.classList.add(styles.dragging);
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
    const viewport = viewportRef.current;
    draggingRef.current = false;
    viewport?.classList.remove(styles.dragging ?? "");
    const step = (() => {
      const row = viewport?.firstElementChild;
      const first = row?.children[0] as HTMLElement | undefined;
      const next = row?.children[1] as HTMLElement | undefined;
      if (!first || !next) return 0;
      return next.offsetLeft - first.offsetLeft;
    })();
    if (viewport && step > 0) {
      const moved = viewport.scrollLeft - originRef.current.scroll;
      const start = Math.round(originRef.current.scroll / step);
      let index = Math.round(viewport.scrollLeft / step);
      if (index === start) {
        if (moved > step * 0.18) index = start + 1;
        else if (moved < -step * 0.18) index = start - 1;
      }
      const row = viewport.firstElementChild;
      const max = (row?.children.length ?? 1) - 1;
      index = Math.max(0, Math.min(max, index));
      const card = row?.children[index] as HTMLElement | undefined;
      if (card) {
        const pad = parseFloat(getComputedStyle(viewport).scrollPaddingLeft) || 0;
        programmaticRef.current = true;
        viewport.scrollTo({
          left: card.offsetLeft - pad,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
        window.setTimeout(() => {
          programmaticRef.current = false;
        }, SLIDE_MS);
      }
    }
    pauseRef.current();
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
        aria-roledescription="carousel"
        aria-label="Live nearby plans"
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
