// 화면 3-8 홈/대시보드 · 3-9 1주차 강의 · 3-11 확인 퀴즈 · 3-12 마이페이지
import { h, fmt, pct, numClass, openSheet } from '../ui.js'
import { register, go, tabbar } from '../router.js'
import { S, save, resetAll } from '../state.js'
import { LECTURE_CARDS, QUIZ, QUIZ_PASS, DISCLAIMER, SLOGAN } from '../content.js'

// ---------- 홈 ----------
function nextAction() {
  if (!S.diagnosis.completedAt) return { label: '사전 진단 받기', desc: '20문항 · 약 5분', screen: 'diag', step: '0단계' }
  if (S.simulation.status !== 'ended') return {
    label: S.simulation.status === 'in_progress' ? '블라인드 투자 이어하기' : '블라인드 투자 시작하기',
    desc: '가상 자금 1,000만 원 · 10년', screen: 'sim', step: '0단계',
  }
  if (S.week1.cardsViewed.length < LECTURE_CARDS.length) return {
    label: '거시경제 강의 보기', desc: `카드 ${S.week1.cardsViewed.length}/${LECTURE_CARDS.length} 완료`, screen: 'lecture', step: '1주차',
  }
  const pr = S.week1.practices
  const done = [pr.review0, pr.rateCutReplay, pr.fxWidget].filter(Boolean).length
  if (done < 3) return { label: '실습하기', desc: `실습 ${done}/3 완료`, screen: 'practices', step: '1주차' }
  if (!S.week1.quiz.passed) return { label: '확인 퀴즈 풀기', desc: `5문항 중 ${QUIZ_PASS}개 이상 통과`, screen: 'quiz', step: '1주차' }
  return { label: '1주차 완료! 🎉', desc: '2주차(저축과 제도)는 준비 중입니다', screen: null, step: '완료' }
}

register('home', () => {
  const na = nextAction()
  const pr = S.week1.practices
  const pracDone = [pr.review0, pr.rateCutReplay, pr.fxWidget].filter(Boolean).length

  const step = (ico, title, sub, state, screen) =>
    h('div', {
      class: 'step-row' + (state === 'locked' ? ' locked' : ''),
      onclick: () => { if (state !== 'locked' && screen) go(screen) },
    },
      h('div', { class: 'st-ico ' + (state === 'done' ? 'done' : state === 'now' ? 'now' : '') },
        state === 'done' ? '✅' : ico),
      h('div', { class: 'st-body' }, h('b', {}, title), h('span', {}, sub)),
      state === 'locked' ? h('span', { class: 'badge gray' }, '잠김') :
        state === 'done' ? h('span', { class: 'badge green' }, '완료') :
          state === 'now' ? h('span', { class: 'badge blue' }, '진행 중') : null,
    )

  const diagDone = !!S.diagnosis.completedAt
  const simDone = S.simulation.status === 'ended'
  const lecDone = S.week1.cardsViewed.length >= LECTURE_CARDS.length
  const quizDone = S.week1.quiz.passed

  return h('div', { class: 'screen has-tabbar' },
    h('div', { class: 'home-greet' },
      h('h1', { class: 'hero', style: 'font-size:22px' }, `안녕하세요, ${S.user.nickname}님`),
      h('p', { class: 'small', style: 'margin-top:4px' }, SLOGAN),
    ),
    h('div', { class: 'next-card', onclick: () => { if (na.screen) go(na.screen) } },
      h('div', { class: 'nc-label' }, `다음 액션 · ${na.step}`),
      h('b', {}, na.label),
      h('p', {}, na.desc),
    ),
    h('h2', { class: 'section' }, '나의 진도'),
    h('div', { class: 'card', style: 'padding:6px 20px' },
      step('📝', '사전 진단', diagDone ? `${S.diagnosis.score}점 (또래 평균 62.6점)` : '금융이해력 20문항', diagDone ? 'done' : 'now', diagDone ? 'diagResult' : 'diag'),
      step('📉', '0단계 · 블라인드 투자', simDone ? `수익률 ${pct(S.report.finalReturn)}` : '아무것도 모른 채 10년', simDone ? 'done' : diagDone ? 'now' : 'wait', simDone ? 'report' : 'sim'),
      step('🤖', '매매 실수 리포트', simDone ? '실수 3건 분석 완료' : '0단계 종료 후 열림', simDone ? 'done' : 'locked', 'aiReport'),
      step('📚', '1주차 · 거시경제 강의', `카드 ${S.week1.cardsViewed.length}/${LECTURE_CARDS.length}`, lecDone ? 'done' : simDone ? 'now' : 'locked', 'lecture'),
      step('🧪', '1주차 · 실습 3종', `${pracDone}/3 완료`, pracDone === 3 ? 'done' : simDone ? 'now' : 'locked', 'practices'),
      step('✅', '1주차 · 확인 퀴즈', quizDone ? `통과 (${S.week1.quiz.lastScore}/5)` : `${QUIZ_PASS}개 이상 맞히면 통과`, quizDone ? 'done' : simDone ? 'now' : 'locked', 'quiz'),
    ),
    h('h2', { class: 'section' }, '커리큘럼'),
    h('div', { class: 'card', style: 'padding:6px 20px' },
      step('1️⃣', '1주차 · 거시경제와 투자의 이유', '금리·환율·물가', quizDone ? 'done' : simDone ? 'now' : 'locked', 'lecture'),
      step('2️⃣', '2주차 · 저축과 제도 활용', 'ISA·청년도약계좌·절세', 'locked'),
      step('3️⃣', '3-4주차 · 좋은 기업 찾기', '재무제표·PER·가치투자', 'locked'),
      step('5️⃣', '5주차 · ETF와 인덱스 투자', '존 보글·퇴직연금', 'locked'),
      step('6️⃣', '6주차 · 부동산과 종합 (졸업)', '청약·자산배분·졸업 리포트', 'locked'),
    ),
    h('p', { class: 'disclaimer' }, DISCLAIMER),
    tabbar('home'),
  )
})

