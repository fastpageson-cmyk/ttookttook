// 3-8 홈/대시보드 — 진행 상태, 다음 액션, 주차별 잠금 (2주차 이후는 콘텐츠 미구현으로 잠금)
import { useStore } from '../state/store.jsx'
import { fmtPct } from '../engine/constants.js'
import { WEEK1_LESSONS } from '../data/lessons.js'
import { personaForScore } from '../data/personas.js'

const LOCKED_WEEKS = [
  { num: '2주', title: '저축과 제도 활용', sub: '예적금 · ISA · 청년도약계좌 · 절세' },
  { num: '3-4주', title: '좋은 기업 찾기', sub: '재무제표 · PER/PBR · 가치투자' },
  { num: '5주', title: 'ETF와 인덱스 투자', sub: '존 보글 · 퇴직연금' },
  { num: '6주', title: '부동산과 자산관리 종합', sub: '졸업 — 나의 투자 원칙 문서화' },
]

export default function Home() {
  const { state, dispatch } = useStore()
  const { week1, report } = state
  const cardsDone = week1.cardsViewed.length
  const lessonDone = cardsDone >= WEEK1_LESSONS.length
  const practices = week1.practices
  const practicesDone = practices.review0 && practices.rateCutReplay && practices.fxWidget
  const allDone = week1.quiz.passed

  // 다음 액션 결정: 강의 → 실습 → 퀴즈 → 완료
  let next
  if (!lessonDone) {
    next = {
      label: '1주차 강의',
      title: cardsDone === 0 ? '거시경제와 투자의 이유' : `강의 이어보기 (${cardsDone}/10)`,
      desc: '방금 겪은 실패 뒤에 있던 큰 흐름 — 금리·물가·환율을 배웁니다.',
      cta: cardsDone === 0 ? '강의 시작' : '이어보기',
      go: () => dispatch({ type: 'NAVIGATE', screen: 'lesson' }),
    }
  } else if (!practicesDone) {
    const target = !practices.review0 ? ['practice1', '실습 1 · 0단계 복기']
      : !practices.rateCutReplay ? ['practice2', '실습 2 · 금리 인하기 리플레이']
        : ['practice3', '실습 3 · 한미 금리차와 환율']
    next = {
      label: '1주차 실습',
      title: target[1],
      desc: '배운 개념을 내 매매 기록과 시나리오 위에서 직접 확인합니다.',
      cta: '실습 하기',
      go: () => dispatch({ type: 'NAVIGATE', screen: target[0] }),
    }
  } else if (!allDone) {
    next = {
      label: '확인 퀴즈',
      title: '1주차 마무리 퀴즈 (5문항)',
      desc: '4문항 이상 맞히면 1주차 완료입니다.',
      cta: '퀴즈 풀기',
      go: () => dispatch({ type: 'NAVIGATE', screen: 'quiz' }),
    }
  } else {
    next = {
      label: '1주차 완료',
      title: '여기까지가 이번 프로토타입입니다 🎉',
      desc: '2주차(저축·제도)부터는 다음 빌드에서 이어집니다.',
      cta: '내 기록 보기',
      go: () => dispatch({ type: 'NAVIGATE', screen: 'mypage' }),
    }
  }

  const pips = [lessonDone, practices.review0, practices.rateCutReplay, practices.fxWidget, week1.quiz.passed]

  return (
    <div>
      <div className="home-hello">
        <h2 className="section-title">{state.user.nickname}님의 학습</h2>
        <p className="muted mt8">
          진단 {state.diagnosis.score}점 ({personaForScore(state.diagnosis.score)?.name}) · 0단계 수익률 {fmtPct(report.finalReturn)}
        </p>
      </div>

      <div className="card pad next-action">
        <div className="eyebrow">{next.label}</div>
        <h3>{next.title}</h3>
        <p>{next.desc}</p>
        <button className="btn block" onClick={next.go}>{next.cta}</button>
      </div>

      <div className="week-list">
        <div className="card week-card">
          <span className="wk-num">0</span>
          <div className="wk-body">
            <h4>무지식 블라인드 투자</h4>
            <div className="wk-sub">진단 · 자유투자 · 실수 리포트</div>
          </div>
          <button className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'report' })}>
            결과 다시 보기
          </button>
        </div>

        <div className="card week-card">
          <span className="wk-num">1주</span>
          <div className="wk-body">
            <h4>거시경제와 투자의 이유</h4>
            <div className="wk-sub">강의 {cardsDone}/10 · 실습 {[practices.review0, practices.rateCutReplay, practices.fxWidget].filter(Boolean).length}/3 · 퀴즈 {week1.quiz.passed ? '통과' : week1.quiz.attempts > 0 ? `${week1.quiz.lastScore}/5` : '-'}</div>
            <div className="progress-mini">
              {pips.map((on, i) => <span key={i} className={`pip${on ? ' on' : ''}`} />)}
            </div>
          </div>
          <span className={`wk-state ${allDone ? '' : 'pending'}`}>{allDone ? '완료' : '진행 중'}</span>
        </div>

        {LOCKED_WEEKS.map((w) => (
          <div className="card week-card locked" key={w.num}>
            <span className="wk-num">{w.num}</span>
            <div className="wk-body">
              <h4>{w.title}</h4>
              <div className="wk-sub">{w.sub}</div>
            </div>
            <span className="wk-state locked">🔒 준비 중</span>
          </div>
        ))}
      </div>
    </div>
  )
}
