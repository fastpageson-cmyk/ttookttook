import './styles.css'
import { S } from './state.js'
import { go } from './router.js'
import './screens/onboarding.js'
import './screens/diagnosis.js'
import './screens/sim.js'
import './screens/report.js'
import './screens/learn.js'
import './screens/week.js'
import './screens/practice.js'
import './weeks/index.js'

// 시작 화면 결정 — 재방문 유저는 온보딩 생략(화면기획서 3-1 예외)
function initialScreen() {
  if (!S.onboarded || !S.user.nickname) return 'splash'
  return 'home'
}

go(initialScreen())
