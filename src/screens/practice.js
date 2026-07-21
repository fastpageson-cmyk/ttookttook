// 화면 3-10 — 1주차 실습 3종 (0단계 복기 / 금리 인하기 리플레이 / 한미 금리차 위젯)
import { h, fmt, pct, numClass, lineChart } from '../ui.js'
import { register, go, onLeave } from '../router.js'
import { S, week as weekState, save } from '../state.js'
import sp500 from '../data/sp500_scenario.json'
import { RATE_PHASES, rateAt, price, ETF_CODE, TOTAL_WEEKS } from '../sim-core.js'

const PHASE_COLORS = {
  '완화 유지': 'rgba(139,149,161,.10)',
  '긴축기 (금리 인상)': 'rgba(240,68,82,.13)',
  '고금리 유지': 'rgba(255,149,0,.13)',
  '완화 전환 (금리 인하)': 'rgba(49,130,246,.13)',
  '저금리 유지': 'rgba(18,183,106,.12)',
}

// (실습 허브는 주차 공통 화면 screens/week.js로 이동 — 여기에는 1주차 개별 실습 3종만 남는다)
const backToHub = () => go('practices', { week: 1 })

// ---------- 실습 1 · 0단계 복기 ----------
register('prac1', () => {
  if (!S.report) { queueMicrotask(() => go('home')); return h('div') }
  const endWeek = S.report.endWeek
  const rates = Array.from({ length: TOTAL_WEEKS }, (_, i) => rateAt(i + 1).baseRate)
  const infoBox = h('div', {})
  let clickedOnce = false

  const doneBtn = h('button', {
    class: 'btn', disabled: !weekState(1).practices.review0,
    onclick: () => { weekState(1).practices.review0 = true; save(); backToHub() },
  }, weekState(1).practices.review0 ? '실습 완료됨 · 돌아가기' : '구간을 눌러 확인해보세요')

  const svg = lineChart({
    h: 240,
    series: [{ data: rates, color: '#191f28', width: 2 }],
    bands: RATE_PHASES.map((p, i) => ({ id: i, x0: p.from - 1, x1: p.to - 1, color: PHASE_COLORS[p.name] || 'rgba(0,0,0,.05)' })),
    markers: S.simulation.trades.map(t => ({ x: t.week - 1, y: rateAt(t.week).baseRate, color: t.type === 'buy' ? '#f04452' : '#3182f6', r: 3.5 })),
    vline: endWeek - 1,
    yFmt: v => v.toFixed(1) + '%',
  })
  svg.addEventListener('click', e => {
    const band = e.target.closest?.('[data-band]')
    if (!band || band.dataset.band === '') return
    const ph = RATE_PHASES[Number(band.dataset.band)]
    const trades = S.simulation.trades.filter(t => t.week >= ph.from && t.week <= ph.to)
    const buys = trades.filter(t => t.type === 'buy').length
    const from = Math.min(ph.from, TOTAL_WEEKS), to = Math.min(ph.to, TOTAL_WEEKS)
    const etfChg = (price(ETF_CODE, to) / price(ETF_CODE, from) - 1) * 100
    const inPlay = ph.from <= endWeek
    clickedOnce = true
    doneBtn.disabled = false
    doneBtn.textContent = '실습 완료'
    infoBox.innerHTML = ''
    infoBox.append(h('div', { class: 'card band-info' },
      h('b', { style: 'font-size:16px' }, `${ph.name} (${ph.from}~${ph.to}주차)`),
      h('p', { class: 'desc', style: 'margin:8px 0' },
        `기준금리 ${rateAt(ph.from).baseRate.toFixed(1)}% → ${rateAt(ph.to).baseRate.toFixed(1)}%`, h('br'),
        `이 구간 KOSPI: `, h('b', { class: numClass(etfChg) }, pct(etfChg)), h('br'),
        inPlay
          ? `이 구간에서 ${S.user.nickname}님의 매매는 ${trades.length}건 (매수 ${buys} · 매도 ${trades.length - buys})`
          : '이 구간은 시뮬레이션 종료 이후 구간이에요.'),
      trades.length > 0 && ph.name.includes('긴축')
        ? h('p', { class: 'small' }, '금리가 오르는 구간의 매수는 대체로 역풍을 맞습니다. 그때 알았다면, 선택이 달라졌을까요?')
        : null,
    ))
  })

  return h('div', { class: 'screen' },
    h('div', { class: 'topbar' },
      h('button', { class: 'btn-back', onclick: () => backToHub() }, '‹'),
      h('div', { class: 'tb-title' }, '실습 1 · 0단계 복기'),
    ),
    h('div', { class: 'card' },
      h('b', { style: 'font-size:17px' }, '당신이 방금 투자했던 그 10년 동안,', h('br'), '사실 이런 일이 있었습니다.'),
      h('p', { class: 'small', style: 'margin:8px 0 12px' },
        '검은 선 = 기준금리 · 색 구간 = 금리 국면 · 점 = 내 매매(빨강 매수/파랑 매도) · 점선 = 내가 종료한 시점. 구간을 눌러보세요.'),
      svg,
    ),
    infoBox,
    h('div', { class: 'card', style: 'background:var(--blue-soft);box-shadow:none' },
      h('p', { style: 'font-size:14px;font-weight:700;color:var(--blue-dark)' },
        '이 시점에 금리가 오르고 있다는 걸 알았다면, 당신의 선택은 달라졌을까요?')),
    h('div', { class: 'cta-area' }, doneBtn),
  )
})

