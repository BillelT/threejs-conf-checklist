import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { getPointer } from "../lib/pointer";
import { dampFactor, reducedMotion, springStep } from "../lib/motion";

// Reusable elastic-perimeter shape. Renders an SVG background whose contour
// is deformed locally by the shared pointer manager, with spring-return
// physics per point and a Catmull-Rom → cubic Bézier spline reconstruction.
//
// The content sits inside a plain DOM node and only receives a tiny content
// parallax translate — it never distorts. This mirrors the spec exactly.

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  radius?: number; // corner radius in px
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  perimeterPoints?: number;
  influenceRadius?: number; // pointer reach in px, including outside the element
  strength?: number; // fraction of pointer distance used for deformation
  spring?: number; // rest return stiffness (0..1 per step)
  damping?: number; // damping ratio: below 1 adds a light return bounce
  contentParallax?: number; // px content translate at edge
  push?: boolean; // if true, contour is pushed away instead of pulled
  padding?: number; // inner padding around content, px
};

type SoftPoint = {
  restX: number;
  restY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

// Build a rounded-rect perimeter sample set with roughly even spacing.
function buildPerimeter(
  w: number,
  h: number,
  r: number,
  n: number,
): SoftPoint[] {
  const rr = Math.min(r, w / 2, h / 2);
  const straightX = Math.max(0, w - 2 * rr);
  const straightY = Math.max(0, h - 2 * rr);
  const cornerLen = (Math.PI * rr) / 2;
  const perimeter = 2 * (straightX + straightY) + 4 * cornerLen;
  const step = perimeter / n;

  const pts: SoftPoint[] = [];
  let cursor = 0;

  // Walk clockwise from top-left corner start (after the corner).
  // Segments: top-line → TR-corner → right-line → BR-corner → bottom-line →
  //           BL-corner → left-line → TL-corner
  type Seg =
    | {
        kind: "line";
        x0: number;
        y0: number;
        x1: number;
        y1: number;
        len: number;
      }
    | {
        kind: "arc";
        cx: number;
        cy: number;
        a0: number;
        a1: number;
        len: number;
      };
  const segs: Seg[] = [
    { kind: "line", x0: rr, y0: 0, x1: rr + straightX, y1: 0, len: straightX },
    {
      kind: "arc",
      cx: w - rr,
      cy: rr,
      a0: -Math.PI / 2,
      a1: 0,
      len: cornerLen,
    },
    { kind: "line", x0: w, y0: rr, x1: w, y1: rr + straightY, len: straightY },
    {
      kind: "arc",
      cx: w - rr,
      cy: h - rr,
      a0: 0,
      a1: Math.PI / 2,
      len: cornerLen,
    },
    {
      kind: "line",
      x0: w - rr,
      y0: h,
      x1: rr,
      y1: h,
      len: straightX,
    },
    {
      kind: "arc",
      cx: rr,
      cy: h - rr,
      a0: Math.PI / 2,
      a1: Math.PI,
      len: cornerLen,
    },
    { kind: "line", x0: 0, y0: h - rr, x1: 0, y1: rr, len: straightY },
    {
      kind: "arc",
      cx: rr,
      cy: rr,
      a0: Math.PI,
      a1: (3 * Math.PI) / 2,
      len: cornerLen,
    },
  ];

  let segIdx = 0;
  let segOffset = 0;
  for (let i = 0; i < n; i++) {
    // Advance segIdx / segOffset until cursor fits.
    while (segIdx < segs.length && cursor > segOffset + segs[segIdx].len) {
      segOffset += segs[segIdx].len;
      segIdx++;
    }
    if (segIdx >= segs.length) break;
    const s = segs[segIdx];
    const local = cursor - segOffset;
    let x = 0;
    let y = 0;
    if (s.kind === "line") {
      const tt = s.len === 0 ? 0 : local / s.len;
      x = s.x0 + (s.x1 - s.x0) * tt;
      y = s.y0 + (s.y1 - s.y0) * tt;
    } else {
      const tt = s.len === 0 ? 0 : local / s.len;
      const a = s.a0 + (s.a1 - s.a0) * tt;
      x = s.cx + Math.cos(a) * rr;
      y = s.cy + Math.sin(a) * rr;
    }
    pts.push({ restX: x, restY: y, x, y, vx: 0, vy: 0 });
    cursor += step;
  }
  return pts;
}

// Catmull-Rom (uniform, tension 0.5) → cubic Bézier, closed loop.
function toSmoothPath(pts: SoftPoint[]): string {
  const n = pts.length;
  if (n < 3) return "";
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} `;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
  }
  return d + "Z";
}

export function SoftShape({
  children,
  className,
  style,
  radius = 24,
  fill = "#f2ebd5",
  stroke,
  strokeWidth = 0,
  perimeterPoints = 44,
  influenceRadius = 150,
  strength = 0.2,
  spring = 0.2,
  damping = 0.65,
  contentParallax = 6,
  push = false,
  padding = 0,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const pointsRef = useRef<SoftPoint[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });

  const uid = useMemo(
    () => `soft-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    let rafId = 0;

    const resize = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(2, rect.width);
      const h = Math.max(2, rect.height);
      const prev = sizeRef.current;
      if (
        Math.abs(prev.w - w) < 0.5 &&
        Math.abs(prev.h - h) < 0.5 &&
        pointsRef.current.length
      ) {
        return;
      }
      sizeRef.current = { w, h };
      pointsRef.current = buildPerimeter(w, h, radius, perimeterPoints);
      if (pathRef.current) {
        pathRef.current.setAttribute("d", toSmoothPath(pointsRef.current));
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let lastTime = performance.now();
    let contentX = 0;
    let contentY = 0;
    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const quiet = reducedMotion();
      const rect = el.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (
        Math.abs(sizeRef.current.w - w) > 0.5 ||
        Math.abs(sizeRef.current.h - h) > 0.5
      ) {
        resize();
      }
      const p = getPointer();
      const pts = pointsRef.current;

      // Convert pointer to local shape coordinates.
      const mx = p.screenX - rect.left;
      const my = p.screenY - rect.top;
      const reach = Math.max(0, influenceRadius);
      const outsideDistance = Math.hypot(
        Math.max(0, -mx, mx - w),
        Math.max(0, -my, my - h),
      );
      const active = p.active && !quiet && reach > 0 && outsideDistance < reach;
      const proximity = active ? 1 - outsideDistance / reach : 0;
      const envelope = proximity * proximity * (3 - 2 * proximity);
      const maxDisplacement = Math.min(24, Math.min(w, h) * 0.22);
      const frequency = 5 + spring * 12 + (1 - damping) * 3;

      // Per-point integration: local pointer force + spring + damping.
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        let targetX = pt.restX;
        let targetY = pt.restY;
        if (active) {
          const dx = mx - pt.restX;
          const dy = my - pt.restY;
          const dist = Math.hypot(dx, dy);
          if (dist < reach && dist > 0.001) {
            const t = 1 - dist / reach;
            const falloff = t * t * (3 - 2 * t);
            const sign = push ? -1 : 1;
            // Scale with distance so the force stays continuous when crossing
            // a contour point. Soft-limit it to preserve small pills' shape.
            const displacement =
              maxDisplacement *
              Math.tanh((dist * strength * falloff) / maxDisplacement);
            targetX += sign * (dx / dist) * displacement;
            targetY += sign * (dy / dist) * displacement;
          }
        }
        const x = springStep(pt.x, pt.vx, targetX, frequency, dt, damping);
        const y = springStep(pt.y, pt.vy, targetY, frequency, dt, damping);
        pt.x = x.position;
        pt.y = y.position;
        pt.vx = x.velocity;
        pt.vy = y.velocity;
      }

      if (pathRef.current) {
        pathRef.current.setAttribute("d", toSmoothPath(pts));
      }

      // Subtle content parallax — the content moves a tiny amount toward the
      // pointer to feel connected, but never deforms.
      if (contentRef.current) {
        const cx = w / 2;
        const cy = h / 2;
        const ndx = active ? (mx - cx) / (w / 2) : 0;
        const ndy = active ? (my - cy) / (h / 2) : 0;
        const clamp = Math.max(-1, Math.min(1, Math.hypot(ndx, ndy)));
        const tx = active
          ? Math.max(-1, Math.min(1, ndx)) * contentParallax * clamp * envelope
          : 0;
        const ty = active
          ? Math.max(-1, Math.min(1, ndy)) * contentParallax * clamp * envelope
          : 0;
        contentX += (tx - contentX) * dampFactor(9, dt);
        contentY += (ty - contentY) * dampFactor(9, dt);
        contentRef.current.style.transform = `translate3d(${contentX.toFixed(2)}px, ${contentY.toFixed(2)}px, 0)`;
      }

      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [
    radius,
    perimeterPoints,
    influenceRadius,
    strength,
    spring,
    damping,
    contentParallax,
    push,
  ]);

  return (
    <div
      ref={wrapRef}
      className={`soft-shape ${className ?? ""}`}
      style={style}
    >
      <svg
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <path
          ref={pathRef}
          id={uid}
          d=""
          fill={fill}
          stroke={stroke || "none"}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </svg>
      <div
        ref={contentRef}
        style={{
          position: "relative",
          zIndex: 1,
          padding,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
