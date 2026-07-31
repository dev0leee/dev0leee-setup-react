import {
  MOVING_HOUSE_LIST_ITEM_FIELD,
  MOVING_HOUSE_STATUS_LIST,
  MOVING_HOUSE_TYPE_LIST,
} from '@/features/movingHouse/constants/movingHouse'
import type { MovingHouseListItemData } from '@/features/movingHouse/types/movingHouse'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 목록 카드 (MH1). 레거시 `MovingHouseListItem.vue` 이식.
 *
 * ⚠️ **칩과 화살표가 왼쪽에 붙어 있고 등록일시가 오른쪽이다** — 화살표가 카드 오른쪽
 * 끝이 아니다. 레거시 배치 그대로다.
 *
 * ✅ **`moveType` 조회에 `?.`를 붙였다.** 레거시는 `.find(...).label`이라 서버가
 * `MOVE_IN`/`MOVE_OUT` 밖의 값을 주면 **카드가 통째로 크래시**했다. 상세 화면의 같은
 * 코드에는 `?.`가 있어 내부 비대칭이었다 (`moving-house.md` MH-Q7 · `deferred.md` D-95).
 * 정상 데이터에서는 화면이 완전히 같다.
 *
 * ⚠️ **`이사 시간`이 템플릿 리터럴 하나다.** 레거시는 줄바꿈과 들여쓰기 공백이 섞여
 * 있었지만 HTML이 축약해 `오전 09:00 - 12:00`으로 보였다 — 결과가 같도록 한 줄로 옮겼다.
 * **MH4의 표기(`오전 09:00~12:00`)와는 다르다.**
 */
const renderFieldValue = ({
  key,
  info,
}: {
  key: (typeof MOVING_HOUSE_LIST_ITEM_FIELD)[number]['key']
  info: MovingHouseListItemData
}): string => {
  if (key === 'moveType') {
    return (
      MOVING_HOUSE_TYPE_LIST.find((type) => {
        return type.key === info.moveType
      })?.label ?? '-'
    )
  }

  if (key === 'moveDate') {
    return formatIsoStringDate({ dateTimeString: info.moveStartDateTime }).date() ?? '-'
  }

  if (key === 'moveTime') {
    return `${info.moveReservationTimeName} ${info.moveStartDateTime?.slice(11, 16)} - ${info.moveEndDateTime?.slice(11, 16)}`
  }

  return info[key] || '-'
}

export const MovingHouseListItem = ({
  movingHouseInfo,
  onClick,
}: {
  movingHouseInfo: MovingHouseListItemData
  onClick: () => void
}) => {
  const statusInfo = MOVING_HOUSE_STATUS_LIST.find((status) => {
    return status.status === movingHouseInfo.moveReservationStatus
  })

  return (
    <li
      className="flex w-full flex-col gap-3 rounded-lg border border-defaults-tertiary-border-tertiary px-3 py-4"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4 border-b border-b-defaults-tertiary-border-tertiary pb-3">
        <div className="flex items-center gap-[3px]">
          <ChipBase color={statusInfo?.color} variant="fill">
            {statusInfo?.label}
          </ChipBase>
          <img
            src="/assets/icons/ArrowRight.svg"
            alt="화살표 아이콘"
            aria-hidden
            className="h-4 w-4"
          />
        </div>
        <span className="pretendard-12Regular text-defaults-tertiary-text-tertiary">
          {formatIsoStringDate({ dateTimeString: movingHouseInfo.createdDate }).dateTime()}
        </span>
      </div>

      <ol className="flex flex-col gap-4">
        {MOVING_HOUSE_LIST_ITEM_FIELD.map((field) => {
          return (
            <li key={field.key} className="flex justify-between gap-2">
              <span className="pretendard-14SemiBold whitespace-nowrap text-defaults-tertiary-text-tertiary">
                {field.label}
              </span>
              <span className="overflow-hidden pretendard-14Regular text-ellipsis whitespace-nowrap text-defaults-primary-text-primary">
                {renderFieldValue({ key: field.key, info: movingHouseInfo })}
              </span>
            </li>
          )
        })}
      </ol>
    </li>
  )
}
