// 경제 용어 백과사전 + 게이미피케이션 퀴즈 (마이페이지 → 진입)
// 화면: glossary(사전 홈) / glossaryQuiz(퀴즈 허브) / glossaryOX / glossaryMatch / glossaryMeaning
// 규칙: 색·간격은 토큰/유틸, 아이콘은 glyphs 단색 SVG, 조건부 자식은 appendKids, 상태는 S+save().
import { h, appendKids, topbar } from '../ui.js'
import { register, go, onLeave } from '../router.js'
import { S, save } from '../state.js'
import { TERMS, GLOSSARY_CATS, OX_QUESTIONS } from '../glossary-data.js'
import { coinGlyph, flameGlyph, gridGlyph, trophyGlyph, bookGlyph } from '../glyphs.js'

// ---------- 공용 헬퍼 ----------
const shuffle = arr => {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}
const sample = (arr, n) => shuffle(arr).slice(0, n)
const g = () => S.glossary

// 코인·콤보 상단 표시(퀴즈 진행 중)
function scoreBar(coins, streak) {
  return h('div', { class: 'gl-scorebar' },
    h('span', { class: 'gl-coin' }, h('i', { html: coinGlyph(18) }), h('b', {}, String(coins))),
    streak >= 2
      ? h('span', { class: 'gl-combo' }, h('i', { html: flameGlyph(16) }), h('b', {}, `${streak} 콤보`))
      : null,
  )
}

// 한 문제 정답 시 코인 계산: 기본 10 + 콤보 보너스(2연속부터 콤보당 +5)
function coinFor(streak) { return 10 + (streak >= 2 ? (streak - 1) * 5 : 0) }

// 퀴즈 결과 화면(공통) — 코인 적립·최고기록 갱신 후 report-hero로 렌더
// pct(정답률)는 명시적으로 받는다(선긋기는 correct/total로 계산되지 않으므로). heroNum/heroLabel로 표시 문구를 덮어쓸 수 있다.
function renderResult(wrap, { mode, modeLabel, correct, total, earned, maxStreak, retry, pct: pctIn, heroNum, heroLabel }) {
  const pct = pctIn != null ? pctIn : Math.round((correct / total) * 100)
  const st = g()
  const prevBest = st.quiz[mode].best || 0
  const newRecord = pct > prevBest
  st.coins += earned
  st.bestStreak = Math.max(st.bestStreak, maxStreak)
  st.quiz[mode].best = Math.max(prevBest, pct)
  st.quiz[mode].plays = (st.quiz[mode].plays || 0) + 1
  save()

  const grade = heroLabel || (pct >= 90 ? '완벽해요!' : pct >= 70 ? '잘했어요' : pct >= 40 ? '조금만 더!' : '다시 도전!')
  const gradeColor = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--up)'

  wrap.innerHTML = ''
  appendKids(wrap,
    topbar(`${modeLabel} 결과`, () => go('glossaryQuiz')),
    h('div', { class: 'report-hero' },
      h('div', { class: 'gl-trophy', style: `color:${gradeColor}`, html: trophyGlyph(44) }),
      h('div', { class: 'rh-label' }, grade),
      h('div', { class: 'rh-num', style: `color:${gradeColor}` }, heroNum || `${correct} / ${total}`),
      newRecord ? h('span', { class: 'badge blue mt-2', style: 'display:inline-block' }, '최고 기록 경신!') : null,
    ),
    h('div', { class: 'gl-reward card' },
      h('div', { class: 'gl-reward-row' },
        h('span', { class: 'gl-coin big' }, h('i', { html: coinGlyph(22) }), h('b', {}, `+${earned}`)),
        h('span', { class: 'small' }, '이번에 모은 코인'),
      ),
      h('div', { class: 'divider' }),
      h('div', { class: 'my-row' }, h('span', { style: 'color:var(--sub)' }, '최고 콤보'), h('b', {}, `${st.bestStreak} 연속`)),
      h('div', { class: 'my-row' }, h('span', { style: 'color:var(--sub)' }, '총 보유 코인'), h('b', {}, `${st.coins} 코인`)),
    ),
    h('div', { class: 'cta-area' },
      h('button', { class: 'btn', style: 'margin-bottom:10px', onclick: retry }, '한 번 더 풀기'),
      h('button', { class: 'btn secondary', style: 'margin-bottom:10px', onclick: () => go('glossaryQuiz') }, '다른 퀴즈 풀기'),
      h('button', { class: 'btn ghost', onclick: () => go('glossary') }, '사전으로 돌아가기'),
    ),
  )
  window.scrollTo(0, 0)
}

