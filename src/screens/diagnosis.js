// 화면 3-3 사전 진단 20문항 · 3-4 진단 결과 (또래 비교 + 카운트업)
import { h, countUp } from '../ui.js'
import { register, go } from '../router.js'
import { S, save } from '../state.js'
import { DIAGNOSIS, PEER_AVG } from '../content.js'

register('diag', () => {
  // 중도 이탈 임시저장: answers에 저장된 다음 문항부터 재개
  let idx = Math.min(S.diagnosis.answers.length, DIAGNOSIS.length - 1)
  if (S.diagnosis.completedAt) idx = 0
  const wrap = h('div', { class: 'screen' })

  function renderQ() {
    const item = DIAGNOSIS[idx]
    const picked = S.diagnosis.answers[idx]
    wrap.innerHTML = ''
    wrap.append(
      h('div', { class: 'topbar' },
        h('button', {
          class: 'btn-back',
          onclick: () => { if (idx > 0) { idx--; renderQ() } else go('home') },
        }, '‹'),
        h('div', { class: 'tb-title' }, '사전 진단'),
      ),
      h('div', { class: 'progressbar', style: 'margin-bottom:20px' },
        h('i', { style: `width:${((idx) / DIAGNOSIS.length * 100).toFixed(1)}%` })),
      h('div', { class: 'q-count' }, `${idx + 1} / ${DIAGNOSIS.length} · ${item.cat}`),
      h('div', { class: 'q-title' }, item.q),
      ...item.opts.map((opt, oi) =>
        h('button', {
          class: 'opt' + (picked === oi ? ' picked' : ''),
          onclick: () => {
            S.diagnosis.answers[idx] = oi
            save()
            setTimeout(next, 160)
          },
        },
          h('span', { class: 'opt-key' }, 'ABCD'[oi]),
          h('span', {}, opt),
        )),
      h('p', { class: 'small', style: 'margin-top:10px;text-align:center' },
        '중간에 나가도 진행 상황은 저장됩니다'),
    )
  }

  function next() {
    if (idx < DIAGNOSIS.length - 1) { idx++; renderQ() }
    else {
      const correct = DIAGNOSIS.reduce((a, item, i) => a + (S.diagnosis.answers[i] === item.a ? 1 : 0), 0)
      S.diagnosis.score = correct * 5
      S.diagnosis.completedAt = new Date().toISOString()
      save()
      go('diagResult')
    }
  }

  renderQ()
  return wrap
})

register('diagResult', () => {
  const score = S.diagnosis.score ?? 0
  const scoreNode = h('span', {}, '0')
  const myBar = h('i', { style: `background:var(--blue);width:0` })
  const peerBar = h('i', { style: `background:#c6cdd5;width:0` })
  requestAnimationFrame(() => {
    countUp(scoreNode, score, { dur: 1300 })
    setTimeout(() => {
      myBar.style.width = score + '%'
      peerBar.style.width = PEER_AVG + '%'
    }, 120)
  })
  const diff = score - PEER_AVG
  const diffText = diff >= 0
    ? `또래 평균보다 ${diff.toFixed(1)}점 높아요. 그래도 방심은 금물 — 아는 것과 버는 건 다릅니다.`
    : `또래 평균보다 ${Math.abs(diff).toFixed(1)}점 낮아요. 괜찮습니다. 여기는 잃어도 되는 곳이니까요.`

  return h('div', { class: 'screen' },
    h('div', { class: 'report-hero' },
      h('div', { class: 'rh-label' }, `${S.user.nickname}님의 금융이해력`),
      h('div', { class: 'rh-num' }, scoreNode, h('span', { style: 'font-size:22px;color:var(--mut)' }, ' / 100')),
    ),
    h('div', { class: 'card' },
      h('div', { class: 'cmp-row' },
        h('div', { class: 'cmp-label' }, h('span', {}, '내 점수'), h('b', {}, score + '점')),
        h('div', { class: 'cmp-bar' }, myBar)),
      h('div', { class: 'cmp-row', style: 'margin-bottom:0' },
        h('div', { class: 'cmp-label' }, h('span', {}, '20대 평균 (한은 2024 조사)'), h('b', {}, PEER_AVG + '점')),
        h('div', { class: 'cmp-bar' }, peerBar)),
      h('hr', { class: 'divider' }),
      h('p', { class: 'desc' }, diffText),
    ),
    h('div', { class: 'card', style: 'background:var(--blue-soft);box-shadow:none' },
      h('p', { style: 'font-size:15px;font-weight:700;color:var(--blue-dark)' }, '이제, 투자를 직접 해보세요'),
      h('p', { class: 'desc', style: 'font-size:13px;margin-top:4px' },
        '설명은 없습니다. 가상 자금 1,000만 원으로 10년치 시장이 시작됩니다. 지금 아는 만큼만 부딪혀보세요.'),
    ),
    h('div', { class: 'cta-area' },
      h('button', { class: 'btn', onclick: () => go('sim') }, '블라인드 투자 시작하기'),
    ),
  )
})
