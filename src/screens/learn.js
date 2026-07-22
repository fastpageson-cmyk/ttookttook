// 화면 3-8 홈/대시보드 · 3-12 마이페이지
// (강의·실습·퀴즈 화면은 주차 공통으로 screens/week.js에 있음)
import { h, fmt, pct, openSheet } from '../ui.js'
import { lockGlyph, gradCapGlyph } from '../glyphs.js'
import { register, go, tabbar } from '../router.js'
import { S, week, resetAll } from '../state.js'
import { QUIZ_PASS, DISCLAIMER, SLOGAN } from '../content.js'
import { WEEKS, byId, isUnlocked, isWeekComplete, practiceCount, allPracticesDone, currentWeek } from '../weeks/index.js'

// ---------- 다음 액션 ----------
function nextAction() {
  if (!S.diagnosis.completedAt) return { label: '사전 진단 받기', desc: '20문항 · 약 5분', screen: 'diag', params: {}, step: '0단계' }
  if (S.simulation.status !== 'ended') return {
    label: S.simulation.status === 'in_progress' ? '블라인드 투자 이어하기' : '블라인드 투자 시작하기',
    desc: '가상 자금 1,000만 원 · 10년', screen: 'sim', params: {}, step: '0단계',
  }
  const w = currentWeek()
  if (!w) return { label: '졸업 리포트 보기', desc: '6주 여정을 돌아봅니다', screen: 'graduation', params: {}, step: '졸업' }

  const st = week(w.id)
  const step = `${w.id}주차`
  if (st.cardsViewed.length < w.cards.length) return {
    label: `${w.id}주차 강의 보기`, desc: `카드 ${st.cardsViewed.length}/${w.cards.length} 완료`,
    screen: 'lecture', params: { week: w.id }, step,
  }
  const { done, total } = practiceCount(w)
  if (!allPracticesDone(w)) return {
    label: st.miniSim.done || done > 0 ? '실습 이어하기' : '실습하기',
    desc: `실습 ${done}/${total} 완료`, screen: 'practices', params: { week: w.id }, step,
  }
  return {
    label: '확인 퀴즈 풀기', desc: `${w.quiz.length}문항 중 ${QUIZ_PASS}개 이상 통과`,
    screen: 'quiz', params: { week: w.id }, step,
  }
}

