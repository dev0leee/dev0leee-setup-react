# 레거시에서 적용되지 않는 스타일 클래스

> 기준 SHA `6d5bf22` · **Tailwind 3.4 실제 빌드로 검증** (`npx tailwindcss` 출력에 해당 클래스 미생성)
> 결정: **고친다** (2026-07-29 사용자 — "오타가 있으면 고쳐야지")

## 요약

레거시 소스가 쓰는 색상 클래스 중 **16개가 `tailwind.config.js`에 없어 CSS가 생성되지 않는다.**
Tailwind는 알 수 없는 클래스를 조용히 무시하므로, 해당 요소는 **색 지정 없이 브라우저 기본값으로
렌더되고 있다.**

| 구분                                                          | 건수 | 조치                      |
| ------------------------------------------------------------- | ---: | ------------------------- |
| **명백한 오타** (끝에 `0` 하나)                               |    2 | **확실히 수정 가능**      |
| **스케일 표기 불일치** (`neutral-90` vs `neutral-b-gray-900`) |   10 | 매핑 근거 명확, 수정 가능 |
| **대응 토큰 불명**                                            |    4 | ⚠️ **디자인 확인 필요**   |

영향 파일 **20개** — 대부분 **MyPage**와 **SignUp**에 몰려 있다.

> ⚠️ **고치면 화면이 달라진다.** 현재는 색이 안 먹어 기본색으로 보이고, 수정하면 의도한 색이 나온다.
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

## 1. 명백한 오타 (2건) — 확실히 수정

토큰 이름 끝에 `0`이 잘못 붙었다.

| 현재 (깨짐)                                 | 수정                                       | 사용처                                                                                      |
| ------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `border-defaults-tertiary-border-tertiary0` | `border-defaults-tertiary-border-tertiary` | `components/common/TermsCheckboxList.vue`<br>`views/TermsOfUseView/TermsOfUseAgreeView.vue` |
| `text-defaults-primary-text-primary0`       | `text-defaults-primary-text-primary`       | `views/TermsOfUseView/TermsOfUseAgreeView.vue`                                              |

**영향 화면**: 회원가입 약관 동의(`signup.md` S1), 버전1 약관 동의(`auth.md` A5),
쇼핑 마케팅 동의(`main.md` §11) — `TermsCheckboxList`를 쓰는 모든 곳.

수정 후 색:

- `defaults.tertiary.border-tertiary` → 약관 구분선에 지정색 적용
- `defaults.primary.text-primary` = `#111927` → "모두 동의" 텍스트가 진한 남색으로

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

## 3. 대응 토큰 불명 (4건) — ⚠️ 디자인 확인 필요

config에 유사한 이름이 없어 **의도한 색을 추정할 수 없다.** 확인 전까지 현행 유지.

| 현재 (깨짐)                                   | 사용처                                                                          | 상황                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `text-brand-primary-50`                       | MyPageMenuGroupItem (그룹 제목), OfficeInfoBusinessHour·ContactList (섹션 제목) | `brand`에는 `default`/`hover`/`focus`/`disabled`만 있고 숫자 스케일이 없다. `brand-default-text-brand`(`#0037BE`)가 유력하나 `50`이 뭘 가리키는지 불명 |
| `text-brand-primary-100`                      | OfficeInfoBusinessHour (운영시간), OfficeInfoContactList (전화번호)             | 〃                                                                                                                                                     |
| `border-defaults-secondary-border-primary`    | `components/common/ButtonBase.vue`                                              | `defaults.secondary`에는 `border-secondary`가, `defaults.primary`에는 `border-primary`가 있다. 둘 중 어느 쪽인지 불명                                  |
| `bg-brand-default-background-brand-secondary` | `components/common/InputRadioList.vue`                                          | `brand.default.background-brand`는 있으나 `-secondary` 변형이 없다                                                                                     |

> ⚠️ `ButtonBase`·`InputRadioList`는 **공용 컴포넌트**라 영향 범위가 넓다.
> `ButtonBase`는 거의 모든 화면에서 쓰인다 — 어떤 variant에서 이 클래스가 붙는지 확인 필요.
> → `[확인 필요]` B-Q2

---

## 4. 이관 방침

| 구분                  | 이관 시                                                       |
| --------------------- | ------------------------------------------------------------- |
| §1 명백한 오타 2건    | **수정한다.** `0` 제거                                        |
| §2 스케일 불일치 10건 | **수정한다.** `neutral-b-gray-*`·`primary-pc-indigo-*`로 매핑 |
| §3 불명 4건           | **현행 유지** (색 미적용). B-Q1·B-Q2 확인 후 별도 처리        |

### 타깃 토큰 설계와의 관계

`decisions/tech-choices.md`에서 **레거시 토큰 값을 `@theme`으로 전량 이식**하기로 했다.
이때 **디자인 시스템 표기(`neutral-90`)와 config 표기(`neutral-b-gray-900`) 중 어느 쪽을
쓸지 정해야 한다.**

**권장: config 표기를 그대로 옮긴다.** 정상 동작하는 클래스 99개가 이미 config 표기를 쓰고 있어,
표기를 바꾸면 그 99개를 전부 손봐야 한다. 깨진 16개만 config 표기로 맞추는 쪽이 변경 범위가 작다.

### QA 체크리스트 (수정 후 확인)

- [ ] 약관 동의 화면 — "모두 동의" 텍스트가 진한 남색, 구분선에 색이 들어가는가
- [ ] 마이페이지 — 메뉴 그룹 제목·본문 텍스트 색
- [ ] 마이페이지 프로필 — 아바타 테두리·배경
- [ ] 관리사무소 — 섹션 제목·운영시간·전화번호 색 (§3 미해결이라 일부는 그대로)
- [ ] 회원가입 아파트 설정 — 세대주/세대원 선택 배경 (B-Q1)
- [ ] 아파트 검색 모달 — 결과 영역 테두리, `선택` 버튼 색

---

## `[확인 필요]`

| #    | 질문                                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- |
| B-Q1 | `bg-primary-400`(`#7F98F9`)이 맞는가? 흰 글자와 대비가 약해 `#0037BE`(500)가 의도였을 수 있다                                         |
| B-Q2 | `text-brand-primary-50/100`, `border-defaults-secondary-border-primary`, `bg-brand-default-background-brand-secondary`의 의도한 색은? |
| B-Q3 | 디자인 시스템 원본(Figma 등)에 `neutral/90` 같은 표기가 있는가? 매핑 근거를 확정할 수 있다                                            |
