# zod 3 → 4 변환 규칙 (Phase 0-7)

> 기준 SHA `6d5bf22` · 레거시 `zod ^3.23.8` → 타깃 `zod ^4.4.3`
> 근거: zod v4 공식 마이그레이션 문서 (context7 `/colinhacks/zod/v4.0.1`)

## 결론

**깨지는 것은 에러 메시지 커스터마이징 하나뿐이다.** 스키마 구조(`z.object`·`z.string`·`z.union`·
`z.array`·`z.tuple`·`superRefine`)는 그대로 동작한다.

| 변경                                              |   건수 | 성격                         |
| ------------------------------------------------- | -----: | ---------------------------- |
| `required_error` → `error`                        | **33** | ⚠️ **제거됨. 반드시 변환**   |
| `invalid_type_error` → `error`                    |  **5** | ⚠️ **제거됨. 반드시 변환**   |
| `z.ZodIssueCode.custom` → `'custom'`              |      9 | 권장 (v4 관용구)             |
| `import z from 'zod'` → `import { z } from 'zod'` |     13 | 타깃 컨벤션 통일             |
| `message:` → `error:`                             |    ~24 | 선택 (deprecated지만 동작함) |

---

## 1. ⚠️ `required_error` · `invalid_type_error` — 제거됨

zod 4는 두 파라미터와 `errorMap`을 **완전히 제거**하고 단일 `error`로 통합했다.

```js
// zod 3
z.string({ required_error: '비밀번호를 입력해주세요' })

// zod 4
z.string({ error: '비밀번호를 입력해주세요' })
```

두 메시지가 **다를 때만** 함수 형태가 필요하다:

```js
z.string({ error: (issue) => (issue.input === undefined ? '필수입니다' : '문자열이어야 합니다') })
```

### 이 프로젝트에서는 함수 형태가 필요 없다

동시 사용이 4곳뿐이고 **전부 두 메시지가 동일하다.** 단순 치환으로 끝난다.

| 위치                                                                  | 메시지                             |
| --------------------------------------------------------------------- | ---------------------------------- |
| `schemas/common.js:60-61` (`visitPurpose`)                            | `'방문목적을 선택해주세요'` (동일) |
| `schemas/common.js:71-72` (`inOutParkingScheduledDate` 내부 `z.date`) | `'기간을 선택해주세요'` (동일)     |
| `schemas/common.js:77-78` (`inOutParkingScheduledDate` 튜플)          | `'기간을 선택해주세요'` (동일)     |
| `schemas/vote.js:25-26` (`optionList`)                                | `'옵션을 선택해주세요'` (동일)     |

```js
// before
z.object({ ... }, { required_error: '방문목적을 선택해주세요',
                    invalid_type_error: '방문목적을 선택해주세요' })
// after
z.object({ ... }, { error: '방문목적을 선택해주세요' })
```

### 분포

| 위치                        | `required_error` | `invalid_type_error` |
| --------------------------- | ---------------: | -------------------: |
| `schemas/common.js`         |               18 |                    3 |
| `schemas/movingHouse.js`    |                3 |                    — |
| `schemas/resident.js`       |                3 |                    — |
| `schemas/auth.js`           |                1 |                    — |
| `schemas/parking.js`        |                1 |                    — |
| `schemas/vote.js`           |                1 |                    1 |
| `views/**/*.vue` (3개 파일) |                6 |                    1 |
| **합계**                    |           **33** |                **5** |

> `views/` 안의 7건은 `PasswordResetView.vue`·`SignUpAptInfoView.vue`·`SignUpUserInfoView.vue`에
> 인라인으로 정의된 스키마다. 타깃에서는 **`features/<domain>/schemas/`로 옮긴다**
> (`docs/conventions/13-forms.md`: 스키마는 `schemas/`에).

### ⚠️ 조용히 깨진다

`required_error`를 그대로 두면 zod 4는 **알 수 없는 옵션으로 무시**한다.
타입 에러도 안 나고 런타임 에러도 안 난다 — **에러 메시지만 기본 영문 메시지로 바뀐다.**

```
"Invalid input: expected string, received undefined"   ← 사용자에게 이게 보인다
```

**등가 이관 위반이 사용자 눈에 직접 보이는 형태**이므로 변환 누락이 없어야 한다.
Phase 6에서 도메인별로 폼 에러 메시지를 실제로 띄워보고 확인한다.

