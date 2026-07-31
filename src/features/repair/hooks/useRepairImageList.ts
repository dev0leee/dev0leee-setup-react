import { useEffect, useMemo, useState } from 'react'

import { env } from '@/config/env'
import { REPAIR_IMAGE_LIMIT, type RepairImageErrorType } from '@/features/repair/constants/repair'
import type { RepairFile } from '@/features/repair/types/repair'

/** 폼이 다루는 첨부 1개. 새로 고른 것은 `File`, 기존 것은 서버 객체다 */
export type RepairImage = File | RepairFile

/**
 * 첨부 목록 관리 (RP2·RP3). 레거시 `RepairFormImage.vue` + `lib/utils/validImage.js` 이식.
 *
 * ✅ **미리보기 blob URL을 정리한다.** 레거시는 `computed`가 재평가될 때마다
 * `URL.createObjectURL`로 새 URL을 만들고 `revoke`하지 않아 **메모리가 샜다**
 * (`repair.md` RP-Q11). 목록이 바뀔 때만 만들고 정리한다.
 *
 * ✅ **미리보기 key를 인덱스 기반으로 만든다.** 레거시는 `image.name`을 key로 썼는데
 * 서버에서 온 기존 이미지에는 `name`이 없어 **2장 이상이면 key가 중복**됐다.
 *
 * ⚠️ **검증은 첫 위반에서 즉시 중단한다** — 그 전까지 통과한 파일도 담기지 않는다.
 * 게시판 폼과 같은 규칙이다 (`board.md` §3-4).
 */
export const useRepairImageList = () => {
  const [imageList, setImageList] = useState<RepairImage[]>([])

  const previewImageList = useMemo(() => {
    return imageList.map((image, index) => {
      return {
        key: image instanceof File ? `${image.name}-${index}` : `${image.fileUuid}-${index}`,
        url:
          image instanceof File
            ? URL.createObjectURL(image)
            : `${env.VITE_S3_BUCKET_URL_FILE}${image.fileUrl}`,
      }
    })
  }, [imageList])

  useEffect(() => {
    const createdUrls = previewImageList
      .filter((_, index) => {
        return imageList[index] instanceof File
      })
      .map((preview) => {
        return preview.url
      })

    return () => {
      createdUrls.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageList])

  const addImages = ({
    event,
    onError,
  }: {
    event: React.ChangeEvent<HTMLInputElement>
    onError: (errorType: RepairImageErrorType) => void
  }) => {
    const input = event.target
    const selected = Array.from(input.files ?? [])
    const remainingSlots = REPAIR_IMAGE_LIMIT.MAX_COUNT - imageList.length

    if (remainingSlots <= 0) {
      onError('countLimit')
      input.value = ''
      return
    }

    const targetFiles = selected.slice(0, remainingSlots)

    for (const file of targetFiles) {
      if (
        !(REPAIR_IMAGE_LIMIT.ALLOWED_TYPES as readonly string[]).includes(file.type.toLowerCase())
      ) {
        onError('fileTypeLimit')
        input.value = ''
        return
      }
      if (file.size > REPAIR_IMAGE_LIMIT.MAX_SIZE) {
        onError('sizeLimit')
        input.value = ''
        return
      }
    }

    if (selected.length > remainingSlots) onError('countLimit')

    setImageList((prev) => {
      return [...prev, ...targetFiles]
    })
    input.value = ''
  }

  const removeImage = (index: number) => {
    setImageList((prev) => {
      return prev.filter((_, itemIndex) => {
        return itemIndex !== index
      })
    })
  }

  return { imageList, setImageList, previewImageList, addImages, removeImage }
}
