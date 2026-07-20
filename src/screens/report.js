// 화면 3-6 0단계 종료 리포트 · 3-7 AI 매매 실수 리포트 · 결과 공유 카드
import { h, fmt, won, pct, numClass, countUp, lineChart } from '../ui.js'
import { register, go } from '../router.js'
import { S } from '../state.js'
import { SLOGAN, DISCLAIMER } from '../content.js'

register('report', () => {
  const r = S.report
  if (!r) { queueMicrotask(() => go('home')); return h('div') }
  const retNode = h('span', {}, '0')
  requestAnimationFrame(() => countUp(retNode, r.finalReturn, { dur: 1400, decimals: 1, signed: true, suffix: '%' }))

  // 벤치마크 비교선 그래프 (내 자산 vs 지수ETF 적립)
  const step = Math.max(1, Math.floor(r.equityCurve.length / 240))
  const eq = r.equityCurve.filter((_, i) => i % step === 0)
  const bm = r.benchmarkCurve.filter((_, i) => i % step === 0)

  const gap = r.finalReturn - r.benchmarkReturn

  return h('div', { class: 'screen' },
    r.bankrupt ? h('div', { class: 'bankrupt-banner' },
      h('b', {}, '💥 파산 — 자산의 대부분을 잃었습니다'),
      h('span', {}, '한 종목에 크게 걸었다가 무너진 결과예요. 아래 실수 리포트에서 이유를 짚어봅니다.'),
    ) : null,
    h('div', { class: 'report-hero' },
      h('div', { class: 'rh-label' }, `${S.user.nickname}님의 첫 투자 성적표 · ${fmt(r.endWeek)}주(약 ${(r.endWeek / 52).toFixed(1)}년)`),
      h('div', { class: 'rh-num ' + numClass(r.finalReturn) }, retNode),
      h('div', { class: 'small', style: 'margin-top:6px' },
        `1,000만 원 → ${won(r.finalValue)}`),
    ),
    h('div', { class: 'stat-grid' },
      h('div', { class: 'stat' }, h('div', { class: 's-label' }, '최대 낙폭 (MDD)'), h('div', { class: 's-num num-down' }, '-' + r.mdd.toFixed(1) + '%')),
      h('div', { class: 'stat' }, h('div', { class: 's-label' }, '매매 횟수'), h('div', { class: 's-num' }, fmt(r.totalTrades) + '회')),
      h('div', { class: 'stat' }, h('div', { class: 's-label' }, '수수료·세금 총액'), h('div', { class: 's-num' }, won(r.totalFees))),
      h('div', { class: 'stat' }, h('div', { class: 's-label' }, '지수ETF 적립이었다면'), h('div', { class: 's-num ' + numClass(r.benchmarkReturn) }, pct(r.benchmarkReturn))),
    ),
    h('div', { class: 'card', style: 'margin-top:12px' },
      h('b', { style: 'font-size:15px' }, '내 자산 vs 지수ETF 적립 매수'),
      h('div', { style: 'margin-top:10px' },
        lineChart({
          h: 220,
          series: [
            { data: bm, color: '#c6cdd5', width: 2, dash: '5 4' },
            { data: eq, color: gap >= 0 ? '#f04452' : '#3182f6', width: 2.5 },
          ],
          yFmt: v => fmt(v / 10000) + '만',
        })),
      h('div', { class: 'legend' },
        h('span', {}, h('i', { style: `background:${gap >= 0 ? '#f04452' : '#3182f6'}` }), '내 자산'),
        h('span', {}, h('i', { style: 'background:#c6cdd5' }), '같은 돈, 지수ETF 매주 적립')),
      h('p', { class: 'desc', style: 'font-size:13px;margin-top:10px' },
        gap >= 0
          ? `지수 적립보다 ${gap.toFixed(1)}%p 앞섰습니다. 운과 실력을 구분하는 법도 앞으로 배웁니다.`
          : `아무 종목도 고르지 않고 지수만 샀다면 ${Math.abs(gap).toFixed(1)}%p 더 벌었습니다.`),
    ),
    h('div', { class: 'cta-area' },
      h('button', { class: 'btn', onclick: () => go('aiReport') }, '내 실수 보기'),
      h('div', { style: 'height:10px' }),
      h('button', { class: 'btn secondary', onclick: shareCard }, '성적표 이미지로 저장하기'),
      h('p', { class: 'disclaimer' }, DISCLAIMER),
    ),
  )
})

