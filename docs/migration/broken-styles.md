# 레거시에서 적용되지 않는 스타일 클래스

> 기준 SHA `6d5bf22` · **Tailwind 3.4 실제 빌드로 검증** (`npx tailwindcss` 출력에 해당 클래스 미생성)
> 결정: **고친다** (2026-07-29 사용자 — "오타가 있으면 고쳐야지")

> ⚠️ **2026-07-29 2차 조사에서 9건이 추가로 발견됐다. 1차의 "16건"은 틀렸다.**
> 1차는 손으로 만든 접두사 목록으로 후보를 뽑아 검증했다. **검증 방법은 맞았지만 후보 생성이
> 불완전했다** — 접두사 목록에 없는 형태(`bg-bg-*`, `deep-glue`, `max-w-1/2`, `w-4.75`)를 놓쳤다.
> 2차는 `class`/`:class`/`class-name`/`custom-class` 속성에서 **토큰 821개를 전수 추출**해
> 전부 빌드로 검증했다. 아래 수치가 확정값이다.

## 요약

레거시 소스가 쓰는 클래스 중 **26개가 `tailwind.config.js`에 없어 CSS가 생성되지 않는다.**
Tailwind는 알 수 없는 클래스를 조용히 무시하므로, 해당 선언은 **아무 효과가 없다.**

| 구분                                                          | 건수 | 조치                            |
| ------------------------------------------------------------- | ---: | ------------------------------- |
| **명백한 오타** (끝에 `0`, `glue`, 단수/복수)                 |    4 | **확실히 수정 가능**            |
| **스케일 표기 불일치** (`neutral-90` vs `neutral-b-gray-900`) |   10 | 매핑 근거 명확, 수정 가능       |
| **Tailwind 기본 스케일 밖 값** (`4.75`, `3.5`, `1/2`)         |    4 | 임의값 문법으로 치환            |
| **효과 없는 죽은 선언** (덮이거나 애초에 무의미)              |    3 | **삭제**                        |
| **미생성 클래스** (config에 없는 이름)                        |    6 | **Tailwind 토큰으로 확정** (§5) |

영향 파일 **33개**. **26건 전부 조치 방침이 정해졌다** — 미해결 0건.

> ✅ **2026-07-30 — `B-Q2` 확정.** §5 6건을 **`globalColor.scss`의 이전 팔레트가 아니라
> 현 Tailwind 토큰으로** 표현한다 (사용자 결정). `@theme`에 새 색을 추가하지 않는다.

---

## 0. 조치 규칙 (MUST — 2026-07-30 정정)

> 🔴 **이전 판(2026-07-29~30)은 "고치면 화면이 달라진다 / 등가 이관의 의도적 예외"라고 적었다.
> 그것은 결정을 잘못 기록한 것이다.** 사용자 결정은 **어떤 토큰으로 표현할지**에 관한 것이었고,
> **화면을 바꾸라는 것이 아니었다** (2026-07-30 사용자: _"화면이 왜 바뀌어야해? 화면은 그대로여야지"_).
>
> Phase 5에서 이 오해로 MyPage 11곳의 색을 실제로 바꿨다가 되돌렸다 (커밋 `ee6409b` → 정정).

**죽은 클래스는 "이름이 암시하는 색"이 아니라 "레거시가 실제로 렌더한 값"으로 옮긴다.**

렌더값 판정은 기계적이다 — 클래스가 없으면 아래가 적용된다:

| 종류       | 레거시가 실제로 렌더하는 값                    | 타깃에서 쓸 것                                      |
| ---------- | ---------------------------------------------- | --------------------------------------------------- |
| `text-*`   | `body`의 상속색 **`#111927`** (`input.css:28`) | `text-neutral-b-gray-900` (같은 값)                 |
| `border-*` | v3 preflight 기본 **`#E5E7EB`**                | `border-neutral-b-gray-200` (같은 값)¹              |
| `bg-*`     | **없음** (투명)                                | 클래스를 **제거**한다                               |
| 크기·간격  | 무시됨                                         | 무시되는 것이 정상 → 임의값으로 되살리지 **않는다** |

