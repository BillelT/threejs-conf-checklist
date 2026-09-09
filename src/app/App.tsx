import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Experience } from "../scene/Experience";
import { ChecklistPanel } from "../components/ChecklistPanel";
import { Toasts, pushToast } from "../components/Toasts";
import { Completion } from "../components/Completion";
import { useChecklistStore } from "../hooks/useChecklistStore";
import { checklist, type ItemKind } from "../data/checklist";
import { popConfetti, celebrate } from "../lib/confetti";
import { installPointerManager } from "../lib/pointer";
import { TitleDeformation } from "../components/TitleDeformation";
import { BagTarget } from "../components/BagTarget";
import { SoundToggle } from "../components/SoundToggle";
import { reducedMotion } from "../lib/motion";
import { installSoundUnlock } from "../lib/sounds";

export function App() {
  const packed = useChecklistStore((s) => s.packed);
  const toggle = useChecklistStore((s) => s.toggle);
  const totalDone = useMemo(
    () => checklist.reduce((n, it) => n + (packed[it.id] ? 1 : 0), 0),
    [packed],
  );
  const [showCompletion, setShowCompletion] = useState(false);
  const celebratedRef = useRef(totalDone === checklist.length);
  const burstTimers = useRef(new Set<number>());
  useEffect(() => () => burstTimers.current.forEach(window.clearTimeout), []);
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const hero = heroRef.current;
    const title = titleRef.current;
    if (!hero || !title) return;

    const fit = () => {
      const heroStyle = getComputedStyle(hero);
      const available =
        hero.clientWidth -
        parseFloat(heroStyle.paddingLeft) -
        parseFloat(heroStyle.paddingRight);
      if (available <= 0) return;
      const currentSize = parseFloat(getComputedStyle(title).fontSize);
      const widths = Array.from(
        title.querySelectorAll<HTMLSpanElement>("span"),
        (line) => {
          const range = document.createRange();
          range.selectNodeContents(line);
          return range.getBoundingClientRect().width;
        },
      );
      const longest = Math.max(...widths);
      if (longest > 0)
        title.style.fontSize = `${(currentSize * available) / longest}px`;
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(hero);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return installPointerManager();
  }, []);
  useEffect(() => installSoundUnlock(), []);

  const handleCollect = useCallback(
    (id: ItemKind, x: number, y: number) => {
      const wasPacked = !!packed[id];
      if (wasPacked) return;
      toggle(id);
      const item = checklist.find((i) => i.id === id);
      pushToast({
        text: `Packed: ${item?.label ?? id}`,
        kind: "success",
        color: item?.color,
      });
      const timer = window.setTimeout(() => {
        burstTimers.current.delete(timer);
        const ring = document.querySelector('.bag-target')?.getBoundingClientRect();
        popConfetti(ring ? ring.x + ring.width / 2 : x, ring ? ring.y + ring.height / 2 : y);
      }, reducedMotion() ? 100 : 560);
      burstTimers.current.add(timer);
    },
    [packed, toggle],
  );

  useEffect(() => {
    if (totalDone === checklist.length && !celebratedRef.current) {
      celebratedRef.current = true;
      const timer = window.setTimeout(celebrate, reducedMotion() ? 160 : 740);
      burstTimers.current.add(timer);
      pushToast({ text: "You're ready — see you in Paris!", kind: "win" });
      setShowCompletion(true);
      window.setTimeout(() => setShowCompletion(false), 4200);
    }
    if (totalDone < checklist.length) {
      celebratedRef.current = false;
    }
  }, [totalDone]);

  return (
    <>
      <div className="bg-gradient" aria-hidden />
      <div
        className="stage"
        role="region"
        aria-label="Drag the six objects into the purple backpack"
      >
        <Experience onCollect={handleCollect} />
      </div>
      <div className="grain" aria-hidden />
      <BagTarget />
      <SoundToggle />
      <main className="page">
        <section className="hero" ref={heroRef}>
          <h1 className="title" ref={titleRef}>
            <span>Three.js</span>
            <span>Conf</span>
            <span>Checklist</span>
          </h1>
          <TitleDeformation titleRef={titleRef} />
        </section>
        <ChecklistPanel />
        <section className="game" aria-label="3D packing area" />
      </main>
      <Toasts />
      <Completion visible={showCompletion} />
    </>
  );
}
