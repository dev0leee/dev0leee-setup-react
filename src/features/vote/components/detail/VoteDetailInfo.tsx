import {
  DETAIL_PAGE_INFO_FIELD,
  VOTE_MESSAGE,
  VOTE_TYPE,
  VOTER_STATUS,
} from '@/features/vote/constants/vote'
import type { VoteDetailInfo as VoteDetailInfoData } from '@/features/vote/types/vote'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { convertDeltaToHtml } from '@/shared/lib/convertDeltaToHtml'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'

/**
 * `투표 정보` 탭 (VT2·VT7). 레거시 `Detail/VoteDetailInfo.vue`(88 LOC) 이식.
 *
 * ⚠️ **기간을 `replace('T', ' ')`로만 가공한다.** `formatIsoStringDate`를 안 써서
 * **초까지 그대로 보인다**(`2026-07-29 09:00:00`). 레거시 그대로다.
 *
 * ⚠️ **상세내용만 HTML(Quill Delta)이고 나머지는 텍스트다.**
 */
export const VoteDetailInfo = ({
  voteDetailInfo,
  isLoading,
}: {
  voteDetailInfo?: VoteDetailInfoData
  isLoading: boolean
}) => {
  const renderFieldValue = (key: (typeof DETAIL_PAGE_INFO_FIELD)[number]['key']) => {
    if (key === 'period') {
      return `${voteDetailInfo?.voteOpenDateTime?.replace('T', ' ')} ~ ${voteDetailInfo?.voteCloseDateTime?.replace('T', ' ')}`
    }

    if (key === 'joinState') return VOTER_STATUS[voteDetailInfo?.voterStatus ?? '']
    if (key === 'voteType') return VOTE_TYPE[voteDetailInfo?.voteType ?? '']

    return undefined
  }

  return (
    <div className="space-y-4 p-5 pb-14">
      <h3 className="pretendard-14SemiBold text-defaults-tertiary-text-tertiary">
        {VOTE_MESSAGE.infoTitle}
      </h3>
      <ol className="space-y-4 pb-5">
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
                          convertDeltaToHtml({ delta: voteDetailInfo?.content ?? undefined }) ?? '',
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
