// 앱 전체 state — docs/데이터모델.md의 AppState 구조를 따름. localStorage로 새로고침 시 유지.
const KEY = 'ddokddok-state-v1'

export const STARTING_CASH = 10_000_000
export const FEE_RATE = 0.002 // 매매 1회당 수수료·제세금 0.2% (목업 상수)

export function initialState() {
  return {
    user: { nickname: '' },
    onboarded: false,
    diagnosis: { answers: [], score: null, completedAt: null },
    simulation: {
      status: 'not_started', // not_started | in_progress | ended
      currentWeek: 1,
      startingCash: STARTING_CASH,
      cash: STARTING_CASH,
      holdings: {}, // code -> qty
      trades: [],   // {id, week, stockCode, type, quantity, price, fee}
    },
    report: null,   // {finalReturn, mdd, totalTrades, totalFees, benchmarkReturn, finalValue, endWeek, equityCurve, benchmarkCurve}
    aiReport: null, // {items:[{tradeId, headline, explanation}]}
    week1: {
      cardsViewed: [],
      practices: { review0: false, rateCutReplay: false, fxWidget: false },
      quiz: { attempts: 0, lastScore: 0, passed: false },
    },
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    const s = JSON.parse(raw)
    // 최소한의 마이그레이션 방어: 필수 키 없으면 초기화
    if (!s.user || !s.simulation || !s.week1) return initialState()
    return s
  } catch {
    return initialState()
  }
}

export let S = load()

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)) } catch { /* 프로토타입: 저장 실패 무시 */ }
}

export function resetAll() {
  localStorage.removeItem(KEY)
  S = initialState()
}
