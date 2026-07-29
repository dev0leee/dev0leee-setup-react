# 도메인 코드·상수 인벤토리 — 레거시 `apt-resident-fe`

> 기준 SHA `6d5bf22` (2026-07-27) · 추출원 `src/constants/**`, 쿼리 훅의 `errorCode` 분기
> 전체 계획: `~/.claude/plans/working-smcom-apt-resident-fe-tranquil-charm.md`

## 집계

| 구분              |                                                       수 |
| ----------------- | -------------------------------------------------------: |
| 상수 파일         | **19** (`constants/*.js` 5 + `constants/domain/*.js` 14) |
| 총 LOC            |                                                    1,303 |
| export 심볼       |                                                     ~112 |
| **서버 에러코드** |                                                   **39** |
| 정규식            |                                                        7 |
| 도메인 상태 enum  |                                                      14+ |

### 파일별 규모

| 파일                       | LOC | 파일                   | LOC |
| -------------------------- | --: | ---------------------- | --: |
| `domain/fireInspection.js` | 308 | `domain/repair.js`     |  60 |
| `domain/parking.js`        | 174 | `domain/survey.js`     |  56 |
| `domain/common.js`         | 123 | `domain/aptMall.js`    |  39 |
| `domain/board.js`          | 118 | `domain/faceRecog.js`  |  37 |
| `domain/movingHouse.js`    | 111 | `domain/terms.js`      |  35 |
| `domain/vote.js`           |  75 | `domain/lobbyPhone.js` |  31 |
| `nativeKeys.js`            |  60 | `domain/auth.js`       |  25 |
| `mypage.js`                |  20 | `domain/apass.js`      |   7 |
| `regex.js`                 |  10 | `domain/kiosk.js`      |   4 |
| `api.js`                   |  10 |                        |     |

---

## 1. ⚠️ 서버 에러코드 39종

**69개 파일**이 `error.data.error.errorCode`로 분기한다. 이것이 이관에서 가장 넓은 계약 표면이다.

### 1-1. 인증/토큰 (axios 인터셉터에서 처리)

| 코드            | 처리                                |
| --------------- | ----------------------------------- |
| `EXPIRED_TOKEN` | 토큰 재발급 트리거 (`api/axios.js`) |
| `INVALID_TOKEN` | 〃                                  |

> ⚠️ **재발급 트리거가 HTTP 401이 아니라 이 두 코드다.** 타깃 `apiClient.ts`는 `status === 401`로
> 판단하므로 **반드시 코드 기반으로 재작성**해야 한다 (`decisions/auth-strategy.md`).

### 1-2. 로그인/회원가입

| 코드                            | 의미·처리                              |
| ------------------------------- | -------------------------------------- |
| `RESIDENT_NOT_FOUND`            | 존재하지 않는 입주민                   |
| `INVALID_PASSWORD`              | 비밀번호 불일치                        |
| `APT_NOT_FOUND`                 | 단지 없음                              |
| `HOUSEHOLD_NOT_FOUND`           | 세대 없음                              |
| `RESIDENT_NOT_APPROVED`         | 미승인 → **`/login/pending`으로 이동** |
| `RESIDENT_ALREADY_EXISTS`       | 이미 등록된 입주민                     |
| `HOUSEHOLD_HEAD_ALREADY_EXISTS` | 이미 등록된 세대주 존재                |
| `APT_RESIDENT_NOT_FOUND`        | 단지-입주민 매핑 없음                  |
| `NOT_HEAD_AUTHORITY`            | 세대주 권한 없음                       |
| `KMC_ERROR`                     | 본인인증 유효시간 만료 → 모달 후 `/`로 |

### 1-3. 주차

