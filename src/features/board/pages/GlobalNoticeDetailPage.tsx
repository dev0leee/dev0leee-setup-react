import { useParams } from 'react-router-dom'

import { BoardDetailContent } from '@/features/board/components/BoardDetailContent'
import { EMPTY_CONTENT_TEXT } from '@/features/board/constants/board'
import { useGlobalNoticeDetail } from '@/features/board/queries/useNoticeDetail'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { FileAttachment } from '@/shared/components/common/FileAttachment'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { convertDeltaToHtml } from '@/shared/lib/convertDeltaToHtml'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 아파트먼트 공지사항 상세 (B4). 레거시 `GlobalNoticeBoard/GlobalNoticeDetailView.vue`.
 *
 * **B2와 세 군데가 다르다:**
 *
 * | 항목       | B2 (공지사항)              | B4 (아파트먼트 공지)                |
 * | ---------- | -------------------------- | ----------------------------------- |
 * | 제목       | Quill Delta → HTML         | **평문 그대로**                     |
 * | 첨부 필드  | `fileList` / `fileUrl`     | **`uploadFileList` / `filePath`**   |
 * | 본문 래퍼  | `<div class="ql-snow">` 있음 | **없음** — 서식이 달라 보인다      |
 * | 조회수     | 표시                       | **없음**                            |
 *
 * ⚠️ `ql-snow` 래퍼가 없는 것이 의도인지 확인이 필요하다 (`board.md` BD-Q6).
 * 확인 전까지는 레거시대로 래퍼 없이 렌더한다.
 */
export const GlobalNoticeDetailPage = () => {
  const { globalNoticeUuid } = useParams()
  const { globalNoticeDetail, isGlobalNoticeDetailLoading } = useGlobalNoticeDetail({
    globalNoticeUuid,
  })

  // 제목은 변환하지 않는다 — B2와 다른 점이다
  const title = globalNoticeDetail?.title ?? EMPTY_CONTENT_TEXT
  const htmlContent =
    convertDeltaToHtml({ delta: globalNoticeDetail?.content }) ?? EMPTY_CONTENT_TEXT

  return (
    <div className="h-full w-full space-y-5 overflow-auto p-5">
      <header className="flex w-full flex-col items-start gap-3 self-stretch border-b border-b-defaults-tertiary-border-tertiary pb-5">
        <div className="flex items-center justify-between self-stretch">
          <div className="flex gap-2">
            <ChipBase color="deepPurple" variant="fill">
              {globalNoticeDetail?.categoryName}
            </ChipBase>
          </div>
          <span className="pretendard-14Regular text-defaults-tertiary-text-tertiary">
            {formatIsoStringDate({ dateTimeString: globalNoticeDetail?.createdDate }).date()}
          </span>
        </div>

        <h2 className="pretendard-18Bold text-defaults-primary-text-primary">{title}</h2>
      </header>

      {isGlobalNoticeDetailLoading ? (
        <SpinnerDots />
      ) : (
        <article className="space-y-4">
          {globalNoticeDetail?.uploadFileList?.map((file) => {
            return (
              <FileAttachment
                key={file.uuid}
                // 필드 이름이 달라 `FileAttachment`가 아는 모양으로 바꿔 넘긴다
                fileInfo={{ fileUuid: file.uuid, fileName: file.fileName, fileUrl: file.filePath }}
              />
            )
          })}
          <BoardDetailContent html={htmlContent} hasQuillWrapper={false} />
        </article>
      )}
    </div>
  )
}
