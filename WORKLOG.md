# 작업 로그 (인수인계용)

> 규칙: 작업 세션마다 아래 "진행 기록"에 항목 추가. 다른 에이전트가 이어받을 수 있도록 **완료된 것 / 진행 중이던 것 / 다음 할 일**을 남길 것.

## 전체 계획 (2026-07-18 수립)

사용자 확정사항:
- 위치: `~/Desktop/post/커리어/뚝뚝` (git 저장소, 세션 2에서 원격 `fastpageson-cmyk/ttookttook` 연결)
- 배포:~~로컬 프리뷰만~~ → 세션 2에서 **Vercel 배포로 변경** (아래 세션 2 기록 참고, production URL 확보)
- 중간 확인: 0단계 시뮬레이션 동작 시점에 프리뷰 1회 보여주기 (그 외에는 논스톱 진행) — 실제로는 사용자가 이 체크를 건너뛰고 바로 배포 요청으로 넘어감

기술 결정:
- Vite + React(JS) + 커스텀 SVG 차트(라이브러리 없음 — 금리 밴드 오버레이·매매 마커·점진 재생 커스텀 요구 때문) + localStorage 영속화
- 퀴즈 통과 기준 4/5 (잠정치 채택)
- 조기 종료 허용하되 긴축기(121~220주) 전 종료 시 확인 다이얼로그
- 파산: 레버리지 없어 잔고 음수 불가 → 별도 파산 로직 없음, 총자산 -90% 시 안내 배너만

작업 순서 (태스크):
1. ✅ 스캐폴딩 + 데이터 이관 + 이 문서
2. 상태·라우팅·디자인 시스템 (store, styles, LineChart, ui)
3. 스플래시 + 진단 20문항 + 결과
4. 0단계 시뮬레이션 (핵심)
5. 종료 리포트 + AI 실수 리포트(규칙 기반)
6. ★ 사용자 중간 체크 (0단계까지 프리뷰)
7. 홈 대시보드 + 1주차 강의 10카드
8. 실습 3종 (복기 / S&P500 리플레이 / 금리차 슬라이더)
9. 퀴즈 + 마이페이지 + 완료기준 8항목 검증

완료 기준: `docs/기획원본/빌드_브리프_클로드코드용.md` 6번 Acceptance Criteria 8항목.

## 추후 콘텐츠 백로그 (2026-07-18 사용자 지시)

다음 항목은 **추후 콘텐츠에 추가할 사항**으로 사용자가 지정함 (아직 구현하지 말 것, 기획 반영 대기):

- **대출-적금에서의 돈 흐름** — 2주차(저축과 제도) 또는 1주차 심화에 붙일 후보
- **신용-레버리지-리볼빙** — 진단 12·14번, 페르소나 고득점 가이드와 연결 고리 있음
- (옵시디언 `프로젝트 기획서.md` 말미, 사용자 메모) "맨 처음 경제 퀴즈로 수준 파악 후, 이후 카드뉴스에 적절한 용어로 설명" — 수준별 용어 난이도 분기 방향. `personas.js`의 `termLevel` 필드가 이 분기의 훅으로 준비돼 있음(easy/standard). 강의 카드에 `desc_easy` 같은 난이도별 문구를 추가하면 코드 변경 최소로 적용 가능.

## 진행 기록

### 2026-07-18 세션 3 (이름 변경 + 데스크톱 + 진단 고도화)

- **프로젝트명 뚝뚝 → 똑똑**: index.html(title/description), App.jsx(브랜드·디스클레이머), Splash 워드마크, README, CLAUDE.md 반영. localStorage 키 `ddukdduk-state-v1` → `ttokttok-state-v1`(구 키 읽기 폴백으로 기존 진행 이관 — 브라우저 검증 완료). 폴더도 `커리어/똑똑`으로 rename. **GitHub repo(ttookttook)·Vercel 프로젝트명은 유지**(URL·연동 보존, 변경은 사용자 결정 대기).
- **데스크톱 레이아웃(≥1000px)**: styles.css 말미 "데스크톱 레이아웃" 블록. DOM 동일, CSS만 분기 — 기본 화면은 중앙 680px 컬럼, 시뮬레이션은 차트·종목(좌)+주문패널(우 sticky) 2컬럼 그리드(`.sim-screen` 클래스 추가), 스플래시는 풀블리드 히어로+온보딩 3컬럼(`:has` 사용). 1000px 미만은 기존 모바일 그대로. 1280/375 브라우저 검증 완료.
- **사전진단 오답 풀이**: diagnosis.js 20문항 전부에 `explain` 추가 + `categoryBreakdown()`. 진단 결과 화면에 접이식 오답 풀이(내 답/정답/해설)와 카테고리별 강·약 칩 추가.
- **점수별 페르소나**: `src/data/personas.js` 신설 — 0~30 경제 새내기 / 35~55 초보 투자자 / 60~80 열정은 있지만 아직 채울 게 많은 투자자 / 85~100 기본기를 갖춘 투자자. 진단 결과·홈·마이페이지에 노출. `termLevel`(easy/standard) 필드는 추후 용어 난이도 분기용 훅.
- 옵시디언 원본 접근 확인(`~/Library/Mobile Documents/iCloud~md~obsidian/Documents/KGW/김미정/`) — 사용자가 수정한 `프로젝트 기획서.md`를 `docs/기획원본/`에 재동기화.
- 세션 2에서 미커밋으로 남아있던 `.gitignore` 변경 포함 커밋.
- **GitHub↔Vercel 자동 배포 확인 완료**: push 후 1분 내 새 Production 배포 자동 생성(Ready). 고정 도메인 `https://ttookttook.vercel.app` 정상 (똑똑 반영 확인). 이후로는 main push만 하면 됨.
- **다음 할 일**: 수준별 커리큘럼/용어 난이도 분기 구현 여부 사용자 결정 대기(백로그 참고).

