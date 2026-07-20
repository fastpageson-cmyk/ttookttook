# 똑똑 — 투자 교육 웹사이트 프로토타입

사회초년생이 지식 없이 투자를 해보고 실패를 겪은 뒤(0단계), 거시경제 강의와 실습을
통해 왜 실패했는지 배우는(1주차) 흐름을 목업 데이터로 동작하는 웹사이트로 만든 프로젝트.
학교 토이 프로젝트 — 금융 규제 검토 불필요 (확정, 2026-07-18).
**프로젝트명**: 구명 "뚝뚝" → "똑똑" (2026-07-19 확정). 슬로건 "먼저 잃고, 똑똑해집니다".

## 현재 상태 (2026-07-19 기준)

**MVP(0단계+1주차) 구현 완료.** 화면 12개 전부 동작하며, 전체 흐름
(닉네임 → 사전진단 20문항 → 0단계 매매 → 종료 리포트 → AI 실수 리포트(규칙 기반) →
강의 10카드 → 실습 3종 → 퀴즈 통과)을 실제 브라우저 E2E로 검증함(콘솔 에러 0, 빌드 통과).
남은 백로그는 `docs/TASKS.md` 하단 "다음 백로그" 참고(배포·실기기 QA·실데이터 교체 등).
아직 git 저장소 아님.

## 실행

```bash
npm install
npm run dev    # Vite, 포트 5174
npm run build  # dist/ (gitignore 대상)
```

## 무엇으로 만들어졌나

Vite 6 + **순수 JS(ES 모듈), React 없음**. 화면 = `src/screens/*.js`의 render 함수,
초경량 라우터(`src/router.js`)가 이름으로 전환. 상태는 `src/state.js`의 단일 객체
(`docs/데이터모델.md`의 AppState 구조를 따름)이며 localStorage로 새로고침 시 유지.

| 경로 | 무엇 |
|---|---|
| `src/main.js` | 부트스트랩 + 시작 화면 결정(재방문 시 온보딩 생략) |
| `src/state.js` | AppState + localStorage 저장/초기화. `FEE_RATE`(0.2%)·시작자금 상수 |
| `src/sim-core.js` | 시세/금리 접근, 자산곡선 리플레이, MDD, ETF 주간적립(DCA) 벤치마크, **규칙 기반 AI 실수 리포트**(`generateMistakeReport` — 시그니처 유지, 추후 LLM 교체 지점) |
| `src/content.js` | 진단 20문항·강의 카드 10개·퀴즈 5문항 — `docs/콘텐츠/` 원고 그대로 |
| `src/ui.js` | DOM 빌더 `h()`, `countUp()`(카운트업 모션), SVG `lineChart()`(밴드/마커/점선), 바텀시트 |
| `src/screens/` | onboarding(스플래시·닉네임) / diagnosis / sim(0단계) / report(리포트·공유카드·AI리포트) / learn(홈·강의·퀴즈·마이) / practice(실습 3종) |
| `src/data/` | 목업 JSON (docs/콘텐츠/mock-data의 사본) |
| `src/assets/` | 강의용 SVG 인포그래픽 2종 |

## 편집 시 지킬 것

1. **콘텐츠 원고는 `docs/콘텐츠/`가 원본.** 화면 문구를 바꾸려면 원고를 먼저 바꾸고 `src/content.js`에 반영(둘이 어긋나지 않게).
2. **AI 리포트는 규칙 기반 유지** — 실제 LLM 호출 금지(빌드 브리프 5번). 교체 시 `generateMistakeReport` 내부만.
3. `wrap.append(...)`에 배열을 직접 넘기지 말 것(문자열로 변환됨). `...arr`로 스프레드하거나 `h()`의 자식으로. (실제로 있었던 버그)
4. 디자인 토큰은 `src/styles.css` 상단 `:root` — 토스 계열 차분한 금융 톤. 수익=빨강(`--up`)/손실=파랑(`--down`) 국내 관례.
5. 데이터 구조 바꿀 땐 `docs/데이터모델.md`와 localStorage 마이그레이션(`state.js`의 방어 로직) 함께.

## 문서 (기획 전문)

`docs/빌드_브리프_클로드코드용.md`(스코프·완료기준 — **다른 문서와 충돌 시 우선**) ·
`docs/화면기획서.md`(화면 12개 스펙) · `docs/프로젝트 기획서.md` · `docs/데이터모델.md` ·
`docs/기본적인 컨셉과 개요..md` · `docs/TASKS.md`(**할 일 체크리스트 — 작업 시마다 갱신**)

원본은 Obsidian 볼트 `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/KGW/김미정/`
(볼트가 소스 오브 트루스 — `docs/`와 어긋나면 볼트 기준. TASKS.md는 양쪽 함께 갱신).
리서치 자료(기획 초안 docx): `~/Claude/Projects/hufs_better_world/`
