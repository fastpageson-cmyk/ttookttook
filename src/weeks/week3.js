// 3주차 · 신용과 대출, 레버리지의 두 얼굴
// 원고 원본: docs/콘텐츠/3주차_신용과_대출_레버리지.md (수정 시 함께 반영)
//
// 이 주차의 미니 모의투자는 "배운 걸 실제로 써본다"의 대표 사례다.
// 카드에서 레버리지·상환방식·마진콜을 배우고, 모의투자에서 직접 대출을 당겨 52주를 버텨본다.
import { onLeave } from '../router.js'
import { appendKids } from '../ui.js'
import {
  h, fmt, won, pct, numClass, seriesFrom, maxDD, INDEX_CODE,
  metricGrid, choiceRow, coachCard, compareChart, lineChart,
} from '../mini-sim.js'

const EQUITY0 = 10_000_000   // 내 돈 1,000만 원
const LOAN_RATE = 0.06       // 대출 연 6%
const WEEKS = 52
const MARGIN_CALL = 0.25     // 담보비율(자기자본/자산) 25% 미만이면 반대매매

// 상승장 / 하락장 — 어느 쪽을 배정받을지는 시작 전에는 알 수 없다(그게 핵심)
// 실제 KOSPI 구간. 205주=2020년 코로나 반등 랠리(+53%), 260주=2022년 긴축 하락장(-28%)
const SCENARIOS = [
  { key: 'bull', label: '상승장', start: 205 },
  { key: 'bear', label: '하락장', start: 260 },
]

// 원리금균등 주간 상환액
function annuityPayment(loan, weeklyRate, n) {
  if (loan <= 0) return 0
  if (weeklyRate === 0) return loan / n
  return loan * weeklyRate / (1 - Math.pow(1 + weeklyRate, -n))
}

// 52주 시뮬레이션 — 한 번에 끝까지 돌린다(진행 화면은 이 결과를 주차별로 보여줌)
// export: 검증/테스트에서 순수 계산만 따로 호출하기 위함
export function runLeverage({ multiple, repay, scenario, prepayAt = null, exitAt = null }) {
  const sc = SCENARIOS.find(s => s.key === scenario)
  const px = seriesFrom(INDEX_CODE, sc.start, WEEKS)
  const wr = LOAN_RATE / 52

  const loan0 = EQUITY0 * multiple
  let asset = EQUITY0 + loan0
  let loan = loan0
  let interestPaid = 0
  const payment = annuityPayment(loan0, wr, WEEKS)

  const equityCurve = [EQUITY0]
  const assetCurve = [asset]
  let ended = null // 'margin' | 'exit' | null
  let marginIndex = null

  // 시작하자마자 종료한 경우 — 아래 루프는 i=1부터라 여기서 따로 처리한다
  if (exitAt != null && exitAt <= 0) {
    return {
      sc, px, multiple, repay, loan0, interestPaid: 0, ended: 'exit', endIndex: 0,
      equityCurve, assetCurve, finalEquity: EQUITY0,
      ret: 0, marketRet: 0, mdd: 0,
      totalInterestAnnuity: payment * WEEKS - loan0,
      totalInterestBullet: loan0 * LOAN_RATE,
    }
  }

  for (let i = 1; i < WEEKS; i++) {
    if (ended) { equityCurve.push(equityCurve[i - 1]); assetCurve.push(assetCurve[i - 1]); continue }

    asset *= px[i] / px[i - 1]

    const interest = loan * wr
    interestPaid += interest
    if (repay === 'annuity') {
      const principalPart = Math.max(0, payment - interest)
      loan = Math.max(0, loan - principalPart)
      asset -= payment            // 상환액은 자산 일부를 팔아 충당
    } else {
      asset -= interest           // 만기일시: 이자만 내고 원금은 만기에
    }

    // 사용자가 중도 일부상환을 선택한 주차
    if (prepayAt != null && i === prepayAt && loan > 0) {
      const pay = Math.min(loan, asset * 0.3)
      loan -= pay
      asset -= pay
    }

    let equity = asset - loan
    // 반대매매(마진콜) — 담보비율이 기준 아래로 떨어지면 강제 청산
    if (asset <= 0 || equity <= 0 || equity / asset < MARGIN_CALL) {
      equity = Math.max(0, asset - loan)
      ended = 'margin'
      marginIndex = i
      asset = equity
      loan = 0
    }
    if (!ended && exitAt != null && i === exitAt) {
      equity = asset - loan
      ended = 'exit'
      asset = equity
      loan = 0
    }
    equityCurve.push(Math.max(0, equity))
    assetCurve.push(Math.max(0, asset))
  }

  const finalEquity = Math.max(0, asset - loan)
  // 중도 종료(반대매매·전량매도) 시점 — 비교군과 시장 수익률을 같은 시점으로 맞추기 위해 기록
  const endIndex = ended ? (ended === 'exit' ? exitAt : marginIndex ?? WEEKS - 1) : WEEKS - 1
  return {
    sc, px, multiple, repay, loan0, interestPaid, ended, endIndex,
    equityCurve: equityCurve.slice(0, endIndex + 1),
    assetCurve: assetCurve.slice(0, endIndex + 1),
    finalEquity,
    ret: (finalEquity / EQUITY0 - 1) * 100,
    marketRet: (px[endIndex] / px[0] - 1) * 100,
    mdd: maxDD(equityCurve.slice(0, endIndex + 1)),
    // 상환방식 비교용 총이자 (같은 대출을 다른 방식으로 갚았다면)
    totalInterestAnnuity: payment * WEEKS - loan0,
    totalInterestBullet: loan0 * LOAN_RATE,
  }
}

