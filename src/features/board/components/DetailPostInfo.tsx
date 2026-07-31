import { BoardPostStatusChip } from '@/features/board/components/BoardPostStatusChip'
import type { BoardPostDetail } from '@/features/board/types/detail'
import { useKoreanTimeAgo } from '@/shared/hooks/useKoreanTimeAgo'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 게시글 머리말 — 카테고리·제목·작성자·시간·조회수. 레거시 `DetailPostInfo.vue` 이식.
 *
 * ⚠️ **`authorText`의 쉼표를 전부 지운다.** 서버가 `홍길동,101동`처럼 보내므로
 * 화면에는 **`홍길동101동`으로 붙어 나온다.** 같은 값을 더보기 드로어는 `split(',')[0]`으로
 * 첫 조각만 쓴다 — 두 곳의 처리가 다르다 (`board.md` BD-Q9, 서버 확인 대상).
 *
 * ⚠️ 아바타 `alt`가 **`프로필 이미지 `**로 끝에 공백이 있다. 레거시 그대로다.
 */
export const DetailPostInfo = ({ postData }: { postData: BoardPostDetail }) => {
  const koreanTimeAgo = useKoreanTimeAgo({ dateString: postData.createdDate })
  const authorName = formatHtmlText({ text: postData.authorText?.replaceAll(',', '') })

  return (
    <div className="flex flex-col items-start gap-[13px] self-stretch">
      <div className="flex flex-col items-start justify-center gap-2 self-stretch">
        <div className="flex h-5 items-center gap-2 pretendard-14SemiBold text-defaults-secondary-text-secondary">
          <span>{postData.categoryName ?? '카테고리 없음'}</span>
          {/* 민원에만 있다 — 소통공간 응답에는 `status`가 없다 */}
          {postData.status !== undefined && <BoardPostStatusChip status={postData.status} />}
        </div>
        <span
          className="w-full pretendard-18Bold break-words text-defaults-primary-text-primary"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml({ html: formatHtmlText({ text: postData.title ?? '제목 없음' }) }),
          }}
        />
      </div>

      <div className="flex w-full items-center gap-1.5 border-b border-b-defaults-tertiary-border-tertiary pb-[18px]">
        <div className="flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full border border-defaults-tertiary-border-tertiary">
          <img
            className="h-[30px] w-[30px]"
            src="/assets/images/Profile.svg"
            alt="프로필 이미지 "
          />
        </div>
        <div className="flex flex-col items-start justify-center gap-1 pretendard-13Regular">
          <span className="font-semibold text-defaults-primary-text-primary">
            {authorName || '이름 없음'}
          </span>
          <div className="flex items-center gap-1.5 font-normal text-defaults-secondary-text-secondary">
            <span className="border-r border-r-defaults-tertiary-border-tertiary pr-1.5">
              {koreanTimeAgo || '시간 없음'}
            </span>
            <span>조회</span>
            <span>{postData.viewCount ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
