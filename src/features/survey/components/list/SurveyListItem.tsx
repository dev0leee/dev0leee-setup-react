import {
  LIST_ITEM_FIELD,
  PARTICIPANT_STATE_LABEL,
  STATUS_LIST,
} from '@/features/survey/constants/survey'
import { SURVEY_STATE, type SurveyListItemData } from '@/features/survey/types/survey'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { calculateDday } from '@/shared/utils/calculateDday'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 설문 카드 1개 (SV1). 레거시 `List/SurveyListItem.vue`(95 LOC) 이식.
 *
 * ✅ **투표 목록과 달리 D-day가 실제로 보인다.** 조건(`state === 'PENDING'`)과 날짜 필드
 * (`startDateTime`)가 둘 다 맞다 — 투표 목록은 둘 다 틀려서 한 번도 안 보인다(D-287).
 * **같은 화면인데 한쪽만 동작한다.**
 *
 * ⚠️ **필드 키와 서버 필드명이 다르다** — `openSurveyDateTime` 키로 `startDateTime`을 읽는다.
 */
export const SurveyListItem = ({
  item,
  onClick,
}: {
  item: SurveyListItemData
  onClick: () => void
}) => {
  const statusInfo = STATUS_LIST.find((status) => {
    return status.state === item.state
  })

  const renderFieldValue = (key: (typeof LIST_ITEM_FIELD)[number]['key']) => {
    if (key === 'openSurveyDateTime') {
      return formatIsoStringDate({ dateTimeString: item.startDateTime }).dateTime()
    }
    if (key === 'closeSurveyDateTime') {
      return formatIsoStringDate({ dateTimeString: item.endDateTime }).dateTime()
    }

    return PARTICIPANT_STATE_LABEL[item.respondentState ?? '']
  }

  return (
    <li
      className="flex w-full flex-col gap-3 rounded-lg border border-defaults-tertiary-border-tertiary px-3 py-4 shadow-[0px_4px_8px_-2px_rgba(16,24,40,0.10)]"
      onClick={onClick}
    >
      <div className="flex flex-col justify-between gap-2 border-b border-b-defaults-tertiary-border-tertiary pb-3">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 items-center gap-1">
            <ChipBase color={statusInfo?.color}>{statusInfo?.label}</ChipBase>
            <span
              className="truncate pretendard-13Regular text-defaults-secondary-text-secondary"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml({ html: formatHtmlText({ text: item.groupName || '-' }) }),
              }}
            />
          </div>
          {item.state === SURVEY_STATE.PENDING && (
            <span className="shrink-0 pretendard-13Regular text-defaults-tertiary-text-tertiary">
              {calculateDday({ targetDate: item.startDateTime ?? '' })}
            </span>
          )}
        </div>
        <span
          className="truncate pretendard-16SemiBold text-[#364152]"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml({ html: formatHtmlText({ text: item.title || '-' }) }),
          }}
        />
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
                {renderFieldValue(field.key) || '-'}
              </span>
            </li>
          )
        })}
      </ol>
    </li>
  )
}