| 코드                                             | 의미                         |
| ------------------------------------------------ | ---------------------------- |
| `ALWAYS_ALLOW_EXISTS` / `ALWAYS_ALLOW_NOT_FOUND` | 항상허용 중복/없음           |
| `BOOKMARK_DUPLICATED`                            | 즐겨찾기 중복                |
| `REGULAR_EXISTS`                                 | 정기권 차량 존재             |
| `RESERVATION_EXISTS` / `RESERVATION_NOT_FOUND`   | 방문예약 중복/없음           |
| `RESERVATION_DATE_INVALID`                       | 예약 일자 오류               |
| `RESERVATION_MILEAGE_LIMIT`                      | 마일리지 한도 초과           |
| `REJECT_EXISTS` / `REJECT_ALREADY_EXISTS`        | 거부차량 중복 (**2종 존재**) |
| `REJECT_HOUSE_HOLD_NOT_MATCH`                    | 거부 요청 세대 불일치        |
| `CAR_TYPE_NOT_ALLOWED`                           | 허용되지 않는 차량 유형      |
| `BLACK_LIST_EXISTS`                              | 블랙리스트 차량              |
| `VISIT_PURPOSE_NOT_FOUND`                        | 방문목적 없음                |

> `REJECT_EXISTS`와 `REJECT_ALREADY_EXISTS`가 둘 다 쓰인다 — 서버가 상황별로 다른 코드를 준다. 그대로 유지.

### 1-4. 게시판

| 코드                     | 의미             |
| ------------------------ | ---------------- |
| `BOARD_BLACK_LIST`       | 게시판 이용 제한 |
| `BOARD_FILE_UPLOAD_FAIL` | 첨부 업로드 실패 |

### 1-5. 투표/설문

| 코드                                                           | 의미               |
| -------------------------------------------------------------- | ------------------ |
| `VOTER_NOT_FOUND` / `VOTER_MISS_MATCH`                         | 투표자 없음/불일치 |
| `SURVEY_RESPONDENT_NOT_FOUND` / `SURVEY_RESPONDENT_MISS_MATCH` | 응답자 없음/불일치 |
| `ALREADY_SUBMITTED`                                            | 이미 제출됨        |

> `MISS_MATCH`는 `MISMATCH`의 오타로 보이나 **서버 계약이므로 그대로 유지.**

### 1-6. 소방점검 / 로비폰

| 코드                                  | 의미                          |
| ------------------------------------- | ----------------------------- |
| `HOUSEHOLD_FIRE_INSPECTION_NOT_FOUND` | 세대 점검 없음                |
| `NOT_IN_INSPECTION_PERIOD`            | 점검 기간 아님                |
| `GUARD_NETWORK_ERROR`                 | 경비실 네트워크 오류 (로비폰) |

### 1-7. 코드인지 상태값인지 모호한 3건

`COMPLETE` · `PENDING` · `REJECT` — `case` 절에서 발견됐으나 **상태값 switch일 가능성이 높다.**
Phase 6에서 도메인별로 확인. → `[확인 필요]` D-Q1

### 이관 방침

레거시는 훅마다 `switch (errorCode)` + `swalErrorModal({ text })`로 처리한다.

타깃에서는 `ApiError.code`로 옮긴다. **`apiErrors.ts`의 `ServerErrorBody`가
평면 구조(`{ message?, code? }`)를 가정하므로 레거시의 중첩 구조
(`{ error: { errorCode, message } }`)에 맞게 확장이 필요하다** (`endpoints.md` E-Q7).

에러코드 → 메시지 매핑은 **feature별 `constants/`에 `as const` 객체**로 둔다.
공통 코드(`EXPIRED_TOKEN` 등)만 `shared/constants/`로.

---

## 2. 서버 계약 상태값 (enum)

**서버가 보내거나 받는 값**이다. 문자열이 정확히 일치해야 한다.

### Vote (`domain/vote.js`)

```js
VOTE_STATE = { PENDING, PROGRESS, CLOSE } // 투표 상태
VOTER_STATE = { PENDING, VOTED, UN_VOTED } // 투표자 상태
AUTH_TYPE = { PASS, NAME_PHONE } // 본인인증 방식
QUESTION_TYPE = { SINGLE_CHOICE, MULTIPLE_CHOICE }
```

### Survey (`domain/survey.js`)

