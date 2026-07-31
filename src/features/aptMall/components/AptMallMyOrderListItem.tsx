import { LIST_ITEM_FIELD, MEAL_TYPE, STATUS_LIST } from '@/features/aptMall/constants/aptMall'
import type { AptMallMyOrderListItemData } from '@/features/aptMall/types/aptMall'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 예약 목록 카드 (AM2). 레거시 `AptMallMyOrderListItem.vue`.
 *
 * ⚠️ **`포장` 예약에도 `인원 수` 행이 그대로 보인다**(값 `-`). 확인 단계(AM7)는 걸러내는데
 * 목록은 걸러내지 않는다 — 비대칭을 그대로 옮겼다.
 *
 * ⚠️ **상태가 표에 없으면 칩이 빈 상태로 렌더된다** — 색도 문구도 없다. `?.`가 붙어 있어
 * 크래시하지는 않는다(AM3의 취소 섹션과 다르다).
 *
 * ⚠️ **몰 이름만 HTML로 렌더한다** — 레거시 `v-dompurify-html` + `formatHtmlText`다.
 */
const renderFieldValue = ({
  key,
  info,
}: {
  key: (typeof LIST_ITEM_FIELD)[number]['key']
  info: AptMallMyOrderListItemData
}): string => {
  const value = info[key]
  if (value === undefined) return '-'

  if (key === 'aptMallOrderType') return MEAL_TYPE[info.aptMallOrderType ?? 'VISIT']
  if (key === 'orderDateTime') {
    return formatIsoStringDate({ dateTimeString: info.orderDateTime }).dateTime() ?? '-'
  }
  if (key === 'personCount') return `${info.personCount}명`

  return `${value}`
}

export const AptMallMyOrderListItem = ({
  info,
  onClick,
}: {
  info: AptMallMyOrderListItemData
  onClick: () => void
}) => {
  const statusInfo = STATUS_LIST.find((status) => {
    return status.status === info.aptMallOrderState
  })

  return (
    <li
      className="flex w-full flex-col gap-3 rounded-lg border border-defaults-tertiary-border-tertiary bg-base-b-white px-3 py-4"
      onClick={onClick}
    >
      <div className="flex flex-col justify-between gap-2 border-b border-b-defaults-tertiary-border-tertiary pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            <span
              className="pretendard-15SemiBold"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml({ html: formatHtmlText({ text: info.aptMallName || '-' }) }),
              }}
            />
            <ChipBase color={statusInfo?.color} variant="fill">
              {statusInfo?.label}
            </ChipBase>
          </div>
          <div className="flex items-center gap-1">
            <span className="pretendard-15SemiBold">
              {Number(info.orderPrice).toLocaleString()}원
            </span>
            <img
              src="/assets/icons/ArrowRight.svg"
              alt="화살표 아이콘"
              aria-hidden
              className="h-5 w-5"
            />
          </div>
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {LIST_ITEM_FIELD.map((field) => {
          return (
            <li
              key={field.key}
              className="flex justify-between gap-2 text-defaults-tertiary-text-tertiary"
            >
              <span className="pretendard-13Medium whitespace-nowrap">{field.label}</span>
              <span className="overflow-hidden pretendard-13Regular text-ellipsis whitespace-nowrap">
                {renderFieldValue({ key: field.key, info })}
              </span>
            </li>
          )
        })}
      </ol>
    </li>
  )
}