¹ 타깃도 같은 색이다 — `index.css`의 `@layer base { * { border-border } }` + `--border: #e5e7eb`가
v3 preflight를 재현한다. 즉 **색 클래스를 지우고 `border`만 남겨도 같다.**

**이름이 암시하는 색을 넣으면 등가 이관이 깨진다.** `text-brand-primary-50`이라는 이름은
디자이너 의도를 알려주지만, 사용자가 지금 보는 화면은 검정이다.
**의도 복원은 전환 후 별도 작업이다** → `deferred.md`.

### 예외 — 렌더값을 그대로 옮기면 화면이 못 쓰게 되는 경우

등가 이관이 **사용 불가능한 UI를 재현**하는 자리가 있다. 이건 도메인 착수 시 결정한다.

| 자리                               | 렌더값 그대로 옮기면                                                                    | 상태              |
| ---------------------------------- | --------------------------------------------------------------------------------------- | ----------------- |
| `SignUpAptInfoRadio.vue` 선택 상태 | `bg-primary-400 text-white` 중 배경이 죽어 **흰 글자만 남는다** (선택 표시가 안 보인다) | 🔴 SignUp 착수 시 |

> 아래 §1~§5의 "수정" 열은 **디자이너 의도를 복원하는 값**이다. 참고 정보로 남겨두지만
> **이관 시 쓰는 값은 §0의 렌더값 규칙**이다. 두 값이 같은 행(예: `neutral-90`→`-b-gray-900`)만
> 그대로 쓸 수 있다.

## 검증 방법 (재현 가능)

```bash
cd apt-resident-fe
# config를 그대로 쓰되 content만 probe 파일로 교체해 빌드
npx tailwindcss -c <config> -i <@tailwind utilities> -o out.css
# out.css에 .클래스명 셀렉터가 없으면 미생성
```

문자열 매칭이 아니라 **실제 빌드 산출물**로 판정했다. `text-red-500`은 후보에 올랐으나
빌드에서 정상 생성되어 제외했다.

---

## 1. 명백한 오타 (4건) — 확실히 수정

| 현재 (깨짐)                                    | 수정                                         | 사용처                                                                                                                                                                                                       |
| ---------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `border-defaults-tertiary-border-tertiary0`    | `border-defaults-tertiary-border-tertiary`   | `components/common/TermsCheckboxList.vue`<br>`views/TermsOfUseView/TermsOfUseAgreeView.vue`                                                                                                                  |
| `text-defaults-primary-text-primary0`          | `text-defaults-primary-text-primary`         | `views/TermsOfUseView/TermsOfUseAgreeView.vue`                                                                                                                                                               |
| `border-deep-glue-20` ⭐                       | ⚠️ **대응 토큰 없음** → §5                   | `ParkingManagementView/CarManagement/CarManagementList.vue`<br>`.../InOutHistory/InOutCarHistoryListView.vue`<br>`.../Mileage/MileageHistoryListView.vue`<br>`.../ReservationCar/ReservationCarListView.vue` |
| `border-default-secondary-border-secondary` ⭐ | `border-defaults-secondary-border-secondary` | `views/ManagementFeeView/ManagementFeeDetailView.vue`                                                                                                                                                        |

⭐ = 2차 조사에서 추가 발견

**끝에 `0`이 붙은 2건** — `defaults.tertiary.border-tertiary` / `defaults.primary.text-primary`가 정답.

**`border-default-secondary-border-secondary`** — `default`(단수)가 아니라 **`defaults`**(복수)다.
config는 전부 `defaults.*`이며 `border-defaults-secondary-border-secondary`는 정상 생성된다. **명확한 수정.**

**`border-deep-glue-20`** — `glue`는 `blue`의 오타로 보이지만, config에 **`deep-blue`도 없다.**
철자를 고쳐도 생성되지 않으므로 §5로 넘긴다.

**영향 화면**: 회원가입 약관 동의(`signup.md` S1), 버전1 약관 동의(`auth.md` A5),
쇼핑 마케팅 동의(`main.md` §11), 주차 카드 목록 4종(`parking.md`), 관리비 상세(`ManagementFee`).

수정 후 색:

