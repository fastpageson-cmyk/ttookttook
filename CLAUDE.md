# 똑똑 — 투자 교육 웹사이트 프로토타입

> **이름 변경 (2026-07-18)**: 프로젝트명이 **뚝뚝 → 똑똑**으로 바뀌었다. 폴더도 `~/Desktop/post/커리어/똑똑`으로 이동. 단 **GitHub 저장소(`fastpageson-cmyk/ttookttook`)와 Vercel 프로젝트명(`ttookttook`)은 옛 이름 그대로**다(URL·배포 연동 유지 목적 — 바꾸려면 사용자 승인 필요). localStorage 키는 `ttokttok-state-v1`(구 `ddukdduk-state-v1`에서 읽기 폴백 있음).

"아무것도 모른 채 투자해보고 실패한 뒤, 그 실패를 교재 삼아 배운다"는 6주 투자 교육 서비스의 **MVP 프로토타입** (0단계 + 1주차만). 학교 토이 프로젝트.

## 에이전트가 먼저 읽을 것

1. **`WORKLOG.md`** — 작업 진행 상황·남은 일·결정사항이 기록된 인수인계 로그. **작업을 이어받으면 여기부터 읽고, 작업 후 반드시 갱신할 것.**
2. `docs/기획원본/빌드_브리프_클로드코드용.md` — 스코프·완료 기준(Acceptance Criteria 8항목). 기획 문서 간 충돌 시 이 문서 우선.
3. `docs/기획원본/화면기획서.md` — 화면 12개 상세 스펙.
4. `docs/기획원본/데이터모델.md` — state 구조 원본.

기획 원본의 소스 오브 트루스는 Obsidian (`~/Library/Mobile Documents/iCloud~md~obsidian/Documents/KGW/김미정/`)이며, `docs/기획원본/`은 2026-07-18 시점 사본이다.

## 확정된 스코프 (빌드 브리프 요약)

- 0단계(닉네임 → 사전진단 20문항 → 블라인드 자유투자 → 종료 리포트 → AI 실수 리포트) + 1주차(강의 카드 10장 → 실습 3종 → 퀴즈 5문항, 통과 4/5)
- **로그인·백엔드·DB 없음.** 상태는 localStorage 저장.
- **AI 리포트는 실제 LLM 호출 금지** — `src/engine/mistakeReport.js`의 `generateMistakeReport(trades, ...)` 규칙 기반 구현. 함수 시그니처는 유지(나중에 내부만 LLM으로 교체 가능하게).
- 모든 시세·금리는 `src/data/*.json` 목업 (재생성: 기획원본 폴더의 generate_mock_data.py, 시드 42).
- 2주차 이후 화면은 이번 범위 밖.
- **배포**: 원래 "로컬 프리뷰만"이었으나 2026-07-18 세션 중 사용자가 Vercel 배포로 전환 요청. GitHub `fastpageson-cmyk/ttookttook` ↔ Vercel 프로젝트 `ttookttook` 연결 완료, main push 시 자동 배포. 배포 URL·상세는 `WORKLOG.md` 참고.

## 실행

```bash
npm install
npm run dev   # Vite, 포트 5175 고정 (vite.config.js — 처인:담다 등 다른 로컬 프로토타입과 포트 충돌 방지)
```

## 구조

- `src/App.jsx` — 화면 라우팅 (state 기반, react-router 없음)
- `src/state/store.jsx` — AppState reducer + localStorage 영속화 (`ttokttok-state-v1`, 구 키 폴백)
- `src/engine/` — 시뮬레이션 체결/평가, 리포트 계산, 규칙 기반 실수 리포트 (순수 함수, React 무관)
- `src/data/` — 목업 JSON 3종 + 진단 20문항(오답 풀이 포함)·페르소나(`personas.js`)·강의 10카드·퀴즈 5문항 (기획원본 md에서 코드로 옮긴 것 — 문구 수정 시 원본 md와 어긋나지 않게 주의)
- `src/screens/` — 화면 단위 컴포넌트 (화면기획서 3-1~3-12 매핑)
- `src/components/` — LineChart(커스텀 SVG, 금리 밴드·매매 마커·점진 재생 지원), 공통 UI

## 도메인 상수 (목업 기준)

- 초기 자금 1,000만원 · 매수/매도 수수료 각 0.015% · 매도 거래세 0.18% (`src/engine/constants.js`)
- 시뮬레이션 520주. 금리 레짐: 1~120 완화(2.0%) → **121~220 긴축(2.0→5.0%)** → 221~300 고금리 → 301~420 인하(→2.5%) → 421~520 저금리. 긴축기 구간이 1주차 학습과의 연결고리이므로 유저가 이 구간을 겪게 하는 설계가 중요.
- 또래 평균 62.6점 (한은 2024, 20대) · 주가 상승=빨강, 하락=파랑 (국내 관례)
