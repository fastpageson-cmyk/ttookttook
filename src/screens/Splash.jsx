// 3-1 스플래시/온보딩 + (빌드 브리프) 닉네임 입력 — 회원가입 대체
import { useState } from 'react'
import { useStore } from '../state/store.jsx'

const ONBOARDING_CARDS = [
  {
    num: 'STEP 0',
    title: '일단, 아무것도 모른 채 투자합니다',
    desc: '가상 자금 1,000만원. 종목 이름도 가려져 있고, 설명도 없습니다. 지금 아는 만큼만 가지고 10년을 굴려보세요.',
  },
  {
    num: 'REPORT',
    title: '처참한 결과를 데이터로 확인합니다',
    desc: '수익률, 최대낙폭, 수수료. 그리고 내 손실에 가장 크게 기여한 매매 3건을 분석 리포트로 돌려받습니다.',
  },
  {
    num: '6 WEEKS',
    title: '그 실패를 교재로 6주간 배웁니다',
    desc: '거시경제부터 부동산까지. 매주 개념을 배우고, 배운 즉시 내 실패 기록 위에서 실습합니다.',
  },
]

export default function Splash() {
  const { state, dispatch } = useStore()
  const [nickname, setNickname] = useState(state.user.nickname || '')
  const hasProgress = !!state.user.nickname

  const start = () => {
    const name = nickname.trim()
    if (!name) return
    dispatch({ type: 'SET_NICKNAME', nickname: name })
  }

  // 재방문: 진행 상태에 맞는 화면으로 복귀
  const resume = () => {
    let screen = 'diagnosis'
    if (state.report) screen = 'home'
    else if (state.diagnosis.completedAt) screen = state.simulation.status === 'not_started' ? 'diagResult' : 'sim'
    dispatch({ type: 'NAVIGATE', screen })
  }

  return (
    <div className="splash">
      <h1 className="wordmark">뚝뚝<span className="dot">.</span></h1>
      <p className="tagline">
        떨어져 봐야 배웁니다.<br />
        <strong>잃어도 되는 곳에서, 먼저 잃어보세요.</strong>
      </p>

      <div className="onb-cards">
        {ONBOARDING_CARDS.map((c) => (
          <div className="onb-card" key={c.num}>
            <div className="num">{c.num}</div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="nick-form">
        <label className="nick-label" htmlFor="nickname">닉네임만 정하면 바로 시작합니다 (가입 없음)</label>
        <input
          id="nickname"
          className="nick-input"
          placeholder="닉네임 입력"
          maxLength={12}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && start()}
        />
        <button className="btn block" onClick={start} disabled={!nickname.trim()}>
          바로 투자해보기
        </button>
        {hasProgress && (
          <div className="splash-resume">
            <button onClick={resume}>{state.user.nickname}님, 하던 곳에서 이어하기 →</button>
          </div>
        )}
      </div>
    </div>
  )
}
