import { REPAIR_LIST_ITEM_FIELD, REPAIR_STATUS_LIST } from '@/features/repair/constants/repair'
import type { RepairListItemData } from '@/features/repair/types/repair'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 접수 카드 1개 (RP1). 레거시 `RepairListItem.vue`(67 LOC) 이식.
 *
 * ⚠️ **내용을 한 줄로 눌러 보여준다** — 개행을 먼저 지운 뒤 `formatHtmlText`를 통과시켜서
 * `<br/>`이 생기지 않는다. 결과적으로 엔티티 디코딩만 적용된다.
 *
 * ⚠️ **상태를 `state`로 찾는다** — 상세 응답은 `repairState`다. 서버 필드명이 화면마다
 * 다르다 (`repair.md` RP-Q8).
 */
export const RepairListItem = ({
  item,
  onClick,
}: {
  item: RepairListItemData
  onClick: () => void
}) => {
  const statusInfo = REPAIR_STATUS_LIST.find((status) => {
    return status.status === item.state
  })

  return (
    <li
      className="flex w-full flex-col gap-3 rounded-lg border border-defaults-tertiary-border-tertiary px-3 py-4"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <ChipBase color={statusInfo?.color}>{statusInfo?.label}</ChipBase>
          <img src="/assets/icons/ArrowRight.svg" alt="이동 아이콘" className="h-4 w-4" />
        </div>
        <span className="pretendard-12Regular text-defaults-tertiary-text-tertiary">
          {formatIsoStringDate({ dateTimeString: item.createdDate }).dateTime()}
        </span>
      </div>
      <ol className="flex flex-col gap-2">
        {REPAIR_LIST_ITEM_FIELD.map((field) => {
          return (
            <li
              key={field.key}
              className="flex justify-between gap-2 text-defaults-tertiary-text-tertiary"
            >
              <span className="pretendard-13Medium whitespace-nowrap">{field.label}</span>
              <span className="overflow-hidden pretendard-13Regular text-ellipsis whitespace-nowrap">
                {formatHtmlText({ text: (item[field.key] ?? '').replaceAll('\n', '') }) || '-'}
              </span>
            </li>
          )
        })}
      </ol>
    </li>
  )
}
