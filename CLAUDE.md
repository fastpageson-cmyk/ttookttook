# 똑똑 — 투자 교육 웹사이트

사회초년생이 지식 없이 투자를 해보고 실패를 겪은 뒤(0단계), 거시경제 강의·실습으로
왜 실패했는지 배우는(1주차) 흐름을 목업 데이터로 동작시키는 학교 토이 프로젝트.
금융 규제 검토 불필요(2026-07-18 확정). 구명 "뚝뚝" → **"똑똑"**(2026-07-19 확정).
슬로건 **"먼저 잃고, 똑똑해집니다"**.

## 지금 상태 (2026-07-21)

**전 6주차 + 주차별 미니 모의투자 완성.** 아래 전부 구현·브라우저 실측 검증됨(콘솔 에러 0).

- **2~6주차 전개**: 학교 교육자료(docx)를 원천으로 강의 카드 + 확인 퀴즈 5문항씩 구현
- **주차별 미니 모의투자**: 모든 주차 실습의 **마지막**에 배치. 그 주차에서 배운 개념을 직접 조작한다
  (1주차 금리국면 / 2주차 저축률·적금 실효수익률 / 3주차 **대출 레버리지·반대매매** /
  4주차 자산배분·리밸런싱·MDD / 5주차 PER·PBR·소음vs신호 / 6주차 ISA·손익통산·중도해지)
- **주차 잠금**: 1주차는 0단계 종료 시, 2~6주차는 직전 주차 퀴즈 통과 시 해제

### 이전 상태 (2026-07-19) — MVP(0단계+1주차) 완성 + 배포

- 화면 12개: 스플래시 → 닉네임 → 사전진단 20문항 → 진단결과 → 0단계 블라인드 투자 →
  종료 리포트 → AI 매매실수 리포트(규칙 기반) → 홈 → 강의 10카드 → 실습 3종 → 퀴즈 → 마이
- 디자인: 토스 톤. 숫자 카운트업, 결과 공유 카드(PNG), 정오답 마이크로 피드백
- **데스크톱 레이아웃(≥1024px)**: 스플래시 히어로 2컬럼 / 시뮬 트레이딩 2컬럼 /
  탭바→상단 네비 / 읽기형 680px 중앙정렬 / 바텀시트→중앙 다이얼로그
- **진단 결과 보강**: 점수별 페르소나 4단계, 영역별(카테고리) 이해도 막대, 틀린 문항 오답풀이
- **0단계 파산 처리**: 총자산 < 시작자금 20%면 파산 모달 → 종료, 리포트에 파산 배너

**🔗 라이브: https://ttookttook.vercel.app** · **레포: https://github.com/fastpageson-cmyk/ttookttook** (public)

다음 할 일은 `docs/TASKS.md` 하단 "다음 백로그" 참고.

## 실행 / 배포

```bash
npm install
npm run dev    # Vite, 포트 5174
npm run build  # dist/ (gitignore 대상)
```

**`main`에 push하면 Vercel이 자동 배포**된다(연동 확인됨, 보통 30초 내 Ready).
확인: `vercel ls ttookttook`. Vercel 계정 `fastpageson-3600`, 프로젝트 `ttookttook`
(Framework Vite / build `npm run build` / output `dist`). git 인증은 osxkeychain.
`git add -A` 금지 — **특정 파일만** add(아래 미추적 폴더 주의).

## 스택 / 파일 지도

Vite 6 + **순수 JS(ES 모듈), React 없음**. 화면 = `src/screens/*.js`의 render 함수를
초경량 라우터(`src/router.js`)가 이름으로 전환. 상태는 `src/state.js` 단일 객체
(`docs/데이터모델.md`의 AppState 구조), localStorage로 새로고침 시 유지.

| 경로 | 무엇 |
|---|---|
| `src/main.js` | 부트스트랩 + 시작 화면 결정(재방문 시 온보딩 생략) |
| `src/state.js` | AppState + localStorage. `STARTING_CASH`, `FEE_RATE`(0.2%) |
| `src/sim-core.js` | 시세/금리 접근, 자산곡선 리플레이, MDD, ETF 주간적립(DCA) 벤치마크, `BANKRUPT_RATIO`, **규칙 기반 `generateMistakeReport`**(LLM 교체 지점) |
| `src/content.js` | 진단 20문항(+explain)·`PERSONAS`/`personaForScore`·`categoryBreakdown`·강의 10카드·퀴즈 5문항 |
| `src/ui.js` | DOM 빌더 `h()`, `countUp()`, SVG `lineChart()`(밴드/마커/점선), `openSheet()` |
| `src/screens/` | onboarding · diagnosis · sim · report · learn(홈/마이) · **week(강의/실습허브/퀴즈 — 주차 공통)** · practice(1주차 실습 3종) |
| `src/weeks/weekN.js` | 주차별 **강의 카드 + 퀴즈 + 미니 모의투자 설정**. 원고 사본(원본은 `docs/콘텐츠/`) |
| `src/weeks/index.js` | 주차 레지스트리 + 잠금·진행 헬퍼(`isUnlocked`/`currentWeek`/`practiceCount`) |
| `src/mini-sim.js` | 미니 모의투자 **공용 엔진**(브리핑→설정→진행→결과) + 목업 계열 생성(채권·금·현금)·MDD·공용 UI 조각 |
| `src/styles.css` | 디자인 토큰(`:root`) + 반응형. 파일 하단에 데스크톱(≥1024) 블록 |
| `src/data/` | 목업 JSON (`docs/콘텐츠/mock-data`의 사본) |

## 편집 시 지킬 것 (실제로 당한 것들)

