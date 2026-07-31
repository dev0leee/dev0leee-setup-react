import {
  BoardHighlightedTitle,
  getHighlightedTitle,
} from '@/features/board/components/BoardHighlightedTitle'
import { NOTICE_TYPE, type NoticeListItem } from '@/features/board/types/notice'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { cn } from '@/shared/utils/cn'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 공지 목록 아이템 (B1). 레거시 `NoticeBoard/NoticeBoardItem.vue` 이식.
 *
 * ⚠️ 날짜 클래스가 레거시에선 **`leading-3.5`**인데 그런 유틸리티가 생성되지 않는다.
 * 렌더값과 같은 `leading-[14px]`로 옮겼다 (`broken-styles.md` §3 · B-Q4).
 */
export const NoticeBoardItem = ({
  boardInfo,
  searchKeyword,
  className,
  onSelect,
}: {
  boardInfo: NoticeListItem
  searchKeyword: string
  className?: string
  onSelect: (uuid: string) => void
}) => {
  const highlightedTitle = getHighlightedTitle({ title: boardInfo.title, searchKeyword })

  // 검색어가 제목에 없으면 아이템 자체를 그리지 않는다 (레거시 `v-if`)
  if (highlightedTitle === undefined) return null

  return (
    <li
      className={cn('flex flex-col items-start gap-3 self-stretch p-5 pb-6', className)}
      onClick={() => {
        onSelect(boardInfo.uuid)
      }}
    >
      <div className="flex gap-3">
        <div className="flex gap-1">
          {boardInfo.noticeType === NOTICE_TYPE.IMPORTANT && (
            <ChipBase color="red" variant="fill">
              필독
            </ChipBase>
          )}
          <ChipBase color="deepPurple" variant="fill">
            {boardInfo.categoryName}
          </ChipBase>
        </div>
        <span className="pretendard-14Regular leading-[14px] text-defaults-tertiary-text-tertiary">
          {formatIsoStringDate({ dateTimeString: boardInfo.createdDate }).date()}
        </span>
      </div>

      <p className="h-[150%] w-full overflow-hidden pretendard-16SemiBold text-ellipsis whitespace-nowrap text-defaults-primary-text-primary">
        <BoardHighlightedTitle highlightedTitle={highlightedTitle} searchKeyword={searchKeyword} />
      </p>

      <div className="mt-2 flex items-center gap-1.5 self-stretch">
        <div className="flex items-center gap-[3px] pretendard-12Regular text-defaults-tertiary-text-tertiary">
          <img src="/assets/icons/Eye.svg" alt="조회 아이콘" className="h-[13px] w-[13px]" />
          <span>{boardInfo.viewCount}</span>
        </div>
      </div>
    </li>
  )
}