// 결과 공유 카드 — 캔버스로 그려 PNG 저장 (외부 라이브러리 없음)
function shareCard() {
  const r = S.report
  const c = document.createElement('canvas')
  c.width = 720; c.height = 960
  const x = c.getContext('2d')
  const up = r.finalReturn >= 0

  x.fillStyle = '#191f28'
  x.fillRect(0, 0, 720, 960)
  x.fillStyle = '#3182f6'
  x.font = '800 34px Pretendard, sans-serif'
  x.fillText('똑똑', 56, 92)
  x.fillStyle = '#8b95a1'
  x.font = '600 24px Pretendard, sans-serif'
  x.fillText('나의 첫 투자 성적표', 56, 150)
  x.fillStyle = '#ffffff'
  x.font = '700 30px Pretendard, sans-serif'
  x.fillText(`${S.user.nickname}님 · ${fmt(r.endWeek)}주의 기록`, 56, 200)

  x.fillStyle = up ? '#f04452' : '#5b8def'
  x.font = '800 110px Pretendard, sans-serif'
  x.fillText((r.finalReturn > 0 ? '+' : '') + r.finalReturn.toFixed(1) + '%', 56, 370)

  x.strokeStyle = '#2c3441'
  x.lineWidth = 2
  x.beginPath(); x.moveTo(56, 430); x.lineTo(664, 430); x.stroke()

  const rows = [
    ['시작 자금', '10,000,000원'],
    ['최종 자산', won(r.finalValue)],
    ['최대 낙폭', '-' + r.mdd.toFixed(1) + '%'],
    ['매매 횟수', fmt(r.totalTrades) + '회'],
    ['수수료·세금', won(r.totalFees)],
    ['지수ETF 적립이었다면', pct(r.benchmarkReturn)],
  ]
  rows.forEach(([k, v], i) => {
    const y = 500 + i * 62
    x.fillStyle = '#8b95a1'; x.font = '600 26px Pretendard, sans-serif'
    x.fillText(k, 56, y)
    x.fillStyle = '#ffffff'; x.font = '700 26px Pretendard, sans-serif'
    const w = x.measureText(v).width
    x.fillText(v, 664 - w, y)
  })

  x.fillStyle = '#3182f6'
  x.font = '800 32px Pretendard, sans-serif'
  x.fillText(SLOGAN, 56, 908)
  x.fillStyle = '#4e5968'
  x.font = '500 18px Pretendard, sans-serif'
  x.fillText('학습용 가상 데이터 시뮬레이션', 430, 908)

  const a = document.createElement('a')
  a.href = c.toDataURL('image/png')
  a.download = `똑똑_성적표_${S.user.nickname}.png`
  a.click()
}

register('aiReport', () => {
  const items = S.aiReport?.items || []
  return h('div', { class: 'screen' },
    h('div', { class: 'topbar' },
      h('button', { class: 'btn-back', onclick: () => go('report') }, '‹'),
      h('div', { class: 'tb-title' }, '매매 실수 리포트'),
    ),
    h('div', { style: 'margin:6px 0 16px' },
      h('span', { class: 'badge blue' }, '규칙 기반 분석'),
      h('p', { class: 'desc', style: 'margin-top:10px' },
        `${S.user.nickname}님의 매매 기록에서 손실에 가장 크게 기여한 의사결정을 골라냈습니다. 자책은 금물 — 이건 전부 다음 주부터 배울 내용입니다.`),
    ),
    items.map((it, i) => h('div', { class: 'card mistake-card' },
      h('div', { class: 'mc-no' }, `실수 ${i + 1}`),
      h('b', { class: 'mc-head' }, it.headline),
      h('p', {}, it.explanation),
    )),
    h('div', { class: 'cta-area' },
      h('button', { class: 'btn', onclick: () => go('home') }, '왜 이런 실수를 했는지 알아보기 (1주차 시작)'),
      h('p', { class: 'disclaimer' }, '이 리포트는 시뮬레이션 기록 기반의 학습용 분석이며, 투자 조언이 아닙니다.'),
    ),
  )
})
