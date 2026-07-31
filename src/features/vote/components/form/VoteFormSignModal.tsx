import { CanvasSign } from '@/shared/components/common/CanvasSign'
import { ModalBase } from '@/shared/components/common/ModalBase'

/**
 * 서명 모달 (VT3). 레거시 `Form/VoteFormSignModal.vue`(51 LOC) 이식.
 *
 * **서명을 그려야 제출된다.** `CanvasSign`이 캔버스를 `File`로 만들어 넘긴다.
 *
 * ✅ **제출 중에는 닫기 버튼과 서명 캔버스가 잠긴다.** 레거시는 잠금 값이 `undefined`라
 * 제출 중에도 닫히고 다시 서명할 수 있었다 — 중복 제출의 통로였다(VT-Q2 결정으로 수정).
 *
 * ⚠️ 레거시는 `ModalBase`(이미 flex 중앙 정렬) 안에서 `absolute`로 **다시** 중앙 정렬하고
 * `document.body.style.overflow`도 **중복으로** 조작했다. 둘 다 `ModalBase`가 하는 일이라
 * 옮기지 않았다 — 보이는 결과는 같다.
 */
export const VoteFormSignModal = ({
  isPending,
  onClose,
  onSave,
}: {
  isPending: boolean
  onClose: () => void
  onSave: (payload: { file: File }) => void
}) => {
  return (
    <ModalBase open onClose={onClose}>
      <div className="flex h-[286px] w-4/5 min-w-[30px] flex-col gap-4 rounded-md bg-base-b-white p-5">
        <div className="flex items-center justify-between gap-4 py-2">
          <h1 className="pretendard-18Bold">서명하기</h1>
          <button type="button" disabled={isPending} onClick={onClose}>
            <img src="/assets/icons/CloseBold.svg" alt="닫기 아이콘" className="h-3 w-3" />
          </button>
        </div>
        <CanvasSign isPending={isPending} onSave={onSave} />
      </div>
    </ModalBase>
  )
}
