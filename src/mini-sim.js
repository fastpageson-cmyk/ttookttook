// 주차별 미니 모의투자 공용 엔진
//
// 각 주차 실습의 **마지막**에 배치된다. 목적은 그 주차에서 배운 개념을 읽고 끝내지 않고
// 직접 조작해보게 하는 것 — 예를 들어 3주차에서 대출을 배웠으면 미니 모의투자에서
// 실제로 레버리지를 당겨보고 마진콜까지 맞아본다.
//
// 이 파일은 단계 진행(브리핑 → 설정 → 진행 → 결과)과 완료 저장만 담당하고,
// 주차별 기전은 weeks/weekN.js의 miniSim 설정이 제공한다.
import { h, fmt, won, pct, numClass, lineChart } from './ui.js'
import { go, onLeave } from './router.js'
import { week, save } from './state.js'
import stocksData from './data/stocks.json'
import ratesData from './data/rates.json'

// ---------- 공용 데이터 헬퍼 ----------
// stocks.json은 2026-07 기준 실제 시세(FinanceDataReader)로 교체되었다.
// 종목 코드는 실제 회사명이므로 하드코딩하지 말고 INDEX_CODE / stocksData를 통해 참조할 것.
export const INDEX_CODE = stocksData.indexEtf.code   // 'KOSPI'
export const DATA_PERIOD = stocksData.meta.period

const priceMap = Object.fromEntries(
  [...stocksData.stocks, stocksData.indexEtf].map(s => [s.code, s.prices]))

// 목업 시세에서 구간을 잘라 1.0으로 정규화한 수익 지수로 변환
export function seriesFrom(code, startWeek, len) {
  const raw = priceMap[code].slice(startWeek - 1, startWeek - 1 + len)
  const base = raw[0]
  return raw.map(v => v / base)
}

export function ratesFrom(startWeek, len) {
  return ratesData.weeklyRates.slice(startWeek - 1, startWeek - 1 + len).map(r => r.baseRate)
}

// 결정론적 의사난수 (mulberry32) — 같은 seed면 항상 같은 계열이 나오도록
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 채권·금 목업 계열 — 실제 시세가 아니라 교육용 합성 데이터.
// 채권은 금리와 반대로(금리 상승 → 채권 가격 하락), 금은 주식과 상관관계가 낮게 움직이도록 설계.
export function bondSeries(startWeek, len) {
  const rates = ratesFrom(startWeek, len)
  const r0 = rates[0]
  const rand = rng(startWeek * 7 + 11)
  const out = []
  let v = 1
  for (let i = 0; i < len; i++) {
    const carry = rates[i] / 100 / 52                        // 이자 수익(캐리)
    const duration = -(rates[i] - (i ? rates[i - 1] : r0)) / 100 * 4 // 듀레이션 4년 가정
    v *= 1 + carry + duration + (rand() - 0.5) * 0.0016
    out.push(v)
  }
  return out
}

export function goldSeries(startWeek, len) {
  const rand = rng(startWeek * 13 + 29)
  const out = []
  let v = 1
  for (let i = 0; i < len; i++) {
    v *= 1 + 0.0009 + (rand() - 0.5) * 0.018
    out.push(v)
  }
  return out
}

// 정기예금: 대체로 정책금리 수준의 이자가 붙는다(4주차의 '현금'과 구분 — 그쪽은 파킹통장)
export function depositSeries(startWeek, len) {
  const rates = ratesFrom(startWeek, len)
  const out = []
  let v = 1
  for (let i = 0; i < len; i++) {
    v *= 1 + Math.max(0, rates[i]) / 100 / 52
    out.push(v)
  }
  return out
}

// 현금(파킹): 기준금리 - 1%p 수준의 이자만 붙음
export function cashSeries(startWeek, len) {
  const rates = ratesFrom(startWeek, len)
  const out = []
  let v = 1
  for (let i = 0; i < len; i++) {
    v *= 1 + Math.max(0, rates[i] - 1) / 100 / 52
    out.push(v)
  }
  return out
}

export function maxDD(curve) {
  let peak = -Infinity, m = 0
  for (const v of curve) {
    if (v > peak) peak = v
    const dd = (peak - v) / peak
    if (dd > m) m = dd
  }
  return m * 100
}

// 손실 회복에 필요한 수익률 (4주차 음의 복리)
export function recoveryNeeded(ddPct) {
  return (1 / (1 - ddPct / 100) - 1) * 100
}

// ---------- 공용 UI 조각 ----------
export function metricGrid(items) {
  return h('div', { class: 'ms-metrics' },
    items.map(m => h('div', { class: 'ms-metric' },
      h('span', { class: 'ms-mk' }, m.k),
      h('b', { class: m.cls || '' }, m.v),
      m.sub ? h('span', { class: 'ms-ms' }, m.sub) : null,
    )))
}

