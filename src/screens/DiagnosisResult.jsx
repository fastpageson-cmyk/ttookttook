// 3-4 진단 결과 — 내 점수 vs 또래 평균(62.6) 비교, 점수별 페르소나, 오답 풀이, 0단계 진입 CTA
import { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { PEER_AVERAGE } from '../engine/constants.js'
import { DIAGNOSIS_QUESTIONS, categoryBreakdown } from '../data/diagnosis.js'
import { personaForScore } from '../data/personas.js'

export default function DiagnosisResult() {
  const { state, dispatch } = useStore()
  const [showReview, setShowReview] = useState(false)
  const score = state.diagnosis.score ?? 0
  const diff = score - PEER_AVERAGE
  const maxBar = 100

  const persona = personaForScore(score)
  const answers = state.diagnosis.answers
  const wrongs = DIAGNOSIS_QUESTIONS
    .map((q, i) => ({ q, i, my: answers[i] }))
    .filter(({ q, my }) => my !== q.answer)
  const cats = categoryBreakdown(answers)

  return (
    <div>
      <div className="eyebrow">진단 결과</div>
      <div className="score-hero">
        <div className="score-big">{score}<small> 점</small></div>
        <p className="muted mt8">
          {state.user.nickname}님의 금융이해력 점수는{' '}
          {diff >= 0
            ? `또래 평균보다 ${diff.toFixed(1)}점 높습니다.`
            : `또래 평균보다 ${Math.abs(diff).toFixed(1)}점 낮습니다.`}
        </p>
      </div>

      {persona && (
        <div className="card pad persona-card">
          <div className="eyebrow">지금 {state.user.nickname}님은</div>
          <h3 className="persona-name">{persona.emoji} {persona.name}</h3>
          <p className="muted mt8">{persona.desc}</p>
          <p className="persona-guide mt8">{persona.guide}</p>
        </div>
      )}

      <div className="card pad mt16">
        <div className="bar-compare">
          <div className="bar-row">
            <span className="bar-label">내 점수</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(score / maxBar) * 100}%`, background: 'var(--brand)' }} />
            </div>
            <span className="bar-val" style={{ color: 'var(--brand)' }}>{score}점</span>
          </div>
          <div className="bar-row">
            <span className="bar-label">또래 평균</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(PEER_AVERAGE / maxBar) * 100}%`, background: 'var(--ink3)' }} />
            </div>
            <span className="bar-val" style={{ color: 'var(--ink2)' }}>{PEER_AVERAGE}점</span>
          </div>
        </div>
        <div className="cat-grid">
          {cats.map((c) => (
            <div className={`cat-chip${c.correct === c.total ? ' full' : c.correct <= c.total / 2 ? ' weak' : ''}`} key={c.category}>
              <span className="cat-name">{c.category}</span>
              <b>{c.correct}/{c.total}</b>
            </div>
          ))}
        </div>
        <p className="tiny">또래 평균: 한국은행 2024 금융이해력 조사 20대 평균 62.6점</p>
      </div>

      {wrongs.length > 0 && (
        <div className="card pad mt16">
          <button className="review-toggle" onClick={() => setShowReview(!showReview)}>
            <b>오답 풀이 {wrongs.length}문항</b>
            <span className="tiny">{showReview ? '접기 ▲' : '펼치기 ▼'}</span>
          </button>
          {showReview && wrongs.map(({ q, i, my }) => (
            <div className="review-item" key={q.id}>
              <div className="tiny">{q.category}</div>
              <b className="review-q">Q{i + 1}. {q.q}</b>
              <div className="review-answers">
                <span className="wrong-pick">내 답: {my >= 0 ? q.choices[my] : '무응답'}</span>
                <span className="right-pick">정답: {q.choices[q.answer]}</span>
              </div>
              <p className="review-explain">{q.explain}</p>
            </div>
          ))}
        </div>
      )}
      {wrongs.length === 0 && (
        <div className="card pad mt16 center">
          <b>20문항 전부 정답입니다 👏</b>
          <p className="muted mt8">이제 아는 것을 실전에서도 지킬 수 있는지 확인할 차례입니다.</p>
        </div>
      )}

      <div className="card pad mt16" style={{ background: 'var(--navy)', color: '#fff', border: 0 }}>
        <div className="eyebrow" style={{ color: '#8fa3ff' }}>다음 단계</div>
        <h3 style={{ color: '#fff', fontSize: 18, margin: '6px 0 4px' }}>이제, 투자를 직접 해보세요</h3>
        <p style={{ color: '#9aa3bd', fontSize: 13.5 }}>
          공부는 아직입니다. 가상 자금 1,000만원으로 이름이 가려진 종목들을 10년간
          사고팔아 보세요. 지금 점수 그대로의 실력으로요.
        </p>
        <button
          className="btn block mt16"
          style={{ background: '#4a68e8' }}
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'sim' })}
        >
          블라인드 투자 시작하기
        </button>
      </div>
    </div>
  )
}
