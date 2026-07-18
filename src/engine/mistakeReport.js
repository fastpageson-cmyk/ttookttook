// "AI 매매 실수 리포트" — 규칙 기반 구현 (화면기획서 3-7, 빌드 브리프 5번)
// 주의: 실제 LLM 호출 금지. 함수 시그니처는 유지한 채 내부만 규칙 기반으로 구현.
// 나중에 실제 AI로 교체할 때 이 함수 내부만 API 호출로 바꾸면 된다.
import { priceAt } from './simulation.js'
import { fmtWon, fmtPct } from './constants.js'

// 후보 실수를 심각도(원 단위 손실 환산)와 함께 수집한 뒤 상위 3건을 뽑는다.
// 톤 가이드(화면기획서 3-7): 결과는 정확히 보여주되 자기비하로 흐르지 않게.
export function generateMistakeReport(session, report) {
  const { trades } = session
  const candidates = []

  // 1) 손실을 확정한 매도 (평균단가 대비 낮은 가격에 매도)
  for (const t of trades) {
    if (t.type !== 'sell' || !t.avgCostAtSell) continue
    const loss = (t.avgCostAtSell - t.price) * t.quantity + t.fee
    if (loss <= 0) continue
    const pct = ((t.price - t.avgCostAtSell) / t.avgCostAtSell) * 100
    candidates.push({
      severity: loss,
      category: 'realized_loss',
      tradeId: t.id,
      headline: '손실을 확정한 매도',
      explanation:
        `평균 ${fmtWon(t.avgCostAtSell)}에 산 ${t.stockCode}을(를) ${t.week}주차에 ` +
        `${fmtWon(t.price)}에 팔았습니다. ${fmtPct(pct)} 손실이 확정되어 약 ${fmtWon(loss)}을 잃었습니다. ` +
        `가격이 이미 크게 떨어진 뒤의 매도는 손실을 되돌리지 못하고 확정만 시킵니다.`,
    })
  }

  // 2) 하락을 버티다 커진 손실 (매수 후 큰 하락에도 계속 보유)
  for (const t of trades) {
    if (t.type !== 'buy') continue
    const endPrice = priceAt(t.stockCode, session.currentWeek)
    // 매수 이후 최저가
    let minPrice = t.price
    let minWeek = t.week
    for (let w = t.week; w <= session.currentWeek; w++) {
      const p = priceAt(t.stockCode, w)
      if (p < minPrice) { minPrice = p; minWeek = w }
    }
    const dropPct = ((minPrice - t.price) / t.price) * 100
    const stillHeld = (session.holdings[t.stockCode] || 0) > 0
    const finalLoss = (t.price - endPrice) * t.quantity
    if (dropPct < -25 && stillHeld && finalLoss > 0) {
      candidates.push({
        severity: finalLoss,
        category: 'held_through_drop',
        tradeId: t.id,
        headline: '하락을 버티다 커진 손실',
        explanation:
          `${t.week}주차에 ${t.stockCode}을(를) ${fmtWon(t.price)}에 매수했습니다. ` +
          `이후 ${minWeek}주차까지 가격이 ${fmtPct(dropPct)} 하락했을 때도 매도하지 않아, ` +
          `종료 시점까지 약 ${fmtWon(finalLoss)}의 평가손실이 발생했습니다. ` +
          `"오르겠지"라는 기대만으로 하락을 버티는 것은 계획이 아니라 희망입니다.`,
      })
    }
  }

  // 3) 잦은 매매의 비용
  const feeRatio = (report.totalFees / session.startingCash) * 100
  if (report.totalTrades >= 10 || feeRatio >= 0.3) {
    candidates.push({
      severity: report.totalFees,
      category: 'overtrading',
      tradeId: null,
      headline: '수수료로 새어나간 돈',
      explanation:
        `총 ${report.totalTrades}번 사고팔면서 수수료·세금으로만 ${fmtWon(report.totalFees)}을 냈습니다. ` +
        `초기 자금의 ${feeRatio.toFixed(2)}%입니다. 수익은 불확실하지만 매매 비용은 거래할 때마다 ` +
        `확실하게 쌓입니다. 매매 횟수 자체가 성과를 깎는 요인이 될 수 있습니다.`,
    })
  }

  // 4) 벤치마크(지수ETF 적립)보다 뒤처진 성과
  const gap = report.benchmarkReturn - report.finalReturn
  if (gap > 0) {
    candidates.push({
      severity: (gap / 100) * session.startingCash,
      category: 'benchmark',
      tradeId: null,
      headline: '고르고 사고판 결과가 지수보다 나빴다',
      explanation:
        `직접 종목을 고르고 사고판 결과는 ${fmtPct(report.finalReturn)}. ` +
        `같은 돈을 4주마다 지수ETF에 기계적으로 나눠 넣기만 했다면 ${fmtPct(report.benchmarkReturn)}였습니다. ` +
        `${gap.toFixed(1)}%p 차이는 종목 선택과 매매 타이밍이 만든 격차입니다. ` +
        `이게 왜 그런지는 앞으로의 커리큘럼에서 배우게 됩니다.`,
    })
  }

  // 5) 최대낙폭 (변동성 체감)
  if (report.mdd < -20) {
    candidates.push({
      severity: (Math.abs(report.mdd) / 100) * session.startingCash * 0.5, // 보조 지표라 가중치 절반
      category: 'mdd',
      tradeId: null,
      headline: `계좌가 고점 대비 ${Math.abs(report.mdd).toFixed(0)}% 빠졌던 순간`,
      explanation:
        `이번 시뮬레이션에서 내 계좌는 한때 고점 대비 ${fmtPct(report.mdd)}까지 떨어졌습니다(최대낙폭). ` +
        `하락 폭이 커질수록 원금 회복에 필요한 수익률은 그보다 훨씬 커집니다. ` +
        `50% 손실을 회복하려면 100% 수익이 필요합니다.`,
    })
  }

  // 폴백 — 매매가 거의 없거나, 수익이 나서 위 규칙에 안 걸리는 경우에도 3건을 채운다
  const fallbacks = [
    report.totalTrades < 3 && {
      severity: 0, category: 'no_trade', tradeId: null,
      headline: '거의 매매하지 않은 선택',
      explanation:
        `이번 시뮬레이션에서 매매는 ${report.totalTrades}번뿐이었습니다. 관망도 하나의 선택이지만, ` +
        `"왜 사지 않았는지"를 설명할 수 없다면 그것도 판단이 아니라 회피에 가깝습니다. ` +
        `기준을 만드는 것이 앞으로의 학습 목표입니다.`,
    },
    {
      severity: 0, category: 'blind', tradeId: null,
      headline: '정보 없이 내린 판단들',
      explanation:
        `이번 구간 동안 기준금리는 큰 폭으로 움직였지만, 화면 어디에도 그 정보는 없었습니다. ` +
        `내 매매 판단은 오직 가격의 등락만 보고 이뤄졌습니다. 같은 상황에서 무엇을 더 봤어야 했는지, ` +
        `1주차에서 확인해보세요.`,
    },
    {
      severity: 0, category: 'lucky', tradeId: null,
      headline: '좋은 결과, 반복 가능할까?',
      explanation:
        `이번엔 수익(${fmtPct(report.finalReturn)})으로 끝났습니다. 하지만 어떤 근거로 그 종목을 골랐는지 ` +
        `설명할 수 없다면, 같은 방식이 다음에도 통한다고 보장할 수 없습니다. ` +
        `운과 실력을 구분하는 법을 배우는 것이 이 코스의 목표입니다.`,
    },
  ].filter(Boolean)

  const picked = []
  const usedCategories = new Set()
  for (const c of candidates.sort((a, b) => b.severity - a.severity)) {
    if (usedCategories.has(c.category)) continue
    picked.push(c)
    usedCategories.add(c.category)
    if (picked.length === 3) break
  }
  for (const f of fallbacks) {
    if (picked.length === 3) break
    if (usedCategories.has(f.category)) continue
    if (f.category === 'lucky' && report.finalReturn <= 0) continue
    picked.push(f)
    usedCategories.add(f.category)
  }

  return {
    items: picked.slice(0, 3).map(({ tradeId, headline, explanation }) =>
      ({ tradeId, headline, explanation })),
  }
}
