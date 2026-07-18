// 3-7 AI 매매 실수 리포트 — 프로토타입에서는 규칙 기반 생성 (engine/mistakeReport.js)
// 톤: 결과는 정확히, 자기비하는 없이. 다음 학습(1주차)으로 넘어가는 동기부여 훅.
import { useStore } from '../state/store.jsx'

export default function MistakeReport() {
  const { state, dispatch } = useStore()
  const items = state.aiReport?.items ?? []

  return (
    <div>
      <div className="eyebrow">매매 실수 분석</div>
      <h2 className="section-title mt8">
        방금 그 10년에서,<br />이 3가지가 결과를 갈랐습니다
      </h2>
      <p className="muted mt8 mt12">
        {state.user.nickname}님의 매매 기록 전체를 분석해 손실에 가장 크게 기여한
        의사결정을 뽑았습니다. 누구나 처음엔 같은 실수를 합니다 — 중요한 건 다음입니다.
      </p>

      <div className="mt20">
        {items.map((item, i) => (
          <div className="card mistake-card" key={i}>
            <span className="mistake-num">{i + 1}</span>
            <h3 className="mistake-headline">{item.headline}</h3>
            <p className="mistake-body">{item.explanation}</p>
          </div>
        ))}
      </div>

      <div className="card pad mt16" style={{ background: 'var(--navy)', color: '#fff', border: 0 }}>
        <div className="eyebrow" style={{ color: '#8fa3ff' }}>1주차 시작</div>
        <h3 style={{ color: '#fff', fontSize: 18, margin: '6px 0 4px' }}>왜 이런 실수를 했는지 알아보기</h3>
        <p style={{ color: '#9aa3bd', fontSize: 13.5 }}>
          사실 그 10년 동안 화면에 보이지 않던 큰 흐름이 있었습니다.
          1주차 거시경제 강의에서 그 흐름을 배우고, 내 매매 기록 위에 직접 겹쳐봅니다.
        </p>
        <button className="btn block mt16" style={{ background: '#4a68e8' }}
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'lesson', lessonCard: 1 })}>
          1주차 강의 시작하기
        </button>
      </div>

      <p className="tiny mt12 center">프로토타입에서는 이 분석이 규칙 기반 로직으로 생성됩니다.</p>
    </div>
  )
}
