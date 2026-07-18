// 진단 점수(0~100, 5점 단위)별 학습자 페르소나.
// termLevel: 추후 강의 카드 용어 난이도 분기용 ('easy' = 풀어쓴 설명 우선, 'standard' = 기본 용어 사용)
export const PERSONAS = [
  {
    min: 0, max: 30, termLevel: 'easy',
    name: '경제 새내기',
    emoji: '🌱',
    desc: '경제 용어가 아직 낯선 단계예요. 부끄러운 게 아니라, 지금이 가장 배우기 좋은 출발점입니다.',
    guide: '용어를 최대한 풀어서 설명해드릴게요. 금리·물가 같은 큰 그림부터 천천히 갑니다.',
  },
  {
    min: 35, max: 55, termLevel: 'easy',
    name: '초보 투자자',
    emoji: '🐣',
    desc: '들어본 개념은 많지만 아직 서로 연결이 안 된 상태예요. 또래 평균(62.6점)까지 한 걸음 남았습니다.',
    guide: '개념 사이의 연결고리(금리 → 물가 → 환율)를 중심으로, 쉬운 표현 위주로 설명합니다.',
  },
  {
    min: 60, max: 80, termLevel: 'standard',
    name: '열정은 있지만 아직 채울 게 많은 투자자',
    emoji: '🔥',
    desc: '기본 개념은 잡혀 있어요. 다만 아는 것과 실전에서 그대로 하는 것은 다릅니다 — 0단계 결과가 그걸 보여줄 거예요.',
    guide: '기본 용어는 그대로 쓰되, 개념을 실전(내 매매 기록)에 연결하는 훈련에 집중합니다.',
  },
  {
    min: 85, max: 100, termLevel: 'standard',
    name: '기본기를 갖춘 투자자',
    emoji: '🎯',
    desc: '또래 상위권 수준의 이해도예요. 이제 관건은 지식이 아니라 리볼빙·레버리지 같은 함정을 피하는 습관입니다.',
    guide: '표준 용어로 빠르게 진행하고, 심화 함정 사례(신용·레버리지) 위주로 보강합니다.',
  },
]

export function personaForScore(score) {
  if (score == null) return null
  return PERSONAS.find((p) => score >= p.min && score <= p.max) ?? PERSONAS[0]
}
