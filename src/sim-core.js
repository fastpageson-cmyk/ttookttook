// 0단계 시뮬레이션 코어 — 데이터 접근, 리포트 계산, 규칙 기반 AI 매매 실수 리포트
// (AI 리포트는 빌드 브리프 5번 방침에 따라 실제 LLM 호출 없이 규칙 기반으로 구현.
//  함수 시그니처는 데이터모델의 AIMistakeReport 인터페이스를 유지해 추후 교체 가능.)
import stocksData from './data/stocks.json'
import ratesData from './data/rates.json'
import { STARTING_CASH, FEE_RATE } from './state.js'
import { fmt, won, pct } from './ui.js'

export const TOTAL_WEEKS = stocksData.meta.totalWeeks // 520
export const ALL_STOCKS = [...stocksData.stocks, stocksData.indexEtf] // 8종목 + 지수ETF
export const ETF_CODE = stocksData.indexEtf.code

const priceMap = Object.fromEntries(ALL_STOCKS.map(s => [s.code, s.prices]))
export const stockType = Object.fromEntries(ALL_STOCKS.map(s => [s.code, s.type]))

export function price(code, week) {
  return priceMap[code][week - 1]
}
export function rateAt(week) {
  return ratesData.weeklyRates[week - 1]
}
// 금리 레짐 구간 (rates.json 실데이터 기준)
export const RATE_PHASES = (() => {
  const phases = []
  for (const r of ratesData.weeklyRates) {
    const last = phases[phases.length - 1]
    if (!last || last.name !== r.phase) phases.push({ name: r.phase, from: r.week, to: r.week })
    else last.to = r.week
  }
  return phases
})()

export function tradeFee(p, qty) {
  return Math.round(p * qty * FEE_RATE)
}

export function portfolioValue(sim, week) {
  let v = sim.cash
  for (const [code, qty] of Object.entries(sim.holdings)) v += qty * price(code, week)
  return v
}

// 주차별 자산 곡선 재계산 (1..endWeek) — 매매 로그를 리플레이
export function equityCurve(trades, endWeek) {
  const sorted = [...trades].sort((a, b) => a.week - b.week)
  let cash = STARTING_CASH
  const holdings = {}
  const curve = []
  let ti = 0
  for (let w = 1; w <= endWeek; w++) {
    while (ti < sorted.length && sorted[ti].week <= w) {
      const t = sorted[ti]
      if (t.type === 'buy') {
        cash -= t.price * t.quantity + t.fee
        holdings[t.stockCode] = (holdings[t.stockCode] || 0) + t.quantity
      } else {
        cash += t.price * t.quantity - t.fee
        holdings[t.stockCode] = (holdings[t.stockCode] || 0) - t.quantity
      }
      ti++
    }
    let v = cash
    for (const [code, qty] of Object.entries(holdings)) if (qty > 0) v += qty * price(code, w)
    curve.push(v)
  }
  return curve
}

// 지수ETF 주간 적립(DCA) 벤치마크 곡선 — 같은 자금을 매주 균등 분할 매수했다면
export function benchmarkCurve(endWeek) {
  const chunk = STARTING_CASH / endWeek
  let units = 0, invested = 0
  const curve = []
  for (let w = 1; w <= endWeek; w++) {
    units += chunk / price(ETF_CODE, w)
    invested += chunk
    curve.push(units * price(ETF_CODE, w) + (STARTING_CASH - invested))
  }
  return curve
}

export function maxDrawdown(curve) {
  let peak = -Infinity, mdd = 0
  for (const v of curve) {
    if (v > peak) peak = v
    const dd = (peak - v) / peak
    if (dd > mdd) mdd = dd
  }
  return mdd * 100
}

// 파산 판정: 총자산이 시작 자금의 30% 미만(= -70% 이상 손실)이면 사실상 파산.
// (실데이터 전환 후 단일 종목 all-in 최악 매수→최저 홀딩 손실은 카카오 -79.3%, 아모레 -77.5%,
//  한국전력 -73.1% 순. 이전 기준 0.20(-80%)은 이 실데이터에선 도달 불가한 죽은 코드였다.
//  0.30(-70%)이면 위 3종에 몰빵+악타이밍으로 보유했을 때만 발동해, 분산·능동매매엔 안 걸리는
//  '집중 몰빵 참사' 신호로 기능한다. 스펙 3-5의 진짜 '잔고 0' 파산은 상장폐지 시세가 있어야 성립 —
//  현재 8종목은 전부 생존 대형주라 미지원, 상장폐지 데이터 확보 시 하향)
export const BANKRUPT_RATIO = 0.30

