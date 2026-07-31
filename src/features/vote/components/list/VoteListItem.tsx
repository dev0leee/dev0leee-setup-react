import {
  LIST_ITEM_FIELD,
  STATE_LIST,
  VOTE_TYPE,
  VOTER_STATUS,
} from '@/features/vote/constants/vote'
import type { VoteListItemData } from '@/features/vote/types/vote'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 투표 카드 1개 (VT1). 레거시 `List/VoteListItem.vue`(96 LOC) 이식.
 *
 * 🔴 **D-day를 옮기지 않았다.** 레거시는 `info?.state === 'BEFORE'`일 때 그리는데
 * 서버 응답에 `state` 필드가 없고(있는 것은 `voteStatus`) 값도 `PENDING`이다.
 * **한 번도 렌더된 적이 없는 코드**다. 옮기면 목록에 없던 D-day가 새로 생긴다
 * (`vote.md` §7-2). 상세(VT2)의 D-day는 조건이 정확해서 그쪽은 보인다.
 *
 * ⚠️ **제목·그룹명이 HTML로 렌더된다** — 레거시 `v-dompurify-html`이다. 서버가 준 값에
 * `&amp;` 같은 엔티티가 섞여 있어 텍스트로 그리면 그대로 보인다.
 */
export const VoteListItem = ({
  item,
  onClick,
}: {
  item: VoteListItemData
  onClick: () => void
}) => {
  const statusInfo = STATE_LIST.find((state) => {
    return state.status === item.voteStatus
  })

  const renderFieldValue = (key: (typeof LIST_ITEM_FIELD)[number]['key']) => {
    if (key === 'openVoteDateTime' || key === 'closeVoteDateTime') {
      return formatIsoStringDate({ dateTimeString: item[key] }).dateTime()
    }

    if (key === 'voterStatus') return VOTER_STATUS[item.voterStatus ?? '']
    if (key === 'voteType') return VOTE_TYPE[item.voteType ?? '']

    return undefined
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
