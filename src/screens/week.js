// 주차 공통 화면 — 강의 카드 / 실습 허브 / 확인 퀴즈
// 1주차만 개별 실습 3종(prac1~3)을 갖고, 모든 주차는 실습 마지막에 미니 모의투자가 붙는다.
import { h, appendKids } from '../ui.js'
import { register, go } from '../router.js'
import { S, week, save } from '../state.js'
import { QUIZ_PASS, missedForWeek } from '../content.js'
import { byId, WEEKS, practiceCount, allPracticesDone } from '../weeks/index.js'

// ---------- 강의 카드 ----------
register('lecture', (params = {}) => {
  const w = byId(params.week ?? 1)
  const st = week(w.id)
  const cards = w.cards
  let idx = Math.min(Math.max(params.card ?? 0, 0), cards.length - 1)
  const wrap = h('div', { class: 'screen' })

  function markViewed(i) {
    if (!st.cardsViewed.includes(i)) { st.cardsViewed.push(i); save() }
  }

  // 진단에서 이 주차 개념을 틀렸던 문항 — 첫 카드에서 한 번만 짚어준다
  const missed = missedForWeek(S.diagnosis.answers, w.id)

  function paint() {
    markViewed(idx)
    const c = cards[idx]
    wrap.innerHTML = ''
    appendKids(wrap,
      h('div', { class: 'topbar' },
        h('button', { class: 'btn-back', onclick: () => go('home') }, '‹'),
        h('div', { class: 'tb-title' }, `${w.id}주차 · ${w.title}`),
      ),
      idx === 0 && missed.length
        ? h('div', { class: 'diag-recall' },
            h('b', {}, `진단에서 놓친 개념 ${missed.length}가지`),
            h('p', { class: 'small' }, '이번 주차에서 다시 나옵니다. 이번엔 확실히 잡고 가요.'),
            h('ul', {}, missed.map(({ q }) => h('li', {}, q.q))),
          )
        : null,
      // 진행 표시는 카드 안 eyebrow("카드 N / M") 하나로 — 줄형 progressbar 제거(중복)
      h('div', { class: 'card lecture-card', style: 'margin-top:8px' },
        h('div', { class: 'eyebrow' }, `카드 ${idx + 1} / ${cards.length}`),
        h('div', { class: 'lc-title' }, c.title),
        // 인포그래픽: figure(인라인 SVG · 디자인 토큰 색) 우선, 없으면 기존 img
        c.figure ? h('figure', { class: 'lc-figure', html: c.figure }) : c.img ? h('img', { src: c.img, alt: c.title }) : null,
        (c.paras || []).map(p => h('p', {}, p)),
        c.bullets ? h('ul', {}, c.bullets.map(b => h('li', {}, b))) : null,
        c.note ? h('div', { class: 'note' }, c.note) : null,
      ),
      // 진행 표시는 상단 진행바 + "카드 n/N" 카운터 둘로 충분 — 점 줄(lc-dots)은 같은 정보의 3중 표기였다
      h('div', { class: 'lc-nav' },
        h('button', { class: 'btn secondary', disabled: idx === 0, onclick: () => { idx--; paint() } }, '이전'),
        idx < cards.length - 1
          ? h('button', { class: 'btn', onclick: () => { idx++; paint() } }, '다음')
          : h('button', { class: 'btn', onclick: () => go('practices', { week: w.id }) }, '강의 완료 → 실습하기'),
      ),
    )
    window.scrollTo(0, 0)
  }
  paint()
  return wrap
})

// ---------- 실습 허브 ----------
register('practices', (params = {}) => {
  const w = byId(params.week ?? 1)
  const st = week(w.id)
  const items = w.practices || []
  const { done, total } = practiceCount(w)

  // 카드에는 제목·설명·상태 뱃지만 — "실습 N" 번호가 이미 구분자라 아이콘은 중복 장식이었다
  const item = (isDone, title, desc, screen, extraClass = '') =>
    h('div', { class: 'card' + extraClass, style: 'cursor:pointer', onclick: () => go(screen, { week: w.id }) },
      h('div', { class: 'prac-row' },
        h('div', { style: 'flex:1' },
          h('b', { style: 'font-size:16px' }, title),
          h('p', { class: 'small', style: 'margin-top:2px' }, desc)),
        h('span', { class: 'badge ' + (isDone ? 'green' : 'blue') }, isDone ? '완료' : '하러 가기'),
      ))

  return h('div', { class: 'screen' },
    h('div', { class: 'topbar' },
      h('button', { class: 'btn-back', onclick: () => go('home') }, '‹'),
      h('div', { class: 'tb-title' }, `${w.id}주차 실습`),
    ),
    // 진행 카운터는 하단 버튼 한 곳에만 둔다(설명문과의 2중 표기 제거)
    h('p', { class: 'desc', style: 'margin-bottom:16px' },
      total === 1
        ? '배운 개념을 바로 손으로 확인해봅니다. 미니 모의투자를 마치면 확인 퀴즈가 열립니다.'
        : `배운 개념을 바로 손으로 확인해봅니다. ${total}개를 모두 완료하면 확인 퀴즈가 열립니다.`),
    items.map((p, i) => item(!!st.practices[p.key], p.title, p.desc, p.screen)),
    // 실습의 마지막은 항상 미니 모의투자 — 그 주차에서 배운 개념을 직접 굴려본다
    h('div', { class: 'ms-divider' }, h('span', {}, '마무리 · 미니 모의투자')),
    item(st.miniSim.done, w.miniSim.navTitle, w.miniSim.navDesc, 'mini' + w.id, ' ms-entry'),
    st.miniSim.done && st.miniSim.result
      ? h('p', { class: 'small ms-last' }, `지난 결과: ${st.miniSim.result.headline}`)
      : null,
    h('div', { class: 'cta-area' },
      h('button', {
        class: 'btn', disabled: !allPracticesDone(w),
        onclick: () => go('quiz', { week: w.id }),
      }, allPracticesDone(w) ? '확인 퀴즈 풀러 가기' : `실습을 모두 완료하면 열립니다 (${done}/${total})`),
    ),
  )
})