// ==========================================================================
// 사전 홈
// ==========================================================================
register('glossary', () => {
  let cat = '전체'
  let query = ''
  const openIds = new Set()

  const listWrap = h('div', { class: 'gl-list' })

  const markLearned = id => {
    if (!g().learned.includes(id)) { g().learned.push(id); save() }
  }

  const termCard = t => {
    const item = h('div', { class: 'gl-item' + (openIds.has(t.id) ? ' open' : '') })
    const body = h('div', { class: 'gl-body' },
      h('p', { class: 'gl-desc' }, t.desc),
      h('div', { class: 'gl-eg' }, h('span', { class: 'gl-eg-label' }, '예시'), h('p', {}, t.example)),
    )
    const head = h('div', {
      class: 'gl-head',
      onclick: () => {
        const nowOpen = !item.classList.contains('open')
        item.classList.toggle('open', nowOpen)
        if (nowOpen) { markLearned(t.id); if (!item.contains(body)) item.append(body) }
      },
    },
      h('div', { class: 'gl-head-main' },
        h('div', { class: 'gl-term-row' },
          h('b', { class: 'gl-term' }, t.term),
          h('span', { class: 'gl-chevron' }, '⌄'),
        ),
        h('p', { class: 'gl-short' }, t.short),
      ),
    )
    item.append(head)
    if (openIds.has(t.id)) item.append(body)
    return item
  }

  const renderList = () => {
    const q = query.trim().toLowerCase()
    const items = TERMS.filter(t =>
      (cat === '전체' || t.cat === cat) &&
      (!q || t.term.toLowerCase().includes(q) || t.short.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)))
    listWrap.innerHTML = ''
    if (!items.length) {
      listWrap.append(h('div', { class: 'gl-empty' }, h('p', {}, '검색 결과가 없어요.'), h('p', { class: 'small' }, '다른 단어로 찾아보세요.')))
      return
    }
    items.forEach(t => listWrap.append(termCard(t)))
  }

  // 카테고리 칩
  const chips = h('div', { class: 'gl-chips' })
  const cats = ['전체', ...GLOSSARY_CATS]
  const chipEls = cats.map(c => {
    const el = h('button', { class: 'gl-chip' + (c === cat ? ' active' : ''), onclick: () => {
      cat = c
      chipEls.forEach((e, i) => e.classList.toggle('active', cats[i] === cat))
      renderList()
    } }, c)
    chips.append(el)
    return el
  })

  const learnedCount = g().learned.length
  const searchInput = h('input', {
    class: 'gl-search', type: 'search', placeholder: '용어 검색 (예: 복리, ETF)', value: query,
    oninput: e => { query = e.target.value; renderList() },
  })

  renderList()

  return h('div', { class: 'screen' },
    topbar('경제 용어 사전', () => go('my')),
    // 헤더 요약 — 학습 진행 + 보유 코인
    h('div', { class: 'gl-hero' },
      h('div', { class: 'gl-hero-ico', html: gridGlyph(24) }),
      h('div', { style: 'flex:1' },
        h('b', {}, '투자·경제 기초 용어집'),
        h('p', { class: 'small' }, `${TERMS.length}개 용어 · ${learnedCount}개 학습함`),
      ),
      h('span', { class: 'gl-coin' }, h('i', { html: coinGlyph(18) }), h('b', {}, String(g().coins))),
    ),
    // 퀴즈 진입 배너
    h('div', { class: 'gl-quiz-banner', onclick: () => go('glossaryQuiz') },
      h('div', { style: 'flex:1' },
        h('div', { class: 'nc-label' }, '게임처럼 익히기'),
        h('b', {}, '퀴즈로 복습하고 코인 모으기'),
        h('p', {}, 'OX · 선긋기 · 뜻 맞히기'),
      ),
      h('span', { class: 'gl-quiz-arrow' }, '→'),
    ),
    searchInput,
    chips,
    listWrap,
    h('p', { class: 'disclaimer' }, '학습용 정의입니다. 실제 투자·세무 판단 시에는 최신 제도와 전문가 확인이 필요해요.'),
  )
})