// ---------- 실습 2 · 금리 인하기 가이드 리플레이 ----------
register('prac2', () => {
  const idxData = sp500.weeklyIndex
  const rateData = sp500.weeklyBaseRate
  const CHECKPOINTS = [
    {
      week: 12,
      q: '지금, 기준금리는 어느 방향으로 움직이고 있을까요?',
      opts: ['인상 중', '인하 중', '동결 중'], a: 1,
      explain: '연준은 2020년 3월 3일 0.5%p, 3월 15일 1.0%p를 연달아 내려 사실상 제로금리로 갔습니다. 위 금리 숫자가 1.55%에서 0.15%까지 줄어드는 걸 보셨을 거예요.',
    },
    {
      week: 34,
      q: '금리가 크게 낮아진 뒤, 지수는 어떻게 되었나요?',
      opts: ['계속 하락했다', '저점을 지나 반등했다', '전혀 변화가 없었다'], a: 1,
      explain: '3월 저점(2,304) 이후 지수는 회복해 8월에는 급락 전 수준을 넘어섰습니다. 낮아진 금리와 유동성 공급이 배경으로 꼽힙니다.',
    },
  ]
  let week = 1
  let timer = null
  let cpIdx = 0
  const wrap = h('div', { class: 'screen' })
  onLeave(() => { if (timer) clearInterval(timer) })

  function stop() { if (timer) { clearInterval(timer); timer = null } }

  function paint(quiz = null, finished = false) {
    wrap.innerHTML = ''
    const curIdx = idxData[week - 1]
    const curRate = rateData[week - 1]
    const chg = (curIdx / sp500.meta.startIndexValue - 1) * 100
    wrap.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn-back', onclick: () => { stop(); backToHub() } }, '‹'),
        h('div', { class: 'tb-title' }, '실습 2 · 금리 인하기 리플레이'),
      ),
      h('div', { class: 'card' },
        h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' },
          h('div', {},
            h('div', { class: 'small' }, 'S&P 500'),
            h('b', { style: 'font-size:22px' }, fmt(curIdx, 0)),
            h('span', { class: 'chg ' + numClass(chg), style: 'font-size:13px;font-weight:700;margin-left:6px' }, pct(chg))),
          h('div', { style: 'text-align:right' },
            h('div', { class: 'small' }, '미국 기준금리'),
            h('b', { style: 'font-size:22px;color:var(--blue)' }, curRate.toFixed(2) + '%')),
        ),
        lineChart({
          h: 200,
          series: [{ data: idxData.slice(0, Math.max(2, week)), color: '#191f28', width: 2.5, fill: 'rgba(25,31,40,.05)' }],
          xMax: 52,
          yFmt: v => fmt(v, 0),
        }),
        h('div', { class: 'small', style: 'display:flex;justify-content:space-between' },
          h('span', {}, `${week} / 52주`),
          h('span', {}, '2020년 실제 데이터 · 출처 FRED')),
      ),
      quiz ? renderQuiz(quiz) : finished ? renderEnd() : renderControls(),
    )
  }

  function renderControls() {
    return h('div', {},
      week === 1
        ? h('div', { class: 'card', style: 'background:#f7f8fa;box-shadow:none' },
            h('b', { style: 'font-size:14px' }, '📰 상황 브리핑 · 2020년'),
            h('p', { class: 'small', style: 'margin-top:6px' },
              '2020년 1월, S&P 500은 3,234에서 시작합니다. 곧 코로나19로 지수가 고점 대비 -31.8% 급락하고 연준이 긴급 대응에 나섭니다. 재생을 누르고, 오른쪽 위 기준금리 숫자를 눈여겨보세요.'))
        : null,
      h('div', { class: 'cta-area' },
        h('button', {
          class: 'btn', onclick: () => {
            if (timer) return
            timer = setInterval(() => {
              week++
              const cp = CHECKPOINTS[cpIdx]
              if (cp && week >= cp.week) { stop(); paint(cp); return }
              if (week >= 52) { week = 52; stop(); paint(null, true); return }
              paint()
            }, 130)
            paint()
          },
        }, timer ? '재생 중…' : week === 1 ? '▶ 재생 시작' : '▶ 계속 재생'),
      ))
  }

  function renderQuiz(cp) {
    let answered = false
    const box = h('div', {})
    const opts = cp.opts.map((o, oi) => h('button', {
      class: 'opt',
      onclick: function () {
        if (answered) return
        answered = true
        opts.forEach((b, bi) => {
          b.disabled = true
          if (bi === cp.a) { b.classList.add('correct'); b.append(h('span', { class: 'mark ok' }, '✓')) }
          else if (bi === oi) { b.classList.add('wrong'); b.append(h('span', { class: 'mark no' }, '✕')) }
        })
        box.append(
          h('div', { class: 'explain' }, cp.explain),
          h('div', { style: 'margin-top:14px' },
            h('button', { class: 'btn', onclick: () => { cpIdx++; paint(); } }, '계속 보기')),
        )
      },
    }, h('span', { class: 'opt-key' }, 'ABC'[oi]), h('span', {}, o)))
    return h('div', {},
      h('div', { class: 'card', style: 'background:var(--blue-soft);box-shadow:none;margin-bottom:12px' },
        h('b', { style: 'color:var(--blue-dark)' }, '⏸ 잠깐, 질문! '), cp.q),
      opts, box)
  }

  function renderEnd() {
    return h('div', {},
      h('div', { class: 'card' },
        h('b', { style: 'font-size:16px' }, '🧭 균형 잡힌 해설'),
        h('p', { class: 'desc', style: 'margin-top:8px' },
          '2020년에는 금리 인하와 지수 반등이 함께 왔습니다. 그해 S&P 500은 고점 대비 -31.8%까지 빠졌다가 연말에는 연초 대비 +14.5%로 끝났습니다. 하지만 이건 2020년 한 해의 기록일 뿐입니다. 금리 인하와 지수 반등이 항상 같이 오지는 않습니다 — 경기 침체가 심각해서 금리를 내리는 경우라면 주가는 더 떨어질 수도 있습니다. "금리 인하 = 매수 신호"로 기계적으로 외우지 않는 것이 이번 실습의 진짜 결론입니다.')),
      h('div', { class: 'cta-area' },
        h('button', {
          class: 'btn', onclick: () => { weekState(1).practices.rateCutReplay = true; save(); backToHub() },
        }, '실습 완료')))
  }

  paint()
  return wrap
})

