# 결정 — 인증/로그인 전략

> 결정일: 2026-07-29 · 결정자: 사용자
> **이 결정은 최초 계획(쿠키 refresh 전환)을 뒤집는다.**

## 결정

> **로그인은 레거시 구현 방식을 그대로 유지한다.**
> 쿠키 기반 refresh 전환은 하지 않고, **전환 완료 후 별도 작업**으로 남긴다.

## 최초 계획과의 차이

| 항목              | 최초 계획 (폐기)                       | **확정**                                               |
| ----------------- | -------------------------------------- | ------------------------------------------------------ |
| 토큰 전달         | 쿠키(`Set-Cookie` + `withCredentials`) | **응답/요청 헤더** (`authorization`, `refresh-token`)  |
| accessToken 보관  | 메모리 (`tokenStore.ts`)               | **localStorage**                                       |
| refreshToken 보관 | HttpOnly 쿠키                          | **localStorage**                                       |
| 자동 로그인       | 폐기 (세션 만료 시 재로그인)           | **유지** (`userAuthInfo`의 아이디·비밀번호로 재로그인) |
| 백엔드 협의       | **필요**                               | **불필요**                                             |
| 웹뷰 쿠키 검증    | **필요**                               | **불필요**                                             |

## 이 결정의 효과

### 1. 등가 이관 원칙에 예외가 사라졌다

최초 계획에서 인증 변경은 "사용자가 승인한 유일한 의도적 변경"이었다.
이제 **UI·동작 전 영역이 예외 없이 등가 이관**이 된다. 원칙이 단순해지고 검증도 명확해진다.

- 리스크 **R11**(세션 만료 UX 변화) **소멸**
- 전환 공지 불필요

### 2. Phase 0 블로커 3건 중 2건이 해소됐다

| #   | 항목                          | 상태                                               |
| --- | ----------------------------- | -------------------------------------------------- |
| 0-1 | 인증 계약 백엔드 협의         | **불필요 — 해소**                                  |
| 0-2 | 네이티브 웹뷰 쿠키 동작 검증  | **불필요 — 해소**                                  |
| 0-3 | 자동 로그인 대체 설계         | **불필요 — 해소** (레거시 자동 로그인 그대로 이식) |
| 0-4 | 네이티브 브릿지 핸들러명 정합 | **여전히 블로커** (앱 팀 확인 필요)                |

**Phase 4(기반 구축) 착수를 막던 외부 의존이 0-4 하나로 줄었다.** 일정 리스크가 크게 낮아진다.

### 3. 대신 타깃 템플릿의 HTTP 인프라를 다시 써야 한다

이것이 이 결정의 비용이다. 타깃 `src/shared/lib/**`는 쿠키 refresh를 전제로 만들어져 있다.

| 파일               | 최초 계획        | **변경 후**                                                          |
| ------------------ | ---------------- | -------------------------------------------------------------------- |
| `apiClient.ts`     | 그대로 재사용    | ⚠️ **재작성** — 쿠키/Web Locks 기반 refresh를 헤더 기반으로          |
| `tokenStore.ts`    | 그대로 재사용    | ⚠️ **재작성** — 메모리 → localStorage                                |
| `authChannel.ts`   | 그대로 재사용    | ⚠️ **재검토** — BroadcastChannel 탭 동기화가 필요한지 (웹뷰 단일 탭) |
| `apiErrors.ts`     | 그대로 재사용    | ⚠️ **확장** — `ServerErrorBody`를 중첩 구조로 (E-Q7)                 |
| `queryClient.ts`   | 그대로 재사용    | 그대로 재사용                                                        |
| `features/auth/**` | 계약에 맞게 조정 | **레거시 로직 이식**                                                 |

> 타깃 템플릿의 인증 설계가 더 안전한 것은 사실이나, **등가 이관이 최우선**이라는
> 사용자 결정에 따른다. 개선 방향은 `deferred.md`에 보존한다.