---

## 2. `z.ZodIssueCode.custom` → `'custom'` (9곳)

v4의 관용구는 문자열 리터럴이다.

```js
// zod 3
ctx.addIssue({ code: z.ZodIssueCode.custom, message: '...', path: [...] })

// zod 4
ctx.addIssue({ code: 'custom', message: '...', path: [...] })
```

| 파일                      |                                 건수 |
| ------------------------- | -----------------------------------: |
| `schemas/survey.js`       | 6 (라인 89, 113, 133, 143, 152, 175) |
| `schemas/vote.js`         |                      2 (라인 48, 55) |
| `schemas/tempPassword.js` |                          1 (라인 17) |

`superRefine` 자체는 v4에도 있고 `ctx.addIssue` 시그니처도 동일하다. **로직은 그대로 옮긴다.**

---

## 3. import 스타일 (13곳)

레거시는 전부 default import다.

```js
import z from 'zod' // 레거시 13곳
import { z } from 'zod' // 타깃 기존 코드 (bridge.ts 등)
```

**타깃 컨벤션(named import)으로 통일한다.** `verbatimModuleSyntax`가 켜져 있으므로
타입만 쓰는 곳은 `import type`.

---

## 4. `message:` → `error:` (선택)

v4에서 `message`는 **deprecated지만 계속 동작한다** (내부적으로 `error`로 정규화).

```js
z.string().min(5, { message: 'Too short.' }) // 동작함
z.string().min(5, { error: 'Too short.' }) // v4 권장
```

`message`와 `error`를 **동시에 지정하면 런타임 에러**가 나므로 섞지 않는다.

| 파일                                                     | `message:` 건수 |
| -------------------------------------------------------- | --------------: |
| `schemas/common.js`                                      |              10 |
| `schemas/survey.js`                                      |               6 |
| `schemas/resident.js`                                    |               3 |
| `schemas/vote.js`                                        |               2 |
| `schemas/movingHouse.js` · `auth.js` · `tempPassword.js` |            각 1 |

**방침**: 새로 쓰는 코드는 `error:`, 이관 시 `message:`는 굳이 바꾸지 않는다.
동작이 같고, 바꾸다 실수하면 등가성이 깨진다. 일괄 정리는 `deferred.md`로.

---

## 5. 그대로 동작하는 것 (변환 불필요)

| API                                                                                                                         | 사용 | 비고   |
| --------------------------------------------------------------------------------------------------------------------------- | ---: | ------ |
| `z.string()` `z.object()` `z.array()` `z.union()` `z.literal()` `z.date()` `z.boolean()` `z.number()` `z.enum()` `z.null()` | 다수 | 그대로 |
| `z.discriminatedUnion()`                                                                                                    |    1 | 그대로 |
| `z.tuple()`                                                                                                                 |    1 | 그대로 |
| `.min()` `.max()` `.regex()` `.trim()`                                                                                      |   35 | 그대로 |
| `.optional()` `.nullable()` `.nullish()`                                                                                    |   14 | 그대로 |
| `.refine()` `.superRefine()`                                                                                                |    9 | 그대로 |

레거시는 `.email()`·`.url()`·`.uuid()`·`.datetime()`·`z.record()`·`.merge()`·
`z.nativeEnum()`·`.deepPartial()`·`z.function()`·`errorMap`을 **하나도 쓰지 않는다.**
v4의 다른 breaking change에 걸리는 것이 없다.

---

## 6. 스키마 파일 이관 매핑

레거시 `src/schemas/` 10개 파일 606줄 → feature별로 분산한다.

| 레거시                    |  줄 | 타깃                            |
| ------------------------- | --: | ------------------------------- |
| `schemas/common.js`       | 141 | ⚠️ **분해 필요** — 아래         |
| `schemas/survey.js`       | 183 | `features/survey/schemas/`      |
| `schemas/vote.js`         |  63 | `features/vote/schemas/`        |
| `schemas/parking.js`      |  58 | `features/parking/schemas/`     |
| `schemas/resident.js`     |  57 | `features/mypage/schemas/`      |
| `schemas/movingHouse.js`  |  34 | `features/movingHouse/schemas/` |
| `schemas/tempPassword.js` |  23 | `features/visit/schemas/`       |
| `schemas/repair.js`       |  19 | `features/repair/schemas/`      |
| `schemas/auth.js`         |  15 | `features/auth/schemas/`        |
| `schemas/board.js`        |  13 | `features/board/schemas/`       |

