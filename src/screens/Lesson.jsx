// 3-9 1주차 강의 — 카드 10장, 열람 즉시 진행도 반영. 퀴즈 오답 딥링크(state.lessonCard) 지원.
import { useEffect, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { WEEK1_LESSONS, LESSON_IMAGES } from '../data/lessons.js'
import { Md } from '../components/ui.jsx'

function Block({ block }) {
  switch (block.type) {
    case 'p': return <p><Md text={block.text} /></p>
    case 'ul': return <ul>{block.items.map((it, i) => <li key={i}><Md text={it} /></li>)}</ul>
    case 'note': return <div className="note"><Md text={block.text} /></div>
    case 'quote': return <div className="quote"><Md text={block.text} /></div>
    case 'img': return <img className="lesson-img" src={LESSON_IMAGES[block.src]} alt={block.alt} />
    default: return null
  }
}

export default function Lesson() {
  const { state, dispatch } = useStore()
  // 진입 카드: 딥링크 > 첫 미열람 카드 > 1
  const initial = () => {
    if (state.lessonCard) return state.lessonCard - 1
    const firstUnseen = WEEK1_LESSONS.findIndex((l) => !state.week1.cardsViewed.includes(l.id))
    return firstUnseen === -1 ? 0 : firstUnseen
  }
  const [idx, setIdx] = useState(initial)
  const lesson = WEEK1_LESSONS[idx]
  const isLast = idx === WEEK1_LESSONS.length - 1
  const viewedCount = state.week1.cardsViewed.length

  useEffect(() => {
    dispatch({ type: 'VIEW_CARD', cardId: lesson.id })
  }, [lesson.id, dispatch])

  return (
    <div>
      <div className="eyebrow">1주차 강의 · 카드 {idx + 1}/10</div>
      <div className="card lesson-card mt12">
        <h2 className="section-title">{lesson.title}</h2>
        <div className="lesson-body">
          {lesson.body.map((b, i) => <Block key={i} block={b} />)}
        </div>
      </div>

      <div className="dots">
        {WEEK1_LESSONS.map((l, i) => (
          <span key={l.id}
            className={`dot-i${i === idx ? ' on' : state.week1.cardsViewed.includes(l.id) ? ' seen' : ''}`} />
        ))}
      </div>

      <div className="lesson-nav">
        <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>이전</button>
        {isLast ? (
          <button className="btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'practice1' })}>
            실습 하러 가기 ({viewedCount}/10 완료)
          </button>
        ) : (
          <button className="btn" onClick={() => setIdx(idx + 1)}>다음</button>
        )}
      </div>
      {state.lessonCard && (
        <p className="center mt12">
          <button className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'quiz' })}>
            퀴즈로 돌아가기
          </button>
        </p>
      )}
    </div>
  )
}