// ==========================================================================
// 퀴즈 허브
// ==========================================================================
register('glossaryQuiz', () => {
  const st = g()
  const modeCard = (mode, title, desc, screen) => {
    const best = st.quiz[mode].best || 0
    const plays = st.quiz[mode].plays || 0
    return h('div', { class: 'card gl-mode', style: 'cursor:pointer', onclick: () => go(screen) },
      h('div', { class: 'gl-mode-body' },
        h('b', {}, title),
        h('p', { class: 'small', style: 'margin-top:2px' }, desc),
      ),
      h('div', { class: 'gl-mode-best' },
        plays ? h('span', { class: 'badge green' }, `최고 ${best}%`) : h('span', { class: 'badge gray' }, '미도전'),
        h('span', { class: 'gl-mode-arrow' }, '→'),
      ),
    )
  }

  return h('div', { class: 'screen' },
    topbar('용어 퀴즈', () => go('glossary')),
    h('div', { class: 'gl-hero' },
      h('div', { class: 'gl-hero-ico', style: 'color:var(--amber)', html: flameGlyph(22) }),
      h('div', { style: 'flex:1' },
        h('b', {}, '복습하고 코인 모으기'),
        h('p', { class: 'small' }, `보유 ${st.coins}코인 · 최고 콤보 ${st.bestStreak}연속`),
      ),
      h('span', { class: 'gl-coin' }, h('i', { html: coinGlyph(18) }), h('b', {}, String(st.coins))),
    ),
    h('h2', { class: 'section' }, '퀴즈 고르기'),
    modeCard('ox', 'OX 퀴즈', '맞으면 O, 틀리면 X. 빠르게 판단해요.', 'glossaryOX'),
    modeCard('match', '선긋기', '용어와 뜻을 짝지어 연결해요.', 'glossaryMatch'),
    modeCard('meaning', '뜻 맞히기', '용어의 올바른 정의를 4개 중에 골라요.', 'glossaryMeaning'),
    h('p', { class: 'disclaimer' }, '정답률이 최고 기록으로 저장돼요. 연속 정답(콤보)을 쌓으면 코인을 더 받아요.'),
  )
})

// ==========================================================================
// OX 퀴즈
// ==========================================================================
register('glossaryOX', () => {
  const N = 7
  const items = sample(OX_QUESTIONS, Math.min(N, OX_QUESTIONS.length))
  let idx = 0, correct = 0, coins = 0, streak = 0, maxStreak = 0, answered = false
  const wrap = h('div', { class: 'screen' })

  function paint() {
    answered = false
    const item = items[idx]
    wrap.innerHTML = ''
    const feedback = h('div', {})

    const choose = pick => {
      if (answered) return
      answered = true
      const isRight = pick === item.a
      if (isRight) { correct++; streak++; maxStreak = Math.max(maxStreak, streak) }
      else { streak = 0 }
      const earned = isRight ? coinFor(streak) : 0
      coins += earned

      // 정답인 쪽엔 correct, 사용자가 고른 오답 쪽엔 wrong. 빈 문자열 add는 예외를 던지므로 분기.
      const markSide = (btn, isCorrectSide, isPickedSide) => {
        if (isCorrectSide) btn.classList.add('correct')
        else if (isPickedSide) btn.classList.add('wrong')
      }
      markSide(oBtn, item.a === true, pick === true)
      markSide(xBtn, item.a === false, pick === false)
      oBtn.disabled = xBtn.disabled = true

      appendKids(feedback,
        h('div', { class: 'explain mt-4' },
          h('b', { style: isRight ? 'color:var(--green)' : 'color:var(--up)' }, isRight ? '정답! ' : '오답. '),
          item.explain,
          isRight ? h('span', { class: 'gl-earn' }, ` +${earned}코인${streak >= 2 ? ` · ${streak}콤보` : ''}`) : null,
        ),
        h('button', {
          class: 'btn mt-4',
          onclick: () => { if (idx < items.length - 1) { idx++; paint() } else finish() },
        }, idx < items.length - 1 ? '다음 문제' : '결과 보기'),
      )
      window.scrollTo(0, document.body.scrollHeight)
    }

    const oBtn = h('button', { class: 'gl-ox o', onclick: () => choose(true) }, h('span', { class: 'gl-ox-mark' }, 'O'), h('span', { class: 'gl-ox-label' }, '맞다'))
    const xBtn = h('button', { class: 'gl-ox x', onclick: () => choose(false) }, h('span', { class: 'gl-ox-mark' }, 'X'), h('span', { class: 'gl-ox-label' }, '아니다'))

    wrap.append(
      topbar('OX 퀴즈', () => go('glossaryQuiz')),
      scoreBar(coins, streak),
      h('div', { class: 'q-count', style: 'margin-top:8px' }, `${idx + 1} / ${items.length}`),
      h('div', { class: 'gl-ox-stmt' }, item.s),
      h('div', { class: 'gl-ox-row' }, oBtn, xBtn),
      feedback,
    )
    window.scrollTo(0, 0)
  }

  function finish() {
    renderResult(wrap, {
      mode: 'ox', modeLabel: 'OX 퀴즈', correct, total: items.length, earned: coins, maxStreak,
      retry: () => go('glossaryOX'),
    })
  }

  paint()
  return wrap
})

