// 4주차 · 위험 관리와 자산 배분
// 원고 원본: docs/콘텐츠/4주차_위험관리와_자산배분.md (수정 시 함께 반영)
import {
  h, won, pct, numClass, seriesFrom, bondSeries, goldSeries, cashSeries,
  maxDD, recoveryNeeded, metricGrid, sliderRow, choiceRow, coachCard, compareChart,
} from '../mini-sim.js'

const SEED = 10_000_000
const START = 416 // 큰 하락 구간이 포함된 104주(2년) 창
const LEN = 104

const ASSETS = [
  { key: 'stock', label: '📈 주식', color: '#f04452' },
  { key: 'bond', label: '🏛 채권', color: '#3182f6' },
  { key: 'gold', label: '🪙 금', color: '#ff9500' },
  { key: 'cash', label: '💵 현금', color: '#8b95a1' },
]

function series() {
  return {
    stock: seriesFrom('지수ETF', START, LEN),
    bond: bondSeries(START, LEN),
    gold: goldSeries(START, LEN),
    cash: cashSeries(START, LEN),
  }
}

// 목표 비중 + 리밸런싱 규칙으로 포트폴리오를 굴린다
function runPortfolio(weights, rule) {
  const px = series()
  const keys = ASSETS.map(a => a.key)
  let units = {}
  const setUnits = (value, i) => {
    for (const k of keys) units[k] = value * weights[k] / px[k][i]
  }
  setUnits(SEED, 0)

  const curve = []
  let rebalances = 0
  for (let i = 0; i < LEN; i++) {
    const value = keys.reduce((a, k) => a + units[k] * px[k][i], 0)
    curve.push(value)
    if (i === LEN - 1) break

    let need = false
    if (rule === 'time' && i > 0 && i % 26 === 0) need = true
    if (rule === 'drift') {
      for (const k of keys) {
        const cur = units[k] * px[k][i] / value
        if (Math.abs(cur - weights[k]) >= 0.05) { need = true; break }
      }
    }
    if (need) { setUnits(value, i); rebalances++ }
  }
  return { curve, px, rebalances }
}

