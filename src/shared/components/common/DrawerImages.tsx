import { env } from '@/config/env'
import { DrawerBase } from '@/shared/components/common/DrawerBase'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import type { DrawerImagesProps } from '@/shared/types/overlay'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 첨부 이미지 바텀시트. 레거시 `DrawerImages.vue`.
 *
 * 제목에 줄바꿈이 섞여 올 수 있어 `formatHtmlText`로 `<br/>`로 바꾸고
 * 살균해서 HTML로 렌더한다 — 레거시가 `formatHtmlText(title)`을 `DrawerBase`의
 * `title` prop으로 넘겼는데, Vue는 그것을 텍스트로 그렸으므로 `<br/>`이 글자로
 * 보였을 가능성이 있다. 여기서는 **HTML로 렌더해 의도대로 줄바꿈이 되게** 했다.
 */
export const DrawerImages = ({ open, onClose, title, images }: DrawerImagesProps) => {
  const s3UrlFile = env.VITE_S3_BUCKET_URL_FILE

  return (
    <DrawerBase open={open} onClose={onClose} hasCloseButton>
      <div className="flex h-7 w-full items-center justify-between gap-4 py-2 pr-5 pl-[30px] pretendard-18Bold text-defaults-primary-text-primary">
        <span
          className="truncate"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml({ html: formatHtmlText({ text: title }) }),
          }}
        />
      </div>
      <div className="h-full w-full pt-2.5">
        <div className="max-h-[80vh] min-h-72 w-full overflow-auto p-4">
          <ul className="flex flex-col gap-3">
            {images.map((file) => {
              return (
                <li key={file.fileUuid}>
                  <img
                    className="w-full"
                    src={`${s3UrlFile}${file.fileUrl}`}
                    alt={`${file.fileName} 이미지`}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </DrawerBase>
  )
}
