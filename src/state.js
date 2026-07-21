// 앱 전체 state — docs/데이터모델.md의 AppState 구조를 따름. localStorage로 새로고침 시 유지.
const KEY = 'ddokddok-state-v1'

export const STARTING_CASH = 10_000_000
export const FEE_RATE = 0.002 // 매매 1회당 수수료·제세금 0.2% (목업 상수)

export const WEEK_IDS = [1, 2, 3, 4, 5, 6]

// 주차별 학습 진행 상태. 1주차만 개별 실습 3종(practices)을 갖고,
// 2~6주차는 미니 모의투자 1종이 실습을 대신한다. miniSim은 전 주차 공통.
export function initialWeek() {
  return {
    cardsViewed: [],
    practices: {}, // 1주차 전용: {review0, rateCutReplay, fxWidget}
    miniSim: { done: false, result: null }, // result: 주차별 요약 {label, value} 배열 + coach
    quiz: { attempts: 0, lastScore: 0, passed: false },
  }
}

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
    weeks: Object.fromEntries(WEEK_IDS.map(id => [id, initialWeek()])),
  }
}

// 구버전(단일 week1) state를 weeks 구조로 승격. 기존 사용자의 진행 상황을 보존한다.
function migrate(s) {
  if (!s.weeks) {
    s.weeks = Object.fromEntries(WEEK_IDS.map(id => [id, initialWeek()]))
    if (s.week1) {
      const w1 = s.weeks[1]
      w1.cardsViewed = Array.isArray(s.week1.cardsViewed) ? s.week1.cardsViewed : []
      w1.practices = s.week1.practices || {}
      w1.quiz = { ...w1.quiz, ...(s.week1.quiz || {}) }
    }
  }
  // 주차가 추가된 버전에서 내려온 경우를 대비해 빠진 키를 채움
  for (const id of WEEK_IDS) {
    const w = (s.weeks[id] ||= initialWeek())
    if (!Array.isArray(w.cardsViewed)) w.cardsViewed = []
    if (!w.practices) w.practices = {}
    if (!w.miniSim) w.miniSim = { done: false, result: null }
    if (!w.quiz) w.quiz = { attempts: 0, lastScore: 0, passed: false }
  }
  delete s.week1
  return s
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    const s = JSON.parse(raw)
    // 최소한의 마이그레이션 방어: 필수 키 없으면 초기화
    if (!s.user || !s.simulation) return initialState()
    return migrate(s)
  } catch {
    return initialState()
  }
}

export let S = load()

// 주차 진행 상태 접근자 — 없는 주차를 참조해도 터지지 않도록 방어
export function week(id) {
  return (S.weeks[id] ||= initialWeek())
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)) } catch { /* 프로토타입: 저장 실패 무시 */ }
}

export function resetAll() {
  localStorage.removeItem(KEY)
  S = initialState()
}
