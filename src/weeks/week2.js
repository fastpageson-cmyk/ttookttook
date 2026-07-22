// 2주차 · 시드머니와 저축의 구조
// 원고 원본: docs/콘텐츠/2주차_시드머니와_저축의_구조.md (수정 시 함께 반영)
import {
  h, fmt, won, pct, numClass, seriesFrom, INDEX_CODE,
  metricGrid, sliderRow, choiceRow, coachCard, compareChart,
} from '../mini-sim.js'

const INCOME = 3_000_000      // 월 세후 소득
const FIXED = 1_200_000       // 월 고정지출
const AVAIL = INCOME - FIXED  // 저축 가능액 180만 원
const MONTHS = 24
const TAX = 0.154             // 이자소득세
const DEPOSIT_RATE = 0.04     // 적금 연 4%

// 적금 세후 원리금 — 회차마다 이자가 붙는 기간이 다르다는 점을 그대로 계산
function savingsAccount(monthly, annualRate, months = MONTHS) {
  const principal = monthly * months
  // i번째 납입금은 (months - i + 1)개월치 이자를 받음
  const interest = monthly * (annualRate / 12) * (months * (months + 1) / 2)
  return { principal, interest: interest * (1 - TAX), total: principal + interest * (1 - TAX) }
}

// 지수 월 적립 — 실제 KOSPI에서 24개월(104주) 구간을 4.33주 간격으로 샘플링
// 266주 = 2021~2023년 긴축 구간. 적립식이 손실을 없애주지 않는다는 걸 보여주는 정직한 구간.
const ETF_START = 266
function etfMonthly() {
  const weekly = seriesFrom(INDEX_CODE, ETF_START, 105)
  return Array.from({ length: MONTHS }, (_, i) => weekly[Math.round(i * 104 / (MONTHS - 1))])
}

function investAccount(monthly, months = MONTHS) {
  const px = etfMonthly()
  let units = 0
  const curve = []
  for (let i = 0; i < months; i++) {
    units += monthly / px[i]
    curve.push(units * px[i])
  }
  return { principal: monthly * months, total: curve[curve.length - 1], curve }
}

