// 6주차 · 절세 계좌와 2030 자산 로드맵 (졸업)
// 원고 원본: docs/콘텐츠/6주차_절세계좌와_자산_로드맵.md (수정 시 함께 반영)
import { h, fmt, won, pct, numClass, metricGrid, choiceRow, coachCard } from '../mini-sim.js'

const PRINCIPAL = 10_000_000
// 3종목 세전 손익 — 분산투자를 하면 일부는 반드시 손실이 난다는 4주차 전제를 그대로 반영
const POSITIONS = [
  { code: '종목 A', pnl: 3_000_000 },
  { code: '종목 B', pnl: -1_000_000 },
  { code: '종목 C', pnl: 500_000 },
]
const GROSS_GAIN = POSITIONS.filter(p => p.pnl > 0).reduce((a, p) => a + p.pnl, 0) // 350만
const GROSS_LOSS = -POSITIONS.filter(p => p.pnl < 0).reduce((a, p) => a + p.pnl, 0) // 100만
const NET = GROSS_GAIN - GROSS_LOSS // 250만
const VALUE = PRINCIPAL + NET // 1,250만

const TAX = 0.154          // 이자·배당소득세
const ISA_EXEMPT = 4_000_000 // 서민형 비과세 한도
const PENSION_CREDIT = 0.132 // 세액공제율
const PENSION_PENALTY = 0.165 // 중도해지 기타소득세

const ACCOUNTS = [
  { value: 'normal', label: '일반 계좌', desc: '제약 없음' },
  { value: 'isa', label: 'ISA (서민형)', desc: '비과세·손익통산' },
  { value: 'pension', label: '연금저축', desc: '세액공제' },
]

// 계좌별 최종 실수령 계산
function settle(account, terminated) {
  if (account === 'normal') {
    const tax = GROSS_GAIN * TAX // 손익통산 없음 — 이익 전체에 과세
    return { tax, credit: 0, net: VALUE - tax, note: '이익 350만 원 전체에 과세 (손실 100만 원은 반영되지 않음)' }
  }
  if (account === 'isa') {
    if (terminated) { // 3년 의무 기간 전 해지 → 비과세 혜택 상실
      const tax = GROSS_GAIN * TAX
      return { tax, credit: 0, net: VALUE - tax, note: '3년 전 해지로 비과세 혜택이 사라져 일반 계좌와 동일하게 과세' }
    }
    const taxable = Math.max(0, NET - ISA_EXEMPT)
    const tax = taxable * TAX
    return { tax, credit: 0, net: VALUE - tax, note: '손익통산으로 순이익 250만 원만 계산 → 서민형 비과세 한도(400만) 이내라 세금 0원' }
  }
  // 연금저축
  const credit = PRINCIPAL * PENSION_CREDIT
  if (terminated) {
    const tax = VALUE * PENSION_PENALTY
    return { tax, credit, net: VALUE - tax + credit, note: '만 55세 전 중도 해지 → 원금+수익 전체에 기타소득세 16.5% 부과' }
  }
  return { tax: 0, credit, net: VALUE + credit, locked: true, note: '만 55세까지 인출 불가 (과세이연 상태)' }
}

