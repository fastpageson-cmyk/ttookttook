// 화면 3-3 사전 진단 20문항 · 3-4 진단 결과 (또래 비교 + 카운트업)
import { h, countUp } from '../ui.js'
import { register, go } from '../router.js'
import { S, save } from '../state.js'
import { DIAGNOSIS, PEER_AVG, categoryBreakdown, personaForScore } from '../content.js'

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
      // 진행 표시는 카운터("N / 20") 하나로 충분 — 줄형 progressbar는 같은 정보의 중복이었다
      h('div', { class: 'q-count', style: 'margin-top:8px' }, `${idx + 1} / ${DIAGNOSIS.length} · ${item.cat}`),
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
      // 재측정(졸업 후)일 때 최초 점수를 보존해 성장 비교에 쓴다
      if (S.diagnosis.completedAt && S.diagnosis.firstScore == null) {
        S.diagnosis.firstScore = S.diagnosis.score
      }
      S.diagnosis.score = correct * 5
      S.diagnosis.completedAt = new Date().toISOString()
      save()
      go('diagResult')
    }
  }

  renderQ()
  return wrap
})

// 진단 결과 — 카드뉴스 3스텝(한 화면 = 한 의미). 다음 버튼 또는 좌우 스와이프로 넘긴다.
//   ① 내 위치(점수·페르소나·또래비교)  ② 영역별 이해도  ③ 틀린 문항 다시 보기
register('diagResult', () => {
  const score = S.diagnosis.score ?? 0
  const diff = score - PEER_AVG
  const diffText = diff >= 0
    ? `또래 평균보다 ${diff.toFixed(1)}점 높아요. 그래도 방심은 금물 — 아는 것과 버는 건 다릅니다.`
    : `또래 평균보다 ${Math.abs(diff).toFixed(1)}점 낮아요. 괜찮습니다. 여기는 잃어도 되는 곳이니까요.`
  const persona = personaForScore(score)
  const cats = categoryBreakdown(S.diagnosis.answers)
  const wrong = DIAGNOSIS
    .map((q, i) => ({ q, i, picked: S.diagnosis.answers[i] }))
    .filter(({ q, picked }) => picked !== q.a)
  const first = S.diagnosis.firstScore   // 졸업 후 재측정이면 성장 비교
  const grew = first != null ? score - first : null

  // ---------- 스텝 1: 내 위치 ----------
  const stepMe = () => {
    const scoreNode = h('span', {}, '0')
    const myBar = h('i', { style: 'background:var(--blue);width:0' })
    const peerBar = h('i', { style: 'background:var(--line-strong);width:0' })
    requestAnimationFrame(() => {
      countUp(scoreNode, score, { dur: 1100 })
      setTimeout(() => { myBar.style.width = score + '%'; peerBar.style.width = PEER_AVG + '%' }, 120)
    })
    return h('div', {},
      h('div', { class: 'report-hero', style: 'padding-top:8px' },
        h('div', { class: 'rh-label' }, `${S.user.nickname}님의 금융이해력`),
        h('div', { class: 'rh-num' }, scoreNode, h('span', { style: 'font-size:22px;color:var(--mut)' }, ' / 100')),
      ),
      first != null ? h('div', { class: 'card retest-card' },
        h('div', { class: 'retest-row' },
          h('div', { class: 'retest-col' }, h('span', { class: 'small' }, '6주 전'), h('b', {}, `${first}점`)),
          h('span', { class: 'retest-arrow' }, '→'),
          h('div', { class: 'retest-col' }, h('span', { class: 'small' }, '지금'), h('b', { style: 'color:var(--blue)' }, `${score}점`)),
          h('div', { class: 'retest-delta' + (grew >= 0 ? ' up' : '') }, grew >= 0 ? `+${grew}점` : `${grew}점`)),
        h('p', { class: 'small tac', style: 'margin-top:12px' },
          grew > 0 ? '6주가 숫자로 남았습니다. 먼저 잃고, 정말 똑똑해졌네요.'
            : grew === 0 ? '점수는 그대로지만, 이제 왜 그런지 설명할 수 있습니다.'
              : '점수에 일희일비하지 마세요 — 중요한 건 판단의 기준이 생겼다는 것입니다.'),
      ) : null,
      persona ? h('div', { class: 'card persona-card' },
        h('div', { class: 'small' }, '나의 학습 유형'),
        h('b', { class: 'persona-name' }, persona.name),
        h('p', { class: 'desc', style: 'margin-top:12px' }, persona.desc),
        h('div', { class: 'persona-guide' }, persona.guide),
      ) : null,
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
    )
  }

  // ---------- 스텝 2: 영역별 이해도 ----------
  const stepCats = () => h('div', {},
    h('h2', { class: 'section', style: 'margin-top:4px' }, '영역별 이해도'),
    h('p', { class: 'small', style: 'margin:-8px 0 12px' }, '강할수록 초록, 약할수록 빨강. 약한 영역은 앞으로 강의에서 다시 짚습니다.'),
    h('div', { class: 'card' },
      cats.map((c, ci) => {
        const rate = c.correct / c.total
        const color = rate >= 0.7 ? 'var(--green)' : rate <= 0.34 ? 'var(--up)' : 'var(--amber)'
        return h('div', { class: 'cat-row' + (ci === cats.length - 1 ? ' last' : '') },
          h('div', { class: 'cat-head' },
            h('span', {}, c.cat),
            h('b', { style: `color:${color}` }, `${c.correct}/${c.total}`)),
          h('div', { class: 'cat-bar' }, h('i', { style: `width:${(rate * 100).toFixed(0)}%;background:${color}` })),
        )
      }),
    ),
  )

  // ---------- 스텝 3: 틀린 문항 다시 보기 ----------
  const stepWrong = () => wrong.length ? h('div', {},
    h('h2', { class: 'section', style: 'margin-top:4px' }, `틀린 문항 다시 보기 (${wrong.length})`),
    h('p', { class: 'small', style: 'margin:-8px 0 12px' }, '지금 몰라도 괜찮아요. 관련 개념은 앞으로 강의에서 다룹니다.'),
    wrong.map(({ q, picked }) => h('div', { class: 'card wrong-card' },
      h('div', { class: 'small' }, q.cat),
      h('b', { class: 'wq', style: 'display:block;margin:4px 0 10px' }, q.q),
      h('div', { class: 'wrong-line no' }, `내 답: ${'ABCD'[picked] || '-'}. ${q.opts[picked] ?? '무응답'}`),
      h('div', { class: 'wrong-line ok' }, `정답: ${'ABCD'[q.a]}. ${q.opts[q.a]}`),
      h('div', { class: 'explain', style: 'margin-top:10px' }, q.explain),
    )),
  ) : h('div', {},
    h('h2', { class: 'section', style: 'margin-top:4px' }, '진단 요약'),
    h('div', { class: 'card', style: 'background:var(--green-soft);box-shadow:none' },
      h('p', { style: 'font-weight:700;color:var(--green-ink)' }, '20문항 전부 정답! 기본기가 탄탄하네요.')),
  )

  const STEPS = [
    { label: '내 위치', node: stepMe },
    { label: '영역별 이해도', node: stepCats },
    { label: wrong.length ? '틀린 문항' : '진단 요약', node: stepWrong },
  ]

  let step = 0
  const wrap = h('div', { class: 'screen' })

  function goStep(next) {
    step = Math.max(0, Math.min(STEPS.length - 1, next))
    paint()
    window.scrollTo(0, 0)
  }

  function paint() {
    const isLast = step === STEPS.length - 1
    const content = h('div', { class: 'cn-content' }, STEPS[step].node())
    // 좌우 스와이프로 넘기기
    let x0 = null
    content.addEventListener('touchstart', e => { x0 = e.touches[0].clientX }, { passive: true })
    content.addEventListener('touchend', e => {
      if (x0 == null) return
      const dx = e.changedTouches[0].clientX - x0
      if (dx < -45) goStep(step + 1)
      else if (dx > 45) goStep(step - 1)
      x0 = null
    }, { passive: true })

    wrap.innerHTML = ''
    wrap.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn-back', onclick: () => step > 0 ? goStep(step - 1) : go('home') }, '‹'),
        h('div', { class: 'tb-title' }, '진단 결과'),
        h('div', { class: 'cn-dots', style: 'margin-left:auto' },
          STEPS.map((_, i) => h('i', { class: i === step ? 'on' : '' }))),
      ),
      content,
      h('div', { class: 'cta-area' },
        h('div', { class: 'btn-row' },
          step > 0 ? h('button', { class: 'btn secondary', onclick: () => goStep(step - 1) }, '이전') : null,
          isLast
            ? (first != null
                ? h('button', { class: 'btn', onclick: () => go('graduation') }, '졸업 리포트로 돌아가기')
                : h('button', { class: 'btn', onclick: () => go('sim') }, '블라인드 투자 시작하기'))
            : h('button', { class: 'btn', onclick: () => goStep(step + 1) }, '다음'),
        ),
      ),
    )
  }

  paint()
  return wrap
})
