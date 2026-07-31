import { STATE_LIST } from '@/features/vote/constants/vote'
import { VOTE_STATE, type VoteDetailInfo } from '@/features/vote/types/vote'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { calculateDday } from '@/shared/utils/calculateDday'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 상세 제목 영역 (VT2·VT7). 레거시 `Detail/VoteDetailTitle.vue`(50 LOC) 이식.
 *
 * ⚠️ **D-day는 시작 전(`PENDING`)에만 보인다.** 목록(VT1)의 같은 코드는 조건이 틀려
 * 한 번도 안 보이는데, 여기는 정확하다 (`vote.md` §7-2).
 *
 * ⚠️ 레거시의 죽은 마크업 2개를 옮기지 않았다 — 루트의 `center` 클래스(정의 없음)와
 * `<h2>` 안의 `<span class="opacity-0">`(`v-dompurify-html`이 innerHTML을 통째로
 * 덮어써 렌더되지 않는다). **화면 결과가 같다.**
 *
 * ⚠️ **`max-w-1/2`는 생성되지 않는 클래스다**(`broken-styles.md` §3). 고치면 그룹명이
 * 화면 절반에서 줄바꿈되어 **화면이 달라지므로** 렌더 결과를 유지하는 쪽을 택했다 —
 * 즉 폭 제한이 걸리지 않는 현 상태 그대로다.
 */
export const VoteDetailTitle = ({ voteDetailInfo }: { voteDetailInfo?: VoteDetailInfo }) => {
  const statusInfo = STATE_LIST.find((state) => {
    return state.status === voteDetailInfo?.voteStatus
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
                html: formatHtmlText({ text: voteDetailInfo?.voteGroupName || '-' }),
              }),
            }}
          />
        </div>
        {voteDetailInfo?.voteStatus === VOTE_STATE.PENDING && (
          <span className="shrink-0 pretendard-13Regular text-defaults-tertiary-text-tertiary">
            {calculateDday({ targetDate: voteDetailInfo.voteOpenDateTime ?? '' })}
          </span>
        )}
      </div>
      <h2
        className="text-center pretendard-18SemiBold text-[#364152]"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml({ html: formatHtmlText({ text: voteDetailInfo?.title || '-' }) }),
        }}
      />
    </div>
  )
}