register('home', () => {
  const na = nextAction()
  const cw = currentWeek()

  // 상태는 왼쪽 타일 하나로만 말한다(체크=완료 / 파란 점=진행 / 자물쇠=잠김).
  // 뱃지는 "지금 할 것"을 가리키는 '진행 중' 하나만 남긴다 — 완료·잠김 뱃지는 타일과 의미가 겹쳤다.
  const stateTile = state =>
    h('div', { class: 'st-ico ' + (state === 'done' ? 'done' : state === 'now' ? 'now' : state === 'locked' ? 'lockd' : '') },
      state === 'done' ? '✓'
        : state === 'locked' ? h('span', { class: 'st-lock', html: lockGlyph(15) })
          : h('i', { class: 'st-dot' + (state === 'now' ? '' : ' wait') }))

  const step = (title, sub, state, screen, params = {}) =>
    h('div', {
      class: 'step-row' + (state === 'locked' ? ' locked' : ''),
      onclick: () => { if (state !== 'locked' && screen) go(screen, params) },
    },
      stateTile(state),
      h('div', { class: 'st-body' }, h('b', {}, title), h('span', {}, sub)),
      state === 'now' ? h('span', { class: 'badge blue' }, '진행 중') : null,
    )

  const diagDone = !!S.diagnosis.completedAt
  const simDone = S.simulation.status === 'ended'

  // 현재 진행 중인 주차의 세부 진도
  let weekRows = []
  if (cw) {
    const st = week(cw.id)
    const lecDone = st.cardsViewed.length >= cw.cards.length
    const { done, total } = practiceCount(cw)
    const pracDone = allPracticesDone(cw)
    weekRows = [
      step(`${cw.id}주차 · 강의`, `카드 ${st.cardsViewed.length}/${cw.cards.length}`,
        lecDone ? 'done' : 'now', 'lecture', { week: cw.id }),
      step(`${cw.id}주차 · 실습`, `${done}/${total} 완료 · 미니 모의투자 포함`,
        pracDone ? 'done' : lecDone ? 'now' : 'locked', 'practices', { week: cw.id }),
      step(`${cw.id}주차 · 확인 퀴즈`, `${QUIZ_PASS}개 이상 맞히면 통과`,
        st.quiz.passed ? 'done' : pracDone ? 'now' : 'locked', 'quiz', { week: cw.id }),
    ]
  }

  return h('div', { class: 'screen has-tabbar' },
    h('div', { class: 'home-greet' },
      h('h1', { class: 'hero', style: 'font-size:22px' }, `안녕하세요, ${S.user.nickname}님`),
      h('p', { class: 'small', style: 'margin-top:4px' }, SLOGAN),
    ),
    h('div', { class: 'next-card', onclick: () => { if (na.screen) go(na.screen, na.params) } },
      h('div', { class: 'nc-label' }, `다음 액션 · ${na.step}`),
      h('b', {}, na.label),
      h('p', {}, na.desc),
    ),
    h('h2', { class: 'section' }, '나의 진도'),
    h('div', { class: 'card list' },
      step('사전 진단', diagDone ? `${S.diagnosis.score}점 (또래 평균 62.6점)` : '금융이해력 20문항', diagDone ? 'done' : 'now', diagDone ? 'diagResult' : 'diag'),
      step('0단계 · 블라인드 투자', simDone ? `수익률 ${pct(S.report.finalReturn)}` : '아무것도 모른 채 10년', simDone ? 'done' : diagDone ? 'now' : 'wait', simDone ? 'report' : 'sim'),
      step('매매 실수 리포트', simDone ? '실수 3건 분석 완료' : '0단계 종료 후 열림', simDone ? 'done' : 'locked', 'aiReport'),
      ...weekRows,
    ),
    h('h2', { class: 'section' }, '커리큘럼'),
    h('div', { class: 'card list' },
      WEEKS.map(w => {
        const unlocked = isUnlocked(w.id)
        const complete = isWeekComplete(w.id)
        return step(`${w.id}주차 · ${w.title}`, w.subtitle,
          complete ? 'done' : unlocked ? 'now' : 'locked', 'lecture', { week: w.id })
      }),
    ),
    !currentWeek() && simDone
      ? h('div', { class: 'card grad-home', style: 'cursor:pointer', onclick: () => go('graduation') },
          h('p', { class: 'grad-home-cap', html: gradCapGlyph(36) }),
          h('b', {}, '「똑똑」 6주 과정 졸업'),
          h('p', { class: 'small', style: 'margin-top:4px' }, '졸업 리포트 보기 →'))
      : null,
    h('p', { class: 'disclaimer' }, DISCLAIMER),
    tabbar('home'),
  )
})

// ---------- 마이페이지 ----------
register('my', () => {
  const r = S.report
  const row = (k, v) => h('div', { class: 'my-row' }, h('span', { style: 'color:var(--sub)' }, k), h('b', {}, v))
  const passedCount = WEEKS.filter(w => isWeekComplete(w.id)).length
  const simCount = WEEKS.filter(w => week(w.id).miniSim.done).length

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
      row('완료한 주차', `${passedCount} / ${WEEKS.length}주차`),
      row('완료한 미니 모의투자', `${simCount} / ${WEEKS.length}회`),
    ),
    h('div', { class: 'card' },
      h('b', { style: 'font-size:15px' }, '주차별 기록'),
      WEEKS.map(w => {
        const st = week(w.id)
        return h('div', { class: 'my-row' },
          h('span', { style: 'color:var(--sub)' }, `${w.id}주차`),
          h('b', {},
            !isUnlocked(w.id) ? '잠김'
              : st.quiz.passed ? `통과 (${st.quiz.lastScore}/${w.quiz.length})`
                : st.miniSim.done ? '실습 완료'
                  : st.cardsViewed.length ? `강의 ${st.cardsViewed.length}/${w.cards.length}`
                    : '시작 전'))
      }),
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