// ---------- 실습 3 · 한미 금리차·환율 위젯 ----------
register('prac3', () => {
  let kr = 3.5, us = 4.5
  let prediction = null
  const wrap = h('div', { class: 'screen' })

  function answerOf(diff) {
    if (diff > 0.5) return 0   // 원화 약세(환율 상승)
    if (diff < -0.5) return 1  // 원화 강세(환율 하락)
    return 2                   // 뚜렷한 방향 없음
  }
  const OPTS = ['원화 약세 (환율 상승 압력)', '원화 강세 (환율 하락 압력)', '뚜렷한 방향 없음']

  function paint(revealed = false) {
    const diff = us - kr
    const ans = answerOf(diff)
    wrap.innerHTML = ''
    wrap.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn-back', onclick: () => backToHub() }, '‹'),
        h('div', { class: 'tb-title' }, '실습 3 · 한미 금리차와 환율'),
      ),
      h('div', { class: 'card' },
        h('div', { class: 'slider-row' },
          h('label', {}, h('span', {}, '🇰🇷 한국 기준금리'), h('b', {}, kr.toFixed(2) + '%')),
          (() => {
            const s = h('input', { type: 'range', min: '0', max: '6', step: '0.25', value: String(kr) })
            s.addEventListener('input', () => { kr = Number(s.value); prediction = null; paint() })
            return s
          })()),
        h('div', { class: 'slider-row' },
          h('label', {}, h('span', {}, '🇺🇸 미국 기준금리'), h('b', {}, us.toFixed(2) + '%')),
          (() => {
            const s = h('input', { type: 'range', min: '0', max: '6', step: '0.25', value: String(us) })
            s.addEventListener('input', () => { us = Number(s.value); prediction = null; paint() })
            return s
          })()),
        h('div', { class: 'fx-gap' },
          '금리차 (미국−한국): ',
          h('span', { class: diff > 0 ? 'num-up' : diff < 0 ? 'num-down' : 'num-flat' },
            (diff > 0 ? '+' : '') + diff.toFixed(2) + '%p')),
      ),
      h('div', { class: 'card' },
        h('b', { style: 'font-size:15px' }, '이 경우, 원/달러 환율은 어느 쪽 압력을 받을까요?'),
        h('div', { style: 'margin-top:12px' },
          OPTS.map((o, oi) => h('button', {
            class: 'opt' + (revealed ? (oi === ans ? ' correct' : prediction === oi ? ' wrong' : '') : prediction === oi ? ' picked' : ''),
            disabled: revealed,
            onclick: () => { prediction = oi; paint() },
          },
            h('span', { class: 'opt-key' }, 'ABC'[oi]),
            h('span', {}, o),
            revealed && oi === ans ? h('span', { class: 'mark ok' }, '✓') : null,
            revealed && prediction === oi && oi !== ans ? h('span', { class: 'mark no' }, '✕') : null,
          ))),
        !revealed
          ? h('button', { class: 'btn', style: 'margin-top:8px', disabled: prediction == null, onclick: () => { weekState(1).practices.fxWidget = true; save(); paint(true) } }, '정답 확인')
          : h('div', { class: 'explain' },
              diff > 0.5
                ? `미국 금리가 한국보다 ${diff.toFixed(2)}%p 높습니다. 자본이 더 높은 이자를 주는 달러 쪽으로 이동하려는 유인이 생겨, 원/달러 환율은 상승(원화 약세) 압력을 받는 쪽이 일반적입니다.`
                : diff < -0.5
                  ? `한국 금리가 미국보다 ${Math.abs(diff).toFixed(2)}%p 높습니다. 원화 자산의 이자 매력이 커져 자본이 유입되며, 원/달러 환율은 하락(원화 강세) 압력을 받는 쪽이 일반적입니다.`
                  : '금리차가 크지 않을 때는 금리만으로 뚜렷한 방향을 말하기 어렵습니다. 무역수지, 시장 심리 등 다른 요인이 더 크게 작용할 수 있어요.',
              h('p', { class: 'small', style: 'margin-top:8px' }, '실제 환율은 금리차 외에 무역수지, 시장 심리 등 다른 요인도 함께 작용한다는 걸 잊지 마세요.')),
      ),
      h('div', { class: 'cta-area' },
        revealed
          ? h('div', { class: 'btn-row' },
              h('button', { class: 'btn secondary', onclick: () => { prediction = null; paint() } }, '다른 조합 실험'),
              h('button', { class: 'btn', onclick: () => backToHub() }, '실습 완료'))
          : null),
    )
  }
  paint()
  return wrap
})
