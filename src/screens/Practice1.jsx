// 3-10 실습 1: 0단계 복기 — 내 계좌 흐름 위에 (그때는 가려져 있던) 기준금리 구간을 오버레이
import { useMemo, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { WEEKLY_RATES } from '../engine/simulation.js'
import { fmtPct } from '../engine/constants.js'
import LineChart from '../components/LineChart.jsx'

function regimeDirection(seg) {
  const diff = seg.endRate - seg.startRate
  if (diff > 0.1) return 'up'
  if (diff < -0.1) return 'down'
  return 'flat'
}
const DIR_LABEL = { up: '금리 인상기', down: '금리 인하기', flat: '금리 유지' }
const DIR_BAND = {
  up: 'rgba(217, 54, 62, 0.09)',
  down: 'rgba(37, 99, 235, 0.09)',
  flat: 'rgba(139, 145, 161, 0.06)',
}

export default function Practice1() {
  const { state, dispatch } = useStore()
  const sim = state.simulation
  const endWeek = state.report.endWeek
  const [selectedSeg, setSelectedSeg] = useState(null)
  const done = state.week1.practices.review0

  // 플레이한 구간 내 금리 레짐 세그먼트 (phase 문자열 기준 그룹핑)
  const segments = useMemo(() => {
    const segs = []
    for (let w = 1; w <= endWeek; w++) {
      const { phase, baseRate } = WEEKLY_RATES[w - 1]
      const last = segs[segs.length - 1]
      if (last && last.phase === phase) {
        last.to = w; last.endRate = baseRate
      } else {
        segs.push({ phase, from: w, to: w, startRate: baseRate, endRate: baseRate })
      }
    }
    return segs
  }, [endWeek])

  const seg = selectedSeg != null ? segments[selectedSeg] : null
  const segTrades = seg ? sim.trades.filter((t) => t.week >= seg.from && t.week <= seg.to) : []
  const segValueChange = seg
    ? (sim.valueHistory[seg.to - 1] / sim.valueHistory[seg.from - 1] - 1) * 100
    : 0

  return (
    <div>
      <div className="eyebrow">1주차 실습 1 · 0단계 복기</div>
      <h2 className="section-title mt8">
        당신이 투자했던 그 {Math.round(endWeek / 52)}년 동안,<br />사실 이런 일이 있었습니다
      </h2>
      <p className="muted mt8 mt12">
        0단계에서는 가격만 보였습니다. 이제 그 뒤에서 움직이던 <b>기준금리</b>를
        내 계좌 흐름 위에 겹쳐봅니다. 색 구간을 눌러보세요.
      </p>

      <div className="card pad mt16">
        <LineChart
          height={230}
          series={[
            { data: sim.valueHistory, color: '#2b4acb', width: 2.2 },
            { data: WEEKLY_RATES.slice(0, endWeek).map((r) => r.baseRate), color: '#c2410c', width: 1.6, axis: 'right', dash: '2 3' },
          ]}
          bands={segments.map((s, i) => ({
            from: s.from, to: s.to,
            color: selectedSeg === i ? DIR_BAND[regimeDirection(s)].replace('0.09', '0.22').replace('0.06', '0.15') : DIR_BAND[regimeDirection(s)],
            seg: i,
          }))}
          markers={sim.trades.map((t) => ({ x: t.week, y: sim.valueHistory[t.week - 1], kind: t.type }))}
          fmtRight={(v) => `${v.toFixed(1)}%`}
          onBandClick={(b) => setSelectedSeg(b.seg)}
        />
        <div className="legend">
          <span><span className="sw" style={{ background: '#2b4acb' }} />내 총자산</span>
          <span><span className="sw" style={{ background: '#c2410c' }} />기준금리 (당시엔 비공개)</span>
          <span>▲ 매수 ▼ 매도</span>
        </div>
      </div>

      <div className="mt12">
        {segments.map((s, i) => (
          <button key={i}
            className={`regime-chip${selectedSeg === i ? ' active' : ''}`}
            onClick={() => setSelectedSeg(i)}>
            {s.from}~{s.to}주 · {DIR_LABEL[regimeDirection(s)]}
          </button>
        ))}
      </div>

      {seg && (
        <div className="card pad mt12">
          <div className="eyebrow">{seg.from}~{seg.to}주 · {seg.phase}</div>
          <p className="mt8" style={{ fontSize: 15 }}>
            이 구간에서 기준금리는 <b>{seg.startRate.toFixed(1)}% → {seg.endRate.toFixed(1)}%</b>
            {regimeDirection(seg) === 'up' ? '로 올랐습니다.' : regimeDirection(seg) === 'down' ? '로 내렸습니다.' : ' 수준을 유지했습니다.'}
          </p>
          <p className="muted mt8">
            같은 기간 {state.user.nickname}님은 <b>매수 {segTrades.filter((t) => t.type === 'buy').length}건,
            매도 {segTrades.filter((t) => t.type === 'sell').length}건</b>을 체결했고,
            계좌는 <b className={segValueChange >= 0 ? 'pos' : 'neg'}>{fmtPct(segValueChange)}</b> 변했습니다.
          </p>
          {regimeDirection(seg) === 'up' && (
            <div className="quote mt12">
              이 시점에 금리가 오르고 있다는 걸 알았다면, 당신의 선택은 달라졌을까요?
              금리 인상기는 주식시장 전반에 부담을 주는 경향이 있습니다 (강의 카드 6).
            </div>
          )}
          {regimeDirection(seg) === 'down' && (
            <div className="quote mt12">
              금리 인하기는 상대적으로 주식시장에 우호적인 분위기를 만드는 경향이 있습니다.
              다만 "침체라서 내리는" 경우도 있으니 기계적으로 판단하면 안 됩니다 (강의 카드 6).
            </div>
          )}
        </div>
      )}

      <button
        className="btn block mt20"
        disabled={selectedSeg == null && !done}
        onClick={() => {
          dispatch({ type: 'COMPLETE_PRACTICE', practice: 'review0' })
          dispatch({ type: 'NAVIGATE', screen: 'practice2' })
        }}>
        {selectedSeg == null && !done ? '구간을 하나 이상 눌러보세요' : '실습 1 완료 — 다음 실습으로'}
      </button>
    </div>
  )
}