// ---------- 1주차 강의 (카드 10개) ----------
register('lecture', (params = {}) => {
  let idx = Math.min(Math.max(params.card ?? 0, 0), LECTURE_CARDS.length - 1)
  const wrap = h('div', { class: 'screen' })

  function markViewed(i) {
    if (!S.week1.cardsViewed.includes(i)) { S.week1.cardsViewed.push(i); save() }
  }

  function paint() {
    markViewed(idx)
    const c = LECTURE_CARDS[idx]
    wrap.innerHTML = ''
    wrap.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn-back', onclick: () => go('home') }, '‹'),
        h('div', { class: 'tb-title' }, '1주차 · 거시경제와 투자의 이유'),
      ),
      h('div', { class: 'progressbar', style: 'margin-bottom:16px' },
        h('i', { style: `width:${((idx + 1) / LECTURE_CARDS.length * 100).toFixed(0)}%` })),
      h('div', { class: 'card lecture-card' },
        h('div', { class: 'eyebrow' }, `카드 ${idx + 1} / ${LECTURE_CARDS.length}`),
        h('div', { class: 'lc-title' }, c.title),
        c.img ? h('img', { src: c.img, alt: c.title }) : null,
        (c.paras || []).map(p => h('p', {}, p)),
        c.bullets ? h('ul', {}, c.bullets.map(b => h('li', {}, b))) : null,
        c.note ? h('div', { class: 'note' }, '💡 ' + c.note) : null,
      ),
      h('div', { class: 'lc-dots' },
        LECTURE_CARDS.map((_, i) => h('i', { class: (i === idx ? 'on ' : '') + (S.week1.cardsViewed.includes(i) ? 'seen' : '') }))),
      h('div', { class: 'lc-nav' },
        h('button', { class: 'btn secondary', disabled: idx === 0, onclick: () => { idx--; paint() } }, '이전'),
        idx < LECTURE_CARDS.length - 1
          ? h('button', { class: 'btn', onclick: () => { idx++; paint() } }, '다음')
          : h('button', { class: 'btn', onclick: () => go('practices') }, '강의 완료 → 실습하기'),
      ),
    )
    window.scrollTo(0, 0)
  }
  paint()
  return wrap
})

