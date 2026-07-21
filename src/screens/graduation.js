// 졸업 리포트 — 6주 과정을 모두 마쳤을 때의 마무리 화면.
//
// 앱 전체 서사("먼저 잃고, 똑똑해집니다")의 완결점이다.
// 0단계에서 아무 기준 없이 잃었던 사용자가, 6주 뒤 어떤 기준을 갖게 됐는지를 보여준다.
import { h, pct, numClass } from '../ui.js'
import { register, go } from '../router.js'
import { S, week } from '../state.js'
import { WEEKS } from '../weeks/index.js'
import { PEER_AVG } from '../content.js'

// 각 주차가 사용자에게 남긴 '기준' 한 줄
const TAKEAWAYS = [
  { emoji: '📉', title: '금리를 본다', desc: '시장이 지금 어떤 바람을 맞고 있는지 읽는다' },
  { emoji: '🏦', title: '저축률을 높인다', desc: '시드머니는 금리가 아니라 저축률이 만든다' },
  { emoji: '⚖️', title: '레버리지를 안다', desc: '버틸 수 있는 범위 안에서만 빌린다' },
  { emoji: '🧩', title: '분산한다', desc: '얼마나 버느냐보다 얼마나 덜 잃느냐' },
  { emoji: '🔍', title: '숫자로 고른다', desc: '이름이 아니라 PER·영업이익률로 판단한다' },
  { emoji: '🧾', title: '계좌를 고른다', desc: '같은 수익도 어느 계좌냐에 따라 잔고가 다르다' },
]

register('graduation', () => {
  const r = S.report
  const passedWeeks = WEEKS.filter(w => week(w.id).quiz.passed)
  const avgQuiz = passedWeeks.length
    ? (passedWeeks.reduce((a, w) => a + week(w.id).quiz.lastScore, 0) / passedWeeks.length)
    : 0
  const simCount = WEEKS.filter(w => week(w.id).miniSim.done).length

  return h('div', { class: 'screen grad' },
    h('div', { class: 'topbar' },
      h('button', { class: 'btn-back', onclick: () => go('home') }, '‹'),
      h('div', { class: 'tb-title' }, '졸업 리포트'),
    ),

    // 히어로
    h('div', { class: 'grad-hero' },
      h('div', { class: 'grad-cap' }, '🎓'),
      h('h1', { class: 'hero', style: 'font-size:24px' }, `${S.user.nickname}님,`, h('br'), '6주를 완주했습니다'),
      h('p', { class: 'desc', style: 'margin-top:10px' }, '먼저 잃고, 똑똑해졌습니다'),
    ),

    // 그때 vs 지금 — 앱 서사의 핵심
    h('div', { class: 'card grad-arc' },
      h('div', { class: 'grad-arc-row' },
        h('div', { class: 'grad-arc-col' },
          h('span', { class: 'small' }, '0단계, 그때'),
          h('b', { class: numClass(r ? r.finalReturn : 0) }, r ? pct(r.finalReturn) : '—'),
          h('span', { class: 'grad-arc-sub' }, '아무 기준 없이')),
        h('div', { class: 'grad-arrow' }, '→'),
        h('div', { class: 'grad-arc-col' },
          h('span', { class: 'small' }, '6주 뒤, 지금'),
          h('b', { style: 'color:var(--blue)' }, '6가지 기준'),
          h('span', { class: 'grad-arc-sub' }, '으로 판단한다')),
      ),
    ),

    // 6주가 남긴 기준
    h('h2', { class: 'section' }, '6주가 남긴 것'),
    h('div', { class: 'card', style: 'padding:6px 20px' },
      TAKEAWAYS.map((t, i) => h('div', { class: 'grad-take' },
        h('span', { class: 'grad-take-em' }, t.emoji),
        h('div', { class: 'grad-take-body' },
          h('b', {}, `${i + 1}주차 · ${t.title}`),
          h('span', {}, t.desc)),
        week(WEEKS[i].id).quiz.passed ? h('span', { class: 'badge green' }, '완료') : null,
      )),
    ),

    // 학습 기록 요약
    h('h2', { class: 'section' }, '나의 기록'),
    h('div', { class: 'grad-stats' },
      h('div', { class: 'grad-stat' },
        h('span', { class: 'small' }, '완료한 주차'),
        h('b', {}, `${passedWeeks.length} / ${WEEKS.length}`)),
      h('div', { class: 'grad-stat' },
        h('span', { class: 'small' }, '확인 퀴즈 평균'),
        h('b', {}, `${avgQuiz.toFixed(1)} / 5`)),
      h('div', { class: 'grad-stat' },
        h('span', { class: 'small' }, '미니 모의투자'),
        h('b', {}, `${simCount}회`)),
      h('div', { class: 'grad-stat' },
        h('span', { class: 'small' }, '사전 진단'),
        h('b', {}, `${S.diagnosis.score ?? '—'}점`)),
    ),

    // 진단 재측정 — 얼마나 늘었는지
    h('div', { class: 'card grad-retest' },
      h('b', {}, '얼마나 똑똑해졌을까요?'),
      h('p', { class: 'desc', style: 'margin:8px 0 16px' },
        S.diagnosis.firstScore != null
          ? `처음 ${S.diagnosis.firstScore}점으로 시작했습니다. 지금 다시 풀면 얼마나 달라졌을까요?`
          : `시작할 때 본 20문항 사전 진단을 다시 풀어보면, 6주 전과 지금의 차이를 숫자로 확인할 수 있습니다.`),
      h('button', { class: 'btn secondary', onclick: () => go('diag') }, '사전 진단 다시 풀기'),
    ),

    h('div', { class: 'cta-area' },
      h('button', { class: 'btn', onclick: () => go('home') }, '홈으로'),
    ),
    h('p', { class: 'disclaimer' },
      '「똑똑」 0기 수료 · 학습용 프로토타입', h('br'),
      '이 과정은 실제 과거 시세를 학습용으로 재생한 것이며, 투자 조언이 아닙니다.'),
  )
})
