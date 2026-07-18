// 도메인 상수 — 목업 기준값 (실서비스 전환 시 교체 필요, mock-data/README 참고)
export const STARTING_CASH = 10_000_000
export const BUY_FEE_RATE = 0.00015   // 매수 수수료 0.015%
export const SELL_FEE_RATE = 0.00015  // 매도 수수료 0.015%
export const SELL_TAX_RATE = 0.0018   // 매도 거래세 0.18% (목업 값)
export const TOTAL_WEEKS = 520
export const PEER_AVERAGE = 62.6      // 한은 2024 조사 20대 평균
export const QUIZ_PASS_SCORE = 4      // 5문항 중 4개 이상 (잠정)
export const TIGHTENING_START = 121   // 긴축기 시작 주차 (rates.json 레짐)
export const TIGHTENING_END = 220
export const DCA_INTERVAL_WEEKS = 4   // 벤치마크 지수ETF 적립 매수 주기

export const fmtWon = (n) =>
  `${Math.round(n).toLocaleString('ko-KR')}원`
export const fmtPct = (n, digits = 1) =>
  `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`
