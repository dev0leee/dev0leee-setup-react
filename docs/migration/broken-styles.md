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

| 구분                                                          | 건수 | 조치                      |
| ------------------------------------------------------------- | ---: | ------------------------- |
| **명백한 오타** (끝에 `0`, `glue`, 단수/복수)                 |    4 | **확실히 수정 가능**      |
| **스케일 표기 불일치** (`neutral-90` vs `neutral-b-gray-900`) |   10 | 매핑 근거 명확, 수정 가능 |
| **Tailwind 기본 스케일 밖 값** (`4.75`, `3.5`, `1/2`)         |    4 | 임의값 문법으로 치환      |
| **효과 없는 죽은 선언** (덮이거나 애초에 무의미)              |    3 | **삭제**                  |
| **대응 토큰 불명**                                            |    5 | ⚠️ **디자인 확인 필요**   |

영향 파일 **33개**.

> ⚠️ **고치면 화면이 달라진다.** 현재는 색/크기가 안 먹어 기본값으로 보이고, 수정하면 의도한 값이 나온다.
> 등가 이관 원칙의 **의도적 예외**이며 사용자가 승인했다.

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

> **삭제해도 등가 이관에 어긋나지 않는다.** 현재 렌더 결과와 동일하다.

---

## 5. 대응 토큰 불명 (5건) — ⚠️ 디자인 확인 필요

config에 유사한 이름이 없어 **의도한 색을 추정할 수 없다.** 확인 전까지 현행 유지.

| 현재 (깨짐)                                   | 사용처                                                                                                                | 상황                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `text-brand-primary-50`                       | MyPageMenuGroupItem (그룹 제목), OfficeInfoBusinessHour·ContactList (섹션 제목)                                       | `brand`에는 `default`/`hover`/`focus`/`disabled`만 있고 숫자 스케일이 없다. `brand-default-text-brand`(`#0037BE`)가 유력하나 `50`이 뭘 가리키는지 불명 |
| `text-brand-primary-100`                      | OfficeInfoBusinessHour (운영시간), OfficeInfoContactList (전화번호)                                                   | 〃                                                                                                                                                     |
| `border-defaults-secondary-border-primary`    | `components/common/ButtonBase.vue`                                                                                    | `defaults.secondary`에는 `border-secondary`가, `defaults.primary`에는 `border-primary`가 있다. 둘 중 어느 쪽인지 불명                                  |
| `bg-brand-default-background-brand-secondary` | `components/common/InputRadioList.vue`                                                                                | `brand.default.background-brand`는 있으나 `-secondary` 변형이 없다                                                                                     |
| `border-deep-glue-20` ⭐                      | 주차 카드 4종 (`CarManagementList` · `InOutCarHistoryListView` · `MileageHistoryListView` · `ReservationCarListView`) | `glue`→`blue` 오타로 보이나 **config에 `deep-blue`도 `deep-glue`도 없다.** 현재는 `border`의 기본색(회색)으로 렌더된다                                 |
| `border-bg-gray` ⭐                           | `views/MovingHouseView/MovingHouseWriteView.vue`<br>`views/RepairView/RepairFormDetail.vue`(2곳)                      | `bg.gray` 색상군이 config에 없다. textarea 테두리이며 현재는 기본 회색                                                                                 |

> ⚠️ `ButtonBase`·`InputRadioList`는 **공용 컴포넌트**라 영향 범위가 넓다.
> `ButtonBase`는 거의 모든 화면에서 쓰인다 — 어떤 variant에서 이 클래스가 붙는지 확인 필요.
> → `[확인 필요]` B-Q2

---

## 6. 이관 방침

| 구분                  | 이관 시                                                       |
| --------------------- | ------------------------------------------------------------- |
| §1 명백한 오타 4건    | **수정한다** (3건). `border-deep-glue-20`은 §5로              |
| §2 스케일 불일치 10건 | **수정한다.** `neutral-b-gray-*`·`primary-pc-indigo-*`로 매핑 |
| §3 스케일 밖 값 4건   | **수정한다.** 임의값 문법(`w-[19px]` 등)으로                  |
| §4 죽은 선언 2건      | **삭제한다.** 화면 변화 없음                                  |
| §5 불명 5건           | **현행 유지** (효과 없음). B-Q1·B-Q2 확인 후 별도 처리        |

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
- [ ] 관리사무소 — 섹션 제목·운영시간·전화번호 색 (§5 미해결이라 일부는 그대로)
- [ ] 회원가입 아파트 설정 — 세대주/세대원 선택 배경 (B-Q1)
- [ ] 아파트 검색 모달 — 결과 영역 테두리, `선택` 버튼 색
- [ ] 관리비 상세 — 구분선에 색이 들어가는가 (`defaults` 복수 수정)
- [ ] 공지 목록 — 날짜 행간이 좁아졌는가 (`leading-[14px]`, B-Q4)
- [ ] 투표·설문 상세 제목 — 부제가 화면 절반 폭에서 줄바꿈되는가
- [ ] 방문 키오스크 목록 — 아이콘이 19×19px로 고정되는가
- [ ] 주차 카드 4종·이사/수선 textarea — 테두리 색이 **그대로 회색인가** (§5 미해결)
- [ ] 게시글 썸네일·키오스크 카드·투표/설문 상세 제목 — 죽은 선언 삭제 후 **변화가 없는가** (§4)

---

## `[확인 필요]`

| #    | 질문                                                                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B-Q1 | `bg-primary-400`(`#7F98F9`)이 맞는가? 흰 글자와 대비가 약해 `#0037BE`(500)가 의도였을 수 있다                                                                                                                |
| B-Q2 | `text-brand-primary-50/100`, `border-defaults-secondary-border-primary`, `bg-brand-default-background-brand-secondary`, **`deep-glue-20`(주차 카드 테두리)**, **`bg-gray`(textarea 테두리)** 의 의도한 색은? |
| B-Q3 | 디자인 시스템 원본(Figma 등)에 `neutral/90` 같은 표기가 있는가? 매핑 근거를 확정할 수 있다                                                                                                                   |
| B-Q4 | `leading-3.5`의 의도가 `0.875rem`(14px)인가? `lineHeight`와 `spacing` 스케일이 달라 해석이 갈린다                                                                                                            |
