// 0단계 블라인드 자유투자 — 체결/평가 순수 함수 (React 무관)
import stocksJson from '../data/stocks.json'
import ratesJson from '../data/rates.json'
import {
  STARTING_CASH, BUY_FEE_RATE, SELL_FEE_RATE, SELL_TAX_RATE, TOTAL_WEEKS,
} from './constants.js'

export const STOCKS = stocksJson.stocks
export const INDEX_ETF = stocksJson.indexEtf
export const ALL_TICKERS = [...STOCKS, INDEX_ETF]
export const TICKER_MAP = Object.fromEntries(ALL_TICKERS.map((s) => [s.code, s]))
export const WEEKLY_RATES = ratesJson.weeklyRates // [{week, baseRate, phase}]

export function priceAt(code, week) {
  return TICKER_MAP[code].prices[week - 1]
}

export function rateAt(week) {
  return WEEKLY_RATES[week - 1]
}

// 보유주식 평가액 + 현금
export function portfolioValue(session, week = session.currentWeek) {
  const stockValue = Object.entries(session.holdings)
    .reduce((sum, [code, qty]) => sum + priceAt(code, week) * qty, 0)
  return session.cash + stockValue
}

export function newSession() {
  return {
    status: 'not_started',
    currentWeek: 1,
    startingCash: STARTING_CASH,
    cash: STARTING_CASH,
    holdings: {},   // code -> qty
    avgCosts: {},   // code -> 평균 매수 단가 (수수료 제외)
    trades: [],
    valueHistory: [STARTING_CASH], // index i = (i+1)주차 시점 총자산
  }
}

export function buyFee(amount) { return Math.round(amount * BUY_FEE_RATE) }
export function sellFee(amount) { return Math.round(amount * (SELL_FEE_RATE + SELL_TAX_RATE)) }

// 수수료 포함 최대 매수 가능 수량
export function maxBuyQty(cash, price) {
  if (price <= 0) return 0
  return Math.max(0, Math.floor(cash / (price * (1 + BUY_FEE_RATE))))
}

export function executeBuy(session, code, qty) {
  const price = priceAt(code, session.currentWeek)
  const amount = price * qty
  const fee = buyFee(amount)
  if (qty <= 0) return { error: '수량을 입력해주세요.' }
  if (amount + fee > session.cash) return { error: '현금이 부족합니다.' }
  const prevQty = session.holdings[code] || 0
  const prevAvg = session.avgCosts[code] || 0
  const trade = {
    id: `t${session.trades.length + 1}`,
    week: session.currentWeek,
    stockCode: code, type: 'buy', quantity: qty, price, fee,
  }
  return {
    session: {
      ...session,
      status: 'in_progress',
      cash: session.cash - amount - fee,
      holdings: { ...session.holdings, [code]: prevQty + qty },
      avgCosts: {
        ...session.avgCosts,
        [code]: (prevAvg * prevQty + price * qty) / (prevQty + qty),
      },
      trades: [...session.trades, trade],
    },
  }
}

export function executeSell(session, code, qty) {
  const held = session.holdings[code] || 0
  if (qty <= 0) return { error: '수량을 입력해주세요.' }
  if (qty > held) return { error: '보유 수량보다 많이 팔 수 없습니다.' }
  const price = priceAt(code, session.currentWeek)
  const amount = price * qty
  const fee = sellFee(amount)
  const trade = {
    id: `t${session.trades.length + 1}`,
    week: session.currentWeek,
    stockCode: code, type: 'sell', quantity: qty, price, fee,
    avgCostAtSell: session.avgCosts[code] || 0, // 실수 리포트 손익 계산용
  }
  const holdings = { ...session.holdings, [code]: held - qty }
  const avgCosts = { ...session.avgCosts }
  if (holdings[code] === 0) { delete holdings[code]; delete avgCosts[code] }
  return {
    session: {
      ...session,
      status: 'in_progress',
      cash: session.cash + amount - fee,
      holdings, avgCosts,
      trades: [...session.trades, trade],
    },
  }
}

// n주 진행 — 매 주차 총자산을 valueHistory에 기록
export function advanceWeeks(session, n) {
  const target = Math.min(session.currentWeek + n, TOTAL_WEEKS)
  if (target === session.currentWeek) return session
  const valueHistory = [...session.valueHistory]
  for (let w = session.currentWeek + 1; w <= target; w++) {
    valueHistory.push(portfolioValue(session, w))
  }
  return { ...session, status: 'in_progress', currentWeek: target, valueHistory }
}

// 주간 등락률 (전주 대비)
export function weeklyChange(code, week) {
  if (week <= 1) return 0
  const prev = priceAt(code, week - 1)
  return ((priceAt(code, week) - prev) / prev) * 100
}
