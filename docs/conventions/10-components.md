# 10. 컴포넌트 설계

## 페이지와 컴포넌트를 나눈다 (MUST)

feature 안에서 **라우트에 마운트되는 화면은 `pages/`, 그 외 재사용 조각은 `components/`**에 둔다.

| 폴더                       | 무엇                                            | 판별            |
| -------------------------- | ----------------------------------------------- | --------------- |
| `features/<f>/pages/`      | 라우트 진입점 화면. `~Page` 접미사. route당 1개 | 라우터에 걸린다 |
| `features/<f>/components/` | 재사용 조각·부분 섹션                           | 걸리지 않는다   |

```
features/auth/
├── api/
├── queries/
├── components/
│   ├── AuthProvider.tsx
│   └── LoginForm.tsx
├── pages/
│   ├── LoginPage.tsx
│   └── SignUpPage.tsx
├── hooks/
├── schemas/
└── index.ts
```

- **`~Page`는 `pages/` 바로 밑에 둔다. 하위 폴더에 묻지 않는다.** `pages/detail/deep/XxxPage.tsx`처럼
  깊어지면 구조가 틀린 것이다 ([01-folder-structure](./01-folder-structure.md)의 중첩 2~3단계 제한).
- **페이지는 조합과 배치만 한다.** 데이터 페칭은 그 데이터를 실제 쓰는 컴포넌트가 한다
  ([08-routing](./08-routing.md)).
- 도메인이 없는 페이지(`NotFoundPage`)만 `app/`에 둔다. 전역 `src/pages/`는 만들지 않는다.

> **MAY — 하위 폴더로 컴포넌트를 나눌 만큼 커지면, 폴더 이름을 파일 접두사로 맞춘다.**
> `detail/` 아래는 `DetailPayment.tsx`, `DetailButtons.tsx`처럼. (오버레이 `*Sheet`·`*Dialog`는 예외 —
> [11-overlay](./11-overlay.md).) 파일명은 주 export와 일치시킨다 ([02-naming](./02-naming.md)).

## 반복되는 정보 UI — `{ label, key }` 배열 + display map (SHOULD)

레이블-값 쌍이 반복되는 정보성 UI는 **구조(상수)와 값(컴포넌트)을 분리**한다. 배열을 컴포넌트
안에서 만들면 매 렌더 새 배열이고 구조와 값이 뒤섞인다.

```tsx
// features/reservation/constants/reservationRows.ts — 구조만
export const CANCEL_INFO_ROWS = [
  { label: '운영시설', key: 'facilityName' },
  { label: '이용권명', key: 'programName' },
  { label: '이용 기간', key: 'usagePeriod' },
] as const satisfies readonly { label: string; key: keyof CancelInfo }[]

// 컴포넌트 — 값만
const cancelInfo = {
  facilityName: detail.facilityName,
  programName: detail.programName,
  usagePeriod: `${formatDot(detail.startDate)} ~ ${formatDot(detail.endDate)}`,
}

return CANCEL_INFO_ROWS.map((row) => {
  return (
    <div key={row.key} className="flex gap-2">
      <span className="w-24 shrink-0 font-semibold">{row.label}</span>
      <span>{cancelInfo[row.key]}</span>
    </div>
  )
})
```

`satisfies`로 `key`가 실제 필드인지 컴파일 타임에 검사한다. 상수 위치는 [12-constants](./12-constants.md).

## 시맨틱 마크업 (MUST)

**의미에 맞는 태그를 쓴다.** `div`로 흉내내지 않는다 — 접근성이 살고, 테스트가 role로 잡을 수
있다 ([06-react](./06-react.md) 테스트 절: role 셀렉터가 시맨틱 태그를 전제로 한다).

```tsx
// 표 데이터는 table > thead/tbody > tr > th/td
<table>
  <thead><tr><th>요일</th><th>운영 시간</th></tr></thead>
  <tbody>
    {schedule.map((row) => {
      return (
        <tr key={row.day}><td>{row.day}</td><td>{row.hours}</td></tr>
      )
    })}
  </tbody>
</table>

// 구분선은 <hr>, div가 아니다
<hr className="h-px bg-border" />       // GOOD
<div className="h-px bg-border" />      // BAD

// 전화번호는 tel: 링크 + 공백/하이픈 제거
<a href={`tel:${phone.replace(/[\s-]/g, '')}`}>{phone}</a>
```

`@tanstack/react-table`은 헤드리스라 마크업은 우리가 정한다 — `table` 시맨틱으로 렌더한다.
