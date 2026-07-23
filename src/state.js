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

// 경제 용어 사전 진행 상태 — 학습(펼쳐본 용어)·게이미피케이션(코인·최고 콤보)·퀴즈 최고 기록.
// 세 퀴즈(OX·선긋기·뜻맞히기)는 정답률(%)을 best로 저장한다.
export function initialGlossary() {
  return {
    learned: [],   // 상세를 펼쳐 본 용어 id 목록
    coins: 0,      // 누적 획득 코인
    bestStreak: 0, // 역대 최고 연속 정답(콤보)
    quiz: {
      ox: { best: 0, plays: 0 },
      match: { best: 0, plays: 0 },
      meaning: { best: 0, plays: 0 },
    },
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
    glossary: initialGlossary(),
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
  // 사전이 없던 버전에서 올라온 사용자를 위한 방어 — 빠진 키만 채운다.
  if (!s.glossary) s.glossary = initialGlossary()
  else {
    const g = s.glossary
    if (!Array.isArray(g.learned)) g.learned = []
    if (typeof g.coins !== 'number') g.coins = 0
    if (typeof g.bestStreak !== 'number') g.bestStreak = 0
    const base = initialGlossary().quiz
    g.quiz = { ...base, ...(g.quiz || {}) }
    for (const k of Object.keys(base)) g.quiz[k] = { ...base[k], ...(g.quiz[k] || {}) }
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