```js
SURVEY_STATE = { PENDING, PROGRESS, CLOSE }
PARTICIPANT_STATE = { PENDING, PARTICIPATED, NOT_PARTICIPATED }
AUTH_TYPE = { NONE, PASS, NAME_PHONE } // ⚠️ vote와 다름 (NONE 추가)
QUESTION_TYPE = { SINGLE_CHOICE, MULTIPLE_CHOICE, SUBJECTIVE } // ⚠️ vote와 다름
```

> ⚠️ **`AUTH_TYPE`과 `QUESTION_TYPE`이 vote/survey에서 서로 다르다.**
> 설문에는 `NONE`(인증 없음)과 `SUBJECTIVE`(주관식)가 추가로 있다.
> **공통화하면 안 된다** — 타깃에서도 각 feature의 `constants/`에 따로 둔다.

### FireInspection (`domain/fireInspection.js`)

```js
FIRE_INSPECTION_ANSWER = { NORMAL, DEFECTIVE, NOT_APPLICABLE } // 정상/불량/해당없음
FIRE_INSPECTION_SUBMISSION_STATUS = {
  BEFORE_START,
  NOT_SUBMITTED,
  SUBMITTED,
  NOT_PARTICIPATED,
} // 주석: API enum FireInspectionSubmissionStatus
```

### Parking (`domain/parking.js`)

차량 유형 키: `GENERAL` · `REGULAR` · `REGULAR_RESIDENT` · `RESERVATION` · `ALWAYS_ALLOW` ·
`REJECT` · `BLACKLIST` · `VISIT` · `UNKNOWN`

```js
DAY_FREE_TYPE_LABEL = { NONE: '무료 시간 없음', ALL_DAY: '종일 무료' }
```

> `CAR_TYPE`·`PARKING_WALL_PAD_ALARM`은 객체가 아닌 배열 형태다. Parking 도메인 명세 작성 시 전수 확인.

### MovingHouse (`domain/movingHouse.js`)

이사 유형 키: `MOVE_IN` · `MOVE_OUT`
예약 상태: `WAITING` · `CONFIRMED` · `COMPLETED` · `CANCELED` · `IMPOSSIBLE` · `RECEIVED` · `RESERVATION`

### AptMall (`domain/aptMall.js`)

```js
MEAL_TYPE = { VISIT: '방문식사', TAKEOUT: '포장', DELIVERY: '배달' }
```

> ⚠️ **키는 서버 계약, 값은 한국어 라벨이다.** 서버로는 `VISIT`/`TAKEOUT`/`DELIVERY`를 보내고
> 화면에는 값을 표시한다. 이관 시 이 구조를 유지 — 값만 바꿔도 화면이 달라진다.

### Board (`domain/board.js`)

```js
DETAIL_COMMENT_AUTHOR_STATE = {
  DELETE: '삭제된 댓글',
  RESIDENT_DELETE: '탈퇴된 회원의 댓글',
  BLOCK: '차단된 회원의 댓글',
  ADMIN: '관리사무소',
}
```

### Common (`domain/common.js`)

```js
KMC_TYPE_FOR_URL_CODE = { JOIN, USER_VOTE, NON_USER_VOTE }   // 본인인증 진입 구분
INVALID_VALUES = [0, false, ...]                              // falsy 판정 목록
```

### A-PASS (`domain/apass.js`) — ⚠️ 오타 보존

```js
APASS_PERMISSION_TYPES = {
  BLUETOOTH: 'bluetooth',
  GPS: 'gps',
  LOCATION_ALWAYS_ON: 'locAlawaysOn', // 네이티브와 함께 오타 정정 필요 (원문 주석)
  BT_TRANSMIT: 'btTransmitt', // 〃
}
```

**`native-protocol.md` P7과 동일 건이다.** 앱이 이 철자로 보내므로 고치면 값을 못 받는다.

### Terms (`domain/terms.js`) — 약관 ID

```js
TERMS_AND_CONDITIONS_ID = 'terms-and-conditions'
PRIVACY_POLICY_ID = 'privacy-policy'
MARKETING_DATA_CONSENT_ID = 'marketing-data-consent'
RECEIVE_ADVERTS_CONSENT_ID = 'receive-adverts-consent'
```

