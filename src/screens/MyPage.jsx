// 3-12 마이페이지 — 진행 이력, 데이터 초기화. (알림 설정은 프로토타입 범위 밖)
import { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { fmtPct, fmtWon } from '../engine/constants.js'
import { personaForScore } from '../data/personas.js'
import { Modal } from '../components/ui.jsx'

export default function MyPage() {
  const { state, dispatch } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const { diagnosis, report, week1 } = state
  const practiceCount = Object.values(week1.practices).filter(Boolean).length

  return (
    <div>
      <div className="eyebrow">마이페이지</div>
      <h2 className="section-title mt8">{state.user.nickname}님의 기록</h2>

      <div className="card pad mt16">
        <div className="my-row">
          <span className="lbl">사전 진단</span>
          <span className="val">{diagnosis.score != null ? `${diagnosis.score}점 · ${personaForScore(diagnosis.score)?.name}` : '미응시'}</span>
        </div>
        <div className="my-row">
          <span className="lbl">0단계 결과</span>
          <span className="val">
            {report ? `${fmtPct(report.finalReturn)} · ${report.endWeek}주 플레이` : '미완료'}
          </span>
        </div>
        {report && (
          <div className="my-row">
            <span className="lbl">매매 {report.totalTrades}회</span>
            <span className="val">수수료·세금 {fmtWon(report.totalFees)}</span>
          </div>
        )}
        <div className="my-row">
          <span className="lbl">1주차 강의</span>
          <span className="val">{week1.cardsViewed.length}/10 카드</span>
        </div>
        <div className="my-row">
          <span className="lbl">1주차 실습</span>
          <span className="val">{practiceCount}/3 완료</span>
        </div>
        <div className="my-row">
          <span className="lbl">확인 퀴즈</span>
          <span className="val">
            {week1.quiz.attempts === 0 ? '미응시'
              : week1.quiz.passed ? `통과 (${week1.quiz.lastScore}/5 · ${week1.quiz.attempts}회 시도)`
                : `미통과 (최근 ${week1.quiz.lastScore}/5 · ${week1.quiz.attempts}회 시도)`}
          </span>
        </div>
      </div>

      <div className="card pad mt16">
        <div className="my-row">
          <span className="lbl">알림 설정</span>
          <span className="val tiny">프로토타입 미지원</span>
        </div>
        <div className="my-row">
          <span className="lbl">처음부터 다시 하기</span>
          <button className="icon-btn" style={{ color: 'var(--up)' }} onClick={() => setConfirmReset(true)}>
            데이터 초기화
          </button>
        </div>
      </div>

      <p className="tiny mt16">
        모든 기록은 이 브라우저(localStorage)에만 저장됩니다. 서버로 전송되지 않습니다.
      </p>

      {confirmReset && (
        <Modal
          title="모든 기록을 지울까요?"
          actions={
            <>
              <button className="btn ghost" onClick={() => setConfirmReset(false)}>취소</button>
              <button className="btn danger" onClick={() => dispatch({ type: 'RESET_ALL' })}>초기화</button>
            </>
          }
        >
          진단 점수, 0단계 매매 기록, 1주차 진행 상황이 전부 삭제되고 처음 화면으로 돌아갑니다.
          되돌릴 수 없습니다.
        </Modal>
      )}
    </div>
  )
}
