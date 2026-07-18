// 3-5 0단계: 블라인드 자유투자 (핵심 화면)
// 설계 의도: 유저가 "모른 채" 시작해야 하므로 설명·힌트 최소화. 금리 정보는 절대 노출하지 않는다.
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'
import {
  ALL_TICKERS, priceAt, weeklyChange, portfolioValue, maxBuyQty, buyFee, sellFee,
} from '../engine/simulation.js'
import { TOTAL_WEEKS, TIGHTENING_END, fmtWon, fmtPct } from '../engine/constants.js'
import LineChart, { fmtCompact } from '../components/LineChart.jsx'
import { Modal } from '../components/ui.jsx'

const PLAY_INTERVAL_MS = 160

export default function Simulation() {
  const { state, dispatch } = useStore()
  const sim = state.simulation
  const [selected, setSelected] = useState(ALL_TICKERS[0].code)
  const [qty, setQty] = useState('')
  const [playing, setPlaying] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [error, setError] = useState('')
  const playRef = useRef(null)

  const week = sim.currentWeek
  const atEnd = week >= TOTAL_WEEKS
  const price = priceAt(selected, week)
  const held = sim.holdings[selected] || 0
  const avgCost = sim.avgCosts[selected] || 0
  const total = portfolioValue(sim)
  const totalReturn = (total / sim.startingCash - 1) * 100
  const stockValue = total - sim.cash
  const nQty = Math.max(0, Math.floor(Number(qty) || 0))

  // 자동재생: 재생 중에는 매매 비활성 (일시정지 후 매매)
  useEffect(() => {
    if (!playing) return undefined
    playRef.current = setInterval(() => dispatch({ type: 'SIM_ADVANCE', weeks: 1 }), PLAY_INTERVAL_MS)
    return () => clearInterval(playRef.current)
  }, [playing, dispatch])
  useEffect(() => { if (atEnd) setPlaying(false) }, [atEnd])
  useEffect(() => { setError('') }, [selected, week])

  const doBuy = () => {
    if (nQty <= 0) return setError('수량을 입력해주세요.')
    const cost = price * nQty + buyFee(price * nQty)
    if (cost > sim.cash) return setError('현금이 부족합니다.')
    dispatch({ type: 'SIM_BUY', code: selected, qty: nQty })
    setQty('')
  }
  const doSell = () => {
    if (nQty <= 0) return setError('수량을 입력해주세요.')
    if (nQty > held) return setError('보유 수량보다 많이 팔 수 없습니다.')
    dispatch({ type: 'SIM_SELL', code: selected, qty: nQty })
    setQty('')
  }
  const endSession = () => dispatch({ type: 'SIM_END' })

  const chartData = ALL_TICKERS.find((t) => t.code === selected).prices.slice(0, week)

  return (
    <div>
      <div className="sim-top">
        <div>
          <div className="eyebrow">0단계 · 블라인드 투자</div>
          <div className="tiny">1틱 = 1주 · 시간 압축 시뮬레이션</div>
        </div>
        <span className="sim-week">{week} / {TOTAL_WEEKS}주</span>
      </div>

      {atEnd && (
        <div className="sim-banner">10년(520주)이 끝났습니다. 아래에서 투자를 종료하고 결과를 확인하세요.</div>
      )}
      {!atEnd && total < sim.startingCash * 0.1 && (
        <div className="sim-banner">총자산이 초기 자금의 10% 아래로 떨어졌습니다. 지금 종료하고 결과를 볼 수도 있습니다.</div>
      )}

      <div className="asset-bar">
        <div className="asset-item"><div className="lbl">보유 현금</div><div className="val">{fmtCompact(sim.cash)}</div></div>
        <div className="asset-item"><div className="lbl">주식 평가</div><div className="val">{fmtCompact(stockValue)}</div></div>
        <div className="asset-item"><div className="lbl">총자산</div><div className="val">{fmtCompact(total)}</div></div>
        <div className="asset-item">
          <div className="lbl">수익률</div>
          <div className="val" style={{ color: totalReturn >= 0 ? '#ff8a90' : '#7eaaff' }}>{fmtPct(totalReturn)}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '12px 14px 0' }}>
          <b style={{ fontSize: 14.5 }}>{selected}</b>{' '}
          <span className="tiny">{fmtWon(price)} · 현재까지의 흐름</span>
        </div>
        <div style={{ padding: '4px 6px 6px' }}>
          <LineChart series={[{ data: chartData, color: '#2b4acb', width: 2 }]} height={190} />
        </div>
      </div>

      <div className="time-controls">
        <button className="btn ghost" disabled={playing || atEnd} onClick={() => dispatch({ type: 'SIM_ADVANCE', weeks: 1 })}>+1주</button>
        <button className="btn ghost" disabled={playing || atEnd} onClick={() => dispatch({ type: 'SIM_ADVANCE', weeks: 4 })}>+4주</button>
        <button className="btn ghost" disabled={atEnd} onClick={() => setPlaying(!playing)}>
          {playing ? '⏸ 정지' : '▶ 재생'}
        </button>
        <button className="btn danger" onClick={() => { setPlaying(false); setConfirmEnd(true) }}>종료</button>
      </div>

      <div className="card">
        <div className="stock-list">
          {ALL_TICKERS.map((t) => {
            const chg = weeklyChange(t.code, week)
            const hq = sim.holdings[t.code] || 0
            return (
              <button key={t.code}
                className={`stock-row${selected === t.code ? ' selected' : ''}`}
                onClick={() => setSelected(t.code)}>
                <span>
                  <span className="stock-name">{t.code}</span>
                  {hq > 0 && <span className="stock-hold"> · {hq}주 보유</span>}
                </span>
                <span className="stock-price">{fmtWon(priceAt(t.code, week))}</span>
                <span className={`chg ${chg > 0.005 ? 'chg-up' : chg < -0.005 ? 'chg-down' : 'chg-flat'}`}>
                  {fmtPct(chg)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="card trade-panel mt12">
        <div className="trade-head">
          <b>{selected} 주문</b>
          <span className="tiny">현재가 {fmtWon(price)}</span>
        </div>
        <div className="trade-info">
          <span>보유 <b>{held}주</b>{held > 0 && <> · 평균단가 <b>{fmtWon(avgCost)}</b> ({fmtPct(((price - avgCost) / avgCost) * 100)})</>}</span>
          <span>
            최대 매수{' '}
            <b style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setQty(String(maxBuyQty(sim.cash, price)))}>
              {maxBuyQty(sim.cash, price)}주
            </b>
            {held > 0 && (
              <>
                {' '}· 전량 매도{' '}
                <b style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setQty(String(held))}>{held}주</b>
              </>
            )}
          </span>
        </div>
        <div className="qty-row">
          <input className="qty-input" type="number" inputMode="numeric" min="0"
            placeholder="수량" value={qty}
            onChange={(e) => setQty(e.target.value)} />
          <span className="tiny">주</span>
        </div>
        {nQty > 0 && (
          <div className="trade-info">
            <span>매수 시 <b>{fmtWon(price * nQty + buyFee(price * nQty))}</b> (수수료 {fmtWon(buyFee(price * nQty))} 포함)</span>
            <span>매도 시 <b>{fmtWon(price * nQty - sellFee(price * nQty))}</b> (수수료·세금 {fmtWon(sellFee(price * nQty))} 차감)</span>
          </div>
        )}
        {error && <div className="feedback bad" style={{ marginTop: 10, padding: '9px 12px' }}>{error}</div>}
        <div className="trade-btns">
          <button className="btn buy" disabled={playing || nQty <= 0} onClick={doBuy}>매수</button>
          <button className="btn sell" disabled={playing || nQty <= 0 || held <= 0} onClick={doSell}>매도</button>
        </div>
        {playing && <p className="tiny mt8 center">재생 중에는 매매할 수 없습니다. 일시정지 후 주문하세요.</p>}
      </div>

      {confirmEnd && (
        <Modal
          title="투자를 종료할까요?"
          actions={
            <>
              <button className="btn ghost" onClick={() => setConfirmEnd(false)}>계속하기</button>
              <button className="btn danger" onClick={endSession}>종료하고 결과 보기</button>
            </>
          }
        >
          {week < TIGHTENING_END
            ? `아직 ${week}주차입니다. 시장의 큰 흐름을 다 겪지 않았지만, 지금 종료해도 결과 리포트는 확인할 수 있습니다.`
            : '종료하면 이 시점까지의 매매 기록으로 결과 리포트를 만듭니다.'}
        </Modal>
      )}
    </div>
  )
}
