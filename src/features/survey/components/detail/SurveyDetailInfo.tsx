import {
  DETAIL_PAGE_INFO_FIELD,
  PARTICIPANT_STATE_LABEL,
  SURVEY_MESSAGE,
} from '@/features/survey/constants/survey'
import type { SurveyDetailInfoData } from '@/features/survey/types/survey'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { convertDeltaToHtml } from '@/shared/lib/convertDeltaToHtml'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 설문 기본정보 3줄 (SV2·SV9). 레거시 `Detail/SurveyDetailInfo.vue`(84 LOC) 이식.
 *
 * ⚠️ **기간을 `formatIsoStringDate(...).dateTime()`으로 만든다** — 분까지만 보인다.
 * 투표의 같은 자리는 `replace('T',' ')`뿐이라 **초까지 보인다**(D-290). 같은 모양의
 * 화면 둘이 다른 정밀도로 시각을 보여준다.
 */
export const SurveyDetailInfo = ({
  surveyDetailInfo,
  isLoading,
}: {
  surveyDetailInfo?: SurveyDetailInfoData
  isLoading: boolean
}) => {
  const renderFieldValue = (key: (typeof DETAIL_PAGE_INFO_FIELD)[number]['key']) => {
    if (key === 'period') {
      return `${formatIsoStringDate({ dateTimeString: surveyDetailInfo?.startDateTime }).dateTime()} ~ ${formatIsoStringDate({ dateTimeString: surveyDetailInfo?.endDateTime }).dateTime()}`
    }

    return PARTICIPANT_STATE_LABEL[surveyDetailInfo?.respondentState ?? '']
  }

  return (
    <div className="space-y-4 p-5 pb-14">
      <h3 className="pretendard-14SemiBold text-defaults-tertiary-text-tertiary">
        {SURVEY_MESSAGE.infoTitle}
      </h3>
      <ol className="flex flex-col gap-4 pb-5">
        {DETAIL_PAGE_INFO_FIELD.map((field) => {
          return (
            <li key={field.key} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <img
                  src={`/assets/icons/${field.iconPath}.svg`}
                  alt={`${field.label} 아이콘`}
                  className="h-5 w-5"
                />
              </div>
              <div className="flex flex-col gap-3">
                <span className="flex h-8 items-center pretendard-14SemiBold text-defaults-secondary-text-secondary">
                  {field.label}
                </span>
                {isLoading ? (
                  <SkeletonBase className="h-5 w-full rounded-lg" />
                ) : field.key === 'content' ? (
                  <span
                    className="pr-8 pretendard-14Regular text-defaults-secondary-text-secondary"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml({
                        html:
                          convertDeltaToHtml({ delta: surveyDetailInfo?.content ?? undefined }) ??
                          '',
                      }),
                    }}
                  />
                ) : (
                  <span className="pretendard-14Regular text-defaults-secondary-text-secondary">
                    {renderFieldValue(field.key) || '-'}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