### `common.js` 분해 방침

타깃 `shared/schemas/common.ts`의 규칙은 **"전체 스키마가 아니라 필드 프리미티브만 공유"**다.
현재 타깃엔 `phoneField`·`paginationSchema`가 있다.

| 레거시 심볼                                                                                        | 성격            | 이관 위치                                             |
| -------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------- |
| `phone` · `noHyphenPhone` · `name` · `nickName` · `password` · `verificationCode`                  | 필드 프리미티브 | **`shared/schemas/`** (타깃 `phoneField`와 통합 검토) |
| `carNum` · `visitPurpose` · `inOutParkingScheduledDate` · `emergencyPhone` · `parkingWallPadAlarm` | 주차 도메인     | `features/parking/schemas/`                           |
| `title` · `content` · `category`                                                                   | 게시판 도메인   | `features/board/schemas/`                             |
| `location` · `requirement` · `memo`                                                                | 하자보수 도메인 | `features/repair/schemas/`                            |
| `id` (= `phone` 별칭)                                                                              | 인증            | `features/auth/schemas/`                              |

> ⚠️ `id = phone`이다 (`common.js:108`). **로그인 아이디가 휴대폰 번호**라는 도메인 규칙이
> 별칭 한 줄에 숨어 있다. 이관 시 명시적으로 드러낸다.

> ⚠️ 타깃 `shared/schemas/common.ts`의 `phoneField`가 레거시 `phone`과 **같은 규칙인지 대조**해야 한다.
> 레거시 `phone`은 `PHONE_REGEX`(하이픈 포함 형식) + `.max(13)`이고,
> `noHyphenPhone`은 `PHONE_CUSTOM_REGEX`(하이픈 없음)다. **두 종류가 따로 있다.**
> `domain-codes.md` D-Q2와 같은 건.

---

## 7. 별개 이슈 — `toTypedSchema` 제거

레거시 스키마는 `@vee-validate/zod`의 `toTypedSchema()`로 감싸 export한다.

```js
export const voteAuthNamePhoneSchema = toTypedSchema(z.object({ name, phone }))
```

zod 변환과 무관한 **폼 라이브러리 교체 건**이다. 타깃은 react-hook-form이므로
래핑을 **벗기고 순수 zod 스키마를 export**한 뒤, 페이지에서 `zodResolver(schema)`로 연결한다.

```ts
// features/vote/schemas/voteAuth.ts
export const voteAuthNamePhoneSchema = z.object({ name, phone })
export type VoteAuthNamePhoneValues = z.infer<typeof voteAuthNamePhoneSchema>

// 페이지
const form = useForm({ resolver: zodResolver(voteAuthNamePhoneSchema) })
```

> `z.infer` 파생 타입은 `schemas/`에 그대로 둔다 — `docs/conventions/05-types.md`의 명시적 예외.

### 동적 스키마 팩토리

`voteFormSchema(questionList)`·`surveyFormSchema(...)`처럼 **인자를 받아 스키마를 만드는 함수**가 있다
(`vote.js:15`, `survey.js`). 서버에서 받은 질문 목록으로 `minChoice`/`maxChoice` 검증을 만든다.

React에서는 **`useMemo`로 질문 목록이 바뀔 때만 재생성**하고 `resolver`에 넘긴다.
매 렌더마다 새 스키마를 만들면 RHF가 리졸버를 계속 교체한다.

---

## 8. 변환 체크리스트 (Phase 6 도메인별)

- [ ] `required_error` → `error` (해당 도메인 건수 확인)
- [ ] `invalid_type_error` → `error`
- [ ] 동시 사용이면 메시지가 같은지 확인 → 같으면 `error` 하나로
- [ ] `z.ZodIssueCode.custom` → `'custom'`
- [ ] `import { z } from 'zod'`
- [ ] `toTypedSchema()` 벗기고 `zodResolver`로 연결
- [ ] 동적 스키마 팩토리는 `useMemo`로 감싸기
- [ ] **폼을 실제로 띄워 빈 값 제출 → 한국어 에러 메시지가 레거시와 동일한지 확인**
      (변환 누락 시 영문 기본 메시지가 뜬다)