export default {
  id: 2,
  title: '시드머니와 저축의 구조',
  subtitle: '복리·저축률·통장 쪼개기',
  cards: [
    {
      title: '단리와 복리, 시간이 만드는 차이',
      paras: [
        '단리(Simple Interest)는 최초 원금에만 이자가 붙는 방식입니다. 복리(Compound Interest)는 [원금 + 이미 붙은 이자] 전체가 다시 원금이 되어, 이자에 다시 이자가 붙습니다.',
        '차이는 초반에 거의 없다가 시간이 갈수록 벌어집니다. 그래서 복리는 "수익률의 마법"이 아니라 시간의 마법에 가깝습니다. 사회초년생이 가진 가장 큰 자산이 시간이라는 말은 이 뜻입니다.',
      ],
    },
    {
      title: '72의 법칙',
      paras: ['복리로 원금이 2배가 되는 데 걸리는 기간을 어림하는 공식입니다.'],
      bullets: [
        '거치 기간(년) ≈ 72 ÷ 연이율(%)',
        '연 6% → 72 ÷ 6 = 12년이면 원금이 2배',
        '연 3% → 24년 · 연 12% → 6년',
      ],
      note: '이 공식을 뒤집으면 이렇게도 읽힙니다. 물가상승률이 연 3%라면, 내 현금의 가치는 24년 뒤 절반이 됩니다.',
    },
    {
      title: '"연 6% 적금"의 착시',
      paras: [
        '연 6% 적금에 매달 50만 원씩 1년(원금 600만 원)을 넣으면 이자로 36만 원을 받을 것 같습니다. 실제로는 그렇지 않습니다.',
        '적금은 매달 따로 넣기 때문에 회차마다 이자가 붙는 기간이 다릅니다. 첫 달 납입금은 12개월치 이자를 받지만, 마지막 달 납입금은 1개월치(약 8.3%)만 받습니다.',
        '여기에 이자소득세 15.4%(국세 14% + 지방소득세 1.4%)가 원천징수됩니다. 결과적으로 세후 실제 이자는 약 16만 5천 원, 원금 대비 실효 수익률은 약 2.7%입니다. 광고된 6%의 절반도 안 됩니다.',
      ],
      note: '"몇 %짜리 적금이냐"보다 "얼마를 넣느냐"가 먼저인 이유가 여기 있습니다.',
    },
    {
      title: '저축률이 금리를 이긴다',
      paras: [
        '저축률(%) = (월 저축·투자 금액 ÷ 월 세후 소득) × 100',
        '시드머니가 1,000만 원 미만인 구간에서는, 연 1~2%p의 수익률 차이보다 지출을 줄여 저축 절대액을 늘리는 것이 자산이 불어나는 속도를 비교할 수 없이 크게 바꿉니다.',
        '월 300만 원 소득에서 저축률을 20%(60만 원)에서 40%(120만 원)로 올리면 연 저축액이 720만 원에서 1,440만 원이 됩니다. 이 차이를 수익률로 만들려면 7,200만 원을 연 10%로 굴려야 합니다. 시드머니 단계에서는 불가능한 이야기입니다.',
      ],
    },
    {
      title: '통장 쪼개기: 의지가 아니라 시스템',
      paras: ['돈 관리는 의지력 문제가 아니라 구조 설계 문제입니다. 월급이 들어오면 자동으로 나뉘게 만듭니다.'],
      bullets: [
        '급여 통장 — 월급이 들어오는 곳. 여기서 자동이체로 즉시 분배',
        '저축·투자 통장 — 월급날 직후 선저축. 남는 돈을 저축하는 게 아니라, 저축하고 남은 돈을 씁니다',
        '고정지출 통장 — 월세·보험료·구독료 등 매달 나가는 금액',
        '소비 통장(체크카드) — 최종 잔액만. 이 통장이 비면 그 달 소비는 끝',
      ],
      note: '순서가 핵심입니다. 선저축 → 고정지출 → 소비. 순서를 바꾸면 저축률은 늘 0에 수렴합니다.',
    },
    {
      title: '비상금이 먼저다',
      paras: [
        '투자를 시작하기 전에 생활비 3~6개월치를 즉시 꺼낼 수 있는 곳(파킹통장/MMF)에 둡니다.',
        '비상금이 없으면, 시장이 빠졌을 때 하필 그 시점에 주식을 팔아야 하는 상황이 생깁니다. 비상금은 수익을 내기 위한 돈이 아니라 투자를 강제 종료당하지 않기 위한 돈입니다.',
      ],
    },
  ],
  quiz: [
    {
      q: '연 6% 1년 만기 적금에 매달 일정액을 납입하면, 만기에 총 납입 원금의 6%를 이자로 받는다.',
      opts: ['O — 맞다', 'X — 그렇지 않다'],
      a: 1, card: 2,
      explain: '회차별로 이자가 붙는 기간이 다르고(마지막 회차는 1개월치), 이자소득세 15.4%가 원천징수됩니다. 월 50만 원·연 6%·1년이면 세후 실효 수익률은 약 2.7%입니다.',
    },
    {
      q: '시드머니가 1,000만 원 미만인 단계에서는, 수익률을 1~2%p 높이는 것보다 저축률을 높이는 것이 자산 형성 속도에 더 큰 영향을 준다.',
      opts: ['O — 맞다', 'X — 그렇지 않다'],
      a: 0, card: 3,
      explain: '원금이 작을 때 수익률 1~2%p의 절대 금액 효과는 미미합니다. 저축 절대액을 늘리는 것이 훨씬 강력합니다.',
    },
    {
      q: '연 8% 복리 상품에 투자할 때, 72의 법칙으로 계산한 원금이 2배가 되는 기간은?',
      opts: ['6년', '8년', '9년', '12년'],
      a: 2, card: 1,
      explain: '72 ÷ 8 = 9년입니다.',
    },
    {
      q: "'통장 쪼개기'를 통한 현금흐름 자동화의 올바른 순서는?",
      opts: [
        '소비 → 고정지출 → 남으면 저축',
        '고정지출 → 소비 → 남으면 저축',
        '월급날 직후 선저축 → 고정지출 → 남은 금액으로 소비',
        '저축은 연말에 목돈으로 한 번에',
      ],
      a: 2, card: 4,
      explain: '"쓰고 남은 돈을 저축"하면 저축률은 늘 0에 수렴합니다. 선저축이 핵심입니다.',
    },
    {
      q: '투자를 시작하기 전에 비상금을 먼저 확보해야 하는 가장 큰 이유는?',
      opts: [
        '비상금 통장의 이자가 투자 수익보다 높기 때문',
        '예상치 못한 지출이 생겼을 때 하락장에서 투자 자산을 강제로 팔지 않기 위해',
        '비상금이 있으면 신용점수가 자동으로 오르기 때문',
        '비상금은 세금을 면제받기 때문',
      ],
      a: 1, card: 5,
      explain: '비상금은 수익용이 아니라 투자를 중단당하지 않기 위한 방어 장치입니다.',
    },
  ],
  miniSim: {
    weekId: 2,
    title: '미니 모의투자 · 24개월 시드머니',
    navTitle: '미니 모의투자 · 24개월 시드머니',
    navDesc: '저축률을 직접 정하고 2년을 돌려보기',
    brief: {
      headline: '2년 뒤 내 시드머니를 만들어봅니다',
      lines: [
        '월 세후 소득 300만 원, 고정지출 120만 원. 남는 180만 원을 어떻게 할지 정하는 게 전부입니다.',
        '저축액과 저축 수단을 고르면 24개월을 돌립니다. 적금을 고르면 카드 3에서 배운 회차별 이자 계산과 이자소득세 15.4%가 실제로 적용됩니다.',
      ],
      tools: [
        '카드 3 · 적금 실효 수익률 — 광고 금리가 아니라 세후 실수령 기준으로 계산됩니다',
        '카드 4 · 저축률 — 결과를 가장 크게 바꾸는 변수',
        '카드 5 · 선저축 — 저축을 먼저 떼고 남은 돈으로 소비하는 구조',
      ],
    },
    setup(ctx) {
      let monthly = 900_000
      let vehicle = 'deposit'
      const node = h('div', {})
      const paint = () => {
        const rate = (monthly / INCOME * 100)
        node.innerHTML = ''
        node.append(
          h('div', { class: 'card' },
            h('b', {}, '① 매달 얼마를 저축할까요?'),
            h('p', { class: 'small', style: 'margin:6px 0 10px' },
              `세후 소득 ${won(INCOME)} · 고정지출 ${won(FIXED)} → 저축 가능액 ${won(AVAIL)}`),
            sliderRow('매월 저축액', monthly, {
              min: 0, max: AVAIL, step: 50_000, fmt: v => won(v),
            }, v => { monthly = v; paint() }),
            h('div', { class: 'ms-rate' },
              h('span', {}, '내 저축률'),
              h('b', { class: rate >= 40 ? 'num-flat' : '' }, rate.toFixed(0) + '%'),
              h('span', { class: 'small' }, `· 남는 소비 예산 ${won(AVAIL - monthly)}`)),
          ),
          h('div', { class: 'card' },
            h('b', {}, '② 어디에 넣을까요?'),
            choiceRow([
              { value: 'deposit', label: '적금 (연 4%)', desc: '원금 보장 · 세후 이자' },
              { value: 'invest', label: 'KOSPI 적립', desc: '변동 있음 · 실제 시세' },
            ], vehicle, v => { vehicle = v; paint() }),
          ),
        )
      }
      paint()
      return { node, read: () => ({ monthly, vehicle }) }
    },
    simulate({ monthly, vehicle }) {
      const dep = savingsAccount(monthly, DEPOSIT_RATE)
      const inv = investAccount(monthly)
      const mine = vehicle === 'deposit' ? dep : inv
      const savingRate = monthly / INCOME * 100

      // 비교 시나리오 — 금리를 2배로 vs 저축률을 2배로
      const doubleRate = savingsAccount(monthly, DEPOSIT_RATE * 2)
      const doubleSave = savingsAccount(Math.min(monthly * 2, AVAIL), DEPOSIT_RATE)

      const effective = mine.principal > 0 ? (mine.total / mine.principal - 1) * 100 : 0
      return {
        headline: `저축률 ${savingRate.toFixed(0)}% · ${vehicle === 'deposit' ? '적금' : 'KOSPI 적립'}`,
        monthly, vehicle, savingRate, mine, dep, inv, doubleRate, doubleSave, effective,
        metrics: [
          { k: '24개월 뒤 시드머니', v: won(mine.total) },
          { k: '납입 원금', v: won(mine.principal) },
          { k: '원금 대비', v: pct(effective), cls: numClass(effective) },
        ],
      }
    },
    review(ctx, res) {
      const { monthly, vehicle, savingRate, mine, dep, inv, doubleRate, doubleSave, effective } = res
      const gainRate = doubleRate.total - dep.total
      const gainSave = doubleSave.total - dep.total

      const lines = []
      if (vehicle === 'deposit') {
        lines.push(
          `연 4% 적금에 24개월을 넣었는데 원금 대비 수익은 ${pct(effective)}였습니다. "연 4%"라고 적혀 있었지만 2년간 실제로 손에 남은 건 그 절반도 되지 않습니다.`,
          `회차마다 이자 기간이 다르고(마지막 회차는 1개월치), 이자에서 15.4%가 세금으로 빠져나갔기 때문입니다. 카드 3에서 계산했던 그대로입니다.`)
      } else {
        const invRet = (inv.total / inv.principal - 1) * 100
        lines.push(
          `KOSPI에 매달 적립해 원금 대비 ${pct(invRet)}가 됐습니다. 같은 돈을 연 4% 적금에 넣었다면 ${won(dep.total)}이었습니다(차이 ${won(inv.total - dep.total)}).`,
          invRet >= 0
            ? '다만 이 구간이 올랐다고 해서 적립식이 안전한 건 아닙니다. 반대 구간이었다면 원금이 줄어 있을 수도 있습니다.'
            : '적립식으로 매달 나눠 담았는데도 원금이 줄었습니다. 적립식은 매수 시점을 분산해 줄 뿐, 손실 자체를 없애주지는 않습니다.')
      }

      lines.push(
        `그런데 진짜 차이는 다른 데서 납니다. 같은 조건에서 금리를 2배(연 8%)로 올리면 ${won(gainRate)}을 더 받습니다. 반면 저축액만 2배로 늘리면 ${won(gainSave)}이 늘어납니다. ${(gainSave / Math.max(gainRate, 1)).toFixed(0)}배 차이입니다.`,
        '시드머니 단계에서 "몇 % 상품이냐"를 찾아다니는 시간보다, 매달 얼마를 떼어놓느냐를 20만 원 올리는 쪽이 압도적으로 강력합니다. 이게 카드 4의 결론입니다.')

      return h('div', {},
        h('div', { class: 'report-hero' },
          h('div', { class: 'rh-label' }, `저축률 ${savingRate.toFixed(0)}% · 24개월 뒤`),
          h('div', { class: 'rh-num' }, won(mine.total)),
          h('p', { class: 'desc', style: 'margin-top:8px' },
            `매달 ${won(monthly)}씩 · 납입 원금 ${won(mine.principal)}`),
        ),
        metricGrid(res.metrics),
        h('div', { class: 'card' },
          h('b', {}, '무엇을 바꿔야 결과가 바뀔까'),
          h('div', { class: 'ms-bars' },
            [
              { label: '지금 이대로', v: dep.total },
              { label: '금리를 2배로 (연 8%)', v: doubleRate.total },
              { label: '저축액을 2배로', v: doubleSave.total },
            ].map(b => h('div', { class: 'ms-bar' },
              h('span', {}, b.label),
              h('i', { style: `width:${(b.v / doubleSave.total * 100).toFixed(1)}%` }),
              h('b', {}, won(b.v)),
            ))),
          h('p', { class: 'small', style: 'margin-top:10px' },
            '※ 세 막대 모두 연 4% 적금 기준으로 맞춰 비교했습니다.'),
        ),
        vehicle === 'invest'
          ? h('div', { class: 'card' },
              h('b', {}, '적립 곡선'),
              compareChart(
                inv.curve.map((v, i) => v / (monthly * (i + 1) || 1)),
                inv.curve.map(() => 1),
                ['KOSPI 적립 (원금 대비)', '원금'],
              ))
          : null,
        coachCard('이번 실습이 말하는 것', lines),
      )
    },
  },
}
