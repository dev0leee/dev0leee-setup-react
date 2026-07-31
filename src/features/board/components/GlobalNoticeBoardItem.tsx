import {
  BoardHighlightedTitle,
  getHighlightedTitle,
} from '@/features/board/components/BoardHighlightedTitle'
import type { GlobalNoticeListItem } from '@/features/board/types/notice'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 아파트먼트 공지 목록 아이템 (B3). 레거시 `GlobalNoticeBoard/GlobalNoticeBoardItem.vue`.
 *
 * B1과 달리 **카드형**이다 — 흰 배경 + 둥근 모서리 + 그림자. 필독 칩도 조회수도 없다.
 * 그림자 값 `2px 2px 8px 0px rgba(19,30,59,0.12)`은 이 화면 고유값이다.
 */
export const GlobalNoticeBoardItem = ({
  boardInfo,
  searchKeyword,
  onSelect,
}: {
  boardInfo: GlobalNoticeListItem
  searchKeyword: string
  onSelect: (uuid: string) => void
}) => {
  const highlightedTitle = getHighlightedTitle({ title: boardInfo.title, searchKeyword })

  if (highlightedTitle === undefined) return null

  return (
    <li
      className="flex h-fit items-center justify-center gap-5 self-stretch rounded-xl bg-base-b-white px-4 py-[14px] shadow-[2px_2px_8px_0px_rgba(19,30,59,0.12)]"
      onClick={() => {
        onSelect(boardInfo.uuid)
      }}
    >
      <div className="flex h-full w-full flex-col justify-center gap-3 self-stretch overflow-hidden whitespace-nowrap">
        <div className="flex w-full items-center gap-1 self-stretch">
          <div className="flex h-full w-full items-center gap-2.5">
            <ChipBase color="deepPurple" variant="fill">
              {boardInfo.categoryName}
            </ChipBase>
            <span className="pretendard-13Regular text-defaults-tertiary-text-tertiary">
              {formatIsoStringDate({ dateTimeString: boardInfo.createdDate }).date()}
            </span>
          </div>
        </div>

        <div className="flex h-full w-full justify-between">
          <p className="h-[150%] overflow-hidden pretendard-16SemiBold text-ellipsis text-defaults-primary-text-primary">
            <BoardHighlightedTitle
              highlightedTitle={highlightedTitle}
              searchKeyword={searchKeyword}
            />
          </p>
        </div>
      </div>
    </li>
  )
}
