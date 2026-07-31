import { TYPE_DATA } from '@/features/aptMall/constants/aptMall'
import { useAptMallFormStore } from '@/features/aptMall/stores/aptMallFormStore'
import { cn } from '@/shared/utils/cn'

/**
 * 예약 유형 선택 (AM4). 레거시 `AptMallFormOrderType.vue`.
 *
 * ⚠️ **선택 즉시 다음 단계로 넘어간다** — 확인 버튼이 없다. 그래서 선택 상태 스타일
 * (배경 반전)은 화면에 보일 틈이 없지만 마크업은 그대로 옮겼다.
 *
 * ⚠️ **AM5에서 여기로 되돌아올 방법이 없다.** AM5의 버튼은 `닫기`뿐이라 유형을 잘못
 * 고르면 처음부터 다시 해야 한다 (`apt-mall.md` AM-Q13). 경로를 새로 만들지 않았다.
 */
export const StepOrderType = ({ onNextStep }: { onNextStep: () => void }) => {
  const setAptMallFormData = useAptMallFormStore((state) => {
    return state.setAptMallFormData
  })
  const selectedType = useAptMallFormStore((state) => {
    return state.aptMallFormData.selectedType
  })

  return (
    <div className="flex gap-2.5 p-5">
      {TYPE_DATA.map((type) => {
        const isSelected = selectedType?.key === type.key

        return (
          <label
            key={type.key}
            htmlFor={type.key}
            className={cn(
              'flex h-32 w-1/2 flex-col items-center justify-center gap-2.5 rounded-lg border p-4',
              isSelected && 'bg-blue-s-info-50',
            )}
          >
            <input
              id={type.key}
              type="radio"
              name="orderType"
              value={type.key}
              checked={isSelected}
              className="hidden"
              onChange={() => {
                setAptMallFormData({ selectedType: { ...type } })
                onNextStep()
              }}
            />
            <div
              className={cn(
                'flex h-[58px] w-[58px] items-center justify-center rounded-full p-4',
                isSelected ? 'bg-base-b-white' : 'bg-blue-s-info-50',
              )}
            >
              <img src={type.icon} alt={`${type.label} 아이콘`} className="h-7 w-7" />
            </div>
            <span className="pretendard-16Medium">{type.label}</span>
          </label>
        )
      })}
    </div>
  )
}
