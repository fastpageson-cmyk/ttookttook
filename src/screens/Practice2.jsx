// 3-10 실습 2: 금리 인하기 S&P500 가이드 리플레이 (자유매매 아님, 관찰형)
// 연출된(스타일라이즈드) 데이터임을 화면에 명시 — sp500_scenario.json meta.disclaimer 참고
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'
import scenario from '../data/sp500_scenario.json'
import LineChart from '../components/LineChart.jsx'

const TOTAL = scenario.meta.weeks // 52
const CHECKPOINTS = [5, 16, 36]
const PLAY_MS = 220

// 최근 4주 금리 변화로 정답 방향 계산
function rateDirection(week) {
  const r = scenario.weeklyBaseRate
  const now = r[week - 1]
  const before = r[Math.max(0, week - 5)]
  if (now - before < -0.05) return 2 // 인하 중
  if (now - before > 0.05) return 0  // 인상 중
  return 1                            // 동결
}
const DIR_CHOICES = ['인상 중', '동결', '인하 중']

export default function Practice2() {
  const { state, dispatch } = useStore()
  const [week, setWeek] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [checkpoint, setCheckpoint] = useState(null) // 현재 멈춘 체크포인트 주차
  const [answered, setAnswered] = useState({})       // {주차: 선택 인덱스}
  const timer = useRef(null)
  const finished = week >= TOTAL

  useEffect(() => {
    if (!playing) return undefined
    timer.current = setInterval(() => {
      setWeek((w) => {
        const nw = Math.min(w + 1, TOTAL)
        const cp = CHECKPOINTS.find((c) => c === nw && answered[c] === undefined)
        if (cp) { setPlaying(false); setCheckpoint(cp) }
        if (nw >= TOTAL) setPlaying(false)
        return nw
      })
    }, PLAY_MS)
    return () => clearInterval(timer.current)
  }, [playing, answered])

  const answerCheckpoint = (choice) => {
    setAnswered((a) => ({ ...a, [checkpoint]: choice }))
  }
  const resumeFromCheckpoint = () => { setCheckpoint(null); setPlaying(true) }

  const cpAnswer = checkpoint != null ? rateDirection(checkpoint) : null
  const cpChosen = checkpoint != null ? answered[checkpoint] : undefined

  return (
    <div>
      <div className="eyebrow">1주차 실습 2 · 가이드 리플레이</div>
      <h2 className="section-title mt8">금리를 내리면,<br />시장은 어떻게 반응할까</h2>

      {week === 1 && !playing && (
        <div className="card pad mt16" style={{ borderLeft: '3px solid var(--warn)' }}>
          <div className="eyebrow" style={{ color: 'var(--warn)' }}>상황 브리핑</div>
          <p className="mt8" style={{ fontSize: 14.5 }}>
            어느 해, 갑작스러운 글로벌 충격으로 주가지수가 단기간에 급락했습니다.
            중앙은행은 긴급회의를 열어 대응을 검토하고 있습니다. 이제 1년(52주)의
            흐름을 재생하며, 중간중간 금리의 방향을 추측해봅니다.
          </p>
        </div>
      )}

      <div className="card pad mt16">
        <LineChart
          height={220}
          revealX={week}
          series={[
            { data: scenario.weeklyIndex, color: '#3182f6', width: 2.2 },
            { data: scenario.weeklyBaseRate, color: '#e5780b', width: 1.8, axis: 'right' },
          ]}
          fmtLeft={(v) => v.toFixed(0)}
          fmtRight={(v) => `${v.toFixed(1)}%`}
        />
        <div className="legend">
          <span><span className="sw" style={{ background: '#3182f6' }} />주가지수</span>
          <span><span className="sw" style={{ background: '#e5780b' }} />기준금리</span>
          <span className="tiny">{week}/{TOTAL}주</span>
        </div>
        <p className="tiny mt8">※ 실제 S&P500이 아닌, 학습용으로 연출된 가상 시나리오입니다.</p>
      </div>

      {checkpoint != null ? (
        <div className="card pad mt12">
          <b style={{ fontSize: 15 }}>{checkpoint}주차 체크 — 지금 기준금리는 어느 방향으로 움직이고 있을까요?</b>
          <div className="predict-btns">
            {DIR_CHOICES.map((c, i) => (
              <button key={i}
                className={`btn ghost${cpChosen === i ? ' selected' : ''}`}
                style={cpChosen !== undefined
                  ? { borderColor: i === cpAnswer ? 'var(--good)' : cpChosen === i ? 'var(--up)' : undefined,
                      background: i === cpAnswer ? 'var(--good-soft)' : cpChosen === i && cpChosen !== cpAnswer ? '#ffeef0' : undefined }
                  : undefined}
                disabled={cpChosen !== undefined}
                onClick={() => answerCheckpoint(i)}>
                {c}
              </button>
            ))}
          </div>
          {cpChosen !== undefined && (
            <>
              <div className={`feedback ${cpChosen === cpAnswer ? 'ok' : 'bad'}`}>
                {cpChosen === cpAnswer ? '맞았습니다! ' : `정답은 "${DIR_CHOICES[cpAnswer]}" — `}
                현재 기준금리는 {scenario.weeklyBaseRate[checkpoint - 1].toFixed(2)}%입니다.
              </div>
              <button className="btn block mt12" onClick={resumeFromCheckpoint}>계속 재생 ▶</button>
            </>
          )}
        </div>
      ) : finished ? (
        <div className="card pad mt12">
          <div className="eyebrow">관찰 정리</div>
          <p className="mt8" style={{ fontSize: 14.5 }}>
            이 시나리오에서는 급락 이후 <b>금리 인하</b>가 이어지며 지수가 저점을 지나
            강하게 반등했습니다. 낮아진 금리가 돈을 시장으로 흐르게 만든 그림입니다.
          </p>
          <div className="note mt12">
            다만 <b>금리 인하와 지수 반등이 항상 같이 오지는 않습니다.</b> 경기 침체가
            깊어서 금리를 내리는 경우에는 주가가 더 하락하기도 합니다. "금리 인하 = 매수
            신호"로 기계적으로 외우지 않는 것이 이번 실습의 진짜 결론입니다.
          </div>
          <button className="btn block mt16" onClick={() => {
            dispatch({ type: 'COMPLETE_PRACTICE', practice: 'rateCutReplay' })
            dispatch({ type: 'NAVIGATE', screen: 'practice3' })
          }}>
            실습 2 완료 — 다음 실습으로
          </button>
        </div>
      ) : (
        <div className="time-controls">
          <button className="btn" onClick={() => setPlaying(!playing)}>
            {playing ? '⏸ 일시정지' : week === 1 ? '▶ 재생 시작' : '▶ 계속 재생'}
          </button>
        </div>
      )}
    </div>
  )
}
