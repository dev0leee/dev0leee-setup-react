# 11. 오버레이 (모달 · 바텀시트 · 다이얼로그)

Base UI `Dialog`를 감싼 공통 래퍼로만 띄운다. 딤 배경·포털·포커스 트랩·스크롤 잠금·`Esc`는
래퍼(=Base UI)가 담당하고, **자식 컴포넌트가 이것들을 직접 만들지 않는다**
([01-folder-structure](./01-folder-structure.md)의 `ui/` vs `common/` 경계).

```tsx
// BAD - 손으로 딤 배경 + 바깥 클릭 판정
<div className="fixed inset-0 bg-black/50" onClick={close}>
  ...
</div>
```

손으로 만들면 포커스 트랩·`Esc`·`aria-modal`·스크롤 잠금이 전부 빠진다. `getByRole('dialog')`로
테스트도 못 잡는다 ([06-react](./06-react.md) 테스트 절).

## 오버레이는 별도 컴포넌트로 (MUST)

부모에 인라인하지 않는다. `기능 + Sheet`/`기능 + Dialog`로 분리하고, 부모는 **열림 상태와
"그 다음에 할 일"만** 소유한다. 네비게이션(`navigate`)·서버 호출은 부모의 `onSubmit`이 한다.

```tsx
// 부모
<CancelReservationSheet
  open={overlayType === 'cancelReservation'}
  onOpenChange={(next) => {
    setOverlayType(next ? 'cancelReservation' : null)
  }}
  detail={detail}
  onSubmit={handleCancelSubmit}
/>
```

## 여러 오버레이는 `overlayType` 유니온 하나로 (MUST)

`showCancelModal` / `showTransferSheet` 같은 boolean을 여러 개 만들지 않는다. 유니온 하나로
관리한다 — `04-state`의 "불리언 여러 개 대신 상태 머신 유니온" 원칙의 오버레이 사례다.

```tsx
type OverlayType = 'cancelReservation' | 'cancelSubscription' | 'transfer' | null
const [overlayType, setOverlayType] = useState<OverlayType>(null)
```

boolean 3개면 8가지 조합이 생기고 그중 4가지가 "모달 두 개가 동시에 열린" 불가능한 상태다.
유니온은 그런 상태를 표현할 수 없다.

## 내부 상태는 `key`로 초기화 (MUST)

시트 안의 로컬 상태(동의 체크, 입력값 등)는 닫을 때 초기화돼야 한다. `close()`에서 손으로
리셋하지 말고 **`key`로 재마운트**한다 ([06-react](./06-react.md)). 수동 리셋은 필드가 늘 때
빠뜨리지만 `key`는 안 빠뜨린다.

```tsx
{overlayType && <CancelReservationSheet key={overlayType} ... />}
```

## 배경 클릭으로 닫기 (MUST)

배경(스크림) 클릭 닫기는 **앱 전역 on/off가 아니라 컨텍스트·오버레이 종류로 정한다.** 기준은
"닫는 비용" — 되돌리기 쉬우면 허용, 입력값이 있거나 결정을 요구하면 차단한다.

### 백오피스(데스크톱): 전면 금지

**데스크톱에서는 배경 클릭 닫기를 넣지 않는다.** 다이얼로그 안에서 마우스 드래그(텍스트 선택 등)를
시작해 배경에서 손을 떼면 오탐으로 닫혀 작업이 날아간다. 대신 **`Esc` 키 + 명시적 닫기/취소 버튼**만
제공한다(파괴적 다이얼로그는 `Esc`도 막고 버튼만).

### 모바일: 종류별로

| 오버레이                  | 배경 클릭 닫기        | 비고                                |
| ------------------------- | --------------------- | ----------------------------------- |
| 바텀시트 (정보·선택·필터) | **넣는다** + 스와이프 | 플랫폼 공통 기대. 드래그 핸들 필수  |
| 폼·입력 바텀시트          | **안 넣는다**         | 스침으로 입력 날림 방지 (아래 대안) |
| 확인·삭제 다이얼로그      | **안 넣는다**         | 명시적 선택 강제                    |

폼에서 굳이 배경 클릭 닫기를 허용하려면 **입력이 있을 때만 "정말 닫을까요?"를 묻는 dirty-guard**를
붙인다 ([13-forms](./13-forms.md)).

### 구현 — Base UI `onOpenChange`

Base UI는 `onOpenChange(open, eventDetails)`의 **`eventDetails.reason`**으로 닫힌 이유
(`'outside-press'` / `'escape-key'` / `'close-press'` …)를 준다. 래퍼에 정책 prop
(예: `dismissOnBackdrop`)을 두고 `reason`으로 분기한다.

```tsx
onOpenChange={(open, eventDetails) => {
  if (!open && eventDetails.reason === 'outside-press' && !dismissOnBackdrop) return // 배경 클릭 무시
  onOpenChange(open)
}}
```

(3-인자 `(open, event, reason)`은 구버전 시그니처다. 설치된 `@base-ui/react` 1.6은
2-인자 `eventDetails` 방식이라 3-인자로 쓰면 타입 에러가 난다.)

**닫기 버튼은 어떤 경우든 항상 둔다.** 배경 클릭·`Esc`를 막아도 명시적 닫기 수단은 남긴다.

## 토스트 (MUST)

토스트도 오버레이다 — **컨테이너는 앱에 하나, 호출부는 함수 호출 하나.** 원리는 다른
오버레이와 같다: 위치·트랜지션·타이머·중복 처리는 컨테이너가 소유하고, 쓰는 쪽은 그 존재를 모른다.

- **`<Toaster />`는 `App.tsx`에 한 번만 마운트한다.** 전역 오버레이는 `App.tsx` 담당이다
  ([01-folder-structure](./01-folder-structure.md)). 이미 그렇게 되어 있다 — 페이지·컴포넌트가
  토스트 UI를 다시 만들지 않는다.
- **호출부는 `toast()` 함수만 부른다.** sonner의 `toast`는 훅이 아니라서 컴포넌트 밖
  (뮤테이션 `onSuccess` 등)에서도 부를 수 있다.
- **토스트 상태를 스토어나 `useState`로 만들지 않는다.** 큐·타이머·자동 닫힘은 라이브러리가
  소유한다. 직접 만들면 타이머 해제와 연속 호출 처리를 전부 손으로 관리하게 된다.
- **문구는 [12-constants](./12-constants.md) "사용자에게 보여주는 메시지" 규칙을 따른다** —
  개수·이름 같은 실제 값을 넣는다.
- **HTML 문자열을 넣지 않는다.** 문자열·JSX만. HTML을 넣어야 할 것 같으면
  [13-forms](./13-forms.md)의 sanitize 규칙부터 다시 읽는다.

```tsx
// app/App.tsx - 컨테이너는 여기 한 번뿐 (이미 마운트돼 있다)
<Toaster />
```

```tsx
// 호출부 - 함수 호출이 전부다
import { toast } from 'sonner'

toast.success(`${count}개 항목을 삭제했습니다.`)
```

## 배치 (MAY)

오버레이 JSX는 컴포넌트 반환문의 최하단에 둔다. 포털을 타서 DOM 위치와는 무관하지만 읽기 편하다.
