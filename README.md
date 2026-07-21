# 똑똑

> 먼저 잃고, 똑똑해집니다.

사회초년생이 아무것도 모른 채 투자를 해보고(0단계), 그 실패를 교재 삼아 거시경제부터
배우는(1주차~) 투자 교육 웹사이트. 학교 토이 프로젝트. (구명 "뚝뚝", 2026-07-19 개명)

**🔗 https://ttookttook.vercel.app**

## 👉 시작점은 [`CLAUDE.md`](./CLAUDE.md)

MVP(0단계 + 1주차)가 완성·배포된 상태입니다. 구조·편집 규칙·검증 시 주의사항·남은 백로그는
[`CLAUDE.md`](./CLAUDE.md)와 [`docs/TASKS.md`](./docs/TASKS.md)를 먼저 읽으세요.

## 빠른 실행

```bash
npm install
npm run dev    # http://localhost:5174
npm run build
```

`main`에 push하면 Vercel이 자동 배포합니다.

## 한눈에

| 경로 | 무엇 |
|---|---|
| `src/` | Vite + 순수 JS 앱 (화면 12개, React 없음) |
| `src/data/` | 목업 시세·금리 JSON (전부 가상 데이터) |
| `docs/` | 기획서·화면기획서·데이터모델·콘텐츠 원고 (Obsidian 볼트 사본) |
| `docs/TASKS.md` | 할 일 체크리스트 (완료 이력 + 다음 백로그) |

본 시뮬레이션은 학습용 가상 데이터를 사용하며, 실제 투자 조언이 아닙니다.