export default {
  id: 6,
  title: '절세 계좌와 자산 로드맵',
  subtitle: 'ISA·연금·청년정책 (졸업)',
  cards: [
    {
      title: '세금은 확정 손실이다',
      paras: [
        '예·적금 이자나 주식 배당금에는 기본 15.4%(국세 14% + 지방소득세 1.4%)가 원천징수됩니다. 2주차에서 적금 실효 수익률을 계산할 때 이미 만난 숫자입니다.',
        '투자 수익률을 1%p 더 얻으려면 더 큰 위험을 져야 합니다. 하지만 세금을 1%p 줄이는 것은 위험이 전혀 늘지 않습니다. 확정된 수익입니다.',
      ],
      note: '그래서 "어디에 투자하느냐"만큼 "어느 계좌에서 투자하느냐"가 중요합니다.',
    },
    {
      title: 'ISA와 연금저축/IRP',
      bullets: [
        'ISA — 비과세(일반형 200만 / 서민형 400만까지) + 손익통산. 의무 가입 3년. 중단기 목돈 마련용',
        '연금저축·IRP — 세액공제(납입액의 13.2~16.5% 환급). 만 55세 이후 수령. 장기 노후 대비용',
        'ISA 투자 가능 상품 — 국내 주식, ETF, 펀드, 예·적금, RP 등',
        '연금저축·IRP 투자 가능 상품 — 펀드, ETF, 채권 등 (안전자산 30% 의무 보유)',
      ],
      note: '연금저축·IRP는 세액공제를 받는 대신 만 55세 이후 연금으로 받아야 합니다. 중도 해지하면 그동안 받은 혜택을 기타소득세 16.5%로 토해냅니다.',
    },
    {
      title: 'ISA의 진짜 무기, 손익통산',
      paras: [
        '손익통산은 계좌 안에서 발생한 이익과 손실을 합쳐서 순이익에만 과세하는 방식입니다.',
        'A 종목에서 +300만 원, B 종목에서 -100만 원이 났다고 해봅시다. 일반 계좌는 이익 300만 원 전체에 과세합니다 — 손실은 없는 셈 취급입니다. ISA는 순이익 200만 원에만 과세하고, 서민형 기준이면 전액 비과세입니다.',
      ],
      note: '4주차에서 배운 분산투자를 하면 일부 종목은 반드시 손실이 납니다. ISA는 그 손실을 세금 계산에 반영해 주는 계좌입니다. 분산투자와 궁합이 좋습니다.',
    },
    {
      title: '청년도약계좌',
      paras: ['청년의 중장기 자산 형성을 지원하기 위해 정부가 매월 기여금을 보태주는 정책형 적금입니다.'],
      bullets: [
        '매월 최대 70만 원까지 자유 납입, 가입 기간 5년',
        '본인 납입금에 더해 정부가 소득 구간별로 매월 최대 2.1만~2.4만 원 기여금 추가 적립',
        '만기 이자 소득에 15.4% 비과세',
      ],
      note: '2주차에서 "적금은 실효 수익률이 낮다"고 배웠는데, 청년도약계좌는 다릅니다. 정부 기여금과 비과세가 붙기 때문에 같은 금리의 일반 적금과는 완전히 다른 상품입니다.',
    },
    {
      title: '청년 주택드림 청약통장 & 대출',
      bullets: [
        '청년 주택드림 청약통장 — 만 19~34세 무주택자 중 연 소득 5,000만 원 이하 가입 가능',
        '최대 연 4.5% 우대금리 + 청약 당첨 시 전용 대출 연계',
        '청년 주택드림 대출 — 청약 당첨 시 최저 연 2.2%로 분양가의 80%까지 주택담보대출',
      ],
      note: "3주차의 '좋은 부채' 기준을 다시 떠올려보세요. 연 2.2%는 카드론(연 10~19%)과 같은 '대출'이라는 단어를 쓰지만 완전히 다른 물건입니다.",
    },
    {
      title: '목적별로 계좌를 나누는 로드맵',
      paras: ['2030은 위험 감수 능력이 높은 자산 형성기입니다. 다만 돈을 쓸 시점에 따라 계좌를 분리해야 합니다.'],
      bullets: [
        '단기 (1~2년) · 비상금 및 단기 지출 → 파킹통장 / MMF',
        '중기 (3~5년) · 결혼자금·전세보증금 → 청년도약계좌 / ISA (주식·ETF)',
        '장기 (10년 이상) · 노후 자금 → 연금저축 / IRP / 미국 지수 추종 ETF',
      ],
      note: '3년 뒤 쓸 돈을 연금 계좌에 넣으면, 필요할 때 16.5%를 물고 깨야 합니다. 돈의 사용 시점과 계좌의 만기를 맞추는 것이 로드맵의 핵심입니다.',
    },
    {
      title: '현금흐름 자동화 (졸업)',
      paras: ['2주차의 통장 쪼개기를 계좌 전략과 결합하면 완성됩니다.'],
      bullets: [
        '월급날 직후 선저축 — 청년도약계좌·ISA 자동이체 설정',
        '남은 금액으로 고정지출 처리',
        '최종 잔액을 소비 통장(체크카드)으로 넘겨 예산 한도 내에서 지출',
      ],
      note: '투자를 잘하는 사람은 매일 결정하는 사람이 아니라, 결정을 미리 해둔 사람입니다. 여기까지가 「똑똑」의 전 과정입니다.',
    },
  ],
  quiz: [
    {
      q: 'ISA는 계좌 내에서 발생한 이익과 손실을 합산하여 순이익에 대해서만 세금을 매기는 손익통산 혜택을 제공한다.',
      opts: ['O — 맞다', 'X — 그렇지 않다'],
      a: 0, card: 2,
      explain: '여러 상품의 이익과 손실을 합쳐 순수익에만 비과세·분리과세를 적용하므로 절세 효과가 큽니다.',
    },
    {
      q: '연금저축펀드는 세액공제 혜택을 주지만, 만 55세 이전에 해지해도 아무런 불이익 없이 자유롭게 원금을 인출할 수 있다.',
      opts: ['O — 맞다', 'X — 그렇지 않다'],
      a: 1, card: 1,
      explain: '중도 해지 시 그동안 받은 혜택을 기타소득세 16.5%로 토해내야 합니다.',
    },
    {
      q: '예·적금 이자나 주식 배당금 수령 시 원천징수되는 기본 이자·배당소득세율은?',
      opts: ['6.6%', '13.2%', '15.4%', '22.0%'],
      a: 2, card: 0,
      explain: '소득세 14% + 지방소득세 1.4% = 15.4%입니다.',
    },
    {
      q: "'청년도약계좌'에 대한 설명으로 올바르지 않은 것은?",
      opts: [
        '만기 5년 동안 매월 일정 금액을 자유롭게 납입할 수 있다',
        '본인 납입금 외에 정부가 소득 수준에 따라 기여금을 보태준다',
        '만기 시 발생한 이자 소득에 15.4% 비과세 혜택이 적용된다',
        '만 60세 이상 은퇴 예정자만 가입할 수 있는 노후 전용 상품이다',
      ],
      a: 3, card: 3,
      explain: '청년도약계좌는 만 19~34세 청년을 대상으로 하는 자산 형성 지원 상품입니다.',
    },
    {
      q: '3~5년 뒤 결혼자금이나 전세보증금 같은 목돈을 모으기 위해 가장 적절한 조합은?',
      opts: [
        '전액 현금으로 일반 입출금 통장에 방치하기',
        'IRP에 전액 납입하고 바로 해지해 세금 환급받기',
        'ISA를 활용해 비과세 혜택을 받으며 ETF 및 예·적금으로 시드머니 모으기',
        '연금저축에 모든 자산을 넣고 3년 뒤 해지하기',
      ],
      a: 2, card: 5,
      explain: '의무 가입 기간 3년인 ISA는 비과세·손익통산 혜택이 있어 중단기 목돈 마련에 최적화되어 있습니다.',
    },
  ],
  miniSim: {
    weekId: 6,
    title: '미니 모의투자 · 같은 수익, 다른 잔고',
    navTitle: '미니 모의투자 · 같은 수익, 다른 잔고',
    navDesc: '계좌를 골라 세후 잔고를 비교하기',
    startLabel: '이 계좌로 시작',
    brief: {
      headline: '투자 성과는 똑같습니다. 계좌만 다릅니다',
      lines: [
        '1,000만 원으로 3종목에 투자했고, 결과는 이렇습니다 — 종목 A +300만, 종목 B -100만, 종목 C +50만. 세전 순이익 250만 원. (계좌별 세금 차이만 보기 위한 가상의 손익입니다)',
        '4주차에서 배운 대로 분산했기 때문에 일부 종목은 손실이 났습니다. 이 손실이 세금 계산에서 어떻게 취급되는지가 이번 실습의 핵심입니다.',
        '똑같은 성과인데 어느 계좌에 담았느냐에 따라 손에 남는 돈이 달라집니다.',
      ],
      tools: [
        '카드 1 · 이자·배당소득세 15.4%',
        '카드 2 · ISA vs 연금저축 — 혜택의 성격과 잠금 기간이 다릅니다',
        '카드 3 · 손익통산 — 손실을 세금 계산에 반영해 주는가',
        '카드 6 · 돈의 사용 시점과 계좌 만기 맞추기',
      ],
    },
    setup(ctx) {
      let account = 'normal'
      const node = h('div', {})
      const paint = () => {
        node.innerHTML = ''
        node.append(
          h('div', { class: 'card' },
            h('b', {}, '내 투자 결과 (세전 · 모든 계좌 동일)'),
            h('div', { class: 'ms-positions' },
              POSITIONS.map(p => h('div', { class: 'ms-pos' },
                h('span', {}, p.code),
                h('b', { class: numClass(p.pnl) }, (p.pnl > 0 ? '+' : '') + won(p.pnl))))),
            h('div', { class: 'ms-pos total' },
              h('span', {}, '세전 순이익'),
              h('b', { class: 'num-up' }, '+' + won(NET))),
          ),
          h('div', { class: 'card' },
            h('b', {}, '어느 계좌에 담을까요?'),
            choiceRow(ACCOUNTS, account, v => { account = v; paint() }),
            h('p', { class: 'small', style: 'margin-top:10px' },
              account === 'normal' ? '제약이 없는 대신 아무 혜택도 없습니다.'
                : account === 'isa' ? '3년 의무 가입 기간이 있습니다. 그 전에 깨면 혜택이 사라집니다.'
                  : '납입액의 13.2%를 연말정산에서 환급받습니다. 대신 만 55세까지 잠깁니다.'),
          ),
        )
      }
      paint()
      return { node, read: () => ({ account }) }
    },
    play(ctx, params, done, box) {
      const { account } = params
      const paint = () => {
        box.innerHTML = ''
        box.append(
          h('div', { class: 'card ms-news' },
            h('div', { class: 'ms-news-src' }, '가입 18개월 차'),
            h('p', { class: 'ms-news-body' },
              '전세 계약을 하게 됐습니다. 보증금 잔금으로 800만 원이 급하게 필요합니다.'),
            h('p', { class: 'small' },
              account === 'normal'
                ? '※ 일반 계좌는 언제든 자유롭게 인출할 수 있습니다.'
                : account === 'isa'
                  ? '※ ISA는 의무 가입 기간 3년을 채우지 못했습니다. 중도 해지해야 인출할 수 있습니다.'
                  : '※ 연금저축은 만 55세 전 인출이 불가합니다. 중도 해지해야 인출할 수 있습니다.'),
            h('b', { style: 'display:block;margin-top:14px' }, '어떻게 하시겠습니까?'),
            h('div', { class: 'btn-row', style: 'margin-top:12px' },
              h('button', {
                class: 'btn secondary',
                onclick: () => done(buildResult(account, false)),
              }, account === 'normal' ? '인출한다' : '유지한다 (다른 방법을 찾는다)'),
              h('button', {
                class: 'btn secondary',
                onclick: () => done(buildResult(account, account !== 'normal')),
              }, account === 'normal' ? '그대로 둔다' : '중도 해지한다'),
            ),
          ),
        )
      }
      paint()
    },
    review(ctx, res) {
      const { account, terminated, mine, all } = res
      const label = ACCOUNTS.find(a => a.value === account).label
      const best = all.reduce((a, b) => (b.net > a.net ? b : a))
      // '지금 꺼낼 수 있는 돈' 비교는 잠겨 있는 계좌(연금 유지)를 빼고 계산한다.
      // 연금 유지 잔고가 가장 커 보이지만 만 55세까지 인출할 수 없기 때문.
      const usable = all.filter(a => !a.locked)
      const gap = Math.max(...usable.map(x => x.net)) - Math.min(...usable.map(x => x.net))
      const lines = [
        `세 계좌 모두 세전 순이익은 똑같이 ${won(NET)}입니다. 그런데 지금 실제로 꺼낼 수 있는 돈은 최대 ${won(gap)}까지 차이가 납니다. 투자를 더 잘해서가 아니라 계좌를 고른 결과입니다.`,
        `일반 계좌는 손익통산이 없어 이익 ${won(GROSS_GAIN)} 전체에 15.4%가 과세됩니다. 종목 B에서 난 ${won(GROSS_LOSS)} 손실은 세금 계산에서 없는 셈입니다. ISA는 순이익 ${won(NET)}만 계산하고, 서민형 비과세 한도(400만) 안이라 세금이 0원입니다.`,
      ]
      if (account === 'pension' && terminated) {
        lines.push(
          `연금저축을 중도 해지하셨습니다. 세액공제로 ${won(mine.credit)}을 돌려받았지만, 해지하면서 원금과 수익 전체에 기타소득세 16.5%인 ${won(mine.tax)}을 물었습니다. 결과적으로 받은 혜택보다 더 많이 토해낸 셈입니다.`,
          '카드 6이 말한 그대로입니다. 3년 뒤 쓸 돈을 55세까지 잠기는 계좌에 넣으면 이런 일이 생깁니다. 계좌의 성능이 아니라 돈의 사용 시점과 계좌 만기를 맞추는 것이 핵심입니다.')
      } else if (account === 'isa' && terminated) {
        lines.push(
          `ISA를 3년 전에 해지하면서 비과세 혜택이 사라졌습니다. 세금 ${won(mine.tax)}을 물어 결과적으로 일반 계좌와 똑같아졌습니다. ISA의 혜택은 3년을 채워야 완성됩니다.`)
      } else if (account === 'isa') {
        lines.push(
          'ISA를 유지하셨습니다. 손익통산과 비과세가 모두 적용돼 세금 0원으로 끝났습니다. 다만 급전이 필요할 때 이 계좌를 건드릴 수 없었다는 점도 기억하세요 — 그래서 비상금이 먼저입니다(2주차 카드 6).')
      } else if (account === 'pension') {
        lines.push(
          '연금저축을 유지하셨습니다. 세액공제 환급을 지켰지만, 이 돈은 만 55세까지 꺼낼 수 없습니다. 전세금은 다른 곳에서 마련해야 했습니다. 장기 계좌의 혜택은 잠금의 대가입니다.')
      } else {
        lines.push(
          '일반 계좌는 언제든 꺼낼 수 있다는 게 장점이었습니다. 그 대신 세금에서 아무 혜택도 받지 못했습니다. 자유와 절세는 대체로 맞바꾸는 관계입니다.')
      }
      lines.push(
        '여기까지가 「똑똑」 6주 과정의 마지막 실습입니다. 0단계에서 아무 기준 없이 눌렀던 매수 버튼이, 지금은 금리·레버리지·분산·지표·계좌라는 다섯 개의 기준을 갖게 됐습니다.')

      return h('div', {},
        h('div', { class: 'report-hero' },
          h('div', { class: 'rh-label' }, `${label}${terminated ? ' · 중도 해지' : ''} · 세후 최종`),
          h('div', { class: 'rh-num' }, won(mine.net)),
          h('p', { class: 'desc', style: 'margin-top:8px' }, mine.note),
        ),
        metricGrid(res.metrics),
        h('div', { class: 'card' },
          h('b', {}, '세 계좌 비교 (세전 수익은 모두 동일)'),
          h('div', { class: 'ms-bars', style: 'margin-top:14px' },
            all.map(a => h('div', { class: 'ms-bar' + (a.value === account ? ' on' : '') },
              h('span', {},
                a.label + (a.value === account ? ' (내 선택)' : ''),
                a.locked ? h('em', { class: 'ms-locked' }, ' 만 55세까지 인출 불가') : null),
              h('i', { style: `width:${(a.net / best.net * 100).toFixed(1)}%` }),
              h('b', {}, won(a.net))))),
          h('div', { class: 'ms-tax-note' },
            all.map(a => h('p', { class: 'small' }, h('b', {}, a.label + ' · '), a.note))),
        ),
        coachCard('이번 실습이 말하는 것', lines),
      )
    },
  },
}

function buildResult(account, terminated) {
  const mine = settle(account, terminated)
  const all = ACCOUNTS.map(a => {
    // 비교표는 "각 계좌를 정상적으로 운용했을 때"를 기준으로 보여주되,
    // 내가 고른 계좌는 실제 선택(해지 여부)을 반영한다.
    const t = a.value === account ? terminated : false
    const s = settle(a.value, t)
    return { ...a, ...s }
  })
  return {
    headline: `${ACCOUNTS.find(a => a.value === account).label}${terminated ? ' 중도해지' : ''}`,
    account, terminated, mine, all,
    metrics: [
      { k: '세전 순이익', v: '+' + won(NET) },
      { k: '납부한 세금', v: won(mine.tax), cls: mine.tax > 0 ? 'num-down' : 'num-flat' },
      { k: '세액공제 환급', v: mine.credit ? '+' + won(mine.credit) : '없음' },
      { k: '세후 최종 잔고', v: won(mine.net) },
    ],
  }
}
