import { useParams } from 'react-router-dom'

import { BoardDetailContent } from '@/features/board/components/BoardDetailContent'
import { EMPTY_CONTENT_TEXT } from '@/features/board/constants/board'
import { useNoticeDetail } from '@/features/board/queries/useNoticeDetail'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { FileAttachment } from '@/shared/components/common/FileAttachment'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { convertDeltaToHtml } from '@/shared/lib/convertDeltaToHtml'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 공지사항 상세 (B2). 레거시 `NoticeBoard/NoticeDetailView.vue` 이식.
 *
 * ⚠️ **제목도 Quill Delta다.** 본문과 똑같이 변환해 HTML로 렌더한다.
 * 아파트먼트 공지(B4)는 제목이 평문이라 이 처리를 하지 않는다 — 두 화면의 차이다.
 *
 * ⚠️ **네이티브 푸시 딥링크의 도착지**다. `/board/notice/detail/{uuid}`로 바로 들어온다.
 *
 * 레거시는 `watch`로 변환 결과를 ref에 담지만, 변환은 **입력만으로 결정되는 순수 계산**이라
 * 렌더 중에 구한다 (`06-react.md`).
 */
export const NoticeDetailPage = () => {
  const { noticeUuid } = useParams()
  const { noticeDetail, isNoticeDetailLoading } = useNoticeDetail({ noticeUuid })

  const htmlTitle = convertDeltaToHtml({ delta: noticeDetail?.title }) ?? EMPTY_CONTENT_TEXT
  const htmlContent = convertDeltaToHtml({ delta: noticeDetail?.content }) ?? EMPTY_CONTENT_TEXT

  return (
    <div className="h-full">
      <div className="h-full w-full space-y-5 overflow-auto p-5">
        <header className="flex w-full flex-col items-start gap-3 self-stretch border-b border-b-defaults-tertiary-border-tertiary pb-5">
          <div className="flex items-center justify-between self-stretch">
            <div className="flex gap-2">
              <ChipBase color="deepPurple" variant="fill">
                {noticeDetail?.categoryName}
              </ChipBase>
              <div className="flex items-center gap-1.5 pretendard-13Regular text-defaults-secondary-text-secondary">
                <span>조회</span>
                <span>{noticeDetail?.viewCount ?? 0}</span>
              </div>
            </div>
            <span className="pretendard-14Regular text-defaults-tertiary-text-tertiary">
              {formatIsoStringDate({ dateTimeString: noticeDetail?.createdDate }).date()}
            </span>
          </div>

          <h2
            className="pretendard-18Bold text-defaults-primary-text-primary"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml({ html: htmlTitle }) }}
          />
        </header>

        {isNoticeDetailLoading ? (
          <SpinnerDots />
        ) : (
          <article className="space-y-4">
            {noticeDetail?.fileList?.map((file) => {
              return <FileAttachment key={file.fileUuid} fileInfo={file} />
            })}
            <BoardDetailContent html={htmlContent} hasQuillWrapper />
          </article>
        )}
      </div>
    </div>
  )
}