`TERMS_ITEMS`(필수 2 + 마케팅 2), `MARKETING_TERMS_ITEMS`(선택 2).
각 항목은 `{ id, label, required, title }`. 회원가입 약관 화면과 마이페이지 알림 설정이 공유한다.

---

## 3. 정규식 7종 (`constants/regex.js`)

```js
PHONE_REGEX = /(010|011|016|017|018|019)-\d{3,4}-\d{4}/
PHONE_CUSTOM_REGEX = /^(010|011|016|017|018|019)\d{7,8}$/
PHONE_AUTO_HYPHEN_REGEX = /(\d{3})(\d{3,4})(\d{4})/
PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*[~!@#$%^&*()?])(?=.*[0-9]).{8,}$/
CARNUM_REGEX = /^(\d{2,3}[가-힣]\d{4}|[가-힣]{2}\d{2}[가-힣]\d{4})$/
NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,10}$/
NAME_REGEX = /^[가-힣a-zA-Z ]+$/
```

**전부 그대로 이식한다.** 완화하거나 강화하면 입력 검증 동작이 달라진다.

| 항목     | 규칙                                                         |
| -------- | ------------------------------------------------------------ |
| 비밀번호 | 영문 + 특수문자(`~!@#$%^&*()?`) + 숫자 각 1자 이상, 8자 이상 |
| 닉네임   | 한글·영문·숫자 2~10자 (**공백 불가**)                        |
| 이름     | 한글·영문·**공백만** (숫자 불가, 길이 제한 없음)             |
| 차량번호 | `12가3456` / `123가4456` / `서울12가3456` 형태               |

### 타깃과의 대조 결과 (D-Q2 확인 완료)

| 레거시                                                           | 타깃                                    | 판정                                                             |
| ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| `PHONE_CUSTOM_REGEX` `/^(010\|011\|016\|017\|018\|019)\d{7,8}$/` | `PHONE_PATTERN` `/^01[016789]\d{7,8}$/` | ✅ **기능적으로 동일** (표현만 다름). 타깃 것을 그대로 써도 된다 |
| `PHONE_REGEX` `/(010\|011\|016\|017\|018\|019)-\d{3,4}-\d{4}/`   | **없음**                                | ⚠️ **별도 추가 필요**                                            |

> ⚠️ **`PHONE_REGEX`에는 `^...$` 앵커가 없다.** 부분 일치도 통과한다.
> 이 정규식이 **로그인 아이디 필드**(`common.js`의 `phone` → `id`)에 쓰이고
> `.max(13)`과 조합돼 실질적 범위가 제한된다. **앵커를 추가하면 검증이 엄격해져 동작이 달라진다.**
> 하이픈 유무로 두 정규식이 나뉘므로 **둘 다 별개로 유지**한다.

> ⚠️ 타깃 `shared/schemas/common.ts`의 `phoneField` 에러 메시지는
> `올바른 휴대폰 번호를 입력하세요.`인데 레거시는
> `휴대폰 번호 형식으로 - 없이 올바르게 입력해주세요` / `휴대폰을 입력해주세요`다.
> **문구를 레거시로 교체**한다.

---

## 4. UI 라벨·화면 구성 상수 (서버 계약 아님)

전체 심볼의 절반 이상이 화면 표시용이다. `docs/conventions/10-components.md`의
"반복되는 정보 UI는 `{ label, key }[]` 배열 + 표시 맵으로" 규칙과 **이미 같은 구조**라
이관이 순조롭다.

