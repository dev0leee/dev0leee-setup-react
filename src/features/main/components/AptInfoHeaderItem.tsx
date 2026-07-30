import { APT_DRAWER_TEXT } from '@/features/main/constants/main'
import type { AptInfoHeaderItemProps } from '@/features/main/types/main'
import { useAuthStore } from '@/shared/stores/authStore'
import { RESIDENT_STATE } from '@/shared/types/resident'
import { cn } from '@/shared/utils/cn'

/**
 * 단지 목록 1행. 레거시 `AptInfoHeaderItem.vue` 이식.
 *
 * **승인 상태에 따라 완전히 다른 마크업**을 낸다 — 클래스만 다른 게 아니라 구조가 다르다
 * (승인: 아이콘 + 정보 가로 배치 / 미승인: 배지 + 정보 세로 배치).
 *
 * ⚠️ **미승인 항목에도 클릭이 붙는다.** 레거시가 `<AptInfoHeaderItem @click>`으로
 * 승인 여부와 무관하게 달아놨다. 눌러도 전환되지 않고 드로어가 닫히면서
 * `승인되지 않은 단지입니다.` 모달이 뜬다. 그대로 재현한다.
 *
 * ⚠️ 현재 단지 판정은 **`aptResidentUuid` 비교**다 (`aptUuid`가 아니다) —
 * 같은 단지에 여러 세대가 있을 수 있다.
 */
export const AptInfoHeaderItem = ({ aptInfo, onSelect }: AptInfoHeaderItemProps) => {
  const currentAptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const isSelectedApt = currentAptResidentUuid === aptInfo.aptResidentUuid
  const isApproved = aptInfo.residentState === RESIDENT_STATE.APPROVED

  const aptSummary = (
    <div className="flex flex-col gap-1">
      <span className="pretendard-16Bold text-defaults-primary-text-primary">
        {aptInfo.aptName} {aptInfo.dong}동 {aptInfo.ho}호
      </span>
      <p className="pretendard-14Regular text-defaults-secondary-text-secondary">
        {aptInfo.aptAddress}
      </p>
    </div>
  )

  if (!isApproved) {
    return (
      <li
        className="flex w-full flex-col gap-[7px] rounded-xl border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-mono px-5 py-6"
        onClick={() => {
          onSelect(aptInfo)
        }}
        role="presentation"
      >
        <div className="mb-[2px] flex items-center gap-[2px] pretendard-13Bold text-defaults-primary-text-primary">
          <img src="/assets/icons/ClockWaiting.svg" alt="시계 아이콘" />
          <span>{APT_DRAWER_TEXT.WAITING}</span>
        </div>
        {aptSummary}
      </li>
    )
  }

  return (
    <li
      className={cn(
        'flex w-full items-center gap-[7px] rounded-xl border px-5 py-6',
        isSelectedApt
          ? 'border-blue-s-info-100 bg-blue-s-info-50'
          : 'border-defaults-tertiary-border-tertiary bg-base-b-white',
      )}
      onClick={() => {
        onSelect(aptInfo)
      }}
      role="presentation"
    >
      <div className="flex items-start gap-[10px]">
        <img
          src={
            isSelectedApt
              ? '/assets/icons/CheckVerifiedSelect.svg'
              : '/assets/icons/CheckVerified.svg'
          }
          alt="선택 아이콘"
          className="pt-1"
        />
        {aptSummary}
      </div>
    </li>
  )
}
