// 5주차 · 기업 분석과 거시경제 지표 읽기
// 원고 원본: docs/콘텐츠/5주차_기업분석과_거시지표_읽기.md (수정 시 함께 반영)
import {
  h, fmt, won, pct, numClass, seriesFrom, metricGrid, coachCard, compareChart, lineChart,
} from '../mini-sim.js'

const SEED = 10_000_000
const START = 421 // 저금리 유지기 52주 창
const LEN = 52
const FEE = 0.002

// 목업 재무지표 — 실제 기업 데이터가 아니라 교육용 합성값.
// C케미칼은 의도적으로 '저PER 함정'(싸 보이지만 본업 수익성이 무너진 기업)으로 배치했다.
const UNIVERSE = [
  { code: 'E에너지', sector: '정유·에너지', per: 7.2, pbr: 0.8, opm: 12.4, sectorPer: 9.0 },
  { code: 'G헬스케어', sector: '헬스케어', per: 11.5, pbr: 1.2, opm: 18.2, sectorPer: 14.0 },
  { code: 'F리테일', sector: '유통', per: 9.8, pbr: 0.9, opm: 4.1, sectorPer: 11.0 },
  { code: 'C케미칼', sector: '화학', per: 5.1, pbr: 0.5, opm: 2.0, sectorPer: 9.0 },
  { code: 'A전자', sector: '전자·IT', per: 19.4, pbr: 1.6, opm: 8.3, sectorPer: 13.0 },
  { code: 'H반도체', sector: '반도체', per: 27.1, pbr: 2.3, opm: 11.0, sectorPer: 13.0 },
  { code: 'D플랫폼', sector: '인터넷', per: 38.0, pbr: 4.1, opm: 9.4, sectorPer: 25.0 },
  { code: 'B바이오', sector: '바이오', per: null, pbr: 6.8, opm: -15.3, sectorPer: 20.0 },
]

const EVENTS = [
  {
    week: 10, kind: 'noise', target: 'B바이오',
    icon: '💬', source: '카톡 리딩방',
    text: '"B바이오 내부 정보 입수. 다음 주 임상 발표로 급등 확정. 지금이 마지막 기회."',
    q: '이 정보를 근거로 매매하시겠습니까?',
    explain: '출처가 불분명한 리딩방 찌라시는 전형적인 소음입니다. 애초에 진짜 내부 정보라면 그건 불법이고, 대부분은 물량을 떠넘기기 위한 작전입니다.',
  },
  {
    week: 22, kind: 'signal', target: 'E에너지', good: true,
    icon: '📄', source: 'DART 전자공시',
    text: 'E에너지 분기 영업(잠정)실적 공시 — 매출 전년 동기 대비 +18%, 영업이익 +42%',
    q: '보유 중이라면 어떻게 하시겠습니까?',
    explain: 'DART 정기 공시의 실적 개선은 검증된 신호입니다. 본업이 좋아지고 있다는 뜻이므로, 특별한 이유 없이 팔 근거는 아닙니다.',
  },
  {
    week: 34, kind: 'noise', target: null,
    icon: '📺', source: '유튜브',
    text: '"지금 안 사면 평생 후회하는 종목 TOP3 — 조회수 82만"',
    q: '이 영상을 보고 포트폴리오를 바꾸시겠습니까?',
    explain: '조회수를 노린 자극적인 콘텐츠는 소음입니다. 썸네일의 확신은 데이터가 아니라 클릭을 위한 장치입니다.',
  },
  {
    week: 44, kind: 'signal', target: 'C케미칼', good: false,
    icon: '📄', source: 'DART 전자공시',
    text: 'C케미칼 유상증자 결정 공시 — 자금 조달 목적: 채무 상환',
    q: '보유 중이라면 어떻게 하시겠습니까?',
    explain: '같은 유상증자라도 목적이 다릅니다. 시설 투자 목적이면 장기 호재일 수 있지만, 채무 상환 목적은 회사가 빚을 갚을 돈이 없다는 신호입니다. 매도를 검토할 근거가 되는 진짜 신호입니다.',
  },
]