// ---------- 확인 퀴즈 (정오답 마이크로 피드백 포함) ----------
register('quiz', () => {
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
              !correct ? h('button', {
                class: 'btn ghost', style: 'width:auto;display:inline;padding:0 0 0 6px;font-size:14px;color:var(--blue)',
                onclick: () => go('lecture', { card: item.card }),
              }, `→ 카드 ${item.card + 1} 다시 보기`) : null,
            ),
            h('div', { style: 'margin-top:16px' },
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
        h('div', { class: 'tb-title' }, '1주차 확인 퀴즈'),
      ),
      h('div', { class: 'progressbar', style: 'margin-bottom:20px' },
        h('i', { style: `width:${(idx / QUIZ.length * 100).toFixed(0)}%` })),
      h('div', { class: 'q-count' }, `${idx + 1} / ${QUIZ.length}`),
      h('div', { class: 'q-title' }, item.q),
      ...opts,
      explainBox,
    )
    window.scrollTo(0, 0)
  }

  function finish() {
    const passed = score >= QUIZ_PASS
    S.week1.quiz.attempts++
    S.week1.quiz.lastScore = score
    if (passed) S.week1.quiz.passed = true
    save()
    wrap.innerHTML = ''
    wrap.append(
      h('div', { class: 'report-hero' },
        h('div', { class: 'rh-label' }, '퀴즈 결과'),
        h('div', { class: 'rh-num', style: passed ? 'color:var(--green)' : 'color:var(--up)' }, `${score} / ${QUIZ.length}`),
        h('p', { class: 'desc', style: 'margin-top:10px' },
          passed
            ? '통과! 1주차를 완료했습니다. 2주차는 준비 중이에요.'
            : `${QUIZ_PASS}개 이상 맞혀야 통과할 수 있어요. 틀린 개념의 강의 카드를 다시 본 뒤 도전해보세요.`),
      ),
      passed
        ? h('div', { class: 'card', style: 'text-align:center;background:var(--green-soft);box-shadow:none' },
            h('p', { style: 'font-size:34px;margin-bottom:6px' }, '🎓'),
            h('b', {}, '1주차 · 거시경제와 투자의 이유'),
            h('p', { class: 'small', style: 'margin-top:4px' }, '먼저 잃고, 조금 더 똑똑해졌습니다'))
        : null,
      h('div', { class: 'cta-area' },
        passed
          ? h('button', { class: 'btn', onclick: () => go('home') }, '홈으로')
          : h('div', {},
              h('button', { class: 'btn secondary', style: 'margin-bottom:10px', onclick: () => go('lecture') }, '강의 다시 보기'),
              h('button', { class: 'btn', onclick: () => { idx = 0; score = 0; paintQ() } }, '다시 풀기')),
      ),
    )
  }

  paintQ()
  return wrap
})

// ---------- 마이페이지 ----------
register('my', () => {
  const r = S.report
  const row = (k, v) => h('div', { class: 'my-row' }, h('span', { style: 'color:var(--sub)' }, k), h('b', {}, v))
  return h('div', { class: 'screen has-tabbar' },
    h('h1', { class: 'hero', style: 'font-size:22px;margin:8px 0 18px' }, '마이페이지'),
    h('div', { class: 'card' },
      h('b', { style: 'font-size:17px' }, S.user.nickname || '-'),
      h('p', { class: 'small', style: 'margin-top:2px' }, '똑똑 0기 · 학습용 프로토타입'),
    ),
    h('div', { class: 'card' },
      row('사전 진단 점수', S.diagnosis.score != null ? S.diagnosis.score + '점' : '미응시'),
      row('0단계 수익률', r ? pct(r.finalReturn) : '진행 전'),
      row('0단계 매매 횟수', r ? fmt(r.totalTrades) + '회' : '-'),
      row('1주차 강의', `${S.week1.cardsViewed.length}/${LECTURE_CARDS.length} 카드`),
      row('1주차 퀴즈', S.week1.quiz.passed ? `통과 (${S.week1.quiz.lastScore}/5)` : S.week1.quiz.attempts ? `미통과 (최근 ${S.week1.quiz.lastScore}/5)` : '미응시'),
    ),
    h('div', { class: 'card' },
      h('button', {
        class: 'btn danger', onclick: () => {
          const close = openSheet(
            h('h3', {}, '모든 기록을 초기화할까요?'),
            h('p', { class: 'desc', style: 'margin-bottom:18px' }, '진단·시뮬레이션·학습 진행 상황이 전부 삭제되고 처음부터 시작합니다.'),
            h('div', { class: 'btn-row' },
              h('button', { class: 'btn secondary', onclick: () => close() }, '취소'),
              h('button', { class: 'btn danger', onclick: () => { resetAll(); close(); go('splash') } }, '초기화'),
            ),
          )
        },
      }, '처음부터 다시 하기'),
    ),
    h('p', { class: 'disclaimer' },
      DISCLAIMER, h('br'),
      '기획·개발: 학교 토이 프로젝트 「똑똑」'),
    tabbar('my'),
  )
})
