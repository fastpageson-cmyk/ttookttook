// 화면 3-5 — 0단계 블라인드 자유투자 (핵심 화면)
import { h, fmt, won, pct, numClass, lineChart, openSheet } from '../ui.js'
import { register, go, onLeave } from '../router.js'
import { S, save } from '../state.js'
import { TOTAL_WEEKS, ALL_STOCKS, price, tradeFee, portfolioValue, computeReport, generateMistakeReport, BANKRUPT_RATIO } from '../sim-core.js'
import { DISCLAIMER } from '../content.js'

let selected = ALL_STOCKS[0].code
let timer = null
let speed = 1 // 1: 재생(주당 160ms), 4: 빨리감기(주당 45ms, 2주씩)
let bankruptShown = false // 파산 안내는 세션당 1회만

function stopTimer() { if (timer) { clearInterval(timer); timer = null } }

register('sim', () => {
  const sim = S.simulation
  if (!S.diagnosis.completedAt) { queueMicrotask(() => go('diag')); return h('div') }
  if (sim.status === 'ended') { queueMicrotask(() => go('report')); return h('div') }
  if (sim.status === 'not_started') { sim.status = 'in_progress'; save() }

  const wrap = h('div', { class: 'screen sim-screen' })
  bankruptShown = false
  onLeave(() => { stopTimer(); save() })

  function finalize() {
    stopTimer()
    sim.status = 'ended'
    S.report = computeReport(sim)
    S.aiReport = generateMistakeReport(sim.trades, S.report)
    save()
    go('report')
  }

  // 파산: 보유 종목이 있고 총자산이 시작 자금의 10% 미만
  function isBankrupt() {
    const invested = Object.values(sim.holdings).some(q => q > 0)
    return invested && portfolioValue(sim, sim.currentWeek) < sim.startingCash * BANKRUPT_RATIO
  }
  function showBankruptcy() {
    stopTimer(); bankruptShown = true; paint()
    const close = openSheet(
      h('h3', {}, '파산했습니다'),
      h('p', { class: 'desc', style: 'margin-bottom:18px' },
        `총자산이 시작 자금의 ${Math.round((1 - BANKRUPT_RATIO) * 100)}% 이상 사라졌어요. 한 종목에 크게 걸었다가 회복 불가능한 손실을 본 겁니다. 여기서 마치고, 무엇이 문제였는지 리포트로 확인해봐요.`),
      h('button', { class: 'btn', onclick: () => { close(); finalize() } }, '결과 보기'),
    )
  }

  function tick() {
    const step = speed === 4 ? 2 : 1
    sim.currentWeek = Math.min(TOTAL_WEEKS, sim.currentWeek + step)
    if (sim.currentWeek >= TOTAL_WEEKS) { finalize(); return }
    if (!bankruptShown && isBankrupt()) { showBankruptcy(); return }
    paint()
  }

  function togglePlay(s) {
    if (timer && speed === s) { stopTimer() }
    else {
      stopTimer()
      speed = s
      timer = setInterval(tick, s === 4 ? 45 : 160)
    }
    paint()
  }

  function confirmEnd() {
    stopTimer(); paint()
    const close = openSheet(
      h('h3', {}, '시뮬레이션을 종료할까요?'),
      h('p', { class: 'desc', style: 'margin-bottom:18px' },
        `지금까지 ${fmt(sim.currentWeek)}주(약 ${(sim.currentWeek / 52).toFixed(1)}년)를 플레이했어요. 종료하면 성적표와 매매 실수 분석 리포트가 만들어집니다.`),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn secondary', onclick: () => close() }, '계속하기'),
        h('button', { class: 'btn', onclick: () => { close(); finalize() } }, '종료하고 결과 보기'),
      ),
    )
  }

  function openTrade(type) {
    stopTimer(); paint()
    const code = selected
    const p = price(code, sim.currentWeek)
    const held = sim.holdings[code] || 0
    const maxQty = type === 'buy' ? Math.floor(sim.cash / (p * (1 + 0.002))) : held
    if (maxQty <= 0) {
      const close = openSheet(
        h('h3', {}, type === 'buy' ? '현금이 부족해요' : '보유 수량이 없어요'),
        h('p', { class: 'desc', style: 'margin-bottom:18px' },
          type === 'buy' ? `현재 현금 ${won(sim.cash)}으로는 ${code} 1주(${won(p)})를 살 수 없습니다.` : `${code}를 보유하고 있지 않아 매도할 수 없습니다.`),
        h('button', { class: 'btn secondary', onclick: () => close() }, '확인'),
      )
      return
    }
    const input = h('input', { type: 'number', inputmode: 'numeric', min: '1', max: String(maxQty), value: '1' })
    const feeRow = h('b', {}, '')
    const amtRow = h('b', {}, '')
    const totalRow = h('b', {}, '')
    const qty = () => Math.max(1, Math.min(maxQty, Math.floor(Number(input.value) || 1)))
    const refresh = () => {
      const q = qty()
      const amt = p * q, fee = tradeFee(p, q)
      amtRow.textContent = won(amt)
      feeRow.textContent = won(fee)
      totalRow.textContent = won(type === 'buy' ? amt + fee : amt - fee)
    }
    input.addEventListener('input', refresh)
    const quick = r => { input.value = String(Math.max(1, Math.floor(maxQty * r))); refresh() }
    const close = openSheet(
      h('h3', {}, `${code} ${type === 'buy' ? '매수' : '매도'}`),
      h('div', { class: 'info-rows' },
        h('div', { class: 'r' }, h('span', {}, '현재가 (' + sim.currentWeek + '주차)'), h('b', {}, won(p))),
        h('div', { class: 'r' }, h('span', {}, type === 'buy' ? '주문 가능 현금' : '보유 수량'),
          h('b', {}, type === 'buy' ? won(sim.cash) : fmt(held) + '주')),
      ),
      h('div', { class: 'qty-row' },
        h('button', { class: 'stepper', onclick: () => { input.value = String(Math.max(1, qty() - 1)); refresh() } }, '−'),
        input,
        h('button', { class: 'stepper', onclick: () => { input.value = String(Math.min(maxQty, qty() + 1)); refresh() } }, '+'),
      ),
      h('div', { class: 'qty-quick' },
        h('button', { onclick: () => quick(0.25) }, '25%'),
        h('button', { onclick: () => quick(0.5) }, '50%'),
        h('button', { onclick: () => quick(1) }, '최대'),
      ),
      h('div', { class: 'info-rows', style: 'margin-bottom:16px' },
        h('div', { class: 'r' }, h('span', {}, '주문 금액'), amtRow),
        h('div', { class: 'r' }, h('span', {}, '수수료·세금 (0.2%)'), feeRow),
        h('div', { class: 'r' }, h('span', {}, type === 'buy' ? '총 필요 금액' : '실수령액'), totalRow),
      ),
      h('button', {
        class: 'btn ' + (type === 'buy' ? 'buy' : 'sell'),
        onclick: () => {
          const q = qty()
          const fee = tradeFee(p, q)
          if (type === 'buy') {
            if (p * q + fee > sim.cash) return
            sim.cash -= p * q + fee
            sim.holdings[code] = (sim.holdings[code] || 0) + q
          } else {
            if (q > (sim.holdings[code] || 0)) return
            sim.cash += p * q - fee
            sim.holdings[code] -= q
            if (sim.holdings[code] === 0) delete sim.holdings[code]
          }
          sim.trades.push({
            id: 't' + Date.now() + Math.floor(Math.random() * 1000),
            week: sim.currentWeek, stockCode: code, type, quantity: q, price: p, fee,
          })
          save(); close(); paint()
        },
      }, `${type === 'buy' ? '매수' : '매도'} 확정`),
    )
    refresh()
  }

  function paint() {
    const w = sim.currentWeek
    const total = portfolioValue(sim, w)
    const ret = (total / sim.startingCash - 1) * 100
    const p = price(selected, w)
    const prev = w > 1 ? price(selected, w - 1) : p
    const chg = (p / prev - 1) * 100
    const held = sim.holdings[selected] || 0
    const chartData = ALL_STOCKS.find(s => s.code === selected).prices.slice(0, Math.max(2, w))

    wrap.innerHTML = ''
    const summaryCard = h('div', { class: 'card sim-summary-card' },
      h('div', { class: 'sim-summary' },
        h('div', {},
          h('div', { class: 'small' }, '총자산'),
          h('div', { class: 'total' }, won(total)),
        ),
        h('div', { class: 'tar' },
          h('div', { class: 'small' }, '수익률'),
          h('div', { class: 'chg ' + numClass(ret), style: 'font-size:18px;font-weight:800' }, pct(ret)),
        ),
      ),
      // 진행 표시는 "N주차 · 약 X년 경과" 텍스트로 충분 — 줄형 progressbar 제거(중복)
      h('div', { class: 'sim-week mt-3' },
        h('span', {}, `${fmt(w)}주차 · 약 ${(w / 52).toFixed(1)}년 경과`),
        h('span', {}, `현금 ${won(sim.cash)}`),
      ),
    )
    const chipsWrap = h('div', { class: 'stock-chips' },
      ALL_STOCKS.map(s => h('button', {
        class: 'chip' + (selected === s.code ? ' on' : ''),
        onclick: () => { selected = s.code; paint() },
      }, s.code, (sim.holdings[s.code] || 0) > 0 ? h('span', { class: 'hold-dot' }) : null)),
    )
    const timeControls = h('div', { class: 'time-controls' },
      h('button', { class: 'tc' + (timer && speed === 1 ? ' playing' : ''), onclick: () => togglePlay(1) },
        timer && speed === 1 ? '일시정지' : '재생'),
      h('button', { class: 'tc' + (timer && speed === 4 ? ' playing' : ''), onclick: () => togglePlay(4) },
        timer && speed === 4 ? '일시정지' : '빨리감기'),
      h('button', { class: 'tc', onclick: () => { stopTimer(); sim.currentWeek = Math.min(TOTAL_WEEKS, sim.currentWeek + 4); if (sim.currentWeek >= TOTAL_WEEKS) { finalize(); return } if (!bankruptShown && isBankrupt()) { showBankruptcy(); return } save(); paint() } }, '+4주'),
    )
    // y축 라벨: 값 범위가 좁으면(초반 몇 주) 정수 k 반올림이 "31k×4"처럼 겹친다 → 범위에 맞춰 소수 자리를 늘림
    const chartRange = Math.max(...chartData) - Math.min(...chartData)
    const yDec = chartRange < 400 ? 2 : chartRange < 4000 ? 1 : 0
    const chartCard = h('div', { class: 'card sim-chart-card' },
      h('div', { class: 'price-line' },
        h('span', { class: 'chip label' }, selected),
        h('span', { class: 'p' }, won(p)),
        h('span', { class: 'chg ' + numClass(chg) }, pct(chg) + ' 주간'),
      ),
      lineChart({
        h: 210,
        series: [{ data: chartData, color: chg >= 0 ? '#f04452' : '#3182f6', width: 2, fill: chg >= 0 ? 'rgba(240,68,82,.06)' : 'rgba(49,130,246,.06)' }],
        yFmt: v => fmt(v / 1000, yDec) + 'k',
      }),
      held > 0
        ? h('div', { class: 'pos-line' },
            `보유 ${fmt(held)}주 · 평가액 ${won(held * p)}`)
        : h('div', { class: 'pos-line' }, '보유 없음'),
      h('div', { class: 'trade-btns' },
        h('button', { class: 'btn buy', onclick: () => openTrade('buy') }, '매수'),
        h('button', { class: 'btn sell', onclick: () => openTrade('sell') }, '매도'),
      ),
    )

    wrap.append(
      h('div', { class: 'topbar' },
        h('div', { class: 'tb-title' }, '0단계 · 블라인드 투자'),
        // 종료는 위험 액션이 아니라 다음 단계로 가는 문 — 빨간색이 아니라 무채색으로 둔다
        h('button', {
          class: 'btn ghost tb-action', onclick: confirmEnd,
        }, '종료'),
      ),
      h('div', { class: 'sim-grid' },
        h('div', { class: 'sim-side' }, summaryCard, chipsWrap, timeControls),
        h('div', { class: 'sim-main' }, chartCard),
      ),
      h('p', { class: 'small', style: 'margin-top:10px;text-align:center' },
        `매매 ${fmt(sim.trades.length)}건 · 520주가 되면 자동 종료됩니다`),
      h('p', { class: 'disclaimer' }, DISCLAIMER),
    )
  }

  paint()
  return wrap
})
