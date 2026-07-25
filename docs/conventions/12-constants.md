# 12. 상수 관리

상수는 `as const` 객체로 정의하고 타입은 거기서 파생시킨다 ([05-types](./05-types.md)).
`enum`은 쓰지 않는다 (`erasableSyntaxOnly` 위반).

## 무엇을 상수화하나 (MUST)

리터럴이 셋 중 **하나라도** 해당하면 이름을 붙여 `constants/`로 뺀다.

1. **여러 곳에서 반복 사용되는가?**
2. **나중에 이 값이 바뀔 가능성이 있는가?**
3. **이 값이 무엇을 의미하는지 주석이 필요한가?** (매직넘버·매직스트링)

구조적 리터럴(배열 인덱스 `0`, `+ 1`, `''` 초기값)은 의미가 자명해 상수가 아니다. 그 경계는
[07-javascript](./07-javascript.md) "숫자 리터럴".

## 어디에 두나 (MUST)

**상수는 예외 없이 `constants/`에 둔다.** 로직 파일 안에서 `const`로 선언하지 않는다 —
한 파일에서만 쓰는 값이든 매직넘버든 전부 `constants/`로 뺀다. 전역 `src/constants/`는
만들지 않는다 — 폴더 구조는 수직 슬라이스다 ([01-folder-structure](./01-folder-structure.md)).

| 상수                          | 위치                            |
| ----------------------------- | ------------------------------- |
| 한 도메인만 쓰는 상수         | `features/<f>/constants/<f>.ts` |
| 여러 feature가 쓰는 범용 상수 | `shared/constants/`             |

- **"여러 feature가 쓴다"만으로 `shared/`에 올리지 않는다.** 그건 보통 경계 실수다
  (`01-folder-structure`의 feature 간 의존 참고).

> **예외 — 엔드포인트 경로는 `constants/`에 두지 않는다.** 경로는 그 경로로 요청하는
> 모듈(`api/`)이 소유한다. 한 곳에서만 쓰면 인라인 문자열, 두 곳 이상이면 그 모듈이 `export`한다.
> 경로를 `constants/`에 모으는 순간 전역 `endpoints.ts`가 된다 ([03-api](./03-api.md) 규칙 6).

> **MAY — 상수 파일이 커지면 페이지/기능 단위 섹션 주석으로 나눈다.** feature별로 이미 쪼개져
> 있어 그럴 일은 드물다.

## 정규식도 상수다 (MUST)

**정규식 리터럴을 로직 안에 인라인으로 두지 않는다.** 다른 상수와 똑같이 `constants/`로 뺀다.
범위 판단(도메인 하나면 `features/<f>/constants/`, 여러 곳이면 `shared/constants/`)도 같다.

```ts
// shared/constants/regex.ts
export const PHONE_PATTERN = /^01[016789]\d{7,8}$/
export const BUSINESS_NUMBER_PATTERN = /^\d{3}-\d{2}-\d{5}$/

// 사용처
import { PHONE_PATTERN } from '@/shared/constants/regex'

export const phoneField = z.string().regex(PHONE_PATTERN, '올바른 전화번호를 입력하세요.')
```

```ts
// BAD - 같은 정규식이 검증·치환·하이라이트에 각각 박힌다. 하나만 고치면 어긋난다.
z.string().regex(/^01[016789]\d{7,8}$/)
value.replace(/^01[016789]\d{7,8}$/, '')
```

- **이름은 `~_PATTERN`.** `~_REG`·`~Reg`처럼 줄이지 않는다 ([02-naming](./02-naming.md) 축약 금지).
- **`g` 플래그를 붙인 정규식은 상수로 공유하지 않는다.** `lastIndex`가 호출 간에 남아
  `test()`가 한 번씩 건너뛴다. 필요하면 상수는 패턴 문자열로 두고 쓰는 쪽에서 `new RegExp`를 만든다.

정규식 대부분은 zod 필드로 흡수되므로([01-folder-structure](./01-folder-structure.md)),
`constants/`에 남는 건 검증 밖에서 쓰는 것(문자열 치환·파싱 등)이다.

## 상태값 네이밍 (MUST)

**도메인 상태값은 UI 스타일이 아니라 기능/도메인 기반으로 짓는다.** 키는 `SCREAMING_SNAKE`.

```ts
// GOOD - 도메인 언어
export const RESERVATION_STATE = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  STOP: 'STOP',
} as const
type ReservationState = (typeof RESERVATION_STATE)[keyof typeof RESERVATION_STATE]

// BAD - UI 스타일 이름 (디자인이 바뀌면 도메인 코드가 바뀐다)
type ReservationState = 'success' | 'error' | 'gray'
```

`04-state`의 `AuthStatus = 'booting' | 'authenticated' | 'anonymous'`가 이미 이 규칙을 따른다.