- `defaults.tertiary.border-tertiary` → 약관 구분선에 지정색 적용
- `defaults.primary.text-primary` = `#111927` → "모두 동의" 텍스트가 진한 남색으로
- `defaults.secondary.border-secondary` → 관리비 상세 구분선에 지정색 적용

---

## 2. 스케일 표기 불일치 (10건) — 수정 가능

디자인 시스템의 `neutral/90`·`primary/500` 표기를 그대로 썼는데,
`tailwind.config.js`는 `neutral.b.gray.900`·`primary.pc.indigo.500` 구조다.

### `neutral` 계열 — config는 `neutral-b-gray-{25,50,100,200,300,400,500,600,700,800,900}`

| 현재 (깨짐)           | 수정                          | 색상      | 사용처                                                                                                                                                                 |
| --------------------- | ----------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text-neutral-90`     | `text-neutral-b-gray-900`     | `#111927` | **8곳** — AlarmSettingMenuGroupItem, MyPageAccountDeletion, MyPageProfile, MyProfileEdit, MyProfileView, OfficeInfoBusinessHour, OfficeInfoContactList, OfficeInfoView |
| `text-neutral-70`     | `text-neutral-b-gray-700`     | `#384250` | MyProfilePasswordEditModal                                                                                                                                             |
| `text-neutral-40`     | `text-neutral-b-gray-400`     | `#9DA4AE` | MyProfileView (닉네임 미설정 placeholder)                                                                                                                              |
| `border-neutral-20`   | `border-neutral-b-gray-200`   | `#E5E7EB` | AlarmSettingMenuGroupItem, MyPageMenuGroupItem                                                                                                                         |
| `border-b-neutral-20` | `border-b-neutral-b-gray-200` | `#E5E7EB` | OfficeInfoContactList, OfficeInfoView                                                                                                                                  |
| `border-neutral-10`   | `border-neutral-b-gray-100`   | `#F3F4F6` | MyPageProfile, MyProfileEdit, MyProfileView (아바타 테두리)                                                                                                            |
| `bg-neutral-10`       | `bg-neutral-b-gray-100`       | `#F3F4F6` | MyPageProfile (아바타 배경)                                                                                                                                            |

> 매핑 규칙: **뒤 숫자에 10을 곱한다** (`90`→`900`, `70`→`700`, `40`→`400`, `20`→`200`, `10`→`100`).
> 디자인 시스템의 0~~100 스케일을 Tailwind의 0~~900 스케일로 옮기면서 생긴 불일치로 보인다.

### `primary` 계열 — config는 `primary-pc-indigo-{25,50,100,200,300,400,500,600,700,800,900}`

| 현재 (깨짐)          | 수정                           | 색상      | 사용처                                                      |
| -------------------- | ------------------------------ | --------- | ----------------------------------------------------------- |
| `bg-primary-400`     | `bg-primary-pc-indigo-400`     | `#7F98F9` | `SignUpAptInfoRadio.vue` — 세대주/세대원 **선택 상태 배경** |
| `text-primary-500`   | `text-primary-pc-indigo-500`   | `#0037BE` | `SignUpAptInfoSearchItem.vue` — 아파트 `선택` 버튼          |
| `border-primary-100` | `border-primary-pc-indigo-100` | `#E0EAFF` | `SignUpAptInfoSearchModal.vue` — 검색 결과 영역 테두리      |

> ⚠️ **`bg-primary-400`(`#7F98F9`)은 확인이 필요하다.** 같은 요소에 `text-white`가 걸려 있어
> 연한 파랑 배경 + 흰 글자는 대비가 부족하다. 브랜드 색 `#0037BE`(500)가 의도였을 가능성이 있다.
> → `[확인 필요]` B-Q1

---

## 3. Tailwind 기본 스케일 밖 값 (4건) — 임의값 문법으로 치환

Tailwind 3.4의 기본 스케일에 없는 숫자를 썼다. **디자인 확인 없이 값이 계산된다.**

