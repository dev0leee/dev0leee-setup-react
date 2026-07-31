import { STATUS_LIST } from '@/features/survey/constants/survey'
import { SURVEY_STATE, type SurveyDetailInfoData } from '@/features/survey/types/survey'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { calculateDday } from '@/shared/utils/calculateDday'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 상세 제목 영역 (SV2·SV9). 레거시 `Detail/SurveyDetailTitle.vue`(48 LOC) 이식.
 * 투표의 같은 컴포넌트와 마크업이 같고 필드 이름만 다르다.
 *
 * ⚠️ 죽은 마크업 2개(`center` 클래스, `opacity-0` span)는 옮기지 않았다 — 투표와 같다.
 */
export const SurveyDetailTitle = ({
  surveyDetailInfo,
}: {
  surveyDetailInfo?: SurveyDetailInfoData
}) => {
  const statusInfo = STATUS_LIST.find((status) => {
    return status.state === surveyDetailInfo?.state
  })

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-5">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center gap-1">
          <ChipBase color={statusInfo?.color}>{statusInfo?.label}</ChipBase>
          <span
            className="text-center pretendard-13Regular text-defaults-secondary-text-secondary"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml({
                html: formatHtmlText({ text: surveyDetailInfo?.groupName || '-' }),
              }),
            }}
          />
        </div>
        {surveyDetailInfo?.state === SURVEY_STATE.PENDING && (
          <span className="shrink-0 pretendard-13Regular text-defaults-tertiary-text-tertiary">
            {calculateDday({ targetDate: surveyDetailInfo.startDateTime ?? '' })}
          </span>
        )}
      </div>
      <h2
        className="text-center pretendard-18SemiBold text-[#364152]"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml({ html: formatHtmlText({ text: surveyDetailInfo?.title || '-' }) }),
        }}
      />
    </div>
  )
}