export default {
  id: 4,
  emoji: '4️⃣',
  title: '위험 관리와 자산 배분',
  subtitle: '분산·MDD·리밸런싱',
  cards: [
    {
      title: '계란을 한 바구니에 담지 마라',
      paras: [
        '0단계 리포트에서 "한 종목에 쏠린 투자"를 지적받았다면, 그 이야기가 지금부터입니다.',
        '아무리 좋아 보이는 기업이라도 경영진 리스크, 산업 패러다임 변화, 분식회계, 횡령처럼 예측 불가능한 악재로 폭락하거나 상장폐지될 수 있습니다. 문제는 이걸 미리 알 방법이 없다는 것입니다.',
      ],
      bullets: [
        '비체계적 리스크 — 특정 기업·산업에만 발생하는 위험. 분산투자로 거의 완전히 제거 가능',
        '체계적 리스크 — 금리 인상·전쟁·금융위기처럼 시장 전체에 미치는 위험. 분산만으로는 못 피하고 자산 배분으로 완화',
      ],
    },
    {
      title: 'MDD와 손실 회복의 비대칭',
      paras: [
        'MDD(Maximum Drawdown, 최대 낙폭)는 특정 기간 동안 자산이 고점 대비 최저점까지 얼마나 떨어졌는지를 나타냅니다. 0단계 리포트에서 이미 본 그 숫자입니다.',
        '손실은 회복이 비대칭입니다. 이걸 음의 복리 효과라고 합니다.',
      ],
      bullets: [
        '-10% 손실 → 회복에 필요한 수익률 +11.1%',
        '-30% 손실 → +42.9%',
        '-50% 손실 → +100.0%',
        '-80% 손실 → +400.0%',
      ],
      note: '수익률을 5%p 더 얻는 것보다, MDD를 20%p 줄이는 게 장기적으로 훨씬 강력합니다.',
    },
    {
      title: '상관관계: 같이 움직이지 않는 것을 섞는다',
      paras: [
        '상관계수(Correlation)는 두 자산이 같은 방향으로 움직이는지를 -1.0 ~ +1.0으로 나타냅니다.',
        '+1.0에 가까우면 A가 오를 때 B도 오릅니다(예: 삼성전자와 SK하이닉스). -1.0에 가까우면 A가 오를 때 B는 떨어집니다(예: 주식과 채권).',
        '핵심은 이것입니다. 상관계수가 낮거나 음(-)인 자산을 섞으면, 기대 수익률은 크게 해치지 않으면서 계좌 전체의 변동성을 획기적으로 낮출 수 있습니다.',
      ],
      note: '종목을 10개로 늘려도 전부 반도체라면 분산이 아닙니다. 개수가 아니라 상관관계입니다.',
    },
    {
      title: '포트폴리오를 구성하는 3대 자산',
      bullets: [
        '주식 — 높은 기대수익. 하락장 변동성이 큼',
        '채권 — 이자 수익. 경기 침체 시 가격이 올라 방어 역할',
        '현금 / 달러 — 시장 폭락 시 우량 자산을 싸게 살 수 있는 총알',
      ],
      paras: [
        '올웨더(All-Weather) 포트폴리오는 어떤 경제 상황(성장·침체·인플레이션·디플레이션)이 와도 계좌가 깨지지 않도록 주식·장기채권·중기채권·금·원자재에 나누어 담는 정적 자산 배분 전략입니다.',
      ],
    },
    {
      title: '리밸런싱, 기계적으로 고가 매도·저가 매수',
      paras: [
        '리밸런싱은 가격 변동으로 틀어진 자산 비율을 원래 목표 비율로 되돌리는 작업입니다.',
        '주식 50% : 채권 50%로 시작했는데 주식이 급등해 70:30이 됐다면, 늘어난 주식을 일부 팔아 줄어든 채권을 사서 다시 50:50으로 맞춥니다. 이 과정이 자동으로 비싼 걸 팔고 싼 걸 사게 만듭니다.',
      ],
      bullets: [
        '시간 기준 — 6개월 또는 1년에 한 번 정기적으로',
        '비율 기준 — 목표 비중 대비 5%p 이상 벗어났을 때',
      ],
      note: '0단계에서 "팔고 나서 올랐던 매매"를 지적받았다면, 그건 규칙이 없어서 생긴 일입니다. 리밸런싱은 그 규칙을 미리 정해두는 방법입니다.',
    },
  ],
  quiz: [
    {
      q: '원금이 -50% 손실을 본 뒤 원금을 회복하려면 +50% 수익률이 필요하다.',
      opts: ['O — 맞다', 'X — 그렇지 않다'],
      a: 1, card: 1,
      explain: '1,000만 원이 -50%면 500만 원입니다. 다시 1,000만 원이 되려면 +100%가 필요합니다.',
    },
    {
      q: '상관계수가 음(-)인 자산을 함께 담으면, 한쪽이 폭락할 때 다른 쪽이 방어해 계좌 전체 변동성을 줄일 수 있다.',
      opts: ['O — 맞다', 'X — 그렇지 않다'],
      a: 0, card: 2,
      explain: '반대로 움직이는 자산을 조합하면 위기 시 포트폴리오 전체의 손실 방어력이 크게 올라갑니다.',
    },
    {
      q: '특정 기업의 내부 악재로 주가가 폭락하는 위험이며, 분산투자로 거의 완전히 제거할 수 있는 위험은?',
      opts: ['체계적 리스크', '비체계적 리스크', '인플레이션 리스크', '유동성 리스크'],
      a: 1, card: 0,
      explain: '개별 기업·산업에 국한된 위험이 비체계적 리스크입니다. 시장 전체에 영향을 주는 체계적 리스크는 분산만으로는 피하기 어렵습니다.',
    },
    {
      q: '주식 50% : 채권 50%로 시작한 포트폴리오가 1년 후 주식 70% : 채권 30%가 되었다. 올바른 리밸런싱은?',
      opts: [
        '비중이 늘어난 주식을 더 매수하고 채권을 매도한다',
        '늘어난 주식을 일부 매도해 수익을 실현하고, 그 돈으로 채권을 매수해 50:50으로 맞춘다',
        '채권을 전량 매도해 주식 100% 포트폴리오로 전환한다',
        '아무 조치도 하지 않고 주식이 더 오르기를 기다린다',
      ],
      a: 1, card: 4,
      explain: '오른 자산을 팔고(고가 매도) 덜 오른 자산을 사서(저가 매수) 목표 비중을 회복하는 과정입니다.',
    },
    {
      q: 'MDD(최대 낙폭)에 대한 설명으로 가장 올바른 것은?',
      opts: [
        '특정 기간 포트폴리오가 기록한 최고 수익률을 의미한다',
        'MDD가 클수록 하락장에서 안전하게 방어되었다는 뜻이다',
        '최고점 대비 최저점까지 자산 가치가 얼마나 감소했는지를 비율(%)로 나타낸 지표이다',
        'MDD는 단일 종목에서만 계산할 수 있다',
      ],
      a: 2, card: 1,
      explain: 'MDD가 낮을수록 변동성이 적고 하락장 방어력이 우수함을 뜻합니다.',
    },
  ],
  miniSim: {
    weekId: 4,
    title: '미니 모의투자 · 폭락장 통과하기',
    navTitle: '미니 모의투자 · 폭락장 통과하기',
    navDesc: '포트폴리오를 짜고 2년을 버텨보기',
    brief: {
      headline: '이번엔 포트폴리오를 짜서 폭락장을 지나갑니다',
      lines: [
        '1,000만 원을 주식·채권·금·현금 네 자산에 나눠 담습니다. 그리고 2년(104주)을 굴립니다.',
        '이 구간에는 큰 하락이 포함되어 있습니다. 피할 수 없는 체계적 리스크입니다. 중요한 건 얼마나 버느냐가 아니라 얼마나 덜 깨지느냐입니다.',
        '리밸런싱 규칙도 직접 고릅니다. 규칙이 있는 포트폴리오와 없는 포트폴리오가 어떻게 갈리는지 확인해보세요.',
      ],
      tools: [
        '카드 3 · 상관관계 — 같이 움직이지 않는 자산을 섞기',
        '카드 4 · 3대 자산 — 주식·채권·현금의 역할이 각각 다릅니다',
        '카드 5 · 리밸런싱 — 시간 기준 vs 비율 기준',
        '카드 2 · MDD — 결과 화면에서 수익률보다 먼저 보게 됩니다',
      ],
    },
    setup(ctx) {
      const raw = { stock: 60, bond: 25, gold: 5, cash: 10 }
      let rule = 'none'
      const node = h('div', {})
      const norm = () => {
        const sum = ASSETS.reduce((a, x) => a + raw[x.key], 0) || 1
        return Object.fromEntries(ASSETS.map(a => [a.key, raw[a.key] / sum]))
      }
      const paint = () => {
        const w = norm()
        node.innerHTML = ''
        node.append(
          h('div', { class: 'card' },
            h('b', {}, '① 1,000만 원을 어떻게 나눌까요?'),
            h('p', { class: 'small', style: 'margin:6px 0 4px' },
              '막대를 움직이면 나머지 비중이 자동으로 조정됩니다(합계 100% 기준으로 환산).'),
            ASSETS.map(a => sliderRow(
              `${a.label}  ${(w[a.key] * 100).toFixed(0)}%`, raw[a.key],
              { min: 0, max: 100, step: 5, fmt: v => won(SEED * (v / (ASSETS.reduce((s, x) => s + raw[x.key], 0) || 1))) },
              v => { raw[a.key] = v; paint() })),
            h('div', { class: 'ms-alloc' },
              ASSETS.map(a => h('i', {
                style: `width:${(w[a.key] * 100).toFixed(1)}%;background:${a.color}`,
                title: a.label,
              }))),
          ),
          h('div', { class: 'card' },
            h('b', {}, '② 리밸런싱 규칙을 정하세요'),
            choiceRow([
              { value: 'none', label: '안 함', desc: '그냥 둔다' },
              { value: 'time', label: '6개월마다', desc: '시간 기준' },
              { value: 'drift', label: '5%p 벗어나면', desc: '비율 기준' },
            ], rule, v => { rule = v; paint() }),
          ),
        )
      }
      paint()
      return { node, read: () => ({ weights: norm(), rule }) }
    },
    simulate({ weights, rule }) {
      const mine = runPortfolio(weights, rule)
      const allStock = runPortfolio({ stock: 1, bond: 0, gold: 0, cash: 0 }, 'none')
      const noRule = runPortfolio(weights, 'none')

      const final = mine.curve[LEN - 1]
      const ret = (final / SEED - 1) * 100
      const mdd = maxDD(mine.curve)
      return {
        headline: `주식 ${(weights.stock * 100).toFixed(0)}% · 리밸런싱 ${rule === 'none' ? '없음' : rule === 'time' ? '6개월' : '5%p'}`,
        weights, rule, mine, allStock, noRule, final, ret, mdd,
        stockRet: (allStock.curve[LEN - 1] / SEED - 1) * 100,
        stockMdd: maxDD(allStock.curve),
        noRuleRet: (noRule.curve[LEN - 1] / SEED - 1) * 100,
        metrics: [
          { k: '내 MDD (최대 낙폭)', v: '-' + mdd.toFixed(1) + '%', cls: 'num-down', sub: `회복에 +${recoveryNeeded(mdd).toFixed(1)}% 필요` },
          { k: '2년 수익률', v: pct(ret), cls: numClass(ret) },
          { k: '최종 자산', v: won(final) },
          { k: '리밸런싱 횟수', v: mine.rebalances + '회' },
        ],
      }
    },
    review(ctx, res) {
      const { weights, rule, ret, mdd, stockRet, stockMdd, noRuleRet, mine, allStock } = res
      const lines = [
        `먼저 MDD부터 봅시다. 이 2년 동안 내 계좌는 고점 대비 최대 ${mdd.toFixed(1)}% 빠졌습니다. 이 손실을 원금까지 되돌리려면 +${recoveryNeeded(mdd).toFixed(1)}%가 필요합니다. 카드 2의 음의 복리가 내 숫자로 나온 것입니다.`,
        `같은 기간 주식 100%였다면 MDD는 ${stockMdd.toFixed(1)}%(회복에 +${recoveryNeeded(stockMdd).toFixed(1)}% 필요), 수익률은 ${pct(stockRet)}였습니다. 내 포트폴리오는 ${pct(ret)}입니다.`,
      ]
      if (mdd < stockMdd) {
        lines.push(
          `주식 외 자산을 섞은 덕분에 낙폭을 ${(stockMdd - mdd).toFixed(1)}%p 줄였습니다. 수익률은 ${ret < stockRet ? `${(stockRet - ret).toFixed(1)}%p 낮지만` : '오히려 더 높지만'}, 자산 배분의 목적은 최고 수익이 아니라 "끝까지 버티게 만드는 것"입니다.`)
      } else {
        lines.push('주식 비중이 매우 높아 분산 효과가 거의 없었습니다. 종목이 아니라 자산군을 섞어야 낙폭이 줄어듭니다(카드 3).')
      }
      if (rule === 'none') {
        lines.push(
          `리밸런싱을 하지 않으셨습니다. 규칙을 켰다면 결과가 어떻게 달랐을지는 "다시 해보기"로 확인해볼 수 있습니다. 리밸런싱의 진짜 가치는 수익률이 아니라, 무엇을 사고팔지 감정이 아니라 규칙이 정해준다는 데 있습니다(카드 5).`)
      } else {
        lines.push(
          `리밸런싱을 ${mine.rebalances}회 실행했습니다. 같은 배분에 규칙만 껐다면 ${pct(noRuleRet)}였습니다(현재 ${pct(ret)}). 오른 자산을 기계적으로 덜어내고 빠진 자산을 채우는 과정이 자동으로 일어난 결과입니다.`)
      }
      return h('div', {},
        h('div', { class: 'report-hero' },
          h('div', { class: 'rh-label' }, '2년 최대 낙폭 (MDD)'),
          h('div', { class: 'rh-num num-down' }, '-' + mdd.toFixed(1) + '%'),
          h('p', { class: 'desc', style: 'margin-top:8px' },
            `수익률 ${pct(ret)} · 원금 회복에 +${recoveryNeeded(mdd).toFixed(1)}% 필요`),
        ),
        metricGrid(res.metrics),
        h('div', { class: 'card' },
          h('b', {}, '내 포트폴리오 vs 주식 100%'),
          compareChart(
            mine.curve.map(v => v / SEED),
            allStock.curve.map(v => v / SEED),
            ['내 포트폴리오', '주식 100%'],
          ),
        ),
        h('div', { class: 'card' },
          h('b', {}, '내 자산 배분'),
          h('div', { class: 'ms-alloc', style: 'margin-top:12px' },
            ASSETS.map(a => h('i', { style: `width:${(weights[a.key] * 100).toFixed(1)}%;background:${a.color}` }))),
          h('div', { class: 'ms-legend', style: 'margin-top:10px' },
            ASSETS.map(a => h('span', {},
              h('i', { style: `background:${a.color}` }),
              `${a.label} ${(weights[a.key] * 100).toFixed(0)}%`))),
        ),
        coachCard('🧭 이번 실습이 말하는 것', lines),
      )
    },
  },
}
