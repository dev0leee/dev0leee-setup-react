# 15. 브랜치 · 커밋 · PR

> **현재 상태:** 이 레포는 아직 커밋이 하나도 없다. 아래가 첫 커밋부터 적용할 규칙이다.

## 지금 커뮤니티는 (2026-07 기준)

**브랜치 전략은 합의됐고, 커밋 메시지 포맷은 아직 싸우는 중이다.** 둘을 같은 확신으로 쓰면 안 된다.

### 합의된 것 — trunk-based

r/ExperiencedDevs의 ["How do you handle hotfixes with GIT"](https://www.reddit.com/r/ExperiencedDevs/comments/1v25bpe/how_do_you_handle_hotfixes_with_git_independent/) 스레드(71 댓글)에서 최다 추천 답변이 그대로 전략이다.
[u/BoBoBearDev](https://reddit.com/r/ExperiencedDevs/comments/1v25bpe/) (88 upvotes): _"Trunk based. One main. Release is a tag on main. Patch is a branch from the tag of the main."_
[u/ImpossibleEbb6862](https://reddit.com/r/ExperiencedDevs/comments/1v25bpe/) (30 upvotes): _"Get rid of the dev branch. It makes figuring this problem out redundant. Every feature branch should be in a deployable state before merging to master."_
git-flow에 대해서는 [u/HopadilloRandR](https://reddit.com/r/ExperiencedDevs/comments/1v25bpe/) (30 upvotes): _"It's fallen out of some favor more recently."_

### 안 합의된 것 — Conventional Commits

찬성 쪽은 명확하다: 도구 상호운용, 리뷰 사이클 단축, 커밋을 더 잘게 쪼개게 만드는 유인. commitlint는 19K stars다.

**반대 쪽도 만만치 않다.** [Stop Using Conventional Commits](https://sumnerevans.com/posts/software-engineering/stop-using-conventional-commits/)의 논지:

1. **우선순위가 뒤집혔다.** 버그를 쫓거나 장애를 볼 때 궁금한 건 "어느 영역이 바뀌었나"(scope)지 "무슨 종류의 변경인가"(type)가 아니다. 그런데 type이 앞에 오고 scope는 **선택**이다.
2. **type은 중복이다.** 설명문이 이미 종류를 말한다. 50자짜리 제목에서 자리만 먹는다.
3. **약속이 안 지켜진다.** 자동 changelog는 개발자용과 사용자용을 뒤섞고, revert가 끼면 semver 자동화도 깨진다.

대안으로 제시하는 건 **scope 접두 커밋** — Linux, Go, Git, FreeBSD가 실제로 쓰는 형식이다: `net/http/cookiejar: add godoc links`.

Lobsters와 HN에도 별개 스레드가 세 개 있다("considered harmful", "makes me sad", "encourages focus on the wrong things"). **정리된 표준이 아니라 진행 중인 논쟁이다.**

### 이 프로젝트의 결정

**Conventional Commits를 쓴다. 단, scope를 필수로 올린다.** 반대 논거 1·2가 타당하다고 보고, scope를 선택에서 필수로 바꾸면 그 둘이 대부분 해소된다. 약속 3(자동 changelog·semver)은 이 프로젝트가 라이브러리가 아니라 앱이므로 애초에 기대하지 않는다 — 즉 **우리가 Conventional Commits를 쓰는 이유는 자동화가 아니라 일관성이다.**

"접두사 타이핑이 귀찮다"는 반대 논거는 요즘 약해졌다. [@sivalabs](https://x.com/sivalabs/status/2079096471400656933) (47 likes)처럼 AI에 커밋 메시지 생성을 맡기는 게 흔해졌다.

---

## 브랜치 전략 (MUST)

`main` 하나. **`develop` 브랜치를 만들지 않는다.** 릴리스는 `main`의 태그다.

```
main
 ├── feat/order-detail-page
 ├── fix/token-refresh-loop
 └── chore/upgrade-vite
```

### 브랜치 이름

```
<type>/<kebab-case-요약>
```

`type` 어휘는 커밋과 같다. 이슈 번호가 있으면 뒤에 붙인다: `feat/order-detail-page-142`.

### 브랜치 수명 (SHOULD)

**하루를 넘기지 않는 것을 목표로 한다.** 길어질 것 같으면 작업을 쪼개 여러 PR로 나눈다.
머지 전에 **모든 feature 브랜치는 배포 가능한 상태**여야 한다 (위 u/ImpossibleEbb6862).

`main`에 직접 push하지 않는다.

## 커밋 (MUST)

```
<type>(<scope>): <제목>

<본문 - 왜 이렇게 했는지>
```

**`scope`는 선택이 아니라 필수다.** 전역 변경처럼 정말 scope가 없을 때만 생략한다.

### type

| type       | 언제                        |
| ---------- | --------------------------- |
| `feat`     | 사용자에게 보이는 기능 추가 |
| `fix`      | 버그 수정                   |
| `refactor` | 동작 변화 없는 구조 개선    |
| `perf`     | 성능 개선                   |
| `style`    | 포맷팅만                    |
| `test`     | 테스트 추가/수정            |
| `docs`     | 문서                        |
| `chore`    | 빌드, 의존성, 설정          |
| `ci`       | CI 설정                     |

### scope

변경이 속한 영역. 폴더 이름을 쓴다: `auth`, `dashboard`, `api`, `router`, `ui`, `deps`.

한 커밋이 여러 scope에 걸치면 **그건 보통 커밋을 나눠야 한다는 신호다.**
(Conventional Commits 비판자들이 "scope는 신호로서 쓸모없다"고 하는 근거가 실제로는 커밋이 너무 크다는 뜻인 경우가 많다.)

### 제목

- **한글로 쓴다.** 팀 언어가 한글이다.
- 명령형/현재형. "추가함"이 아니라 "추가".
- 마침표 없음. 50자 이내.

```
feat(dashboard): 주문 상세 페이지 추가
fix(api): 401 재시도가 무한 루프에 빠지는 문제 수정
refactor(auth): 토큰 저장소를 store에서 분리
chore(deps): tanstack query 5.101로 업그레이드
```

### 본문 (SHOULD)

**무엇을 했는지가 아니라 왜 했는지를 쓴다.** 무엇을 했는지는 diff가 말한다.

```
fix(api): 401 재시도가 무한 루프에 빠지는 문제 수정

백엔드가 "권한 부족"도 401로 내려주는 엔드포인트가 있어서
refresh -> 401 -> refresh 가 끝없이 반복됐다.
요청 config에 _retried 플래그를 심어 재시도를 1회로 제한한다.

근본 해결은 백엔드가 403을 주는 것이다. BE-231 참고.
```

### 커밋 크기 (SHOULD)

**하나의 논리적 변경 = 하나의 커밋.** 문제가 생겼을 때 그것만 되돌릴 수 있어야 한다.
리팩터링과 기능 추가를 한 커밋에 섞지 않는다.

### 커밋 전 자동 검사

`.husky/pre-commit`이 `lint-staged`를 돌린다:

- `*.{ts,tsx}` → `oxlint --fix` + `prettier --write`
- `*.{js,json,css,md,yml,yaml}` → `prettier --write`

**`--no-verify`로 우회하지 않는다.**

> **아직 없는 것:** 커밋 **메시지** 검사는 없다. 위 형식을 강제하려면 `commitlint` + `.husky/commit-msg`가 필요하다.
> 사람이 지키는 게 반복적으로 어긋나면 그때 붙인다. 지금은 규칙만 두고 도구는 미룬다.

## PR

### 크기 (SHOULD)

**변경 400줄 이내를 목표로.** 넘을 것 같으면 나눈다 — 리팩터링 PR을 먼저 머지하고 기능 PR을 올리는 식.

### 제목

커밋 제목과 같은 형식.

### 본문 템플릿

```markdown
## 무엇을

<!-- 변경 요약 1~3줄 -->

## 왜

<!-- 배경. 이슈 링크. -->

## 어떻게

<!-- 리뷰어가 알아야 할 구현 결정. 대안을 버린 이유. -->

## 확인

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm format:check`
- [ ] `pnpm test`
- [ ] `pnpm test:e2e` (UI 변경 시)
- [ ] 다크모드 확인 (UI 변경 시)

## 스크린샷

<!-- UI 변경이면 before/after -->
```

### PR 작성자 (MUST)

- **CI가 초록인 상태로 리뷰를 요청한다.**
- **본인이 먼저 diff를 읽는다.** 디버그 로그, 주석 처리된 코드, 실수로 들어간 파일을 잡는다.
- **`TODO`를 남기려면 이유와 후속 계획을 쓴다.**
- SHOULD 등급 규칙을 어겼으면 왜 어겼는지 PR에 쓴다.

### 리뷰어

우선순위 순:

1. **정확성** — 의도대로 동작하나. 에러/경계 조건이 처리됐나.
2. **경계** — 상태가 올바른 곳에 있나 ([04-state](./04-state.md)). 레이어 의존 방향을 지켰나 ([01-folder-structure](./01-folder-structure.md)).
3. **컨벤션** — MUST를 지켰나.
4. **가독성** — 6개월 뒤에 읽어도 이해되나.
5. **테스트** — 분기/계산/상호작용에 테스트가 있나.

포맷팅 지적은 하지 않는다. Prettier가 이미 했다.

### 머지 (SHOULD)

- **Squash and merge.** squash 제목은 PR 제목을 쓴다.
- 머지 후 브랜치 삭제.
- **셀프 머지하지 않는다.** 최소 1명 승인.

## CI

`.github/workflows/ci.yml`이 PR과 `main` push에서 돈다.

| 잡       | 내용                                                     |
| -------- | -------------------------------------------------------- |
| `verify` | `typecheck` → `lint` → `format:check` → `test` → `build` |
| `e2e`    | Playwright (chromium), 실패 시 리포트 아티팩트 업로드    |

**로컬에서 통과하지 않는 것을 push하지 않는다.**

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
```
