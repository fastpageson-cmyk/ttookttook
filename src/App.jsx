import { StoreProvider, useStore } from './state/store.jsx'
import Splash from './screens/Splash.jsx'
import Diagnosis from './screens/Diagnosis.jsx'
import DiagnosisResult from './screens/DiagnosisResult.jsx'
import Simulation from './screens/Simulation.jsx'
import SessionReport from './screens/SessionReport.jsx'
import MistakeReport from './screens/MistakeReport.jsx'
import Home from './screens/Home.jsx'
import Lesson from './screens/Lesson.jsx'
import Practice1 from './screens/Practice1.jsx'
import Practice2 from './screens/Practice2.jsx'
import Practice3 from './screens/Practice3.jsx'
import Quiz from './screens/Quiz.jsx'
import MyPage from './screens/MyPage.jsx'

const SCREENS = {
  splash: Splash,
  diagnosis: Diagnosis,
  diagResult: DiagnosisResult,
  sim: Simulation,
  report: SessionReport,
  aiReport: MistakeReport,
  home: Home,
  lesson: Lesson,
  practice1: Practice1,
  practice2: Practice2,
  practice3: Practice3,
  quiz: Quiz,
  mypage: MyPage,
}

// 데이터 없이 진입 불가한 화면 가드 (localStorage 손상 등 대비)
function resolveScreen(state) {
  const s = state.screen
  if (!SCREENS[s]) return 'splash'
  if ((s === 'report' || s === 'aiReport') && !state.report) return 'splash'
  if (s !== 'splash' && !state.user.nickname) return 'splash'
  return s
}

function Shell() {
  const { state, dispatch } = useStore()
  const screen = resolveScreen(state)
  const Screen = SCREENS[screen]
  const homeUnlocked = !!state.report // 0단계를 마쳐야 홈/마이페이지 개방

  return (
    <div className="app">
      {screen !== 'splash' && (
        <header className="app-header">
          <button className="brand" onClick={() => dispatch({ type: 'NAVIGATE', screen: homeUnlocked ? 'home' : 'splash' })}>
            똑똑<span className="dot">.</span>
          </button>
          {homeUnlocked && (
            <div className="header-actions">
              <button className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })}>홈</button>
              <button className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'mypage' })}>MY</button>
            </div>
          )}
        </header>
      )}
      <main className="app-main">
        <Screen />
      </main>
      <footer className="app-footer">
        <p className="disclaimer">
          똑똑은 학교 토이 프로젝트의 학습용 프로토타입입니다. 본 시뮬레이션의 모든 시세·금리
          수치는 학습용 가상 데이터이며, 실제 시장 데이터가 아니고 투자 조언은 더더욱 아닙니다.
        </p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