| 현재 (깨짐)      | 수정             | 계산 근거                     | 사용처                                                                                         |
| ---------------- | ---------------- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `w-4.75` ⭐      | `w-[19px]`       | `4.75 × 4px`(spacing 1 = 4px) | `views/VisitView/VisitListKioskItem.vue`                                                       |
| `h-4.75` ⭐      | `h-[19px]`       | 〃                            | 〃                                                                                             |
| `leading-3.5` ⭐ | `leading-[14px]` | `3.5 × 4px` (spacing 스케일)  | `views/BoardView/NoticeBoard/NoticeBoardItem.vue`                                              |
| `max-w-1/2` ⭐   | `max-w-[50%]`    | 분수 → 백분율                 | `views/SurveyView/Detail/SurveyDetailTitle.vue`<br>`views/VoteView/Detail/VoteDetailTitle.vue` |

> `maxWidth`는 Tailwind 3.4 기본값에 분수(`1/2`)가 없다. `width`에는 있어서 `w-1/2`는 되지만
> `max-w-1/2`는 안 된다. 헷갈리기 쉬운 지점.
>
> ⚠️ **`leading-3.5`는 `lineHeight` 스케일과 `spacing` 스케일이 다르다.** Tailwind의
> `leading-*` 숫자 키는 `3`(0.75rem)·`4`(1rem)·`5`(1.25rem)… 이므로 `3.5`면 0.875rem = **14px**로
> 보는 것이 자연스럽다. 위 표의 `leading-[14px]`는 그 해석이다. → `[확인 필요]` B-Q4

**수정 시 화면 변화**:

- `w-4.75 h-4.75` → 키오스크 아이콘이 **19×19px로 고정**된다. 현재는 SVG 고유 크기로 렌더된다
- `leading-3.5` → 공지 목록 날짜의 행간이 14px로 좁아진다
- `max-w-1/2` → 투표·설문 상세 제목 부제가 **화면 절반 폭에서 줄바꿈**된다. 현재는 제한 없음

---

## 4. 효과 없는 죽은 선언 (3건) — 삭제

**고쳐도 화면이 바뀌지 않는다.** 의도한 값을 추정할 필요 없이 그냥 지우면 된다.

| 현재 (깨짐)          | 사유                                                                         | 사용처                                                                                         |
| -------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `bg-bg-deep-blue` ⭐ | `<img>` 배경색 — 이미지가 덮는다                                             | `views/BoardView/BoardPostListItem.vue` 썸네일 `<img>`                                         |
| `bg-deep-blue` ⭐    | 같은 요소에 `bg-defaults-primary-background-primary`가 함께 있어 그쪽이 적용 | `views/VisitView/VisitListKioskItem.vue`                                                       |
| `center` ⭐          | **Tailwind 유틸도 아니고 CSS 정의도 없다.** 두 파일 모두 `<style>` 블록 없음 | `views/VoteView/Detail/VoteDetailTitle.vue`<br>`views/SurveyView/Detail/SurveyDetailTitle.vue` |

`bg-bg-deep-blue`는 `<img>`에 붙은 배경색이라 이미지가 로드되면 보이지도 않는다.
`bg-deep-blue`는 같은 `class` 문자열 안에 유효한 배경색이 함께 있어 그쪽이 적용된다.
`center`는 `items-center`/`text-center`를 쓰려다 남은 조각으로 보인다 — 전역 CSS에도 정의가 없다.

> ⚠️ **`bg-bg-deep-blue`·`bg-deep-blue`의 의도한 색은 `globalColor.scss`에 있다**
> (`$bg-deep-blue: #fafbfc` · `$deep-blue-100: #00063f`).
> **그러나 B-Q2 결정(§5)에 따라 이전 팔레트를 되살리지 않으며, 둘 다 렌더에 영향이 없으므로
> 삭제 방침은 그대로다.**

> **삭제해도 등가 이관에 어긋나지 않는다.** 현재 렌더 결과와 동일하다.

---

## 5. 미생성 클래스 6건 — **Tailwind 토큰으로 확정** (2026-07-30 결정)

