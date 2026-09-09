import { useMemo } from "react";
import { checklist } from "../data/checklist";
import { useChecklistStore } from "../hooks/useChecklistStore";
import { SoftShape } from "./SoftShape";

export function ChecklistPanel() {
  const packed = useChecklistStore((s) => s.packed);

  const done = useMemo(
    () => checklist.reduce((acc, it) => acc + (packed[it.id] ? 1 : 0), 0),
    [packed],
  );

  return (
    <aside className="clist" aria-label="Packing checklist">
      <SoftShape
        className="clist__card"
        radius={28}
        fill="#f2ebd5"
        perimeterPoints={48}
        spring={0.14}
        damping={0.65}
        contentParallax={0}
        padding={0}
      >
        <div className="clist__inner">
          <SoftShape
            className="clist__pill-wrap"
            radius={999}
            fill="#7d63ff"
            perimeterPoints={36}
            influenceRadius={0}
            spring={0.18}
            damping={0.74}
            contentParallax={0}
          >
            <span className="clist__pill-label">Checklist</span>
          </SoftShape>
          <ul className="clist__items" role="list">
            {checklist.map((item) => {
              const isDone = !!packed[item.id];
              return (
                <li
                  key={item.id}
                  className={isDone ? "is-done" : ""}
                  aria-label={`${item.label}${isDone ? " — packed" : " — pending"}`}
                >
                  <span className="clist__bullet" aria-hidden>
                    •
                  </span>
                  <span className="clist__label">{item.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </SoftShape>
    </aside>
  );
}