export function sliderRow(label, value, opts, onInput) {
  const { min = 0, max = 100, step = 1, fmt: f = v => v + '%' } = opts || {}
  const val = h('b', {}, f(value))
  const input = h('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(value) })
  input.addEventListener('input', () => { val.textContent = f(Number(input.value)); onInput(Number(input.value)) })
  return h('div', { class: 'slider-row' }, h('label', {}, h('span', {}, label), val), input)
}

export function choiceRow(options, selected, onPick) {
  return h('div', { class: 'ms-choices' },
    options.map(o => h('button', {
      class: 'ms-choice' + (o.value === selected ? ' on' : ''),
      onclick: () => onPick(o.value),
    },
      h('b', {}, o.label),
      o.desc ? h('span', {}, o.desc) : null,
    )))
}

export function coachCard(title, lines) {
  return h('div', { class: 'card ms-coach' },
    h('b', {}, title),
    lines.map(l => h('p', {}, l)))
}

// ---------- 엔진 ----------
// cfg = {
//   weekId, title, brief:{headline, lines[], tools[]},
//   setup(ctx) -> {node, read()}      // 도구 패널. read()가 params를 반환
//   play?(ctx, params, done)          // 주차별 진행 화면. 끝나면 done(result) 호출
//   simulate?(params) -> result       // play가 없을 때 즉시 계산
//   review(ctx, result) -> node       // 결과 화면 본문
// }
export function miniSimScreen(cfg) {
  return () => {
    const wrap = h('div', { class: 'screen' })
    const w = week(cfg.weekId)
    let stage = 'brief'
    let params = null
    let result = null

    const ctx = { weekId: cfg.weekId, repaint: () => paint() }

    ctx.finish = res => {
      result = res
      // localStorage에는 요약만 저장한다(곡선 데이터는 화면 재진입 시 다시 계산)
      w.miniSim = { done: true, result: { headline: res.headline, metrics: res.metrics || [] } }
      save()
      stage = 'result'
      paint()
    }

    function backTo() { go('practices', { week: cfg.weekId }) }

    function briefNode() {
      const b = cfg.brief
      return h('div', {},
        h('div', { class: 'card ms-brief' },
          h('div', { class: 'eyebrow' }, '미니 모의투자'),
          h('b', { style: 'font-size:18px;display:block;margin:6px 0 10px' }, b.headline),
          b.lines.map(l => h('p', { class: 'desc' }, l)),
        ),
        h('div', { class: 'card ms-tools' },
          h('b', {}, '이번 실습에서 쓰는 도구'),
          h('ul', {}, b.tools.map(t => h('li', {}, t))),
        ),
        h('div', { class: 'cta-area' },
          h('button', { class: 'btn', onclick: () => { stage = 'setup'; paint() } }, '시작하기')),
      )
    }

    let setupApi = null
    function setupNode() {
      setupApi = cfg.setup(ctx)
      return h('div', {},
        setupApi.node,
        h('div', { class: 'cta-area' },
          h('button', {
            class: 'btn', onclick: () => {
              params = setupApi.read()
              if (cfg.play) { stage = 'play'; paint() }
              else ctx.finish(cfg.simulate(params))
            },
          }, cfg.startLabel || '이 설정으로 시작')),
      )
    }

    function playNode() {
      const box = h('div', {})
      cfg.play(ctx, params, ctx.finish, box)
      return box
    }

    function resultNode() {
      return h('div', {},
        cfg.review(ctx, result),
        h('div', { class: 'cta-area' },
          h('div', { class: 'btn-row' },
            h('button', {
              class: 'btn secondary', onclick: () => { stage = 'setup'; params = null; result = null; paint() },
            }, '다시 해보기'),
            h('button', { class: 'btn', onclick: backTo }, '실습 완료'),
          )),
      )
    }

    function paint() {
      wrap.innerHTML = ''
      const steps = ['brief', 'setup', cfg.play ? 'play' : null, 'result'].filter(Boolean)
      wrap.append(
        h('div', { class: 'topbar' },
          h('button', { class: 'btn-back', onclick: backTo }, '‹'),
          h('div', { class: 'tb-title' }, cfg.title),
        ),
        h('div', { class: 'ms-steps' },
          steps.map((s, i) => h('i', { class: steps.indexOf(stage) >= i ? 'on' : '' }))),
        stage === 'brief' ? briefNode()
          : stage === 'setup' ? setupNode()
            : stage === 'play' ? playNode()
              : resultNode(),
      )
      window.scrollTo(0, 0)
    }

    onLeave(() => { setupApi = null })
    paint()
    return wrap
  }
}

// 결과 화면에서 자주 쓰는 비교 차트 (내 곡선 vs 비교 곡선)
export function compareChart(mine, other, labels) {
  return h('div', {},
    lineChart({
      h: 220,
      series: [
        { data: other, color: '#8b95a1', width: 2, dash: '5 4' },
        { data: mine, color: '#3182f6', width: 2.5, fill: 'rgba(49,130,246,.07)' },
      ],
      yFmt: v => (v * 100 - 100).toFixed(0) + '%',
    }),
    h('div', { class: 'ms-legend' },
      h('span', {}, h('i', { style: 'background:#3182f6' }), labels[0]),
      h('span', {}, h('i', { style: 'background:#8b95a1' }), labels[1]),
    ))
}

export { fmt, won, pct, numClass, lineChart, h }
