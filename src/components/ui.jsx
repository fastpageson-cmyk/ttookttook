// 작은 공통 컴포넌트 모음
export function ProgressBar({ value }) {
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function Modal({ title, children, actions }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        {title && <h3>{title}</h3>}
        <div className="muted">{children}</div>
        {actions && <div className="modal-btns">{actions}</div>}
      </div>
    </div>
  )
}

// **굵게** 인라인 마크업 렌더러 (강의 카드 본문용)
export function Md({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
    </>
  )
}
