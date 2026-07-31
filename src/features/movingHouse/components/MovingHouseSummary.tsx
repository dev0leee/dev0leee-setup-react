import {
  MOVING_HOUSE_DETAIL_BASIC_CONTENT_FIELD,
  MOVING_HOUSE_MESSAGE,
  MOVING_HOUSE_STATUS_LIST,
  MOVING_HOUSE_TYPE_LIST,
  type MovingHouseBasicFieldKey,
} from '@/features/movingHouse/constants/movingHouse'
import {
  useMovingHouseReservationTimeList,
  useMovingHouseSetting,
} from '@/features/movingHouse/queries/useMovingHouse'
import type {
  MovingHouseDetailData,
  MovingHouseFormData,
} from '@/features/movingHouse/types/movingHouse'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'
import { formatObjectDate } from '@/shared/utils/formatObjectDate'
import { formatPhone } from '@/shared/utils/formatPhone'

/**
 * `예약 내용` 섹션. **MH2와 MH4가 공유한다** — 레거시 `MovingHouseDetailBasicContent.vue`.
 *
 * ✅ **레거시는 `getCurrentRoutePath().includes('detail')`로 화면을 구분했다.**
 * `mode` prop으로 바꿨다 — 경로 문자열에 기대는 분기를 없애도 결과가 같다
 * (`moving-house.md` 「정리해도 되는 것」).
 *
 * | 항목          | `detail` (MH2)                  | `confirm` (MH4)                  |
 * | ------------- | ------------------------------- | -------------------------------- |
 * | 표시 필드     | 9개 (`chargeFlag` 필터 후)      | 앞 3개(예약번호·일시·상태) 제외  |
 * | `이사 예정일` | `moveStartDateTime`             | 폼의 `moveDate`                  |
 * | `이사 시간`   | `오전 09:00 - 12:00`            | 슬롯 라벨 `오전 09:00~12:00`     |
 *
 * ⚠️ **`detail` 모드도 시간대 쿼리를 기다린다.** 슬롯 라벨은 MH4에서만 쓰는데 레거시가
 * 컴포넌트를 공유하며 로딩까지 함께 걸어, 상세 화면이 불필요한 API 1회를 기다렸다가
 * 스피너를 거친다. 등가 이관이라 그대로 뒀다 (`moving-house.md` MH-Q9 · `deferred.md` D-93).
 *
 * ⚠️ **값이 전부 HTML로 렌더된다** — 메모만 HTML이 필요한데 예약번호·유형·사용료까지
 * 그렇다. 레거시 `v-dompurify-html`이다 (MH-Q8 · D-100). 살균은 통과시킨다.
 *
 * ⚠️ **사용료가 없으면 `undefined원`이 보인다** — `|| '-'`가 템플릿 리터럴 뒤에 붙어
 * 절대 발동하지 않는 레거시 코드 그대로다.
 */
const CONFIRM_EXCLUDED_KEYS: MovingHouseBasicFieldKey[] = [
  'receiptNum',
  'createdDate',
  'moveReservationStatus',
]

export const MovingHouseSummary = ({
  mode,
  detail,
  form,
}: {
  mode: 'detail' | 'confirm'
  detail?: MovingHouseDetailData
  form?: MovingHouseFormData
}) => {
  const isDetail = mode === 'detail'

  const { movingHouseSetting } = useMovingHouseSetting()
  const { timeSlotRadioList, isMovingHouseReservationTimeListLoading } =
    useMovingHouseReservationTimeList()

  const statusInfo = MOVING_HOUSE_STATUS_LIST.find((status) => {
    return status.status === detail?.moveReservationStatus
  })

  const selectedMoveTime = timeSlotRadioList.find((slot) => {
    return slot.key === form?.moveTime
  })

  const excludedKeys: MovingHouseBasicFieldKey[] = [
    ...(movingHouseSetting?.chargeFlag ? [] : (['moveReservationPrice'] as const)),
    ...(isDetail ? [] : CONFIRM_EXCLUDED_KEYS),
  ]

  const filteredFields = MOVING_HOUSE_DETAIL_BASIC_CONTENT_FIELD.filter((field) => {
    return !excludedKeys.includes(field.key)
  })

  const renderValue = (key: MovingHouseBasicFieldKey): string => {
    if (key === 'createdDate') {
      return formatIsoStringDate({ dateTimeString: detail?.createdDate }).dateTime() ?? '-'
    }

    if (key === 'moveType') {
      return (
        MOVING_HOUSE_TYPE_LIST.find((type) => {
          return type.key === (isDetail ? detail?.moveType : form?.moveType)
        })?.label ?? '-'
      )
    }

    if (key === 'emergencyPhone') {
      return (
        formatPhone({ phone: (isDetail ? detail?.emergencyPhone : form?.emergencyPhone) ?? '' }) ||
        '-'
      )
    }

    if (key === 'moveDate') {
      if (isDetail) {
        return formatIsoStringDate({ dateTimeString: detail?.moveStartDateTime }).date() ?? '-'
      }

      return formatObjectDate({ date: form?.moveDate, type: 'hyphen' }) ?? '-'
    }

    if (key === 'moveTime') {
      if (isDetail) {
        // 레거시는 줄바꿈·들여쓰기가 섞인 템플릿 리터럴이었다. HTML이 축약해 한 줄로
        // 보이므로 결과가 같도록 한 칸 공백으로 옮겼다
        return `${detail?.moveReservationTimeName} ${detail?.moveStartDateTime?.slice(11, 16)} - ${detail?.moveEndDateTime?.slice(11, 16)}`
      }

      return selectedMoveTime?.label ?? '-'
    }

    if (key === 'moveReservationPrice') {
      const price = isDetail ? detail?.moveReservationPrice : form?.moveReservationPrice

      return `${price?.toLocaleString()}원`
    }

    if (key === 'memo') {
      return formatHtmlText({ text: (isDetail ? detail?.memo : form?.memo) ?? '' }) || '-'
    }

    return detail?.[key] || '-'
  }

  return (
    <section className="flex flex-col gap-5 bg-base-b-white px-5 pt-[18px] pb-[30px]">
      <h2 className="pretendard-16SemiBold">{MOVING_HOUSE_MESSAGE.contentTitle}</h2>

      {isMovingHouseReservationTimeListLoading ? (
        <SpinnerDots />
      ) : (
        <ol className="flex flex-col gap-4">
          {filteredFields.map((field) => {
            return (
              <li key={field.key} className="flex min-h-5 justify-between gap-6">
                <span className="pretendard-14SemiBold whitespace-nowrap text-defaults-tertiary-text-tertiary">
                  {field.label}
                </span>
                {field.key === 'moveReservationStatus' ? (
                  <ChipBase color={statusInfo?.color} variant="fill">
                    {statusInfo?.label}
                  </ChipBase>
                ) : (
                  <span
                    className="pretendard-14Regular text-defaults-primary-text-primary"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml({ html: renderValue(field.key) }),
                    }}
                  />
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