export default {
  id: 3,
  emoji: '3️⃣',
  title: '신용과 대출, 레버리지의 두 얼굴',
  subtitle: '레버리지·상환방식·신용점수',
  cards: [
    {
      title: '레버리지란 무엇인가',
      paras: [
        "레버리지(Leverage)는 '지렛대'라는 뜻으로, 타인의 자본(대출)을 끌어와 자기자본 수익률(ROE)을 키우는 기법입니다. 핵심은 수익만 커지는 게 아니라 손실도 똑같이 커진다는 점입니다.",
        '내 돈 1,000만 원 + 대출 1,000만 원 = 총 2,000만 원을 투자한 경우를 봅시다.',
      ],
      bullets: [
        '자산 +10% → 2,200만 원, 대출 상환 후 내 돈 1,200만 원 (내 원금 대비 +20%)',
        '자산 -10% → 1,800만 원, 대출 상환 후 내 돈 800만 원 (내 원금 대비 -20%)',
        '같은 ±10% 시장에서 내 계좌는 ±20%로 움직인다',
      ],
      note: '2배 레버리지는 수익률을 2배로 만드는 도구가 아니라, 시장 변동을 2배로 증폭하는 도구입니다. 여기에 대출 이자가 더해집니다 — 시장이 0%였어도 나는 이자만큼 잃습니다.',
    },
    {
      title: '레버리지가 위험한 진짜 이유',
      paras: [
        '0단계 리포트에서 본 것처럼 손실은 회복이 비대칭입니다(-50%를 복구하려면 +100%). 레버리지는 이 비대칭을 더 빨리, 더 깊이 만듭니다.',
        '2배 레버리지로 시장이 -50% 빠지면 내 원금은 -100%, 즉 전액 손실입니다. 그런데 실제로는 그 전에 반대매매(마진콜)가 발생합니다. 담보 가치가 기준 아래로 떨어지면 증권사가 내 의사와 무관하게 강제로 팔아버립니다.',
        '버틸 기회 자체가 사라지는 것이 레버리지의 진짜 위험입니다.',
      ],
      note: '레버리지 투자의 실패는 "방향을 틀려서"가 아니라 "버티지 못해서" 일어나는 경우가 훨씬 많습니다.',
    },
    {
      title: '대출 상환 방식 3가지',
      paras: ['어떤 상환 방식을 고르느냐에 따라 매달 나가는 현금흐름과 총이자가 완전히 달라집니다.'],
      bullets: [
        '원리금균등상환 — 매달 [원금 + 이자] 합계가 동일. 지출 계획을 세우기 쉬움',
        '원금균등상환 — 매달 원금을 똑같이 갚음. 잔액이 빨리 줄어 총이자가 가장 적음. 초기 부담은 큼',
        '만기일시상환 — 매달 이자만 내다가 만기에 원금 상환. 월 부담은 가볍지만 총이자가 가장 많음',
        '총이자 크기: 원금균등상환 < 원리금균등상환 < 만기일시상환',
      ],
      note: '"월 상환액이 적은 대출"과 "이자를 적게 내는 대출"은 대체로 반대입니다.',
    },
    {
      title: '나쁜 부채 (소비형 부채)',
      paras: ['시간이 지나면 가치가 사라지는 소비를 위해 빌리는 고금리 대출입니다. 2030이 특히 피해야 할 3가지가 있습니다.'],
      bullets: [
        '카드론 / 현금서비스 — 절차는 간편하지만 연 10~19% 고금리. 이용 즉시 신용점수가 크게 하락',
        '리볼빙(일부결제이월약정) — 카드값 일부만 내고 이월. 연 15~19% 이자가 붙고 잔액이 눈덩이처럼 불어남. 장기 이용 시 신용점수도 하락',
        '무분별한 고금리 신용대출·마이너스 통장 — 특히 투자 자금 마련 목적의 대출이 위험',
      ],
    },
    {
      title: '좋은 부채 (생산형 부채)',
      paras: ['내 자산 가치를 올리거나, 미래 소득을 높이거나, 거주 불안을 해소하는 저금리 대출입니다.'],
      bullets: [
        '청년전세자금대출(버팀목 등) — 시중 전세대출보다 훨씬 낮은 연 1~2%대 정부 지원 대출',
        '청년 주택드림 대출 — 청년 청약통장 당첨 시 연 2%대 저금리 주택담보대출 연계',
        '학자금 대출 — 연 1.7% 수준 저금리, 취업 후 상환 제도 활용 가능',
      ],
      note: '좋은 부채와 나쁜 부채를 가르는 기준은 금액이 아니라 금리와 "그 돈이 무엇이 되는가"입니다.',
    },
    {
      title: '신용점수, 돈 없이 돈을 버는 무기',
      paras: [
        '과거 1~10등급 체계에서 1~1,000점 점수제(KCB/NICE)로 전환되었습니다. 신용점수가 높으면 대출 한도가 늘고 금리가 낮아집니다. 같은 돈을 빌려도 싸게 빌리는 사람이 됩니다.',
      ],
      bullets: [
        '단 하루, 단돈 1만 원도 연체하지 않기 — 10만 원 이상·5영업일 이상 연체 시 점수 폭락',
        '체크카드 꾸준히 사용 — 월 30만 원 이상·6개월 이상 연속 사용 시 가점',
        '신용카드 한도의 30~50% 이내만 사용 — 한도를 꽉 채우면 자금 사정이 나쁜 것으로 평가',
        '비금융 정보 제출 — 통신비·국민연금·건강보험료 납부 내역 제출 시 즉시 가점',
        '금리가 높고 오래된 대출부터 상환 — 금액이 작은 대출부터가 아닙니다',
      ],
      note: '단순 신용점수 조회는 점수에 아무 영향이 없습니다. 자주 확인해도 괜찮습니다.',
    },
  ],
  quiz: [
    {
      q: '1,000만 원을 동일한 금리·기간으로 빌릴 때, 원금균등상환이 원리금균등상환보다 최종 총이자가 적다.',
      opts: ['O — 맞다', 'X — 그렇지 않다'],
      a: 0, card: 2,
      explain: '원금균등상환은 초기에 원금을 빠르게 갚아 잔액이 급격히 줄고, 잔액에 붙는 이자도 함께 줄어 총이자 부담이 가장 적습니다.',
    },
    {
      q: '신용카드를 전혀 만들지 않고 현금·체크카드만 쓰는 사람은 거래 이력이 완벽하므로 신용점수가 무조건 만점에 가깝다.',
      opts: ['O — 맞다', 'X — 그렇지 않다'],
      a: 1, card: 5,
      explain: '신용평가사는 신용 거래 이력을 근거로 평가합니다. 이력이 아예 없으면 평가할 데이터가 부족해 오히려 중간 수준(700~800점대)에 머뭅니다.',
    },
    {
      q: "'리볼빙(일부결제이월약정)'에 대한 설명으로 올바르지 않은 것은?",
      opts: [
        '결제 금액 중 일부만 납부하고 남은 금액을 다음 달로 이월할 수 있다',
        '당장의 상환 부담이나 연체 위험을 일시적으로 방지할 수 있다',
        '이월 잔액에 연 15~19% 수준의 높은 이자가 적용된다',
        '장기간 지속적으로 이용해도 신용점수에는 아무런 부정적 영향이 없다',
      ],
      a: 3, card: 3,
      explain: '리볼빙 잔액이 누적·지속되면 평가사는 "자금 사정 악화"로 판단해 신용점수를 하향 조정합니다.',
    },
    {
      q: '레버리지 투자에 대한 설명으로 가장 적절한 것은?',
      opts: [
        '대출을 받아 투자하면 자산 가격 하락 시 원금 손실을 완화해 준다',
        '자기자본보다 큰 금액을 투자해 자산 상승 시 자기자본 수익률을 극대화한다',
        '레버리지는 주식에서만 가능하고 부동산·채권에는 적용할 수 없다',
        '대출 금리보다 투자 수익률이 낮아도 레버리지 효과로 무조건 이득이다',
      ],
      a: 1, card: 0,
      explain: '레버리지는 타인 자본을 지렛대 삼아 자기자본 수익률을 극대화합니다. 단, 하락 시 손실률도 똑같이 극대화됩니다.',
    },
    {
      q: '사회초년생이 신용점수를 효과적으로 올리는 방법으로 가장 적합한 행동은?',
      opts: [
        '여러 신용카드를 만들어 한도 가득 현금서비스를 자주 이용한다',
        '연체가 발생하면 금액이 가장 큰 것부터 갚는다',
        '통신비·건강보험료 납부 내역을 신용평가사에 제출해 비금융 가점을 받는다',
        '신용점수를 조회하면 점수가 떨어지므로 일절 조회하지 않는다',
      ],
      a: 2, card: 5,
      explain: '비금융 납부 이력 제출은 즉시 가점 요인입니다. 단순 조회는 점수에 영향이 없고, 상환은 "금리가 높고 오래된 대출"부터가 유리합니다.',
    },
  ],
  miniSim: {
    weekId: 3,
    title: '미니 모의투자 · 레버리지 당겨보기',
    navTitle: '미니 모의투자 · 레버리지 당겨보기',
    navDesc: '대출을 실제로 써서 52주를 버텨보기',
    startLabel: '대출 실행하고 시작',
    brief: {
      headline: '이번엔 대출을 직접 써봅니다',
      lines: [
        '내 돈은 1,000만 원입니다. 여기에 대출을 얼마나 얹을지, 어떤 방식으로 갚을지 직접 정합니다. 대출 금리는 연 6%입니다.',
        '52주 동안 시장이 어디로 갈지는 시작 전에 알 수 없습니다. 상승장일 수도, 하락장일 수도 있습니다. 그게 레버리지를 쓰는 사람이 실제로 마주하는 상황입니다.',
        '담보비율(내 돈 ÷ 총자산)이 25% 아래로 떨어지면 반대매매가 발동해 강제 청산됩니다.',
      ],
      tools: [
        '카드 1 · 레버리지 배수 — 시장 변동이 몇 배로 증폭되는지 직접 확인',
        '카드 2 · 마진콜 — 버틸 기회가 사라지는 순간',
        '카드 3 · 상환 방식 — 원리금균등 vs 만기일시, 총이자가 달라집니다',
      ],
    },
    setup(ctx) {
      let multiple = 1
      let repay = 'annuity'
      const node = h('div', {})
      const paint = () => {
        const loan = EQUITY0 * multiple
        const total = EQUITY0 + loan
        const payment = annuityPayment(loan, LOAN_RATE / 52, WEEKS)
        node.innerHTML = ''
        appendKids(node,
          h('div', { class: 'card' },
            h('b', {}, '① 대출을 얼마나 받을까요?'),
            choiceRow([
              { value: 0, label: '0배', desc: '대출 없음' },
              { value: 0.5, label: '0.5배', desc: '+500만 원' },
              { value: 1, label: '1배', desc: '+1,000만 원' },
              { value: 2, label: '2배', desc: '+2,000만 원' },
            ], multiple, v => { multiple = v; paint() }),
            h('div', { class: 'ms-rate' },
              h('span', {}, '총 투자금'),
              h('b', {}, won(total)),
              h('span', { class: 'small' }, `= 내 돈 ${won(EQUITY0)} + 대출 ${won(loan)}`)),
            multiple >= 2
              ? h('p', { class: 'ms-warn' }, '⚠️ 2배 레버리지에서는 시장이 -25%만 빠져도 내 원금의 절반이 사라집니다.')
              : null,
          ),
          multiple > 0
            ? h('div', { class: 'card' },
                h('b', {}, '② 어떻게 갚을까요?'),
                choiceRow([
                  { value: 'annuity', label: '원리금균등', desc: '매주 원금+이자' },
                  { value: 'bullet', label: '만기일시', desc: '이자만, 원금은 만기' },
                ], repay, v => { repay = v; paint() }),
                h('p', { class: 'small', style: 'margin-top:10px' },
                  repay === 'annuity'
                    ? `매주 ${won(payment)}씩 상환 · 총이자 약 ${won(payment * WEEKS - loan)}`
                    : `매주 이자 ${won(loan * LOAN_RATE / 52)}만 · 총이자 약 ${won(loan * LOAN_RATE)} (만기에 원금 ${won(loan)} 상환)`),
              )
            : null,
        )
      }
      paint()
      return {
        node,
        read: () => ({
          multiple, repay,
          scenario: SCENARIOS[Math.random() < 0.5 ? 0 : 1].key, // 어느 장이 올지는 모른다
        }),
      }
    },
    play(ctx, params, done, box) {
      const full = runLeverage(params)
      let i = 0
      let timer = null
      let prepaid = false
      onLeave(() => { if (timer) clearInterval(timer) })
      const stop = () => { if (timer) { clearInterval(timer); timer = null } }

      function finishNow(reason) {
        stop()
        const res = reason === 'exit'
          ? runLeverage({ ...params, exitAt: i })
          : full
        done(buildResult(res, params, reason))
      }

      function paint() {
        const asset = full.assetCurve[i]
        const equity = full.equityCurve[i]
        const loanNow = Math.max(0, asset - equity)
        const ratio = asset > 0 ? equity / asset * 100 : 0
        const ret = (equity / EQUITY0 - 1) * 100
        const hitMargin = full.ended === 'margin' && i >= full.endIndex

        box.innerHTML = ''
        appendKids(box,
          h('div', { class: 'card' },
            h('div', { class: 'ms-play-head' },
              h('div', {},
                h('div', { class: 'small' }, '내 자기자본'),
                h('b', { class: 'ms-big ' + numClass(ret) }, won(equity)),
                h('span', { class: 'chg ' + numClass(ret) }, pct(ret))),
              h('div', { style: 'text-align:right' },
                h('div', { class: 'small' }, '담보비율'),
                h('b', { class: ratio < 35 ? 'num-down' : '', style: 'font-size:20px' }, ratio.toFixed(0) + '%'))),
            lineChart({
              h: 200,
              series: [
                { data: full.assetCurve.slice(0, Math.max(2, i + 1)), color: '#8b95a1', width: 1.8, dash: '4 3' },
                { data: full.equityCurve.slice(0, Math.max(2, i + 1)), color: '#3182f6', width: 2.5, fill: 'rgba(49,130,246,.07)' },
              ],
              xMax: WEEKS,
              yFmt: v => (v / 10_000_000).toFixed(1) + '천만',
            }),
            h('div', { class: 'ms-legend' },
              h('span', {}, h('i', { style: 'background:#3182f6' }), '내 자기자본'),
              h('span', {}, h('i', { style: 'background:#8b95a1' }), '총 자산(대출 포함)')),
            h('div', { class: 'ms-row3' },
              h('div', {}, h('span', {}, '주차'), h('b', {}, `${i + 1} / ${WEEKS}`)),
              h('div', {}, h('span', {}, '대출 잔액'), h('b', {}, won(loanNow))),
              h('div', {}, h('span', {}, '총 자산'), h('b', {}, won(asset))),
            ),
          ),
          ratio < 35 && ratio > 0 && !hitMargin
            ? h('div', { class: 'card ms-alert' },
                h('b', {}, '⚠️ 담보비율 경고'),
                h('p', {}, `담보비율이 ${ratio.toFixed(0)}%입니다. 25% 아래로 떨어지면 반대매매로 강제 청산됩니다. 지금 일부라도 상환하면 비율이 올라갑니다.`))
            : null,
          hitMargin
            ? h('div', { class: 'card ms-alert danger' },
                h('b', {}, '💥 반대매매 발생'),
                h('p', {}, '담보비율이 25% 아래로 떨어져 증권사가 보유 자산을 강제 청산했습니다. 이후 시장이 어떻게 되든 나는 이미 시장에서 내려왔습니다.'),
                h('button', { class: 'btn', style: 'margin-top:12px', onclick: () => finishNow('margin') }, '결과 보기'))
            : i >= full.endIndex
              ? h('div', { class: 'cta-area' },
                  h('button', { class: 'btn', onclick: () => finishNow('end') }, `${i + 1}주 종료 · 결과 보기`))
              : h('div', { class: 'cta-area' },
                  h('button', {
                    class: 'btn', onclick: () => {
                      if (timer) { stop(); paint(); return }
                      timer = setInterval(() => {
                        i++
                        // 마진콜이 예정된 주차 또는 마지막 주차에 도달하면 정지
                        if (i >= full.endIndex) { i = full.endIndex; stop() }
                        paint()
                      }, 90)
                      paint()
                    },
                  }, timer ? '⏸ 일시정지' : i === 0 ? '▶ 재생 시작' : '▶ 계속 재생'),
                  h('div', { class: 'btn-row', style: 'margin-top:10px' },
                    h('button', {
                      class: 'btn secondary', disabled: prepaid || params.multiple === 0,
                      onclick: () => { prepaid = true; stop(); done(buildResult(runLeverage({ ...params, prepayAt: i }), params, 'prepay')) },
                    }, prepaid ? '상환함' : '지금 일부 상환'),
                    h('button', { class: 'btn secondary', onclick: () => finishNow('exit') }, '전량 매도하고 종료'),
                  )),
        )
      }
      paint()
    },
    review(ctx, res) {
      const { multiple, repay, sc, ret, finalEquity, interestPaid, marketRet, mdd, reason, base } = res
      const lines = []

      const heldWeeks = res.endIndex + 1
      lines.push(
        `배정된 시장은 ${sc.label}이었습니다. ${heldWeeks === WEEKS ? `${WEEKS}주 동안` : `보유한 ${heldWeeks}주 동안`} 지수는 ${pct(marketRet)} 움직였습니다.`)

      if (multiple === 0) {
        lines.push(
          `대출을 쓰지 않았기 때문에 내 수익률은 시장과 거의 같은 ${pct(ret)}였습니다. 레버리지를 쓰지 않는다는 것은 "시장만큼만 먹고 시장만큼만 잃는다"는 뜻입니다.`,
          `참고로 같은 시장에서 2배 레버리지를 썼다면 ${pct(base.lev2.ret)}였습니다. ${base.lev2.ended === 'margin' ? '중간에 반대매매를 맞고 강제 청산됐습니다.' : ''}`)
      } else {
        lines.push(
          `${multiple}배 레버리지를 썼기 때문에 시장의 ${pct(marketRet)}가 내 계좌에서는 ${pct(ret)}로 증폭됐습니다. 여기에 대출 이자로 ${won(interestPaid)}이 나갔습니다.`,
          `대출 없이 같은 시장에 있었다면 ${pct(base.lev0.ret)}였습니다. 차이는 ${(ret - base.lev0.ret).toFixed(1)}%p입니다.`)
        if (reason === 'margin') {
          lines.push(
            '그리고 이번엔 반대매매를 맞았습니다. 중요한 건 이겁니다 — 방향을 틀린 게 아니라 버티지 못한 겁니다. 대출이 없었다면 강제로 팔릴 일도 없었고, 시장이 회복될 때까지 기다릴 수 있었습니다. 카드 2에서 말한 "버틸 기회가 사라진다"가 방금 일어난 일입니다.')
        } else if (ret > 0 && sc.key === 'bull') {
          lines.push(
            '이번엔 상승장이 배정돼 레버리지가 도움이 됐습니다. 하지만 시작 전에 상승장인지 알 수 있었나요? 알 수 없었습니다. 같은 선택을 하락장에서 했다면 결과는 정반대였을 겁니다. 레버리지의 성패는 실력이 아니라 배정된 시장에 크게 좌우됩니다.')
        }
        lines.push(
          `상환 방식도 결과를 바꿉니다. ${repay === 'annuity' ? '원리금균등' : '만기일시'}을 골라 실제로 낸 이자는 ${won(interestPaid)}이었습니다. 만기까지 갔다면 총이자는 원리금균등 약 ${won(res.totalInterestAnnuity)}, 만기일시 약 ${won(res.totalInterestBullet)}입니다 — 만기일시는 매달 부담이 가볍지만 총이자가 가장 많습니다(카드 3).`)
      }

      return h('div', {},
        h('div', { class: 'report-hero' },
          h('div', { class: 'rh-label' },
            `${sc.label} · 레버리지 ${multiple}배${reason === 'margin' ? ' · 반대매매' : ''}`),
          h('div', { class: 'rh-num ' + numClass(ret) }, pct(ret)),
          h('p', { class: 'desc', style: 'margin-top:8px' }, `최종 자기자본 ${won(finalEquity)}`),
        ),
        reason === 'margin'
          ? h('div', { class: 'card ms-alert danger' },
              h('b', {}, '💥 반대매매로 강제 청산되었습니다'),
              h('p', {}, '담보비율이 25% 아래로 떨어져, 내 의사와 무관하게 자산이 정리됐습니다.'))
          : null,
        metricGrid(res.metrics),
        h('div', { class: 'card' },
          h('b', {}, '레버리지를 안 썼다면?'),
          compareChart(
            res.equityCurve.map(v => v / EQUITY0),
            base.lev0.equityCurve.map(v => v / EQUITY0),
            [`내 선택 (${multiple}배)`, '레버리지 0배']),
        ),
        coachCard('🧭 이번 실습이 말하는 것', lines),
      )
    },
  },
}

// 결과 객체 조립 — 비교군(0배·2배)을 같은 시장에서 함께 돌린다
function buildResult(res, params, reason) {
  // 비교군은 내가 종료한 시점과 같은 기간으로 맞춰 돌린다(중도 종료 시 기준이 어긋나지 않도록)
  const upTo = res.endIndex
  const base = {
    lev0: runLeverage({ ...params, multiple: 0, exitAt: upTo }),
    lev2: runLeverage({ ...params, multiple: 2, exitAt: upTo }),
  }
  return {
    ...res, reason, base,
    headline: `${res.sc.label} · 레버리지 ${params.multiple}배`,
    metrics: [
      { k: '내 수익률', v: pct(res.ret), cls: numClass(res.ret) },
      { k: '최종 자기자본', v: won(res.finalEquity) },
      { k: '낸 이자', v: won(res.interestPaid) },
      { k: '내 계좌 MDD', v: '-' + res.mdd.toFixed(1) + '%', cls: 'num-down' },
    ],
  }
}