// ==========================================================================
// 선긋기 (매칭) — 용어 ↔ 뜻을 탭으로 짝짓고, 맞으면 선이 이어진다
// ==========================================================================
register('glossaryMatch', () => {
  const PAIRS = 5
  const picked = sample(TERMS, PAIRS)
  const left = shuffle(picked)                 // 용어 열
  const right = shuffle(picked)                // 뜻 열 (섞임)
  let misses = 0
  const matched = new Set()                    // 짝지은 term id
  let sel = null                               // { side, id, el }
  const lines = []                             // { a, b } 매칭된 카드 쌍(선 그리기용)

  const wrap = h('div', { class: 'screen' })
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'gl-match-svg')
  const board = h('div', { class: 'gl-match' })
  board.append(svg)

  const drawLines = () => {
    const cr = board.getBoundingClientRect()
    svg.setAttribute('viewBox', `0 0 ${cr.width} ${cr.height}`)
    let out = ''
    for (const { a, b } of lines) {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
      const x1 = ra.right - cr.left, y1 = ra.top - cr.top + ra.height / 2
      const x2 = rb.left - cr.left, y2 = rb.top - cr.top + rb.height / 2
      out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round"/>`
      out += `<circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="4" fill="var(--green)"/><circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="4" fill="var(--green)"/>`
    }
    svg.innerHTML = out
  }

  const clearSel = () => {
    if (sel) sel.el.classList.remove('sel')
    sel = null
  }

  const finish = () => {
    // 매칭은 항상 5쌍을 완성하므로 정답률은 실수(misses) 기반으로 계산해 명시적으로 넘긴다.
    const pct = Math.max(0, 100 - misses * 10)
    const earned = Math.max(10, Math.round(pct))
    renderResult(wrap, {
      mode: 'match', modeLabel: '선긋기', correct: PAIRS, total: PAIRS, earned, maxStreak: 0,
      retry: () => go('glossaryMatch'),
      pct, heroNum: `${pct}%`, heroLabel: misses === 0 ? '한 번도 안 틀렸어요!' : `실수 ${misses}번`,
    })
  }

  const tryMatch = (a, b) => {
    // a, b: 각각 {side,id,el}. 같은 term id면 정답.
    const first = a.side === 'L' ? a : b
    const second = a.side === 'L' ? b : a
    if (first.id === second.id) {
      matched.add(first.id)
      first.el.classList.remove('sel'); second.el.classList.remove('sel')
      first.el.classList.add('done'); second.el.classList.add('done')
      lines.push({ a: first.el, b: second.el })
      drawLines()
      sel = null
      if (matched.size === PAIRS) setTimeout(finish, 450)
    } else {
      misses++
      const wrongEls = [first.el, second.el]
      wrongEls.forEach(el => el.classList.add('miss'))
      const keep = sel
      setTimeout(() => {
        wrongEls.forEach(el => el.classList.remove('miss'))
        if (keep) keep.el.classList.remove('sel')
      }, 450)
      sel = null
    }
  }

  const cardClick = (side, id, el) => {
    if (matched.has(id) || el.classList.contains('done')) return
    if (!sel) { sel = { side, id, el }; el.classList.add('sel'); return }
    if (sel.el === el) { clearSel(); return }        // 같은 카드 재탭 → 해제
    if (sel.side === side) {                          // 같은 열 다른 카드 → 선택 이동
      sel.el.classList.remove('sel'); sel = { side, id, el }; el.classList.add('sel'); return
    }
    tryMatch(sel, { side, id, el })                  // 반대 열 → 매칭 판정
  }

  const col = (side, list, render) => {
    const c = h('div', { class: 'gl-col' })
    list.forEach(t => {
      const el = h('div', { class: 'gl-card' + (side === 'L' ? ' term' : ' def') })
      el.append(render(t))
      el.addEventListener('click', () => cardClick(side, t.id, el))
      c.append(el)
    })
    return c
  }

  board.append(
    col('L', left, t => h('b', {}, t.term)),
    col('R', right, t => h('span', {}, t.short)),
  )

  wrap.append(
    topbar('선긋기', () => go('glossaryQuiz')),
    h('p', { class: 'desc', style: 'margin-bottom:14px' }, '왼쪽 용어를 누르고, 오른쪽에서 알맞은 뜻을 누르면 선으로 이어져요.'),
    board,
  )

  // 레이아웃 확정 후 첫 그리기 + 리사이즈 대응
  requestAnimationFrame(drawLines)
  const onResize = () => drawLines()
  window.addEventListener('resize', onResize)
  onLeave(() => window.removeEventListener('resize', onResize))

  return wrap
})