> ### ✅ **B-Q2 확정 — `globalColor.scss` 값을 되살리지 않고 현 Tailwind 토큰으로 흡수한다**
>
> `src/styles/globalColor.scss`(이전 디자인 시스템 SCSS 팔레트)에서 `$deep-blue-20: #e6e6ec` ·
> `$bg-gray: #f8f8f8` 같은 "원래 의도한 색"을 찾았지만, **그 hex를 그대로 부활시키지 않는다.**
>
> 근거:
>
> - `globalColor.scss`의 `$` 변수는 **코드 어디에서도 쓰이지 않는다**(전수 검색 0곳).
>   주입만 되고 소비되지 않는 죽은 설정이다 → `deferred.md` D-168
> - 이전 팔레트를 되살리면 **디자인 토큰 체계가 두 벌**이 된다
> - 어차피 `#e6e6ec` vs `#E5E7EB`, `#f8f8f8` vs `#F9FAFB` 수준의 차이다
>
> **따라서 `@theme`에 새 색을 추가하지 않는다.** 아래 표의 토큰만 쓴다.

### 확정 매핑

| 현재 (깨짐)                                   | **확정 토큰**                                    | 값        | 화면 변화                                        |
| --------------------------------------------- | ------------------------------------------------ | --------- | ------------------------------------------------ |
| `border-deep-glue-20`                         | **`border-defaults-secondary-border-secondary`** | `#E5E7EB` | 회색 기본 테두리 → **연회색**. 미세 변화         |
| `border-bg-gray`                              | **`border-defaults-tertiary-border-tertiary`**   | `#F3F4F6` | 회색 기본 → **같은 폼의 입력칸과 동일한 테두리** |
| `text-brand-primary-50`                       | **`text-brand-default-text-brand`**              | `#0037BE` | 🔴 상속색(검정) → **브랜드 파랑**                |
| `text-brand-primary-100`                      | **`text-brand-default-text-brand`**              | `#0037BE` | 🔴 〃                                            |
| `border-defaults-secondary-border-primary`    | **`border-defaults-primary-border-primary`**     | `#D2D6DB` | **없음** (죽은 variant — 아래)                   |
| `bg-brand-default-background-brand-secondary` | **`bg-primary-pc-indigo-50`**                    | `#E6EBF9` | 🔴 배경 없음 → **연한 브랜드 파랑**              |

### 항목별 근거

#### `border-deep-glue-20` → `border-defaults-secondary-border-secondary` (`#E5E7EB`)

주차 카드 4종의 테두리다. 의도한 `#e6e6ec`와 **`#E5E7EB`의 차이는 육안 식별 불가** 수준이다.
`neutral-b-gray-200`을 가리키는 시맨틱 토큰이 이미 있으므로 그것을 쓴다.

#### `border-bg-gray` → `border-defaults-tertiary-border-tertiary` (`#F3F4F6`)

**이사예약 MH3·하자보수 RP2/RP3의 textarea 테두리**다.
의도한 `#f8f8f8`보다 이 선택이 나은 이유:

```html
<!-- 같은 폼 안의 텍스트 입력들 -->
<input class="border border-defaults-tertiary-border-tertiary … …" />
<!-- textarea만 다른 클래스였다 -->
<textarea class="border-bg-gray border … …" />
```

**같은 폼의 `<input>`들이 이미 `border-defaults-tertiary-border-tertiary`를 쓴다.**
textarea를 같은 토큰으로 맞추면 **입력칸 테두리가 통일**된다.
→ `moving-house.md` MH-Q11 · `repair.md` RP-Q10 **확정**

#### `text-brand-primary-50` · `text-brand-primary-100` → `text-brand-default-text-brand` (`#0037BE`)

`brand` 그룹에는 `default`/`hover`/`focus`/`disabled`만 있고 **숫자 스케일이 없다.**
`primary-pc-indigo-50`(`#E6EBF9`)·`-100`(`#E0EAFF`)은 **흰 배경 위 텍스트로는 보이지 않는다** —
이름의 `50`/`100`을 그 팔레트로 해석하면 안 된다.

**두 클래스를 같은 토큰으로 합친다.** 현재도 둘 다 클래스가 생성되지 않아
**상속색으로 렌더되므로 화면상 이미 동일**하다.

🔴 **다만 상속색(검정 계열) → 브랜드 파랑으로 바뀌는 것은 눈에 보이는 변화다.**
영향: `MyPageMenuGroupItem`(그룹 제목) · `OfficeInfoBusinessHour`(섹션 제목·운영시간) ·
`OfficeInfoContactList`(섹션 제목·전화번호) — **MyPage 도메인 이관 시 대조 필수.**

