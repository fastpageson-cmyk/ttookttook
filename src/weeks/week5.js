// 5주차 · 기업 분석과 거시경제 지표 읽기
// 원고 원본: docs/콘텐츠/5주차_기업분석과_거시지표_읽기.md (수정 시 함께 반영)
import {
  h, fmt, won, pct, numClass, metricGrid, coachCard, compareChart, lineChart,
} from '../mini-sim.js'
import FUND from '../data/fundamentals.json'

const SEED = 10_000_000
const FEE = 0.002
const LEN = Math.min(52, Math.min(...Object.values(FUND.weeklyPrices).map(a => a.length)))

// 종목·지표·공시가 전부 실제 데이터다.
//  - 재무지표: DART 오픈API 사업보고서(2024) 기준 → PER=시총/당기순이익, PBR=시총/자본총계
//  - 업종 평균 PER: 같은 업종 비교군 PER의 실제 중앙값
//  - 주가: 지표를 알 수 있게 된 시점(2025-04) 이후 52주 실제 주간 종가
// 생성 스크립트: docs/콘텐츠/mock-data/fetch_dart_fundamentals.py (API 키는 .env.local, 커밋 금지)
const UNIVERSE = FUND.universe

// 공시일(YYYYMMDD)이 투자 시작일 기준 몇 주차인지
function weekOf(yyyymmdd) {
  const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6)}`)
  const s0 = new Date(FUND.meta.valuationDate)
  return Math.max(2, Math.min(LEN - 4, Math.round((d - s0) / (7 * 864e5)) + 1))
}
const REPORT_WEEK = weekOf(
  (UNIVERSE.find(u => u.disclosure) || {}).disclosure?.date || '20250814')

const 조 = n => (n / 1e12).toFixed(n >= 1e13 ? 0 : 1) + '조'
const yoy = v => (v == null ? '—' : (v > 0 ? '+' : '') + v.toFixed(1) + '%')

// 소음은 특정 실제 기업을 지목하지 않는다(허위 정보가 되므로).
// 신호는 실제 DART 공시와 실제 실적 숫자만 쓴다.
const EVENTS = [
  {
    week: 10, kind: 'noise', icon: '💬', source: '카톡 리딩방',
    text: '"내부 정보 입수. 다음 주 발표로 급등 확정. 지금이 마지막 기회입니다."',
    q: '이 정보를 근거로 매매하시겠습니까?',
    explain: '출처가 불분명한 리딩방 찌라시는 전형적인 소음입니다. 진짜 내부 정보라면 그걸로 거래하는 건 불법이고, 대부분은 물량을 떠넘기기 위한 작전입니다.',
  },
  {
    week: REPORT_WEEK, kind: 'signal', good: null, icon: '📄', source: 'DART 전자공시',
    text: '보유 종목의 반기보고서가 공시되었습니다. 상반기 누적 실적입니다.',
    q: '실적을 보고 어떻게 하시겠습니까?',
    explain: 'DART 정기 공시는 검증된 신호입니다. 다만 "매출이 늘었다"만 보면 안 됩니다 — 매출이 늘어도 영업이익이 줄었다면 본업 수익성이 나빠지고 있다는 뜻입니다(카드 3).',
    showFinancials: true,
  },
  {
    week: 34, kind: 'noise', icon: '📺', source: '유튜브',
    text: '"지금 안 사면 평생 후회하는 종목 TOP3 — 조회수 82만"',
    q: '이 영상을 보고 포트폴리오를 바꾸시겠습니까?',
    explain: '조회수를 노린 자극적인 콘텐츠는 소음입니다. 썸네일의 확신은 데이터가 아니라 클릭을 위한 장치입니다.',
  },
  {
    week: 45, kind: 'signal', good: false, icon: '📄', source: 'DART 전자공시',
    text: '보유 종목 중 상반기 영업이익이 가장 많이 줄어든 곳이 있습니다.',
    q: '이 종목을 어떻게 하시겠습니까?',
    explain: '영업이익 감소는 매도를 "검토"할 근거이지 자동 매도 신호는 아닙니다. 일시적 요인인지 구조적 악화인지는 사업보고서 본문을 봐야 알 수 있습니다.',
    worstOnly: true,
  },
]

const _px = {}
function priceSeries(code) {
  if (!_px[code]) {
    const raw = FUND.weeklyPrices[code].slice(0, LEN)
    _px[code] = raw.map(v => v / raw[0])
  }
  return _px[code]
}

export default {
  id: 5,
  emoji: '5️⃣',
  title: '기업 분석과 거시경제 지표 읽기',
  subtitle: 'PER·PBR·영업이익률·DART',
  cards: [
    {
      title: 'PER — 이익 대비 얼마나 비싼가',
      paras: [
        'PER(주가수익비율) = 현재 주가 ÷ 주당순이익(EPS)',
        '기업이 벌어들이는 이익에 비해 주가가 비싼지 싼지를 나타냅니다. PER 10배는 현재 주가 수준에서 기업이 번 돈을 10년 모아야 현재 기업 가치에 도달한다는 뜻입니다.',
      ],
      bullets: [
        '동일 업종 평균보다 낮으면 저평가, 높으면 고평가로 판단',
        '단, 미래 성장성이 높은 기술주는 PER이 높게 형성되기도 함',
      ],
      note: 'PER은 같은 업종끼리 비교할 때만 의미가 있습니다. 반도체와 은행의 PER을 비교하는 건 무의미합니다.',
    },
    {
      title: 'PBR — 자산 대비 얼마나 비싼가',
      paras: ['PBR(주가순자산비율) = 현재 주가 ÷ 주당순자산(BPS). 기업의 청산 가치 대비 주가 수준을 봅니다.'],
      bullets: [
        'PBR = 1.0 — 지금 회사를 정리해 주주에게 나눠줄 순자산과 주가가 정확히 같음',
        'PBR < 1.0 — 보유 순자산보다 주가가 낮게 거래되는 상태. 뚜렷한 재무적 하자가 없다면 안전마진을 확보한 것으로 해석',
      ],
    },
    {
      title: '영업이익률 — 본업으로 얼마나 남기나',
      paras: [
        '영업이익률(%) = (영업이익 ÷ 매출액) × 100',
        '매출 중 순수하게 본업으로 남긴 비율입니다. 기업의 본업 경쟁력과 가격 결정력을 보여줍니다. 영업이익률이 높을수록 원가 절감 능력이 뛰어나고, 원자재 가격이 올라도 버틸 여력이 있습니다.',
      ],
      note: '세 지표를 함께 봅니다. 싸고(PER·PBR) 본업을 잘하는(영업이익률) 기업이 목표입니다. 셋 중 하나만 보면 함정에 빠집니다 — PER이 낮은 이유가 이익이 곧 사라질 예정이라서일 수도 있습니다.',
    },
    {
      title: '금리 — 돈의 가격',
      paras: ['1주차에서 배운 내용이 기업 분석과 만나는 지점입니다.'],
      bullets: [
        '금리 인상 — 기업은 이자 부담으로 투자를 줄이고, 투자자는 위험자산 대신 안전자산으로 이동 → 주식에 하락 압력',
        '금리 인하 — 이자 부담 감소로 기업 투자 증가, 자금이 위험자산으로 유입 → 주식에 상승 압력',
      ],
      note: '실습 2의 결론을 기억하세요. "금리 인하 = 매수 신호"로 기계적으로 외우면 안 됩니다. 경기 침체가 심각해서 내리는 금리라면 주가는 더 떨어질 수도 있습니다.',
    },
    {
      title: '환율과 물가',
      paras: [
        '원/달러 환율이 오르면(원화 약세) 수출 기업은 해외 가격 경쟁력이 올라 실적에 호재가 될 수 있습니다. 단, 외국인 투자자는 환차손이 생기므로 한국 주식을 팔고 탈출하는 요인이 됩니다. 양방향으로 작용합니다.',
        '인플레이션 국면에서는 원자재 가격 상승을 제품 가격에 전가할 수 있는 기업만 실적을 방어합니다. 카드 3의 영업이익률이 바로 그 능력을 보여주는 지표입니다.',
      ],
    },
    {
      title: '소음과 신호를 구별하기',
      bullets: [
        '소음(Noise) — 자극적인 유튜브 썸네일, 카톡 리딩방 찌라시, 토론방의 근거 없는 주가 예측',
        '신호(Signal) — DART(전자공시시스템)의 분기·반기·사업보고서, 실적 발표, 대주주 지분 변동 공시',
      ],
      paras: [
        'DART 핵심 체크리스트는 두 가지입니다. 첫째, 실적 공시에서 매출액·영업이익이 전년 동기 대비(YoY) 또는 전 분기 대비(QoQ) 증가했는가. 둘째, 유상증자 공시의 목적이 무엇인가 — 시설 투자 목적이면 장기 호재일 수 있으나, 채무 상환 목적이면 악재로 작용합니다.',
      ],
      note: '0단계에서 아무 근거 없이 매수 버튼을 눌렀다면, 그게 바로 소음에 반응한 것입니다.',
    },
  ],
  quiz: [
    {
      q: 'PBR이 1.0 미만이라는 것은 현재 주가가 기업 청산 시 주주에게 돌려줄 수 있는 순자산 가치보다 낮게 거래되고 있음을 의미한다.',
      opts: ['O — 맞다', 'X — 그렇지 않다'],
      a: 0, card: 1,
      explain: 'PBR < 1.0은 주가가 장부상 순자산 가치에도 미치지 못하는 저평가 상태를 나타냅니다.',
    },
    {
      q: '기준금리를 급격히 인상하면 기업의 이자 부담이 줄고 유동성이 주식 시장으로 유입되어 주가 상승에 유리한 환경이 된다.',
      opts: ['O — 맞다', 'X — 그렇지 않다'],
      a: 1, card: 3,
      explain: '금리 인상은 이자 부담을 늘리고 자금을 예금·국채로 흡수하므로, 주식 같은 위험자산에는 하락 압력으로 작용합니다.',
    },
    {
      q: '현재 주가가 50,000원이고 주당순이익(EPS)이 5,000원인 기업 A의 PER은?',
      opts: ['5배', '10배', '15배', '20배'],
      a: 1, card: 0,
      explain: 'PER = 주가 ÷ EPS = 50,000 ÷ 5,000 = 10배입니다.',
    },
    {
      q: '매출액 대비 본업으로 얼마의 이익을 남겼는지를 나타내며, 제품 경쟁력과 원가 관리 능력을 평가하는 지표는?',
      opts: ['부채비율', '영업이익률', '유동비율', '배당성향'],
      a: 1, card: 2,
      explain: '영업이익률은 본업 장사로 남긴 이익의 비율로, 순수한 본업 경쟁력을 보여줍니다.',
    },
    {
      q: "'소음'에 휘둘리지 않고 '진짜 신호'를 기반으로 판단하기 위해 참조해야 할 정보원으로 가장 적절한 것은?",
      opts: [
        '출처가 불분명한 주식 리딩방의 추천 종목 찌라시',
        '조회수를 노린 자극적인 금융 유튜브의 주가 폭등 예측',
        '금융감독원 전자공시시스템(DART)에 등록된 정기 사업보고서 및 공시 자료',
        '온라인 주식 커뮤니티의 익명 선동글',
      ],
      a: 2, card: 5,
      explain: 'DART의 사업보고서·재무제표·실적 발표 등 검증된 데이터가 진짜 신호입니다.',
    },
  ],
  miniSim: {
    weekId: 5,
    title: '미니 모의투자 · 숫자를 보고 고르기',
    navTitle: '미니 모의투자 · 숫자를 보고 고르기',
    navDesc: 'PER·PBR을 보고 3종목 고르기',
    startLabel: '이 3종목으로 시작',
    brief: {
      headline: '이번엔 이름이 아니라 숫자를 보고 고릅니다',
      lines: [
        '0단계에서는 종목 이름과 가격만 보고 골랐습니다. 이번엔 PER·PBR·영업이익률·업종 평균 PER이 함께 표시됩니다.',
        '1,000만 원으로 3종목을 골라 균등 매수하고 52주를 갑니다. 중간에 뉴스가 네 번 뜨는데, 그게 소음인지 신호인지 직접 판단해야 합니다.',
        `지표·공시·주가가 모두 실제 데이터입니다. 재무지표는 ${FUND.meta.fiscalYear}년 사업보고서(DART) 기준이고, 그 지표를 알 수 있게 된 ${FUND.meta.valuationDate} 이후 실제 ${LEN}주를 그대로 돌립니다. 특정 종목 추천이 아닙니다.`,
      ],
      tools: [
        '카드 1~3 · PER·PBR·영업이익률 — 종목 카드에서 직접 비교',
        '카드 6 · 소음과 신호 — DART 공시와 리딩방 찌라시를 구별하기',
        '수수료 0.2% — 소음에 반응할 때마다 실제로 빠져나갑니다',
      ],
    },
    setup(ctx) {
      let picked = []
      const node = h('div', {})
      const paint = () => {
        node.innerHTML = ''
        node.append(
          h('div', { class: 'card' },
            h('b', {}, `종목 3개를 고르세요 (${picked.length}/3)`),
            h('p', { class: 'small', style: 'margin:6px 0 12px' },
              `${FUND.meta.fiscalYear}년 사업보고서 기준 실제 지표입니다(출처 DART). PER은 같은 업종 평균과 비교해야 의미가 있습니다.`),
          ),
          h('div', { class: 'ms-stocks' },
            UNIVERSE.map(s => {
              const on = picked.includes(s.name)
              const cheap = s.per != null && s.per < s.sectorPer
              return h('button', {
                class: 'ms-stock' + (on ? ' on' : ''),
                onclick: () => {
                  if (on) picked = picked.filter(c => c !== s.name)
                  else if (picked.length < 3) picked.push(s.name)
                  paint()
                },
              },
                h('div', { class: 'ms-st-head' },
                  h('b', {}, s.name),
                  h('span', { class: 'ms-st-sector' }, s.sector),
                  on ? h('span', { class: 'badge blue' }, '선택') : null),
                h('div', { class: 'ms-st-figs' },
                  h('div', {}, h('span', {}, 'PER'),
                    h('b', { class: s.per == null ? 'num-down' : cheap ? 'num-flat' : '' },
                      s.per == null ? '적자' : s.per.toFixed(1) + '배')),
                  h('div', {}, h('span', {}, '업종 평균'), h('b', {}, s.sectorPer.toFixed(1) + '배')),
                  h('div', {}, h('span', {}, 'PBR'), h('b', {}, s.pbr.toFixed(1) + '배')),
                  h('div', {}, h('span', {}, '영업이익률'),
                    h('b', { class: s.opm < 0 ? 'num-down' : s.opm >= 10 ? 'num-flat' : '' }, s.opm.toFixed(1) + '%')),
                ))
            })),
        )
      }
      paint()
      return { node, read: () => ({ picked: [...picked] }) }
    },
    play(ctx, params, done, box) {
      const { picked } = params
      const px = Object.fromEntries(picked.map(c => [c, priceSeries(c)]))
      // 균등 매수
      const per = SEED / picked.length
      const holding = Object.fromEntries(picked.map(c => [c, { units: per / px[c][0], sold: false }]))
      let cash = 0
      let fees = 0
      let noiseReactions = 0
      let signalHits = 0
      let ei = 0
      const log = []

      function valueAt(i) {
        let v = cash
        for (const c of picked) if (!holding[c].sold) v += holding[c].units * px[c][i]
        return v
      }

      function sell(code, i) {
        const hd = holding[code]
        if (hd.sold) return
        const gross = hd.units * px[code][i]
        const fee = gross * FEE
        fees += fee
        cash += gross - fee
        hd.sold = true
      }

      // 보유 종목의 실제 반기 실적 (DART)
      const heldInfo = picked.map(n => UNIVERSE.find(u => u.name === n))
      const improving = heldInfo.filter(u => (u.disclosure?.opYoY ?? 0) > 0).length
      const reportIsGood = improving * 2 >= picked.length      // 과반이 개선 → 계속 보유가 합리적
      const worst = heldInfo.slice().sort(
        (a, b) => (a.disclosure?.opYoY ?? 0) - (b.disclosure?.opYoY ?? 0))[0]

      function targetOf(ev) { return ev.worstOnly ? worst.name : null }
      function goodOf(ev) { return ev.showFinancials ? reportIsGood : ev.good }

      function act(ev, didTrade) {
        if (ev.kind === 'noise' && didTrade) noiseReactions++
        if (ev.kind === 'signal') {
          const good = goodOf(ev)
          if (good != null && (good ? !didTrade : didTrade)) signalHits++
        }
        if (didTrade) {
          const t = targetOf(ev)
          if (t && picked.includes(t)) sell(t, ev.week)
          else for (const c of picked) sell(c, ev.week)   // 특정 종목이 없으면 전량 정리
        }
        log.push({ ev, didTrade, target: targetOf(ev) })
        ei++
        paint()
      }

      function paint() {
        const ev = EVENTS[ei]
        box.innerHTML = ''
        if (!ev) {
          const finalValue = valueAt(LEN - 1)
          done(buildResult({ picked, px, finalValue, fees, noiseReactions, signalHits,
            signalTotal: EVENTS.filter(e => e.kind === 'signal').length, log, holding, cash }))
          return
        }
        const i = ev.week
        const v = valueAt(i)
        const ret = (v / SEED - 1) * 100
        const tgt = targetOf(ev)
        const owned = tgt && picked.includes(tgt) && !holding[tgt].sold
        box.append(
          h('div', { class: 'card' },
            h('div', { class: 'ms-play-head' },
              h('div', {},
                h('div', { class: 'small' }, '내 자산'),
                h('b', { class: 'ms-big ' + numClass(ret) }, won(v)),
                h('span', { class: 'chg ' + numClass(ret) }, pct(ret))),
              h('div', { style: 'text-align:right' },
                h('div', { class: 'small' }, '경과'),
                h('b', { style: 'font-size:20px' }, `${i}주`))),
            lineChart({
              h: 170,
              series: [{ data: Array.from({ length: i + 1 }, (_, k) => valueAt(k) / SEED), color: '#3182f6', width: 2.5, fill: 'rgba(49,130,246,.07)' }],
              xMax: LEN,
              yFmt: x => (x * 100 - 100).toFixed(0) + '%',
            }),
          ),
          h('div', { class: 'card ms-news' },
            h('div', { class: 'ms-news-src' }, `${ev.icon} ${ev.source}`),
            h('p', { class: 'ms-news-body' }, ev.text),
            ev.showFinancials
              ? h('div', { class: 'ms-fin' },
                  heldInfo.map(u => h('div', { class: 'ms-fin-row' },
                    h('b', {}, u.name),
                    h('span', {}, `매출 ${조(u.disclosure.revenue)} `,
                      h('i', { class: numClass(u.disclosure.revenueYoY ?? 0) }, yoy(u.disclosure.revenueYoY))),
                    h('span', {}, `영업이익 ${조(u.disclosure.op)} `,
                      h('i', { class: numClass(u.disclosure.opYoY ?? 0) }, yoy(u.disclosure.opYoY))),
                  )))
              : null,
            ev.worstOnly
              ? h('p', { class: 'small' },
                  `※ ${worst.name} — 상반기 영업이익 ${yoy(worst.disclosure?.opYoY)} (전년 동기 대비)`)
              : null,
            h('b', { style: 'display:block;margin-top:14px' }, ev.q),
            h('div', { class: 'btn-row', style: 'margin-top:12px' },
              h('button', { class: 'btn secondary', onclick: () => act(ev, false) }, '무시하고 유지'),
              h('button', {
                class: 'btn secondary', onclick: () => act(ev, true),
              }, owned ? `${tgt} 매도` : '포트폴리오 정리'),
            ),
          ),
          h('p', { class: 'disclaimer' }, `뉴스 ${ei + 1} / ${EVENTS.length} · 매매에는 수수료 0.2%가 붙습니다`),
        )
        window.scrollTo(0, 0)
      }
      paint()
    },
    review(ctx, res) {
      const { picked, finalValue, fees, noiseReactions, signalHits, signalTotal,
              ret, avgPer, valuePort, valuePick, log, benchRet } = res
      const info = n => UNIVERSE.find(u => u.name === n)
      const cheap = picked.filter(n => info(n).per && info(n).sectorPer && info(n).per < info(n).sectorPer)
      const lines = [
        `고른 3종목의 매수 시점 평균 PER은 ${avgPer == null ? '계산 불가(적자 종목 포함)' : avgPer.toFixed(1) + '배'}였고, ${LEN}주 뒤 결과는 ${pct(ret)}입니다. 이 8종목에 똑같이 나눠 담았다면 ${pct(benchRet)}였습니다 — 종목 선택이 결과를 얼마나 갈랐는지 보여주는 기준선입니다.`,
        `이 목록에서 저PER(업종 평균 미만)이면서 영업이익률이 높았던 조합 ${valuePick.join('·')}만 골랐다면 ${pct(valuePort)}였습니다.`,
      ]
      // 실제 데이터가 만들어낸 교훈 — 지어낸 사례가 아니라 이 구간의 실제 결과를 짚는다
      const best = UNIVERSE.slice().sort((a, b) => {
        const r = n => priceSeries(n.name)[LEN - 1]
        return r(b) - r(a)
      })[0]
      lines.push(
        `이 구간 1위는 ${best.name}였습니다 — PER ${best.per}배(업종 평균 ${best.sectorPer}배)에 영업이익률 ${best.opm}%로, "싸면서 본업을 잘하는" 조건을 둘 다 만족했습니다. 카드 3이 말한 조합이 실제로 통한 사례입니다.`)
      const naver = UNIVERSE.find(u => u.name === 'NAVER')
      if (naver) {
        lines.push(
          `다만 지표가 정답표는 아닙니다. NAVER는 PER ${naver.per}배로 업종 평균(${naver.sectorPer}배)보다 훨씬 쌌고 영업이익률도 ${naver.opm}%로 낮지 않았지만, 이 구간 성과는 8종목 중 가장 낮았습니다. 싸 보인다고 반드시 오르지는 않습니다.`)
      }
      if (picked.includes('카카오')) {
        lines.push(
          '카카오는 당기순손실이라 PER 자체가 계산되지 않았습니다. PER이 "없는" 종목은 싼 게 아니라 이익이 없는 것입니다 — 이럴 때는 PBR과 영업이익률로 봐야 합니다(카드 2·3).')
      }
      lines.push(
        noiseReactions === 0
          ? '소음에 반응해 매매한 횟수는 0회입니다. 리딩방 찌라시와 유튜브 썸네일을 둘 다 무시하셨습니다 — 그게 카드 6이 말하는 태도입니다.'
          : `소음에 반응해 매매한 횟수는 ${noiseReactions}회입니다. 그때마다 수수료가 나갔고(총 ${won(fees)}), 근거는 리딩방과 유튜브 썸네일이었습니다. 0단계에서 아무 근거 없이 버튼을 눌렀던 것과 구조가 같습니다.`)
      lines.push(
        `DART 공시(진짜 신호) ${signalTotal}건 중 ${signalHits}건을 적절히 처리했습니다. 실적이 개선되는 종목을 특별한 이유 없이 파는 것도, 영업이익이 크게 꺾인 종목을 그냥 두는 것도 근거 없는 선택입니다.`)

      return h('div', {},
        h('div', { class: 'report-hero' },
          h('div', { class: 'rh-label' }, `${picked.join(' · ')} · ${LEN}주`),
          h('div', { class: 'rh-num ' + numClass(ret) }, pct(ret)),
          h('p', { class: 'desc', style: 'margin-top:8px' }, `최종 자산 ${won(finalValue)}`),
        ),
        metricGrid(res.metrics),
        h('div', { class: 'card' },
          h('b', {}, '내 선택 vs 저PER·고영업이익률 조합'),
          compareChart(res.myCurve, res.valueCurve, ['내 3종목', valuePick.join('·')]),
        ),
        h('div', { class: 'card' },
          h('b', {}, '뉴스에 어떻게 반응했나'),
          h('div', { class: 'ms-eventlog' },
            log.map(({ ev, didTrade }) => h('div', { class: 'ms-ev' },
              h('div', { class: 'ms-ev-top' },
                h('span', { class: 'badge ' + (ev.kind === 'noise' ? 'gray' : 'blue') },
                  ev.kind === 'noise' ? '소음' : '신호'),
                h('span', { class: 'ms-ev-src' }, `${ev.icon} ${ev.source}`),
                h('span', { class: 'badge ' + (didTrade ? 'green' : 'gray') }, didTrade ? '매매함' : '유지')),
              h('p', { class: 'small' }, ev.explain),
            ))),
        ),
        h('p', { class: 'disclaimer' }, FUND.meta.note),
        coachCard('🧭 이번 실습이 말하는 것', lines),
      )
    },
  },
}

function buildResult({ picked, px, finalValue, fees, noiseReactions, signalHits, signalTotal, log, holding, cash }) {
  // 비교군: 업종 평균보다 PER이 낮으면서 영업이익률이 높은 상위 3종목 — 실제 지표로 뽑는다
  const VALUE_PICK = UNIVERSE
    .filter(u => u.per && u.sectorPer && u.per < u.sectorPer)
    .sort((a, b) => b.opm - a.opm)
    .slice(0, 3)
    .map(u => u.name)
  const valueCurve = Array.from({ length: LEN }, (_, i) =>
    VALUE_PICK.reduce((a, n) => a + priceSeries(n)[i] / VALUE_PICK.length, 0))
  const myCurve = Array.from({ length: LEN }, (_, i) => {
    let v = cash
    for (const c of picked) if (!holding[c].sold) v += holding[c].units * px[c][i]
    return v / SEED
  })
  const pers = picked.map(c => UNIVERSE.find(u => u.name === c).per)
  const avgPer = pers.includes(null) ? null : pers.reduce((a, b) => a + b, 0) / pers.length
  const ret = (finalValue / SEED - 1) * 100
  // 기준선: 이 8종목 동일가중. (KOSPI가 아니다 — 라벨을 '지수'라고 쓰지 말 것)
  const benchCurve = Array.from({ length: LEN }, (_, i) =>
    UNIVERSE.reduce((a, u) => a + priceSeries(u.name)[i] / UNIVERSE.length, 0))
  return {
    headline: `${picked.join('·')} · ${pct(ret)}`,
    picked, finalValue, fees, noiseReactions, signalHits, signalTotal, log, ret, avgPer,
    myCurve, valueCurve, valuePick: VALUE_PICK,
    valuePort: (valueCurve[LEN - 1] - 1) * 100,
    benchRet: (benchCurve[LEN - 1] - 1) * 100,
    metrics: [
      { k: `${LEN}주 수익률`, v: pct(ret), cls: numClass(ret) },
      { k: '소음 반응', v: noiseReactions + '회' },
      { k: '신호 대응', v: `${signalHits} / ${signalTotal}` },
      { k: '수수료', v: won(fees) },
    ],
  }
}
