# 15. 브랜치 / 커밋 / PR

이 레포의 실제 git 관례에서 뽑은 규칙이다. 강제는 레포 설정(브랜치 보호·머지 전략)과
CI(`.github/workflows/ci.yml`)·husky가 한다. 이 문서는 그 나머지를 다룬다.

## 브랜치 (MUST)

| 브랜치        | 역할                        |
| ------------- | --------------------------- |
| `main`        | 기본 브랜치. 항상 배포 가능 |
| `feat/{기능}` | 기능 개발                   |
| `fix/{내용}`  | 버그 수정                   |

- **`main`에 직접 push하지 않는다.** 항상 `feat/*` · `fix/*`에서 작업하고 PR로 합친다.
- `dev` 통합 브랜치는 두지 않는다. 이 템플릿은 `main` 하나로 충분하다.
- 브랜치 보호 규칙은 `README`에 문서화돼 있다.

## 커밋 메시지 (MUST)

**`type : 요약`** 형식이다. **type과 콜론 사이에 공백을 하나 둔다.**

```
feat : 대시보드 주문 테이블 추가
fix : 장바구니 수량이 음수로 내려가는 버그 수정
refactor : auth 인터셉터의 refresh 락 로직 정리
chore : 린터를 oxlint에서 ESLint로 교체
ci : 액션 최신 메이저로 올려 Node 20 deprecation 경고 제거
```

- **type은 영어, 본문은 한국어.** 이 레포의 실제 히스토리가 그렇다.
- 자주 쓰는 type: `feat` / `fix` / `refactor` / `perf` / `chore` / `ci` / `docs` / `test`.
- **`perf`는 동작이 같고 성능만 달라졌을 때** 쓴다. 메모이제이션, 번들 분할, 쿼리 수 감소 등.
  구조를 바꿨으면 `refactor`, 동작이 바뀌었으면 `feat`/`fix`다.
- **표준에 없는 type을 만들지 않는다.** `rename`·`remove`·`hotfix` 같은 건 쓰지 않는다 —
  파일 이동·삭제는 `refactor`나 `chore`, 급한 수정도 그냥 `fix`다.
  commitlint류 표준 도구가 인식하는 집합 안에 머문다.
- **범위(scope)는 되도록 적지 않는다.** 요약 문장이 이미 어디를 건드렸는지 말해준다.
  범위까지 붙이면 같은 말을 두 번 하게 된다.
- 그래도 적어야 한다면 **요약 앞에 괄호로** 둔다 — `feat : (mypage) 마이페이지 8개 화면 이관`.
  `feat(mypage):`처럼 type에 괄호를 붙이지 않는다. type과 범위가 한 덩어리로 보여 읽기 어렵다.
- ⚠️ 이 형식은 **Conventional Commits 규격이 아니다.** 콜론 앞 공백 때문에 표준 파서는
  type을 인식하지 못한다. 이 레포엔 commitlint이 없어서(`.husky`에 `commit-msg` 훅 없음)
  문제가 되지 않지만, **commitlint을 도입하려면 이 규칙부터 바꿔야 한다.**

## PR (MUST)

- `feat/*` · `fix/*` → `main`으로 PR을 연다.
- **Squash merge를 쓴다.** 브랜치의 커밋들을 1개로 합쳐 `main` 히스토리를 깔끔하게 유지한다.
  머지 전략은 문서가 아니라 **레포 설정에서 강제**하는 게 확실하다.
- PR 본문은 `.github/pull_request_template.md`를 따른다.

## push 전 (MUST)

로컬에서 통과하지 않는 것을 push하지 않는다. husky가 커밋 시 lint/format을 막지만,
push 전에 전체를 한 번 돌린다.

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```

CI가 `typecheck → lint → format:check → test → build`와 e2e를 병렬로 다시 돌린다.
로컬에서 미리 잡는 게 빠르다.