#### `border-defaults-secondary-border-primary` → `border-defaults-primary-border-primary` (`#D2D6DB`)

`ButtonBase`의 `hasOutline` + `color="defaults-primary"` 조합에만 붙는다.

```js
case 'defaults-primary':
  return 'bg-defaults-primary-background-primary border-2 border-defaults-secondary-border-primary  text-defaults-primary-text-primary …';
```

**그룹 이름이 어긋난 오타다** — 다른 variant는 전부 `border-{자기 그룹}-…` 형태를 지킨다.
`defaults.primary.border-primary`(`#D2D6DB`)로 맞춘다.

> ✅ **화면 변화 없음.** `color="defaults-primary"` 사용처를 전수 검색한 결과 **0곳**이다.
> 죽은 variant이므로 어떤 값을 넣어도 렌더에 영향이 없다.
> (클래스 문자열에 **공백 2칸**도 있다 — 함께 정리한다.)

#### `bg-brand-default-background-brand-secondary` → `bg-primary-pc-indigo-50` (`#E6EBF9`)

`InputRadioList`의 **선택 상태 배경**이다. 같은 요소에 이런 클래스들이 함께 붙는다.

```js
'bg-brand-default-background-brand-secondary border-brand-default-border-brand text-brand-default-text-brand pretendard-14SemiBold'
```

`brand.default.background-brand`(`#0037BE`)를 그대로 쓰면 **파란 배경 + 파란 글자**가 되어 읽을 수 없다.
**연한 브랜드 틴트**가 필요하다.

| 후보                                             | 값        | 판단                                          |
| ------------------------------------------------ | --------- | --------------------------------------------- |
| **`bg-primary-pc-indigo-50`**                    | `#E6EBF9` | ✅ **채택** — 브랜드 파랑의 연한 단계         |
| `bg-brand-disabled-background-brand-disabled`    | `#E6EBF9` | 값은 같지만 **`disabled` 의미가 맞지 않는다** |
| `bg-alerts-informal-background-informal-primary` | `#EFF8FF` | `blue-s-info` 계열 — 브랜드색이 아니다        |

🔴 **이것이 이번 결정 중 영향 범위가 가장 넓다.**

| 영향 화면                            | 규모               |
| ------------------------------------ | ------------------ |
| 소방 F2a (점검표) · F4 (상세)        | **21항목 × 2옵션** |
| 이사예약 MH3 (유형·시간대)           | 2 + 시간대 슬롯 수 |
| 하자보수 — (`InputRadioList` 미사용) | 없음               |

**F4(소방 점검 상세)는 `:disabled="true"`가 겹쳐 `bg-[#e7e7e7] opacity-50`이 함께 적용된다.**
Tailwind 클래스 충돌이 되므로 **비활성 라디오의 최종 배경을 실기기에서 확인해야 한다.**
→ `fire-inspection.md` **F-Q11 확정** (색은 확정, 겹침 처리만 대조 항목으로 남긴다)

### 이관 시 적용 방법

**`@theme`에 새 색을 추가하지 않는다.** 마크업의 클래스 이름만 위 표대로 교체한다.

```diff
- class="border border-deep-glue-20"
+ class="border border-defaults-secondary-border-secondary"

- class="border-bg-gray w-full … border …"
+ class="w-full … border border-defaults-tertiary-border-tertiary …"

- class="text-brand-primary-50 …"
+ class="text-brand-default-text-brand …"

- 'bg-brand-default-background-brand-secondary border-brand-default-border-brand …'
+ 'bg-primary-pc-indigo-50 border-brand-default-border-brand …'
```

---

## 6. 이관 방침

| 구분                  | 이관 시                                                       |
| --------------------- | ------------------------------------------------------------- |
| §1 명백한 오타 4건    | **수정한다** (3건). `border-deep-glue-20`은 §5로              |
| §2 스케일 불일치 10건 | **수정한다.** `neutral-b-gray-*`·`primary-pc-indigo-*`로 매핑 |
| §3 스케일 밖 값 4건   | **수정한다.** 임의값 문법(`w-[19px]` 등)으로                  |
| §4 죽은 선언 3건      | **삭제한다.** 화면 변화 없음                                  |
| §5 미생성 6건         | **수정한다.** Tailwind 토큰 매핑 확정 (B-Q2) — §5 표 참조     |