1. **콘텐츠 원고 원본은 `docs/콘텐츠/`.** 화면 문구를 바꾸려면 원고 먼저 → `src/content.js` 반영.
2. **AI 리포트는 규칙 기반 유지** — 실제 LLM 호출 금지(빌드 브리프 5번). 교체 시 `generateMistakeReport` 내부만.
3. `wrap.append(...)`에 **배열을 직접 넘기지 말 것**(문자열로 변환됨). `...arr` 스프레드 또는 `h()`의 자식으로. — 실제 버그였음.
4. 색: 수익=빨강(`--up`)/손실=파랑(`--down`) 국내 관례.
5. **시뮬 화면 순서**: 데스크톱은 `.sim-grid` 2컬럼, 모바일은 `display:contents`+`order`로
   총자산→종목→차트→시간 순 유지. `order`를 쓰므로 topbar/안내문/disclaimer에도 order를 명시해야
   함(기본 order:0이라 안 그러면 위로 튀어 오름).
6. **`BANKRUPT_RATIO=0.20`의 이유**: 목업상 단일 종목 all-in 최악이 B바이오 -84%/D플랫폼 -81%라
   10% 기준은 절대 도달 불가(죽은 코드)였음. 스펙 3-5의 '잔고 0' 완전파산은 상장폐지 데이터가
   있어야 성립 — 데이터 확보 시 하향할 것.
7. 데이터 구조 변경 시 `docs/데이터모델.md`와 localStorage 방어 로직(`state.js`) 함께.
8. **`week`라는 이름의 지역변수 금지** — `state.js`의 `week(id)` 접근자를 가린다. `practice.js`의
   `prac2`가 주차 카운터로 `let week`을 써서 실제로 TypeError가 났고, 지금은 `weekState` 별칭으로 import 중.
9. **`compareChart`에는 정규화된 값(1.0 기준)을 넘길 것.** y축을 `(v*100-100)%`로 찍기 때문에
   원화 원본값을 넘기면 `777524573%` 같은 라벨이 나온다 — 3주차에서 실제로 발생.
10. **미니 모의투자에서 중도 종료를 지원하면 비교군도 같은 시점까지만 돌릴 것.** 안 그러면
   "시장은 -12.7%인데 내 계좌는 +6.9%" 같은 앞뒤 안 맞는 코칭 문구가 나온다(`endIndex` 기준으로 정렬).
11. **결과 비교 막대에 '지금 꺼낼 수 없는 돈'을 섞지 말 것.** 6주차에서 연금 유지 잔고가 최고 막대로
   보여 "3~5년 목돈은 연금이 최고"라는 반대 결론을 줄 뻔했다 — `locked` 표시 + 비교 기준에서 제외.
12. 새 주차를 추가하면 `state.js`의 `WEEK_IDS`와 `weeks/index.js`의 `WEEKS` 배열 양쪽에 등록.

## ⚠️ 검증 시 주의 (중요)

이 환경의 **프리뷰 스크린샷 툴이 데스크톱 폭에서 낡은/축소된 프레임을 반환**한다. 데스크톱
레이아웃이 깨져 보여도 실제로는 정상인 경우가 있었음. **레이아웃·데이터 검증은 반드시
`javascript_tool`로 `getBoundingClientRect()` 실측**할 것. 모바일 폭(≤390) 스크린샷은 정상.

## 이력 (레포에 React 커밋이 섞여 있는 이유)

코덱스가 **다른(클라우드) 환경에서 같은 과제를 병렬로** React+Vite8로 먼저 만들어 이 레포에
푸시·배포해뒀었다(옛 다크톤, 슬로건 "떨어져 봐야 배웁니다"). 2026-07-19에 우리 순수JS 버전을
그 히스토리 **위에 얹어 교체**(`22e15e8`, parent `c7677b3`) — 히스토리는 보존, 트리는 우리 것.
코덱스 로컬 폴더(`커리어/뚝뚝/`)는 이 맥에 없다. 로컬 소스는 `커리어/project/똑똑/`뿐.

## 문서

`docs/빌드_브리프_클로드코드용.md`(스코프·완료기준 — **충돌 시 최우선**) ·
`docs/화면기획서.md`(화면 12개 스펙) · `docs/프로젝트 기획서.md` · `docs/데이터모델.md` ·
`docs/기본적인 컨셉과 개요..md` · **`docs/TASKS.md`(할 일 — 작업할 때마다 갱신)**

원본은 Obsidian 볼트 `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/KGW/김미정/`
(**볼트가 소스 오브 트루스** — `docs/`와 어긋나면 볼트 기준. TASKS.md는 **양쪽 함께 갱신**).
기획 초안 docx: `~/Claude/Projects/hufs_better_world/`

## 📌 `교육 자료/` — 레포 미포함 (2026-07-21 결정)

`교육 자료/`(1~6주차 교육자료 docx 6개 + `markdown/` 변환본, 244KB)는 **학교 교육자료 원본**이라
레포가 public인 점을 고려해 `.gitignore`로 제외했다. 대신 앱에 필요한 내용만 정제해
`docs/콘텐츠/2~6주차_*.md` 원고로 옮겼고, 이 원고가 `src/weeks/weekN.js`의 원본이다.

**콘텐츠 수정 경로**: `교육 자료/`(원천, 로컬 전용) → `docs/콘텐츠/`(원고 원본, 레포 포함) →
`src/weeks/weekN.js`(사본). 문구를 바꾸려면 원고부터 고칠 것.
1주차 원고는 아직 `교육 자료/1주차` 기준으로 보강하지 않았다(기존 원고 유지 중).