## label은 데이터가 아니다 — 변환은 view에서 (MUST)

**enum 값은 raw 그대로 보관하고, 화면에 출력하는 view에서 `_LABEL` 매핑으로 변환한다.**
mock·응답·파생 데이터에 미리 변환한 표시 문자열을 박지 않는다.

```ts
// GOOD - 상수는 매핑만, 데이터는 raw enum
export const RESERVATION_STATE_LABEL = {
  AVAILABLE: '예약 가능',
  UNAVAILABLE: '예약 불가',
  STOP: '운영 중지',
} as const

// view
{RESERVATION_STATE_LABEL[reservation.state]}

// BAD - 데이터에 label을 미리 박는다
{ state: 'AVAILABLE', stateText: '예약 가능' }
```

미리 박은 label은 `04-state`가 경고하는 "데이터 복사"와 같다 — 문구·언어가 바뀌면 데이터
계층을 고쳐야 하고, 원본 enum으로 되돌릴 수도 없다.

### 컨텍스트에 따라 달라지는 label

같은 enum이라도 컨텍스트(시설 유형 등)에 따라 label이 다르면 **별도 매핑 상수**를 만든다.
컴포넌트 안에서 삼항으로 흩뿌리지 않는다.

```ts
// GOOD
export const FACILITY_TYPE_SEAT_LABEL = { GYM: '락커', READING_ROOM: '좌석' } as const

// BAD
facilityType === 'GYM' ? '락커' : '좌석'
```

## 배지·칩 표시 정보 (SHOULD)

**스타일은 CVA variant, 상수는 label만 담당하도록 나눈다.** color·size 같은 스타일 값과
도메인 label을 한 객체에 섞지 않는다 — 섞으면 디자인이 바뀔 때마다 상수 파일이 바뀐다
([14-styling](./14-styling.md)).

```ts
// GOOD - 도메인 → (variant 이름, label). 실제 스타일은 CVA가 소유.
export const PROGRAM_TYPE_BADGE = {
  COUNT_RESERVATION: { tone: 'info', label: '횟수예약제' },
  REGULAR_SCHEDULE: { tone: 'warning', label: '정규시간제' },
} as const satisfies Record<ProgramType, { tone: BadgeTone; label: string }>

// BAD - 스타일 값을 상수에 박는다
{ COUNT_RESERVATION: { color: '#ec4899', bg: 'bg-pink-50', label: '횟수예약제' } }
```

## 서버가 주지 않는 정적 텍스트 (MUST)

**유의사항·안내문 같은 UI 텍스트는 상수에 둔다.** MSW 핸들러나 응답 타입에 끼워넣지 않는다 —
그러면 응답 타입이 실제 API 계약과 어긋나고, 서버를 붙일 때 "이 필드는 원래 없었다"를 뒤늦게
발견한다 ([03-api](./03-api.md)).

```ts
// GOOD - constants
export const LOTTERY_NOTICE = ['응모기간 내 신청자 중 무작위 추첨으로 선정합니다.', ...] as const

// BAD - 응답 인터페이스에 서버가 안 주는 필드
interface Reservation {
  applicationNotes?: string[] // 서버엔 없는데 타입에 있음
}
```

## 사용자에게 보여주는 메시지 (SHOULD)

**메시지에 관련 값을 넣어 구체적으로 만든다.** 성공·에러·안내 문구에 개수·이름·한도 같은
실제 값을 반영한다. 두루뭉술한 고정 문구는 사용자가 무슨 일이 일어났는지 모른다.

```ts
// GOOD - 값을 넣는다
toast.success(`${count}개 항목을 삭제했습니다.`)
setError('file', { message: `${MAX_SIZE_MB}MB 이하만 업로드할 수 있습니다.` })

// BAD - 무슨 일인지 안 보인다
toast.success('삭제되었습니다.')
setError('file', { message: '파일이 너무 큽니다.' })
```

한도·단위 같은 값은 문구에 박지 말고 상수를 참조한다(위 매핑·`MAX_SIZE_MB` 등).

## 탭 키 · 라우트 문자열 상수화 (SHOULD)

탭 키·라우트 문자열을 컴포넌트에 하드코딩하지 않는다. 상수로 정의하고 탭 목록도 그 상수를
참조한다. 탭 상태는 URL에서 읽는다 ([08-routing](./08-routing.md), [04-state](./04-state.md)).

```ts
export const FACILITY_TAB = { RESERVATION: 'reservation', INFO: 'info', NOTICE: 'notice' } as const
type FacilityTab = (typeof FACILITY_TAB)[keyof typeof FACILITY_TAB]
```

## 매직넘버

의미 있는 숫자 리터럴은 이름을 준다 — [07-javascript](./07-javascript.md) "숫자 리터럴" 참고.
