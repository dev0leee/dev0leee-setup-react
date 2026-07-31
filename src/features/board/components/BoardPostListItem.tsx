import { env } from '@/config/env'
import {
  BoardHighlightedTitle,
  getHighlightedTitle,
} from '@/features/board/components/BoardHighlightedTitle'
import { BoardPostStatusChip } from '@/features/board/components/BoardPostStatusChip'
import { BOARD_TYPE, type BoardPostListItemData, type BoardType } from '@/features/board/types/post'
import { useKoreanTimeAgo } from '@/shared/hooks/useKoreanTimeAgo'
import { cn } from '@/shared/utils/cn'

/** 지표 한 칸 (조회·좋아요·댓글) — 아이콘 크기와 클래스가 셋 다 같다 */
const PostMetric = ({ icon, alt, count }: { icon: string; alt: string; count?: number }) => {
  return (
    <div className="flex items-center gap-[3px] pretendard-12Regular text-defaults-tertiary-text-tertiary">
      <img src={icon} alt={alt} className="h-[13px] w-[13px]" />
      <span>{count}</span>
    </div>
  )
}

/**
 * 게시글 카드. 레거시 `BoardPostListItem.vue` 이식 (B5·B12·B11·B18 공용).
 *
 * ⚠️ **레거시 `boardType`에는 `topThree`도 있다.** 메인 화면 전용이었는데 지금 메인은
 * 자체 컴포넌트를 쓰므로(`main.md`) 게시판에서 쓰는 두 종류만 받는다.
 * 그래서 `topThree` 분기(지표 숨김·상태 칩 위치 변경·썸네일 숨김)는 옮기지 않았다.
 *
 * ⚠️ 레거시 썸네일에 **`bg-bg-deep-blue`**가 붙어 있지만 그 유틸리티는 생성되지 않는다
 * (`broken-styles.md` §4). `<img>` 뒤 배경이라 보이지도 않아 **삭제했다** — 렌더 동일.
 */
export const BoardPostListItem = ({
  postItemData,
  boardType,
  searchKeyword,
  onSelect,
}: {
  postItemData: BoardPostListItemData
  boardType: BoardType
  searchKeyword: string
  onSelect: () => void
}) => {
  const koreanTimeAgo = useKoreanTimeAgo({ dateString: postItemData.createdDate })
  const highlightedTitle = getHighlightedTitle({ title: postItemData.title, searchKeyword })

  // 공지 목록과 달리 레거시에 `v-if` 가드가 없어 검색어 불일치도 그대로 그린다.
  // `undefined`면 제목만 비고 카드는 남는다.
  const isComplaints = boardType === BOARD_TYPE.COMPLAINTS

  return (
    <li
      className="flex h-fit items-center justify-center gap-5 self-stretch rounded-xl bg-base-b-white px-4 py-[14px] shadow-[2px_2px_8px_0px_rgba(19,30,59,0.12)]"
      onClick={onSelect}
    >
      <div className="flex h-full w-full flex-col justify-center gap-3 self-stretch overflow-hidden whitespace-nowrap">
        <div className="flex w-full items-center gap-1 self-stretch">
          {isComplaints && postItemData.status !== undefined && (
            <BoardPostStatusChip status={postItemData.status} />
          )}
          <div className="flex h-full w-full items-center gap-2.5">
            <span className="pretendard-14SemiBold text-defaults-secondary-text-secondary">
              {postItemData.categoryName}
            </span>
            <span className="pretendard-13Regular text-defaults-tertiary-text-tertiary">
              {koreanTimeAgo}
            </span>
          </div>
        </div>

        <div className="flex h-full w-full justify-between">
          <div className="flex gap-1">
            {postItemData.privateFlag === true && (
              <img src="/assets/icons/Lock.svg" alt="자물쇠 아이콘" className="h-[20px] w-[20px]" />
            )}
            <p
              className={cn(
                'h-[150%] overflow-hidden pretendard-16SemiBold text-ellipsis text-defaults-primary-text-primary',
                postItemData.privateFlag === true && 'pt-0.5',
              )}
            >
              {highlightedTitle !== undefined && (
                <BoardHighlightedTitle
                  highlightedTitle={highlightedTitle}
                  searchKeyword={searchKeyword}
                />
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-stretch">
          <PostMetric
            icon="/assets/icons/Eye.svg"
            alt="조회 아이콘"
            count={postItemData.viewCount}
          />
          <PostMetric
            icon="/assets/icons/ThumbsUpGray.svg"
            alt="좋아요 아이콘"
            count={postItemData.likeCount}
          />
          <PostMetric
            icon="/assets/icons/MessageSquare.svg"
            alt="댓글 아이콘"
            count={postItemData.commentCount}
          />
        </div>
      </div>

      {postItemData.thumbnailFileUrl !== undefined && (
        <img
          // `flex items-center justify-center`는 `<img>`에 의미가 없지만 레거시 그대로 둔다.
          // 뺀 것은 CSS를 생성하지 않는 `bg-bg-deep-blue` 하나뿐이다.
          className="flex h-16 min-h-16 w-16 min-w-16 items-center justify-center rounded-md border border-defaults-tertiary-border-tertiary object-cover"
          src={`${env.VITE_S3_BUCKET_URL_FILE}${postItemData.thumbnailFileUrl}`}
          alt={`${postItemData.title ?? ''} 썸네일 이미지`}
        />
      )}
    </li>
  )
}
