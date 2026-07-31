import { useState } from 'react'

import { env } from '@/config/env'
import type { BoardPostDetail } from '@/features/board/types/detail'
import { ModalImageViewer } from '@/shared/components/common/ModalImageViewer'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 게시글 본문 + 첨부 이미지. 레거시 `DetailPostContent.vue` 이식.
 *
 * ⚠️ **본문이 Quill Delta가 아니라 평문이다.** 줄바꿈만 `<br/>`로 바꾼다 —
 * 공지(B2·B4)와 렌더 경로가 완전히 다르다.
 *
 * ⚠️ 이미지 `alt`가 `` `${file.title} 이미지` ``인데 **응답에 `title`이 없을 수 있다.**
 * 그러면 `undefined 이미지`가 된다 — 레거시 그대로 두고 서버 확인 대상으로 남긴다
 * (`board.md` BD-Q10).
 */
export const DetailPostContent = ({ postData }: { postData: BoardPostDetail }) => {
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null)

  return (
    <>
      <div
        className="mb-3 pretendard-15Regular break-words text-defaults-primary-text-primary"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml({ html: formatHtmlText({ text: postData.content ?? '' }) }),
        }}
      />

      <ul className="flex flex-col gap-2">
        {postData.fileList?.map((file) => {
          const imageUrl = `${env.VITE_S3_BUCKET_URL_FILE}${file.fileUrl ?? ''}`

          return (
            <li key={file.fileUuid}>
              <button
                type="button"
                className="block w-full"
                onClick={() => {
                  setViewerImageUrl(imageUrl)
                }}
              >
                <img
                  className="w-full rounded-md border border-defaults-secondary-border-secondary"
                  src={imageUrl}
                  alt={`${String(file.title)} 이미지`}
                />
              </button>
            </li>
          )
        })}
      </ul>

      <ModalImageViewer
        open={viewerImageUrl !== null}
        imageUrl={viewerImageUrl ?? ''}
        onClose={() => {
          setViewerImageUrl(null)
        }}
      />
    </>
  )
}
