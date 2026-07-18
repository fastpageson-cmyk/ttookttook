// 3-11 확인 퀴즈 — 5문항, 4개 이상 정답 시 통과. 오답은 관련 강의 카드 딥링크 제공.
import { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { WEEK1_QUIZ } from '../data/quiz.js'
import { QUIZ_PASS_SCORE } from '../engine/constants.js'
import { ProgressBar } from '../components/ui.jsx'

export default function Quiz() {
  const { state, dispatch } = useStore()
  const [answers, setAnswers] = useState(Array(WEEK1_QUIZ.length).fill(-1))
  const [idx, setIdx] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const q = WEEK1_QUIZ[idx]
  const allAnswered = answers.every((a) => a !== -1)
  const score = WEEK1_QUIZ.reduce((s, qq, i) => s + (answers[i] === qq.answer ? 1 : 0), 0)
  const passed = score >= QUIZ_PASS_SCORE

  const submit = () => {
    setSubmitted(true)
    dispatch({ type: 'QUIZ_RESULT', score })
  }
  const retry = () => {
    setAnswers(Array(WEEK1_QUIZ.length).fill(-1))
    setIdx(0)
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div>
        <div className="eyebrow">확인 퀴즈 결과</div>
        <div className="score-hero">
          <div className="score-big">{score}<small> / 5</small></div>
          <p className="muted mt8">
            {passed
              ? '통과했습니다! 1주차를 완료했습니다 🎉'
              : `통과 기준은 ${QUIZ_PASS_SCORE}문항입니다. 틀린 개념을 다시 보고 재도전해보세요.`}
          </p>
        </div>

        {WEEK1_QUIZ.map((qq, i) => {
          const ok = answers[i] === qq.answer
          return (
            <div className="card pad mt12" key={qq.id}>
              <b style={{ fontSize: 14.5 }}>Q{i + 1}. {qq.q}</b>
              <div className={`feedback ${ok ? 'ok' : 'bad'}`} style={{ marginTop: 10 }}>
                {ok ? '정답' : `오답 — 정답: ${qq.choices[qq.answer]}`}<br />
                <span style={{ fontSize: 13 }}>{qq.explain}</span>
              </div>
              {!ok && (
                <button className="icon-btn mt8" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'lesson', lessonCard: qq.cardRef })}>
                  카드 {qq.cardRef} 다시 보기 →
                </button>
              )}
            </div>
          )
        })}

        <div className="diag-nav">
          {passed ? (
            <button className="btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })}>
              홈으로 — 1주차 완료
            </button>
          ) : (
            <>
              <button className="btn ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'lesson' })}>강의 다시 보기</button>
              <button className="btn" onClick={retry}>재도전</button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="eyebrow">1주차 확인 퀴즈</div>
      <h2 className="section-title mt8">배운 걸 확인해볼 시간</h2>
      <p className="muted mt8">5문항 중 {QUIZ_PASS_SCORE}문항 이상 맞히면 1주차 완료입니다.</p>

      <div className="mt20">
        <div className="q-head">
          <span className="q-num">{idx + 1} / {WEEK1_QUIZ.length}</span>
        </div>
        <ProgressBar value={(answers.filter((a) => a !== -1).length / WEEK1_QUIZ.length) * 100} />
        <p className="q-text">{q.q}</p>
        <div className="choices">
          {q.choices.map((c, i) => (
            <button key={i}
              className={`choice${answers[idx] === i ? ' selected' : ''}`}
              onClick={() => {
                const next = [...answers]; next[idx] = i; setAnswers(next)
              }}>
              {c}
            </button>
          ))}
        </div>
        <div className="diag-nav">
          <button className="btn ghost" onClick={() => setIdx(idx - 1)} disabled={idx === 0}>이전</button>
          {idx === WEEK1_QUIZ.length - 1 ? (
            <button className="btn" onClick={submit} disabled={!allAnswered}>제출하기</button>
          ) : (
            <button className="btn" onClick={() => setIdx(idx + 1)} disabled={answers[idx] === -1}>다음</button>
          )}
        </div>
      </div>
    </div>
  )
}
