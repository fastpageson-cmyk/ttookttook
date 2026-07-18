// 3-3 사전 진단 20문항 — 진행률, 이전/다음, 응답은 store에 즉시 저장(중도 이탈 시 유지)
import { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { DIAGNOSIS_QUESTIONS } from '../data/diagnosis.js'
import { ProgressBar } from '../components/ui.jsx'

export default function Diagnosis() {
  const { state, dispatch } = useStore()
  const answers = state.diagnosis.answers
  // 재진입 시 첫 미응답 문항부터
  const firstUnanswered = answers.findIndex((a) => a === -1)
  const [idx, setIdx] = useState(firstUnanswered === -1 ? 19 : firstUnanswered)

  const q = DIAGNOSIS_QUESTIONS[idx]
  const answeredCount = answers.filter((a) => a !== -1).length
  const allAnswered = answeredCount === 20
  const isLast = idx === 19

  const select = (choice) => dispatch({ type: 'ANSWER_DIAG', index: idx, choice })
  const next = () => {
    if (isLast) {
      if (allAnswered) dispatch({ type: 'COMPLETE_DIAG', completedAt: new Date().toISOString() })
      return
    }
    setIdx(idx + 1)
  }

  return (
    <div>
      <div className="eyebrow">사전 진단</div>
      <h2 className="section-title mt8">지금 나의 금융이해력은?</h2>
      <p className="muted mt8">부담 없이 풀어보세요. 점수는 학습 전후 비교에만 쓰입니다.</p>

      <div className="mt20">
        <div className="q-head">
          <span className="q-num">{idx + 1} / 20</span>
          <span className="q-cat">{q.category}</span>
        </div>
        <ProgressBar value={(answeredCount / 20) * 100} />
        <p className="q-text">{q.q}</p>
        <div className="choices">
          {q.choices.map((c, i) => (
            <button
              key={i}
              className={`choice${answers[idx] === i ? ' selected' : ''}`}
              onClick={() => select(i)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="diag-nav">
          <button className="btn ghost" onClick={() => setIdx(idx - 1)} disabled={idx === 0}>
            이전
          </button>
          <button
            className="btn"
            onClick={next}
            disabled={isLast ? !allAnswered : answers[idx] === -1}
          >
            {isLast ? '결과 보기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}