### 2026-07-18 세션 1 (Claude Code)

- Vite React 스캐폴딩, git init, npm install 완료
- 목업 JSON 3종 → `src/data/`, SVG 2종 → `src/assets/`, 기획 문서 7종 → `docs/기획원본/` 복사
- CLAUDE.md, WORKLOG.md 작성
- **전 화면 13개 구현 완료** (스플래시/진단/진단결과/시뮬레이션/리포트/실수리포트/홈/강의/실습1·2·3/퀴즈/마이페이지) + 엔진(simulation/report/mistakeReport) + 데이터 모듈(diagnosis/lessons/quiz)
- vite 포트 5175 고정 (처인:담다 5173과 충돌 방지). 처인.zip의 `.claude/launch.json`에 "뚝뚝" 항목 추가(크로스 프로젝트 프리뷰용)
- **브라우저 검증 완료 (0단계까지)**: 닉네임 → 진단 20문항(70점) → 결과 비교 → 시뮬 매매 시나리오(A전자 80주 매수 → 101주 B바이오 250주 매수 → 181주 손절 → 301주 종료) → 리포트(-19.5% vs 벤치마크 +1.5%, MDD -34.9%, 매매로그 3건) → 실수 리포트 3건 생성 확인
- 참고: 강의 카드는 원본 md의 "카드 3~4"를 카드3(물가 경로)/카드4(환율 경로)로 분리해 10장을 맞춤
- 다음: 사용자 중간 체크 → 1주차 흐름(강의/실습/퀴즈) 브라우저 검증 → 완료 기준 8항목 최종 확인

### 2026-07-18 세션 2 (Vercel 배포)

- 사용자가 중간 체크 단계에서 "로컬 프리뷰만" 방침을 변경 — Vercel로 배포해서 공유 링크를 원함.
- `npm run build` 성공 확인, `vercel.json` 추가 (`dist` 출력 + SPA rewrite).
- GitHub 저장소 생성·연결: `https://github.com/fastpageson-cmyk/ttookttook.git` (origin, main 브랜치 push 완료, `git branch -vv` 상 up to date).
- Vercel 프로젝트 연결 완료: 프로젝트명 `ttookttook` (org `fastpageson-3600s-projects`, `.vercel/project.json`에 링크 정보 있음).
- **배포 성공.** Production: `https://ttookttook-mtgm0dmbm-fastpageson-3600s-projects.vercel.app` (`vercel ls`로 확인, Ready 상태). 이후 GitHub 연동이라 **main에 push하면 Vercel이 자동 재배포**할 것으로 예상되나, GitHub Integration이 실제로 켜져 있는지(수동 `vercel --prod` 배포였는지, 자동 배포 훅이 붙었는지)는 다음 세션에서 push 후 재확인 필요.
- 커밋: `dd82765` Initial commit → `2f28ac2` feat(MVP) → `dd03467` Add Vercel deployment config.
- **확인 완료 (세션 종료 직전 재점검)**:
  - `.vercel/`은 git에 트래킹되지 않음(`git ls-files`에 없음, `vercel.json`만 트래킹됨) — 프로젝트 링크 정보 유출 없음, 안전.
  - HEAD(`dd03467`)에 1주차 화면(Home/Lesson/Practice1~3/Quiz/MyPage) 전부 포함 확인 — 배포된 production 빌드도 이 시점 코드를 반영했을 것.
- **미완료로 남은 것**:
  - `.gitignore`에 `.vercel`, `.env*` 추가한 변경사항이 아직 커밋 안 됨 (working tree에 modified 상태로 남아있음 — 다음 세션에서 커밋 필요. 사용자가 명시적으로 커밋을 요청하지 않는 한 이 세션에서는 커밋하지 않음 — 프로젝트 CLAUDE.md에 처인:담다 같은 자동 배포 승인 규칙이 없으므로 기본 규칙[매번 확인] 적용).
  - 1주차 화면(홈/강의10카드/실습3종/퀴즈/마이페이지)은 **코드 작성은 완료**돼 있으나 브라우저 실사용 검증은 아직 안 함 (0단계까지만 검증됨). 다음 세션에서 강의→실습1(0단계 복기 오버레이)→실습2(S&P500 리플레이)→실습3(금리차 슬라이더)→퀴즈(4/5 통과)→홈 잠금해제 순서로 실제로 눌러보며 확인할 것.
  - 완료 기준 8항목(`docs/기획원본/빌드_브리프_클로드코드용.md` 6번) 최종 체크 아직 안 함.
  - GitHub↔Vercel 자동 배포(push 시 재배포) 연동 여부 미확인 — 다음 커밋·push 후 Vercel 대시보드나 `vercel ls`로 새 배포가 자동으로 뜨는지 확인할 것. 안 뜨면 매번 `vercel --prod`로 수동 배포 필요.
  - Production URL: `https://ttookttook-mtgm0dmbm-fastpageson-3600s-projects.vercel.app`
