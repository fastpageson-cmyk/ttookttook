// 앱 전체 state — docs/기획원본/데이터모델.md 의 AppState 구조 + 화면 라우팅.
// localStorage에 전체 영속화(새로고침해도 진행 유지). 초기화는 마이페이지에서.
import { createContext, useContext, useEffect, useReducer } from 'react'
import { newSession, executeBuy, executeSell, advanceWeeks } from '../engine/simulation.js'
import { buildSessionReport } from '../engine/report.js'
import { generateMistakeReport } from '../engine/mistakeReport.js'
import { scoreDiagnosis } from '../data/diagnosis.js'
import { QUIZ_PASS_SCORE } from '../engine/constants.js'

const STORAGE_KEY = 'ttokttok-state-v1'
const LEGACY_STORAGE_KEY = 'ddukdduk-state-v1' // 뚝뚝 시절 키 — 기존 사용자 진행 상태 이관용

export function initialState() {
  return {
    screen: 'splash',
    lessonCard: null, // 강의 화면 진입 시 열 카드 번호 (퀴즈 오답 → 해당 카드 딥링크용)
    user: { nickname: '' },
    diagnosis: {
      answers: Array(20).fill(-1),
      score: null,
      completedAt: null,
    },
    simulation: newSession(),
    report: null,     // SessionReport — 0단계 종료 시 계산
    aiReport: null,   // AIMistakeReport — 규칙 기반 생성
    week1: {
      cardsViewed: [],
      practices: { review0: false, rateCutReplay: false, fxWidget: false },
      quiz: { attempts: 0, lastScore: 0, passed: false },
    },
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return initialState()
    const saved = JSON.parse(raw)
    // 필드 누락 대비 얕은 병합 (버전업 시 안전망)
    return { ...initialState(), ...saved }
  } catch {
    return initialState()
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, screen: action.screen, lessonCard: action.lessonCard ?? null }

    case 'SET_NICKNAME':
      return { ...state, user: { nickname: action.nickname }, screen: 'diagnosis' }

    case 'ANSWER_DIAG': {
      const answers = [...state.diagnosis.answers]
      answers[action.index] = action.choice
      return { ...state, diagnosis: { ...state.diagnosis, answers } }
    }

    case 'COMPLETE_DIAG':
      return {
        ...state,
        diagnosis: {
          ...state.diagnosis,
          score: scoreDiagnosis(state.diagnosis.answers),
          completedAt: action.completedAt,
        },
        screen: 'diagResult',
      }

    case 'SIM_BUY': {
      const result = executeBuy(state.simulation, action.code, action.qty)
      if (result.error) return state
      return { ...state, simulation: result.session }
    }
    case 'SIM_SELL': {
      const result = executeSell(state.simulation, action.code, action.qty)
      if (result.error) return state
      return { ...state, simulation: result.session }
    }
    case 'SIM_ADVANCE':
      return { ...state, simulation: advanceWeeks(state.simulation, action.weeks) }

    case 'SIM_END': {
      const simulation = { ...state.simulation, status: 'ended' }
      const report = buildSessionReport(simulation)
      const aiReport = generateMistakeReport(simulation, report)
      return { ...state, simulation, report, aiReport, screen: 'report' }
    }

    case 'VIEW_CARD': {
      if (state.week1.cardsViewed.includes(action.cardId)) return state
      return {
        ...state,
        week1: { ...state.week1, cardsViewed: [...state.week1.cardsViewed, action.cardId] },
      }
    }

    case 'COMPLETE_PRACTICE':
      return {
        ...state,
        week1: {
          ...state.week1,
          practices: { ...state.week1.practices, [action.practice]: true },
        },
      }

    case 'QUIZ_RESULT': {
      const passed = action.score >= QUIZ_PASS_SCORE
      return {
        ...state,
        week1: {
          ...state.week1,
          quiz: {
            attempts: state.week1.quiz.attempts + 1,
            lastScore: action.score,
            passed: state.week1.quiz.passed || passed,
          },
        },
      }
    }

    case 'RESET_ALL':
      return initialState()

    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* 저장 실패는 무시 */ }
  }, [state])
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