### 타깃 토큰 설계와의 관계

`decisions/tech-choices.md`에서 **레거시 토큰 값을 `@theme`으로 전량 이식**하기로 했다.
이때 **디자인 시스템 표기(`neutral-90`)와 config 표기(`neutral-b-gray-900`) 중 어느 쪽을
쓸지 정해야 한다.**

**권장: config 표기를 그대로 옮긴다.** 정상 동작하는 클래스 99개가 이미 config 표기를 쓰고 있어,
표기를 바꾸면 그 795개를 전부 손봐야 한다. 깨진 26개만 config 표기로 맞추는 쪽이 변경 범위가 작다.
(2차 조사 실측: 추출 토큰 821개 중 정상 795 · 미생성 26. `center`는 vote 명세 작성 중 추가 확인)

### QA 체크리스트 (수정 후 확인)

- [ ] 약관 동의 화면 — "모두 동의" 텍스트가 진한 남색, 구분선에 색이 들어가는가
- [ ] 마이페이지 — 메뉴 그룹 제목·본문 텍스트 색
- [ ] 마이페이지 프로필 — 아바타 테두리·배경
- [ ] 🔴 관리사무소 — 섹션 제목·운영시간·전화번호가 **브랜드 파랑으로 바뀐다** (§5, 상속색→`#0037BE`)
- [ ] 🔴 마이페이지 메뉴 그룹 제목이 **브랜드 파랑으로 바뀐다** (§5)
- [ ] 회원가입 아파트 설정 — 세대주/세대원 선택 배경 (B-Q1)
- [ ] 아파트 검색 모달 — 결과 영역 테두리, `선택` 버튼 색
- [ ] 관리비 상세 — 구분선에 색이 들어가는가 (`defaults` 복수 수정)
- [ ] 공지 목록 — 날짜 행간이 좁아졌는가 (`leading-[14px]`, B-Q4)
- [ ] 투표·설문 상세 제목 — 부제가 화면 절반 폭에서 줄바꿈되는가
- [ ] 방문 키오스크 목록 — 아이콘이 19×19px로 고정되는가
- [ ] 주차 카드 4종 — 테두리가 `#E5E7EB` 연회색으로 들어가는가 (§5)
- [ ] 이사예약·하자보수 textarea — 테두리가 **같은 폼의 입력칸과 동일한가** (`#F3F4F6`, §5)
- [ ] 🔴 소방 점검표 라디오 — 선택 항목 배경이 **연한 브랜드 파랑(`#E6EBF9`)** 인가 (§5, 21항목×2)
- [ ] 🔴 소방 점검 **상세**(F4) — 비활성(`opacity-50`)과 겹칠 때 선택 항목이 구분되는가
- [ ] 이사예약 MH3 — 유형·시간대 라디오 선택 배경 (§5)
- [ ] `ButtonBase` `defaults-primary` 아웃라인 — **사용처가 없어 변화 없음** (§5)
- [ ] 게시글 썸네일·키오스크 카드·투표/설문 상세 제목 — 죽은 선언 삭제 후 **변화가 없는가** (§4)

---

## `[확인 필요]`

| #        | 질문                                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B-Q1     | `bg-primary-400`(`#7F98F9`)이 맞는가? 흰 글자와 대비가 약해 `#0037BE`(500)가 의도였을 수 있다                                                               |
| ~~B-Q2~~ | ~~미생성 6건의 의도한 색~~ → ✅ **2026-07-30 확정.** `globalColor.scss` 팔레트를 되살리지 않고 **현 Tailwind 토큰으로 매핑**한다 (사용자 결정). 매핑표는 §5 |
| B-Q3     | 디자인 시스템 원본(Figma 등)에 `neutral/90` 같은 표기가 있는가? 매핑 근거를 확정할 수 있다                                                                  |
| B-Q4     | `leading-3.5`의 의도가 `0.875rem`(14px)인가? `lineHeight`와 `spacing` 스케일이 달라 해석이 갈린다                                                           |
