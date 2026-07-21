// 1주차 · 거시경제와 투자의 이유
// 강의 카드·퀴즈는 기존 content.js를 그대로 쓰고(원고: docs/콘텐츠/1주차_거시경제와_투자의_이유.md),
// 실습 3종(prac1~3)은 screens/practice.js에 개별 구현되어 있다.
// 여기서는 실습 마지막에 붙는 미니 모의투자만 정의한다.
import { LECTURE_CARDS, QUIZ } from '../content.js'
import {
  h, won, pct, numClass, seriesFrom, ratesFrom, depositSeries, INDEX_CODE,
  metricGrid, sliderRow, choiceRow, coachCard, compareChart,
} from '../mini-sim.js'

const LEN = 26 // 26주(약 6개월)
// 실제 한국 금리 국면의 시작 주차 (rates.json 기준, 2016-07~2026-07)
//  266주 = 2021년 대긴축 시작 / 431주 = 2024년 완화 전환 / 218주 = 2020년 코로나 저금리
const PHASES = [
  { value: 'tight', label: '긴축기', desc: '금리를 올리는 중', start: 266 },
  { value: 'ease', label: '완화 전환기', desc: '금리를 내리기 시작', start: 431 },
  { value: 'low', label: '저금리 유지기', desc: '낮은 금리가 이어짐', start: 218 },
]
const SEED = 10_000_000

function runPhase(phase, stockPct) {
  const ph = PHASES.find(p => p.value === phase)
  const stock = seriesFrom(INDEX_CODE, ph.start, LEN)
  const deposit = depositSeries(ph.start, LEN) // 정기예금 — 정책금리 수준의 이자
  const rates = ratesFrom(ph.start, LEN)
  const wS = stockPct / 100, wD = 1 - wS
  const mine = stock.map((v, i) => v * wS + deposit[i] * wD)
  return {
    ph, stock, deposit, rates, mine,
    stockRet: (stock[LEN - 1] - 1) * 100,
    depositRet: (deposit[LEN - 1] - 1) * 100,
    myRet: (mine[LEN - 1] - 1) * 100,
    rateChange: rates[LEN - 1] - rates[0],
  }
}

