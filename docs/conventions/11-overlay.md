# 11. 오버레이 · 모달 · 바텀시트 · 토스트

> **현재 상태:** 이 레포에는 아직 Dialog/Sheet 컴포넌트가 없다. Toast만 `sonner`로 붙어 있다.
> 이 문서는 **처음 만들 때 따를 규칙**이다. 첫 모달을 추가하는 사람이 이 구조를 세운다.

## 지금 커뮤니티는 (2026-07 기준)

**두 갈래가 있다.**

1. **제어 컴포넌트 방식 (주류).** Base UI / Radix의 `open` + `onOpenChange`를 부모가 소유한다. 라이브러리 추가가 없고 primitive가 포커스 트랩·ESC·ARIA를 처리한다. shadcn 생태계의 기본값이다.
2. **선언적/Promise 방식.** [toss/overlay-kit](https://github.com/toss/overlay-kit) 같은 라이브러리로 `await overlay.openAsync(...)`를 쓴다. 모달 결과를 반환값으로 받으므로 `useState` + `onClose` 왕복이 사라진다. 아래 "선언적 오버레이 라이브러리" 절에 논거를 정리했다.

**접근성 쪽 조언은 한 줄로 수렴한다: 직접 만들지 말 것.** 모달의 어려움은 열고 닫기가 아니라 포커스 트랩·ESC 계층·스크롤 잠금이고, [Syntax의 UI 컴포넌트 라이브러리 편](https://www.youtube.com/watch?v=9-6deom3ZdY)에서 진행자가 든 불만이 정확히 그 지점이다 — 모달 안 입력에서 ESC를 누르면 _"the actual Escape key will fire as well and it'll close the entire modal and that drives me crazy"_. ESC는 먼저 안쪽 상태를 정리하고 그다음에 모달을 닫아야 한다.

**이 프로젝트의 결정: 1번(제어 컴포넌트 + Base UI).** 근거는 아래 "선언적 오버레이 라이브러리" 절에 재검토 조건과 함께 적었다.

## 오버레이 종류와 선택 기준 (MUST)

| 종류                   | 언제                                        | 구현                            |
| ---------------------- | ------------------------------------------- | ------------------------------- |
| **Toast**              | 결과 통보. 응답 불필요.                     | `sonner` (이미 있음)            |
| **Dialog**             | 선택을 받아야 함. 흐름을 멈춤.              | Base UI `Dialog` + shadcn       |
| **AlertDialog**        | 파괴적 동작 확인. ESC/바깥클릭으로 못 닫음. | Base UI `AlertDialog`           |
| **Sheet / 바텀시트**   | 보조 콘텐츠, 모바일 액션.                   | Base UI `Dialog` + 방향 variant |
| **Popover / Dropdown** | 컨텍스트 메뉴. 모달 아님.                   | Base UI `Popover` / `Menu`      |

**모달을 쓰기 전에 페이지를 고려한다.** 내용이 많거나, 공유·새로고침이 필요하거나,
그 안에서 또 모달이 열려야 하면 그건 페이지여야 한다.

## 설치 규칙 (MUST)

```bash
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add sheet
```

`components.json`이 `style: "base-nova"`라 Base UI 기반 컴포넌트가 설치된다.
**생성된 파일은 `src/components/ui/`에 그대로 둔다** ([10-components](./10-components.md)).

## 상태를 어디에 두나 (MUST)

**모달 열림 상태는 그 모달을 여는 컴포넌트의 로컬 상태다.**
Zustand에 넣지 않는다. URL에도 보통 넣지 않는다.

```tsx
function OrdersTable() {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  return (
    <>
      <Button onClick={() => setDeletingId(order.id)}>삭제</Button>
      <DeleteOrderDialog orderId={deletingId} onClose={() => setDeletingId(null)} />
    </>
  )
}
```

> **패턴 — `boolean` 대신 `T | null`.** `isOpen` + `selectedId` 두 개를 두면
> "열려 있는데 id가 없는" 불가능한 상태가 생긴다. 하나로 합친다.

**예외 — URL에 두는 경우:** 링크로 직접 열려야 하는 모달(공유 가능한 상세 보기)은
`searchParams`에 둔다. 그 외에는 로컬 상태다.

## 모달 컴포넌트 작성 규칙

### 제어(controlled) 방식으로 만든다 (MUST)

모달 컴포넌트가 자기 열림 상태를 소유하지 않는다. 부모가 소유하고 props로 내린다.

```tsx
// features/dashboard/DeleteOrderDialog.tsx
interface DeleteOrderDialogProps {
  orderId: string | null
  onClose: () => void
}

export function DeleteOrderDialog({ orderId, onClose }: DeleteOrderDialogProps) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('주문을 삭제했습니다.')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return (
    <AlertDialog open={orderId !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogTitle>주문을 삭제할까요?</AlertDialogTitle>
        <AlertDialogDescription>되돌릴 수 없습니다.</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={() => orderId && mutation.mutate(orderId)}
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### 규칙 정리

- **MUST — 모달은 자기 데이터를 자기가 가져온다.** 열려 있을 때만 요청하도록 `enabled`를 건다.
- **MUST — 모달 안의 mutation은 `onSuccess`에서 `onClose()`를 부른다.** 부모가 닫아주길 기대하지 않는다.
- **MUST — 파괴적 동작은 `AlertDialog`.** `Dialog`는 ESC/바깥 클릭으로 닫히므로 실수를 유발한다.
- **MUST — `AlertDialogTitle`을 반드시 넣는다.** 스크린리더가 읽을 게 없으면 접근성 위반이고 Base UI가 경고한다.
- **SHOULD — 제출 중에는 닫기를 막는다.** `mutation.isPending`일 때 `onOpenChange`를 무시한다.
- **MUST — 모달 안에서 라우팅하지 않는다.** 이동이 필요하면 닫고 나서 이동한다.

### 파일 위치

| 모달                                 | 위치                                       |
| ------------------------------------ | ------------------------------------------ |
| 도메인 모달 (주문 삭제, 사용자 초대) | `features/<f>/XxxDialog.tsx`               |
| 재사용 확인 모달                     | `components/common/ConfirmDialog.tsx`      |
| shadcn primitive                     | `components/ui/dialog.tsx` (건드리지 않음) |

## 중첩 모달 (MUST — 금지)

모달 안에서 모달을 열지 않는다. 포커스 트랩이 겹치고 ESC 동작이 예측 불가가 된다.

대안:

- 모달 내부를 단계(step)로 나눈다
- 첫 모달을 닫고 두 번째를 연다
- 페이지로 승격시킨다

## 토스트 (sonner)

`<Toaster />`는 `App.tsx`에 이미 붙어 있다. 어디서든 `toast()`를 부르면 된다.

```tsx
import { toast } from 'sonner'

toast.success('저장했습니다.')
toast.error('저장에 실패했습니다.')
```

- **MUST — 토스트는 "이미 끝난 일"을 알린다.** 확인이나 선택을 요구하지 않는다.
- **SHOULD — 조회 실패에 토스트를 쓰지 않는다.** 그건 ErrorBoundary 담당이다 ([04-state](./04-state.md)).
  토스트는 mutation 결과에 쓴다.
- **SHOULD — 성공 토스트를 남발하지 않는다.** 화면에 결과가 즉시 보이면 토스트는 소음이다.

## 선언적 오버레이 라이브러리에 대해 (참고 — 도입 안 함)

**커뮤니티에 실제로 존재하는 대안이다.** [toss/overlay-kit](https://github.com/toss/overlay-kit)은 `overlay.open()` / `overlay.openAsync()`로 모달을 열고 **결과를 Promise로 받는다.** 즉 `useState` + `onClose` 왕복이 사라진다.

논지는 [From State to Relationships: The Declarative Overlay Pattern](https://evan-moon.github.io/2025/10/07/declarative-overlay-pattern-with-overlay-kit/en/)에 정리돼 있다 — 대부분의 React 개발자가 모달·토스트에서만은 아직 절차적으로 사고한다는 것: _"still using useState to create state, wire up event handlers, and manage the sequence of state changes, which is procedural thinking: focusing on temporal order."_

**지금은 도입하지 않는다.** 이유:

- 의존성이 하나 늘어난다 (이 프로젝트는 라이브러리 추가에 보수적이다)
- 현재 모달이 0개라 아직 통증이 없다
- Base UI 제어 방식으로 충분한 규모다

**모달이 10개를 넘고 열림 상태 관리가 반복적으로 느껴지면** 그때 팀에서 재논의한다.
그 전에 개인 판단으로 추가하지 않는다.