## 이관 대상 — 레거시 인증 구현

| 레거시       | 위치                                                                                                                         | 이관 방식                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 토큰 저장    | `lib/composables/storage/useAuthStorage.js` (166 LOC)                                                                        | Zustand + `persist` 또는 동등 localStorage 래퍼                                                                                    |
| 저장 키      | **8종** — `accessToken`, `refreshToken`, `authUser`, `userAuthInfo`, `aptInfo`, `fontSize`, `surveyCertInfo`, `voteCertInfo` | **키 이름·직렬화까지 동일하게.** 기존 앱 사용자의 저장값을 이어받아야 한다 (R13). `features/mypage.md`에서 6종 → 8종으로 실측 정정 |
| 토큰 직렬화  | 레거시 JSON 따옴표를 읽을 때 벗기고 쓸 때는 raw                                                                              | **그대로 재현** (기존 사용자 데이터 호환)                                                                                          |
| 로그인       | `lib/queries/auth/usePatchLogin.js` (111 LOC)                                                                                | 응답 **헤더** `authorization`·`refresh-token`에서 토큰 추출                                                                        |
| 토큰 재발급  | `api/axios.js` 응답 인터셉터                                                                                                 | `errorCode`가 `EXPIRED_TOKEN`/`INVALID_TOKEN`일 때만 트리거 (**401 상태코드 아님**)                                                |
| 대기 요청 큐 | `stores/pendingRequests.js` + `watch`                                                                                        | ⚠️ 계획서 3-3에서 "삭제(apiClient가 대체)"로 판단했으나, **헤더 방식 유지 시 다시 필요하다.** Phase 5에서 설계                     |
| 자동 로그인  | `MainApp.vue`의 `watch` + `userAuthInfo`                                                                                     | 재발급 실패 시 저장된 아이디·비밀번호로 재로그인                                                                                   |
| 로그아웃     | `lib/queries/auth/useDeleteLogout.js` + `useLogoutFlow.js`                                                                   | 로비폰 세대는 `putLobbyPhoneResidentLogout` 선행                                                                                   |
| 라우터 가드  | `router/index.js` `beforeEach`                                                                                               | `routes.md` §6의 5단계 로직                                                                                                        |

### 로그인 에러코드 매핑 (그대로 이관)

| errorCode                     | 동작                       |
| ----------------------------- | -------------------------- |
| `RESIDENT_NOT_FOUND`          | SweetAlert 에러 모달       |
| `INVALID_PASSWORD`            | SweetAlert 에러 모달       |
| `APT_NOT_FOUND`               | SweetAlert 에러 모달       |
| `HOUSEHOLD_NOT_FOUND`         | SweetAlert 에러 모달       |
| `RESIDENT_NOT_APPROVED`       | `/login/pending`으로 이동  |
| `oldResidentFlag` (성공 응답) | `/versionOne/terms`로 이동 |

## 계획서 수정 사항

`~/.claude/plans/working-smcom-apt-resident-fe-tranquil-charm.md`에 반영:

1. 「확정된 결정」의 `인증 계약` 행 → 레거시 방식 유지
2. 「최우선 원칙」의 "단 하나의 예외" 문단 → **삭제** (예외 없음)
3. Phase 0에서 0-1·0-2·0-3 → **삭제**
4. Phase 3-2의 `api/axios.js` → `apiClient.ts` 그대로 사용 → **재작성**으로 변경
5. Phase 3-3의 `pendingRequests.js` 삭제 → **재검토**로 변경
6. 리스크 R3·R4·R11 → **삭제**, R12(HTTP 인프라 재작성) 추가

## 남긴 개선 항목 (`deferred.md`)

- D-15 아이디·비밀번호 평문 localStorage 저장
- D-16 미승인 입주민 조회의 쿼리스트링 비밀번호
- D-17 쿠키 기반 refresh 전환 (본 결정으로 미뤄진 것)
