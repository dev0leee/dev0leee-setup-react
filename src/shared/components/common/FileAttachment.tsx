import { env } from '@/config/env'
import { nativeSaveFile } from '@/shared/lib/native/common'
import type { AttachedFile } from '@/shared/types/file'
import { decodeUrl } from '@/shared/utils/decodeUrl'

/**
 * 첨부파일 다운로드 버튼. 레거시 `FileAttachment.vue`.
 *
 * 파일명은 서버에서 URL 인코딩 + HTML 엔티티가 섞여 오므로 `decodeUrl`로 벗긴다.
 * 저장은 웹이 직접 하지 않고 **네이티브에 맡긴다** — 웹뷰에서 다운로드가 막히기 때문이다.
 */
export const FileAttachment = ({ fileInfo }: { fileInfo: AttachedFile }) => {
  const s3UrlFile = env.VITE_S3_BUCKET_URL_FILE
  const fileName = decodeUrl({ url: fileInfo.fileName })

  return (
    <button
      className="relative flex w-full flex-col items-start gap-[10px] self-stretch rounded-lg border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-mono px-[14px] py-[10px]"
      type="button"
      onClick={() => {
        nativeSaveFile({
          fileName: fileName ?? '',
          fileUrl: `${s3UrlFile}${fileInfo.fileUrl}`,
        })
      }}
    >
      <div className="flex flex-col items-start gap-2 self-stretch">
        <div className="flex items-center gap-1">
          <img className="h-4 w-4" src="/assets/icons/File.svg" alt="파일 아이콘" />
          <span className="pretendard-12SemiBold text-defaults-secondary-text-secondary">
            첨부파일
          </span>
        </div>
        <div className="flex items-end justify-between self-stretch pr-6 pretendard-14Regular text-defaults-primary-text-primary">
          <p className="text-left">{fileName}</p>
          <img
            src="/assets/icons/FileDownload.svg"
            alt="파일 아이콘"
            className="absolute top-1/2 right-[14px] h-5 w-5 -translate-y-1/2"
          />
        </div>
      </div>
    </button>
  )
}