// ==========================================================================
// 뜻 맞히기 (4지선다) — 용어를 주고 올바른 정의를 고른다
// ==========================================================================
register('glossaryMeaning', () => {
  const N = 7
  const picked = sample(TERMS, Math.min(N, TERMS.length))
  const questions = picked.map(t => {
    const distractors = sample(TERMS.filter(x => x.id !== t.id), 3).map(x => x.short)
    const opts = shuffle([t.short, ...distractors])
    return { term: t.term, opts, a: opts.indexOf(t.short) }
  })
  let idx = 0, correct = 0, coins = 0, streak = 0, maxStreak = 0, answered = false
  const wrap = h('div', { class: 'screen' })

  function paint() {
    answered = false
    const item = questions[idx]
    wrap.innerHTML = ''
    const opts = []
    const feedback = h('div', {})

    item.opts.forEach((opt, oi) => {
      const btn = h('button', { class: 'opt', onclick: () => {
        if (answered) return
        answered = true
        const isRight = oi === item.a
        if (isRight) { correct++; streak++; maxStreak = Math.max(maxStreak, streak) } else { streak = 0 }
        const earned = isRight ? coinFor(streak) : 0
        coins += earned
        opts.forEach((b, bi) => {
          b.disabled = true
          if (bi === item.a) { b.classList.add('correct'); b.append(h('span', { class: 'mark ok' }, '✓')) }
          else if (bi === oi) { b.classList.add('wrong'); b.append(h('span', { class: 'mark no' }, '✕')) }
        })
        appendKids(feedback,
          h('div', { class: 'explain' },
            h('b', { style: isRight ? 'color:var(--green)' : 'color:var(--up)' }, isRight ? '정답! ' : '오답. '),
            `"${item.term}"의 뜻은 「${item.opts[item.a]}」`,
            isRight ? h('span', { class: 'gl-earn' }, ` +${earned}코인${streak >= 2 ? ` · ${streak}콤보` : ''}`) : null,
          ),
          h('button', { class: 'btn mt-4', onclick: () => { if (idx < questions.length - 1) { idx++; paint() } else finish() } },
            idx < questions.length - 1 ? '다음 문제' : '결과 보기'),
        )
      } }, h('span', { class: 'opt-key' }, 'ABCD'[oi]), h('span', {}, opt))
      opts.push(btn)
    })

    wrap.append(
      topbar('뜻 맞히기', () => go('glossaryQuiz')),
      scoreBar(coins, streak),
      h('div', { class: 'q-count', style: 'margin-top:8px' }, `${idx + 1} / ${questions.length}`),
      h('div', { class: 'gl-meaning-q' },
        h('span', { class: 'gl-meaning-ico', html: bookGlyph(20) }),
        h('b', {}, item.term),
      ),
      h('p', { class: 'small', style: 'margin:-6px 0 16px' }, '이 용어의 올바른 뜻은?'),
      ...opts,
      feedback,
    )
    window.scrollTo(0, 0)
  }

  function finish() {
    renderResult(wrap, {
      mode: 'meaning', modeLabel: '뜻 맞히기', correct, total: questions.length, earned: coins, maxStreak,
      retry: () => go('glossaryMeaning'),
    })
  }

  paint()
  return wrap
})