function priceSeries(code) { return seriesFrom(code, START, LEN) }

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
      headline: '0단계와 같은 종목, 이번엔 숫자가 보입니다',
      lines: [
        '0단계에서는 종목 이름과 가격만 보고 골랐습니다. 이번엔 PER·PBR·영업이익률·업종 평균 PER이 함께 표시됩니다.',
        '1,000만 원으로 3종목을 골라 균등 매수하고 52주를 갑니다. 중간에 뉴스가 네 번 뜨는데, 그게 소음인지 신호인지 직접 판단해야 합니다.',
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
              '지표는 학습용 목업입니다. PER은 같은 업종 평균과 비교해야 의미가 있습니다.'),
          ),
          h('div', { class: 'ms-stocks' },
            UNIVERSE.map(s => {
              const on = picked.includes(s.code)
              const cheap = s.per != null && s.per < s.sectorPer
              return h('button', {
                class: 'ms-stock' + (on ? ' on' : ''),
                onclick: () => {
                  if (on) picked = picked.filter(c => c !== s.code)
                  else if (picked.length < 3) picked.push(s.code)
                  paint()
                },
              },
                h('div', { class: 'ms-st-head' },
                  h('b', {}, s.code),
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

      function act(ev, didTrade) {
        if (ev.kind === 'noise' && didTrade) noiseReactions++
        if (ev.kind === 'signal') {
          const right = ev.good ? !didTrade : didTrade
          if (right) signalHits++
        }
        if (didTrade) {
          if (ev.target && picked.includes(ev.target)) sell(ev.target, ev.week)
          else { // 특정 종목이 없는 소음이면 전량 정리
            for (const c of picked) sell(c, ev.week)
          }
        }
        log.push({ ev, didTrade })
        ei++
        paint()
      }

      function paint() {
        const ev = EVENTS[ei]
        box.innerHTML = ''
        if (!ev) {
          const finalValue = valueAt(LEN - 1)
          done(buildResult({ picked, px, finalValue, fees, noiseReactions, signalHits, log, holding, cash }))
          return
        }
        const i = ev.week
        const v = valueAt(i)
        const ret = (v / SEED - 1) * 100
        const owned = ev.target && picked.includes(ev.target) && !holding[ev.target].sold
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
            ev.target
              ? h('p', { class: 'small' },
                  owned ? `※ ${ev.target}를 보유 중입니다.` : `※ ${ev.target}는 보유하고 있지 않습니다.`)
              : null,
            h('b', { style: 'display:block;margin-top:14px' }, ev.q),
            h('div', { class: 'btn-row', style: 'margin-top:12px' },
              h('button', { class: 'btn secondary', onclick: () => act(ev, false) }, '무시하고 유지'),
              h('button', {
                class: 'btn secondary', onclick: () => act(ev, true),
              }, ev.target && owned ? `${ev.target} 매도` : '포트폴리오 정리'),
            ),
          ),
          h('p', { class: 'disclaimer' }, `뉴스 ${ei + 1} / ${EVENTS.length} · 매매에는 수수료 0.2%가 붙습니다`),
        )
        window.scrollTo(0, 0)
      }
      paint()
    },
    review(ctx, res) {
      const { picked, finalValue, fees, noiseReactions, signalHits, ret, avgPer, valuePort, log } = res
      const lines = [
        `고른 3종목의 매수 시점 평균 PER은 ${avgPer == null ? '계산 불가(적자 종목 포함)' : avgPer.toFixed(1) + '배'}였고, 52주 뒤 결과는 ${pct(ret)}입니다.`,
        `참고로 저PER·고영업이익률 조합(E에너지·G헬스케어·F리테일)만 골랐다면 ${pct(valuePort)}였습니다.`,
      ]
      if (picked.includes('C케미칼')) {
        lines.push(
          'C케미칼을 고르셨군요. PER 5.1배로 이 목록에서 가장 싸 보였지만, 영업이익률이 2.0%에 불과했습니다. 싼 데는 이유가 있었던 것입니다 — 본업이 돈을 못 벌고 있었고, 결국 채무 상환 목적 유상증자 공시까지 나왔습니다. 이걸 가치 함정(value trap)이라고 합니다. PER만 보면 안 되는 이유입니다(카드 3).')
      }
      if (picked.includes('D플랫폼')) {
        lines.push(
          'D플랫폼은 PER 38배로 업종 평균(25배)보다 비쌌지만 결과는 나쁘지 않았습니다. 고PER이 항상 틀린 것도 아닙니다 — 성장이 실제로 따라와 주면 비싼 값을 정당화합니다. 지표는 확률을 높이는 도구지 정답표가 아닙니다.')
      }
      lines.push(
        noiseReactions === 0
          ? `소음에 반응해 매매한 횟수는 0회입니다. 리딩방 찌라시와 유튜브 썸네일을 둘 다 무시하셨습니다 — 그게 카드 6이 말하는 태도입니다.`
          : `소음에 반응해 매매한 횟수는 ${noiseReactions}회입니다. 그때마다 수수료가 나갔고(총 ${won(fees)}), 근거는 리딩방과 유튜브 썸네일이었습니다. 0단계에서 아무 근거 없이 버튼을 눌렀던 것과 구조가 같습니다.`)
      lines.push(
        `DART 공시(진짜 신호) 2건에 대해서는 ${signalHits}/2 건을 적절히 처리했습니다. 실적 개선 공시는 팔 근거가 아니고, 채무 상환 목적 유상증자는 검토할 근거가 맞습니다.`)

      return h('div', {},
        h('div', { class: 'report-hero' },
          h('div', { class: 'rh-label' }, `${picked.join(' · ')} · 52주`),
          h('div', { class: 'rh-num ' + numClass(ret) }, pct(ret)),
          h('p', { class: 'desc', style: 'margin-top:8px' }, `최종 자산 ${won(finalValue)}`),
        ),
        metricGrid(res.metrics),
        h('div', { class: 'card' },
          h('b', {}, '내 선택 vs 저PER·고영업이익률 포트폴리오'),
          compareChart(res.myCurve, res.valueCurve, ['내 3종목', 'E에너지·G헬스케어·F리테일']),
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
        coachCard('🧭 이번 실습이 말하는 것', lines),
      )
    },
  },
}

function buildResult({ picked, px, finalValue, fees, noiseReactions, signalHits, log, holding, cash }) {
  const VALUE_PICK = ['E에너지', 'G헬스케어', 'F리테일']
  const vpx = Object.fromEntries(VALUE_PICK.map(c => [c, seriesFrom(c, START, LEN)]))
  const valueCurve = Array.from({ length: LEN }, (_, i) =>
    VALUE_PICK.reduce((a, c) => a + vpx[c][i] / vpx[c][0] / VALUE_PICK.length, 0))
  const myCurve = Array.from({ length: LEN }, (_, i) => {
    let v = cash
    for (const c of picked) if (!holding[c].sold) v += holding[c].units * px[c][i]
    return v / SEED
  })
  const pers = picked.map(c => UNIVERSE.find(s => s.code === c).per)
  const avgPer = pers.includes(null) ? null : pers.reduce((a, b) => a + b, 0) / pers.length
  const ret = (finalValue / SEED - 1) * 100
  return {
    headline: `${picked.join('·')} · ${pct(ret)}`,
    picked, finalValue, fees, noiseReactions, signalHits, log, ret, avgPer,
    myCurve, valueCurve,
    valuePort: (valueCurve[LEN - 1] - 1) * 100,
    metrics: [
      { k: '52주 수익률', v: pct(ret), cls: numClass(ret) },
      { k: '소음 반응', v: noiseReactions + '회' },
      { k: '신호 대응', v: `${signalHits} / 2` },
      { k: '수수료', v: won(fees) },
    ],
  }
}
