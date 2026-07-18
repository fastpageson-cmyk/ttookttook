// 0단계 종료 리포트 계산 (화면기획서 3-6, 데이터모델 SessionReport)
import { priceAt, INDEX_ETF } from './simulation.js'
import { DCA_INTERVAL_WEEKS } from './constants.js'

export function computeMDD(valueHistory) {
  let peak = -Infinity
  let mdd = 0
  for (const v of valueHistory) {
    if (v > peak) peak = v
    const dd = ((v - peak) / peak) * 100
    if (dd < mdd) mdd = dd
  }
  return mdd // 음수 (%)
}

// 벤치마크: 같은 초기 자금을 4주마다 지수ETF에 균등 적립 매수했다면 (소수 단위 매수 허용)
export function dcaBenchmark(startingCash, endWeek) {
  const installWeeks = []
  for (let w = 1; w <= endWeek; w += DCA_INTERVAL_WEEKS) installWeeks.push(w)
  const perInstall = startingCash / installWeeks.length
  const history = []
  let units = 0
  let cashLeft = startingCash
  let nextIdx = 0
  for (let w = 1; w <= endWeek; w++) {
    if (nextIdx < installWeeks.length && w === installWeeks[nextIdx]) {
      units += perInstall / priceAt(INDEX_ETF.code, w)
      cashLeft -= perInstall
      nextIdx++
    }
    history.push(units * priceAt(INDEX_ETF.code, w) + cashLeft)
  }
  const finalValue = history[history.length - 1]
  return {
    benchmarkReturn: (finalValue / startingCash - 1) * 100,
    benchmarkHistory: history,
  }
}

export function buildSessionReport(session) {
  const endWeek = session.currentWeek
  const finalValue = session.valueHistory[session.valueHistory.length - 1]
  const { benchmarkReturn, benchmarkHistory } = dcaBenchmark(session.startingCash, endWeek)
  return {
    endWeek,
    finalValue,
    finalReturn: (finalValue / session.startingCash - 1) * 100,
    mdd: computeMDD(session.valueHistory),
    totalTrades: session.trades.length,
    totalFees: session.trades.reduce((s, t) => s + t.fee, 0),
    benchmarkReturn,
    benchmarkHistory,
  }
}