export default {
  id: 1,
  emoji: '1️⃣',
  title: '거시경제와 투자의 이유',
  subtitle: '금리·환율·물가',
  cards: LECTURE_CARDS,
  quiz: QUIZ,
  // 1주차만 개별 실습 3종을 갖는다 (screens/practice.js)
  practices: [
    { key: 'review0', ico: '🔍', title: '실습 1 · 0단계 복기', desc: '그때 금리는 어떻게 움직였을까', screen: 'prac1' },
    { key: 'rateCutReplay', ico: '📈', title: '실습 2 · 금리 인하기 리플레이', desc: '지수 급락과 반등, 그 뒤의 금리', screen: 'prac2' },
    { key: 'fxWidget', ico: '⚖️', title: '실습 3 · 한미 금리차와 환율', desc: '슬라이더로 직접 움직여보기', screen: 'prac3' },
  ],
  miniSim: {
    weekId: 1,
    title: '미니 모의투자 · 금리 국면 읽기',
    navTitle: '실습 4 · 미니 모의투자',
    navDesc: '금리를 보고 26주를 굴려보기',
    brief: {
      headline: '이번엔 금리를 보고 투자해봅니다',
      lines: [
        '0단계에서는 금리가 어디로 가는지 모른 채 10년을 보냈습니다. 이번에는 금리 국면을 먼저 고르고, 그 안에서 26주(약 6개월)를 굴려봅니다.',
        '자금은 1,000만 원입니다. 주식(KOSPI 지수)과 정기예금에 얼마씩 나눌지만 정하면 됩니다. 정기예금 금리는 그 시점의 정책금리를 따라갑니다. 실제 과거 구간을 그대로 돌립니다.',
      ],
      tools: [
        '카드 2 · 기준금리 — 국면에 따라 예금 이자가 달라집니다',
        '카드 5 · 금리와 자산 가격 — 금리가 오를 때 위험자산은 어떤 압력을 받나',
        '실습 2의 결론 — "금리 인하 = 매수"로 외우지 않기',
      ],
    },
    setup(ctx) {
      let phase = 'tight'
      let stockPct = 50
      const node = h('div', {})
      const paint = () => {
        const ph = PHASES.find(p => p.value === phase)
        const rates = ratesFrom(ph.start, LEN)
        node.innerHTML = ''
        node.append(
          h('div', { class: 'card' },
            h('b', {}, '① 어느 금리 국면에서 시작할까요?'),
            choiceRow(PHASES, phase, v => { phase = v; paint() }),
            h('p', { class: 'small', style: 'margin-top:10px' },
              `이 구간의 기준금리: ${rates[0].toFixed(2)}% → ${rates[LEN - 1].toFixed(2)}% (26주 뒤)`),
          ),
          h('div', { class: 'card' },
            h('b', {}, '② 1,000만 원을 어떻게 나눌까요?'),
            sliderRow('📈 주식(KOSPI) 비중', stockPct, { min: 0, max: 100, step: 5 }, v => { stockPct = v; paint() }),
            h('p', { class: 'small' },
              `주식 ${stockPct}% (${won(SEED * stockPct / 100)}) · 정기예금 ${100 - stockPct}% (${won(SEED * (100 - stockPct) / 100)})`),
          ),
        )
      }
      paint()
      return { node, read: () => ({ phase, stockPct }) }
    },
    simulate({ phase, stockPct }) {
      const r = runPhase(phase, stockPct)
      return {
        headline: `${r.ph.label} · 주식 ${stockPct}%`,
        stockPct, ...r,
        metrics: [
          { k: '내 수익률', v: pct(r.myRet), cls: numClass(r.myRet) },
          { k: '최종 자산', v: won(SEED * r.mine[LEN - 1]) },
          { k: '기준금리 변화', v: (r.rateChange > 0 ? '+' : '') + r.rateChange.toFixed(2) + '%p' },
        ],
      }
    },
    review(ctx, res) {
      const { ph, stockRet, depositRet, myRet, rateChange, stockPct } = res
      const stockWon = stockRet > depositRet
      const lines = [
        `${ph.label}(기준금리 ${rateChange > 0 ? '+' : ''}${rateChange.toFixed(2)}%p)에서 26주 동안 주식은 ${pct(stockRet)}, 정기예금은 ${pct(depositRet)}였습니다.`,
        stockWon
          ? `이번 구간에서는 주식이 예금보다 ${(stockRet - depositRet).toFixed(1)}%p 앞섰습니다. 주식 비중을 ${stockPct}%로 잡은 선택이 결과적으로 도움이 됐습니다.`
          : `이번 구간에서는 예금이 주식보다 ${(depositRet - stockRet).toFixed(1)}%p 앞섰습니다. 주식 비중 ${stockPct}%가 수익률을 끌어내렸습니다. 금리가 높을 때는 "아무것도 안 하는 선택"의 이자도 무시할 수 없습니다.`,
        '다만 이건 이 한 구간의 결과일 뿐입니다. 금리 방향만으로 다음 6개월을 맞힐 수 있었다면 모두가 그렇게 했을 겁니다. 금리는 정답표가 아니라, 지금 시장이 어떤 바람을 맞고 있는지 알려주는 나침반에 가깝습니다.',
      ]
      return h('div', {},
        h('div', { class: 'report-hero' },
          h('div', { class: 'rh-label' }, `${ph.label} · 26주 결과`),
          h('div', { class: 'rh-num ' + numClass(myRet) }, pct(myRet)),
        ),
        metricGrid(res.metrics),
        h('div', { class: 'card' },
          h('b', {}, '내 포트폴리오 vs 주식 100%'),
          compareChart(res.mine, res.stock, [`내 선택 (주식 ${stockPct}%)`, '주식 100%']),
        ),
        coachCard('🧭 이번 실습이 말하는 것', lines),
      )
    },
  },
}