// ---------- 확인 퀴즈 ----------
register('quiz', (params = {}) => {
  const w = byId(params.week ?? 1)
  const st = week(w.id)
  const QUIZ = w.quiz
  let idx = 0
  let score = 0
  let answered = false
  const wrap = h('div', { class: 'screen' })

  function paintQ() {
    answered = false
    const item = QUIZ[idx]
    const opts = []
    wrap.innerHTML = ''

    const explainBox = h('div', {})
    item.opts.forEach((opt, oi) => {
      const btn = h('button', {
        class: 'opt',
        onclick: () => {
          if (answered) return
          answered = true
          const correct = oi === item.a
          if (correct) score++
          opts.forEach((b, bi) => {
            b.disabled = true
            if (bi === item.a) {
              b.classList.add('correct')
              b.append(h('span', { class: 'mark ok' }, '✓'))
            } else if (bi === oi) {
              b.classList.add('wrong')
              b.append(h('span', { class: 'mark no' }, '✕'))
            }
          })
          explainBox.append(
            h('div', { class: 'explain' },
              h('b', { style: correct ? 'color:var(--green)' : 'color:var(--up)' }, correct ? '정답! ' : '오답. '),
              item.explain,
              !correct && item.card != null ? h('button', {
                class: 'btn ghost', style: 'width:auto;display:inline;padding:0 0 0 6px;font-size:14px;color:var(--blue)',
                onclick: () => go('lecture', { week: w.id, card: item.card }),
              }, `→ 카드 ${item.card + 1} 다시 보기`) : null,
            ),
            h('div', { class: 'mt-4' },
              h('button', {
                class: 'btn',
                onclick: () => { if (idx < QUIZ.length - 1) { idx++; paintQ() } else finish() },
              }, idx < QUIZ.length - 1 ? '다음 문제' : '결과 보기')),
          )
        },
      }, h('span', { class: 'opt-key' }, 'ABCD'[oi]), h('span', {}, opt))
      opts.push(btn)
    })

    wrap.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn-back', onclick: () => go('home') }, '‹'),
        h('div', { class: 'tb-title' }, `${w.id}주차 확인 퀴즈`),
      ),
      // 진행 표시는 카운터 하나로 — 줄형 progressbar 제거(중복)
      h('div', { class: 'q-count', style: 'margin-top:8px' }, `${idx + 1} / ${QUIZ.length}`),
      h('div', { class: 'q-title' }, item.q),
      ...opts,
      explainBox,
    )
    window.scrollTo(0, 0)
  }

  function finish() {
    const passed = score >= QUIZ_PASS
    st.quiz.attempts++
    st.quiz.lastScore = score
    if (passed) st.quiz.passed = true
    save()
    const isLast = w.id === WEEKS[WEEKS.length - 1].id
    const nextWeek = WEEKS.find(x => x.id === w.id + 1)
    wrap.innerHTML = ''
    appendKids(wrap,
      h('div', { class: 'report-hero' },
        h('div', { class: 'rh-label' }, '퀴즈 결과'),
        h('div', { class: 'rh-num', style: passed ? 'color:var(--green)' : 'color:var(--up)' }, `${score} / ${QUIZ.length}`),
        h('p', { class: 'desc', style: 'margin-top:10px' },
          passed
            ? isLast
              ? '축하합니다. 「똑똑」 6주 과정을 모두 마쳤습니다.'
              : `통과! ${w.id}주차를 완료했습니다. ${nextWeek ? `${nextWeek.id}주차 「${nextWeek.title}」가 열렸어요.` : ''}`
            : `${QUIZ_PASS}개 이상 맞혀야 통과할 수 있어요. 틀린 개념의 강의 카드를 다시 본 뒤 도전해보세요.`),
      ),
      passed
        ? h('div', { class: 'card', style: 'text-align:center;background:var(--green-soft);box-shadow:none' },
            h('b', {}, `${w.id}주차 · ${w.title}`),
            h('p', { class: 'small', style: 'margin-top:4px' },
              isLast ? '먼저 잃고, 똑똑해졌습니다' : '먼저 잃고, 조금 더 똑똑해졌습니다'))
        : null,
      h('div', { class: 'cta-area' },
        passed
          ? h('div', {},
              nextWeek
                ? h('button', {
                    class: 'btn', style: 'margin-bottom:10px',
                    onclick: () => go('lecture', { week: nextWeek.id }),
                  }, `${nextWeek.id}주차 시작하기`)
                : h('button', {
                    class: 'btn', style: 'margin-bottom:10px',
                    onclick: () => go('graduation'),
                  }, '졸업 리포트 보기'),
              h('button', { class: 'btn secondary', onclick: () => go('home') }, '홈으로'))
          : h('div', {},
              h('button', { class: 'btn secondary', style: 'margin-bottom:10px', onclick: () => go('lecture', { week: w.id }) }, '강의 다시 보기'),
              h('button', { class: 'btn', onclick: () => { idx = 0; score = 0; paintQ() } }, '다시 풀기')),
      ),
    )
  }

  paintQ()
  return wrap
})