// 0단계 종료 리포트 (데이터모델 SessionReport + 차트용 곡선)
export function computeReport(sim) {
  const endWeek = sim.currentWeek
  const eq = equityCurve(sim.trades, endWeek)
  const bm = benchmarkCurve(endWeek)
  const finalValue = eq[eq.length - 1]
  return {
    endWeek,
    finalValue,
    finalReturn: (finalValue / STARTING_CASH - 1) * 100,
    mdd: maxDrawdown(eq),
    totalTrades: sim.trades.length,
    totalFees: sim.trades.reduce((a, t) => a + t.fee, 0),
    benchmarkReturn: (bm[bm.length - 1] / STARTING_CASH - 1) * 100,
    bankrupt: finalValue < STARTING_CASH * BANKRUPT_RATIO,
    equityCurve: eq,
    benchmarkCurve: bm,
  }
}

// ---------- 규칙 기반 AI 매매 실수 리포트 ----------
// generateMistakeReport(trades) 형태 유지 — 추후 실제 LLM 호출로 내부만 교체 가능
export function generateMistakeReport(trades, report) {
  const endWeek = report.endWeek
  const candidates = []

  // 종목별 집계 (총 매수액·매도액·잔여 수량 → 종목 단위 손익)
  const byStock = {}
  for (const t of trades) {
    const s = (byStock[t.stockCode] ||= { buyCost: 0, buyQty: 0, sellProceed: 0, sellQty: 0, firstBuy: null })
    if (t.type === 'buy') {
      s.buyCost += t.price * t.quantity
      s.buyQty += t.quantity
      if (!s.firstBuy) s.firstBuy = t
    } else {
      s.sellProceed += t.price * t.quantity
      s.sellQty += t.quantity
    }
  }

  // 규칙 1: 가장 크게 잃은 종목 (실현 + 평가 손실)
  for (const [code, s] of Object.entries(byStock)) {
    if (!s.buyQty) continue
    const remain = s.buyQty - s.sellQty
    const finalWorth = s.sellProceed + remain * price(code, endWeek)
    const lossAmount = s.buyCost - finalWorth
    if (lossAmount > 0) {
      const avgBuy = s.buyCost / s.buyQty
      const nowP = price(code, endWeek)
      candidates.push({
        severity: lossAmount,
        tradeId: s.firstBuy.id,
        headline: `가장 크게 잃은 종목 — ${code}`,
        explanation: `${code}(${stockType[code]})에 총 ${won(s.buyCost)}을 투자해 최종 ${won(finalWorth)}이 되었습니다(${won(-lossAmount)}). 평균 매수가 ${won(avgBuy)} 대비 가격이 ${pct((nowP / avgBuy - 1) * 100)} 움직이는 동안, 미리 정해둔 손절·비중 기준이 없었습니다. 기준 없이 버티는 보유는 "존버"가 아니라 무계획입니다.`,
      })
    }
  }

  // 규칙 2: 팔고 나서 올랐던 매매 (매도 후 12주 내 +10% 이상 반등)
  for (const t of trades) {
    if (t.type !== 'sell') continue
    let maxAfter = t.price
    for (let w = t.week; w <= Math.min(endWeek, t.week + 12); w++) maxAfter = Math.max(maxAfter, price(t.stockCode, w))
    if (maxAfter > t.price * 1.10) {
      const missed = (maxAfter - t.price) * t.quantity
      candidates.push({
        severity: missed * 0.9,
        tradeId: t.id,
        headline: `팔고 나서 올랐던 매매 — ${t.stockCode}`,
        explanation: `${t.week}주차에 ${t.stockCode}를 ${won(t.price)}에 ${fmt(t.quantity)}주 매도했는데, 이후 12주 안에 가격이 ${won(maxAfter)}까지 올랐습니다(놓친 상승분 약 ${won(missed)}). 하락 구간에서 견디지 못하고 파는 결정은 감정이 시킨 것일 가능성이 큽니다.`,
      })
    }
  }

  // 규칙 3: 잦은 매매·수수료 (수수료가 시작 자금의 0.5% 이상 or 매매 20회 이상)
  if (report.totalFees >= STARTING_CASH * 0.005 || report.totalTrades >= 20) {
    candidates.push({
      severity: report.totalFees * 2,
      tradeId: null,
      headline: '거래가 잦을수록 새어나가는 돈',
      explanation: `${fmt(report.totalTrades)}번 매매하는 동안 수수료·세금으로만 ${won(report.totalFees)}이 나갔습니다. 시작 자금의 ${(report.totalFees / STARTING_CASH * 100).toFixed(2)}%가 시장이 아니라 "거래 행위 자체"로 사라진 셈입니다. 매매 횟수는 실력이 아니라 비용입니다.`,
    })
  }

  // 규칙 4: 한 종목 몰빵 (전체 매수액의 50% 이상)
  const totalBuy = Object.values(byStock).reduce((a, s) => a + s.buyCost, 0)
  if (totalBuy > 0) {
    const [topCode, topS] = Object.entries(byStock).sort((a, b) => b[1].buyCost - a[1].buyCost)[0]
    const share = topS.buyCost / totalBuy * 100
    if (share >= 50 && Object.keys(byStock).length >= 1) {
      candidates.push({
        severity: topS.buyCost * 0.3,
        tradeId: topS.firstBuy?.id ?? null,
        headline: `한 종목에 쏠린 투자 — ${topCode}`,
        explanation: `전체 매수 금액의 ${share.toFixed(0)}%가 ${topCode} 한 종목에 집중됐습니다. 그 종목이 틀리면 계좌 전체가 틀리는 구조였습니다. "계란을 한 바구니에 담지 마라"는 격언은 1주차 이후 커리큘럼에서 숫자로 확인하게 됩니다.`,
      })
    }
  }

  // 규칙 5(폴백): 지수ETF 적립식과의 비교
  if (report.finalReturn < report.benchmarkReturn) {
    const gap = report.benchmarkReturn - report.finalReturn
    candidates.push({
      severity: gap * STARTING_CASH / 100 * 0.8,
      tradeId: null,
      headline: '아무것도 고르지 않았다면?',
      explanation: `같은 ${won(STARTING_CASH)}을 종목 선택 없이 KOSPI 지수에 매주 나눠 넣기만 했어도 ${pct(report.benchmarkReturn)}가 됐습니다. 당신의 결과는 ${pct(report.finalReturn)} — 차이는 ${gap.toFixed(1)}%p입니다. "무엇을 고르느냐"보다 "고르지 않는 선택"이 나을 수 있다는 것, 5주차에 배웁니다.`,
    })
  }

  // 규칙 6(폴백): 매매가 거의 없던 경우
  if (trades.length < 3) {
    candidates.push({
      severity: 1,
      tradeId: null,
      headline: '움직이지 않은 것도 하나의 선택',
      explanation: `${TOTAL_WEEKS}주 중 매매가 ${trades.length}건뿐이었습니다. 현금을 그냥 들고 있는 것도 "물가상승만큼 잃는 투자"라는 사실을 1주차 첫 카드에서 다룹니다. 판단 기준이 없어서 못 움직였다면, 그게 바로 지금부터 배울 내용입니다.`,
    })
  }

  // 심각도 상위 3건. 부족하면 일반 안내로 채움
  const items = candidates.sort((a, b) => b.severity - a.severity).slice(0, 3)
    .map(({ tradeId, headline, explanation }) => ({ tradeId, headline, explanation }))
  const fillers = [
    { tradeId: null, headline: '기준 없이 시작한 첫 투자', explanation: '이번 시뮬레이션에서 매수·매도의 이유를 적어둔 적이 있나요? 근거를 기록하지 않은 매매는 복기할 수 없고, 복기 없는 투자는 늘지 않습니다. 1주차부터 "판단의 근거"를 하나씩 만들어봅니다.' },
    { tradeId: null, headline: '금리를 모른 채 투자했다', explanation: '방금 그 10년 동안 기준금리는 2%에서 5%까지 오르내렸습니다. 그 사실을 모른 채 매매하셨다면, 시장의 가장 큰 힘 하나를 빼고 게임을 한 셈입니다. 1주차 실습에서 직접 확인합니다.' },
  ]
  while (items.length < 3 && fillers.length) items.push(fillers.shift())
  return { items }
}