| 유형             | 예시                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 필드 정의 배열   | `LIST_ITEM_FIELD`, `DETAIL_PAGE_INFO_FIELD`, `IN_OUT_HISTORY_DETAIL_FIELD`, `REPAIR_DETAIL_CONTENT_FIELD`, `MOVING_HOUSE_DETAIL_BASIC_CONTENT_FIELD` … |
| 상태 → 라벨·색상 | `STATE_LIST`, `STATUS_LIST`, `VOTER_STATUS`, `PARTICIPANT_STATE_LABEL`, `REPAIR_STATUS_LIST`, `MOVING_HOUSE_STATUS_LIST`                               |
| 모달 문구        | `LOGOUT_MODAL_DATA`, `APP_EXIT_MODAL_DATA`, `ACCESS_DENIED_MODAL_DATA`, `WRITE_BACK_MODAL_DATA`, `DETAIL_DELETE_MODAL_DATA` … (~15종)                  |
| 토스트 문구      | `BOARD_TOAST_MESSAGE`, `REPAIR_TOAST_MESSAGE`, `MOVING_HOUSE_TOAST_MESSAGE`                                                                            |
| 메뉴·탭          | `PARKING_MENU_LIST`, `MAIN_SWIPER_MENU_LIST`, `LOBBY_PHONE_NAV_LIST`, `MY_ACTIVITY_TABS`, `DETAIL_PAGE_TAB_LIST`                                       |
| 폰트 크기        | `ETC_FONT_SIZE_SCALES`, `ETC_FONT_SIZE_SCALE_LABELS`, `ETC_FONT_SIZE_SCALE_VALUES` (`mypage.js`)                                                       |

> **모달·토스트 문구는 화면에 그대로 보이는 텍스트다.** 등가 이관 원칙상 **한 글자도 바꾸지 않는다.**
> 도메인 명세(`features/<domain>.md`)에 원문 그대로 옮긴다.

---

## 5. 이관 매핑

| 레거시                         | 타깃                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| `constants/domain/<domain>.js` | `features/<domain>/constants/*.ts`                              |
| `constants/regex.js`           | `shared/constants/regex.ts` (기존 파일과 병합)                  |
| `constants/api.js`             | 베이스 URL → `config/env.ts`, 경로 접두사 → 각 feature의 `api/` |
| `constants/nativeKeys.js`      | `shared/constants/native.ts` (`TO_NATIVE`/`FROM_NATIVE`)        |
| `constants/mypage.js`          | `features/mypage/constants/`                                    |
| `constants/domain/common.js`   | 사용처에 따라 분산. 여러 feature가 쓰면 `shared/constants/`     |

### 지켜야 할 규칙

1. **`enum` 금지** — `erasableSyntaxOnly`. `as const` 객체 + 파생 타입:
   ```ts
   export const VOTE_STATE = { PENDING: 'PENDING', PROGRESS: 'PROGRESS', CLOSE: 'CLOSE' } as const
   export type VoteState = (typeof VOTE_STATE)[keyof typeof VOTE_STATE]
   ```
   파생 타입은 `constants/`에 그대로 둔다 (`05-types.md`의 명시적 예외).
2. **`src/constants/` 전역 폴더를 만들지 않는다** (`12-constants.md`). 도메인별 `constants/`로 분산.
3. **중복 심볼명은 자연 해소된다.** 레거시는 `AUTH_TYPE`(×2), `QUESTION_TYPE`(×2),
   `LIST_ITEM_FIELD`(×3), `DETAIL_PAGE_INFO_FIELD`(×3), `STATUS_LIST`(×2),
   `LIST_PAGE_FILTER_LIST`(×2)가 도메인별로 같은 이름·다른 내용이다.
   feature 슬라이스로 나뉘면 충돌하지 않는다. **억지로 공통화하지 말 것** (§2의 vote/survey 차이).

---

## 6. `[확인 필요]`

| #    | 질문                                                                                | 근거                      |
| ---- | ----------------------------------------------------------------------------------- | ------------------------- |
| D-Q1 | `COMPLETE`·`PENDING`·`REJECT`는 에러코드인가 상태값인가?                            | §1-7                      |
| D-Q2 | 타깃 `shared/constants/regex.ts`의 `PHONE_PATTERN`이 레거시 `PHONE_REGEX`와 같은가? | §3 — Phase 4에서 대조     |
| D-Q3 | `CAR_TYPE`·`PARKING_WALL_PAD_ALARM`의 전체 값 집합                                  | Parking 명세 작성 시 확인 |

---

**다음 산출물**: `env-vars.md` (Phase 1 마지막)
