export function Completion({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="completion" aria-live="polite">
      <div className="completion-inner">
        <h1>You're ready!</h1>
        <p>See you in Paris — 10 / 11 Sept 2026</p>
      </div>
    </div>
  )
}
