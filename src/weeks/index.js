// 주차 레지스트리 — 강의 카드·퀴즈·미니 모의투자를 주차별 모듈에서 모아 등록한다.
import { register } from '../router.js'
import { miniSimScreen } from '../mini-sim.js'
import { S, week } from '../state.js'
import { FIGURES } from '../infographics.js'
import week1 from './week1.js'
import week2 from './week2.js'
import week3 from './week3.js'
import week4 from './week4.js'
import week5 from './week5.js'
import week6 from './week6.js'

export const WEEKS = [week1, week2, week3, week4, week5, week6]
export const byId = id => WEEKS.find(w => w.id === Number(id)) || WEEKS[0]

// 강의 카드에 인포그래픽(인라인 SVG) 주입 — 카드 데이터에 figure 문자열을 심는다.
// 콘텐츠(주차 모듈)와 도해(infographics)를 분리해 두고 여기서 연결한다.
for (const w of WEEKS) {
  const map = FIGURES[w.id]
  if (!map) continue
  for (const [idx, fn] of Object.entries(map)) {
    if (w.cards[idx]) w.cards[idx].figure = fn()
  }
}

// 미니 모의투자 화면 등록 (mini1 ~ mini6)
for (const w of WEEKS) {
  register('mini' + w.id, miniSimScreen({ ...w.miniSim, weekId: w.id }))
}

// ---------- 진행 상태 헬퍼 ----------
// 1주차는 0단계(블라인드 투자)를 끝내야 열리고, 2주차부터는 직전 주차 퀴즈를 통과해야 열린다.
export function isUnlocked(id) {
  if (id === 1) return S.simulation.status === 'ended'
  return week(id - 1).quiz.passed
}

export function practiceCount(w) {
  const items = w.practices || []
  const st = week(w.id)
  const done = items.filter(p => st.practices[p.key]).length + (st.miniSim.done ? 1 : 0)
  return { done, total: items.length + 1 }
}

export function allPracticesDone(w) {
  const { done, total } = practiceCount(w)
  return done >= total
}

export function isWeekComplete(id) {
  return week(id).quiz.passed
}

// 다음에 해야 할 주차 (전부 끝냈으면 null)
export function currentWeek() {
  for (const w of WEEKS) {
    if (!isUnlocked(w.id)) return null
    if (!isWeekComplete(w.id)) return w
  }
  return null
}
