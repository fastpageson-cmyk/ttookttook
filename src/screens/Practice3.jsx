// 3-10 실습 3: 한미 금리차·환율 인터랙티브 위젯 — 슬라이더로 금리차를 만들고 환율 방향을 예측
import { useState } from 'react'
import { useStore } from '../state/store.jsx'

const PREDICTIONS = [
  '원/달러 환율 하락 압력 (원화 강세)',
  '큰 변화 없음',
  '원/달러 환율 상승 압력 (원화 약세)',
]

function correctAnswer(kr, us) {
  const diff = us - kr
  if (Math.abs(diff) < 0.25) return 1
  return diff > 0 ? 2 : 0
}

export default function Practice3() {
  const { state, dispatch } = useStore()
  const [kr, setKr] = useState(2.5)
  const [us, setUs] = useState(4.5)
  const [prediction, setPrediction] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [triedOnce, setTriedOnce] = useState(state.week1.practices.fxWidget)

  const diff = us - kr
  const answer = correctAnswer(kr, us)

  const reveal = (choice) => {
    setPrediction(choice)
    setRevealed(true)
    setTriedOnce(true)
  }
  const retry = () => { setPrediction(null); setRevealed(false) }

  return (
    <div>
      <div className="eyebrow">1주차 실습 3 · 한미 금리차와 환율</div>
      <h2 className="section-title mt8">금리차를 직접 만들어보고,<br />환율 방향을 맞혀보세요</h2>
      <p className="muted mt8 mt12">
        강의 카드 5에서 배운 내용입니다. 슬라이더로 두 나라 금리를 조절한 뒤,
        원/달러 환율이 받을 압력을 먼저 예측해보세요.
      </p>

      <div className="card pad mt16">
        <div className="slider-row">
          <div className="sl-head"><span>🇰🇷 한국 기준금리</span><span className="sl-val">{kr.toFixed(2)}%</span></div>
          <input type="range" min="0.5" max="6" step="0.25" value={kr}
            onChange={(e) => { setKr(Number(e.target.value)); retry() }} />
        </div>
        <div className="slider-row">
          <div className="sl-head"><span>🇺🇸 미국 기준금리</span><span className="sl-val">{us.toFixed(2)}%</span></div>
          <input type="range" min="0.5" max="6" step="0.25" value={us}
            onChange={(e) => { setUs(Number(e.target.value)); retry() }} />
        </div>
        <div className="gap-pill">
          {Math.abs(diff) < 0.25
            ? '두 나라 금리가 비슷합니다'
            : diff > 0
              ? `미국이 ${diff.toFixed(2)}%p 더 높습니다`
              : `한국이 ${(-diff).toFixed(2)}%p 더 높습니다`}
        </div>

        <p className="mt16" style={{ fontSize: 14.5, fontWeight: 700 }}>
          이 경우 원/달러 환율은 어느 방향의 압력을 받을까요?
        </p>
        <div className="predict-btns" style={{ flexDirection: 'column' }}>
          {PREDICTIONS.map((p, i) => (
            <button key={i}
              className="btn ghost"
              style={revealed
                ? { borderColor: i === answer ? 'var(--good)' : prediction === i ? 'var(--up)' : undefined,
                    background: i === answer ? 'var(--good-soft)' : prediction === i && prediction !== answer ? '#fdeeee' : undefined }
                : undefined}
              disabled={revealed}
              onClick={() => reveal(i)}>
              {p}
            </button>
          ))}
        </div>

        {revealed && (
          <>
            <div className={`feedback ${prediction === answer ? 'ok' : 'bad'}`}>
              {prediction === answer ? '맞았습니다!' : '아쉽습니다.'}{' '}
              {answer === 1
                ? '금리차가 거의 없으면 금리 요인으로 인한 뚜렷한 방향 압력은 약합니다.'
                : answer === 2
                  ? `미국 금리가 한국보다 ${diff.toFixed(2)}%p 높으면, 자본이 더 높은 이자를 주는 달러 쪽으로 이동하려는 유인이 생겨 원/달러 환율은 상승(원화 약세) 압력을 받는 쪽이 일반적입니다.`
                  : `한국 금리가 미국보다 ${(-diff).toFixed(2)}%p 높으면, 원화 자산의 상대 매력이 올라가 원/달러 환율은 하락(원화 강세) 압력을 받는 쪽이 일반적입니다.`}
            </div>
            <div className="note mt12">
              실제 환율은 금리차 외에 무역수지, 시장 심리 등 다른 요인도 함께 작용한다는 걸 잊지 마세요.
            </div>
            <button className="btn ghost block mt12" onClick={retry}>슬라이더를 바꿔 다시 실험하기</button>
          </>
        )}
      </div>

      <button className="btn block mt20" disabled={!triedOnce}
        onClick={() => {
          dispatch({ type: 'COMPLETE_PRACTICE', practice: 'fxWidget' })
          dispatch({ type: 'NAVIGATE', screen: 'quiz' })
        }}>
        {triedOnce ? '실습 3 완료 — 확인 퀴즈로' : '한 번 이상 예측해보세요'}
      </button>
    </div>
  )
}
