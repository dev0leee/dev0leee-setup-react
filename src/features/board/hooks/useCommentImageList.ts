import { useEffect, useRef, useState } from 'react'

import { env } from '@/config/env'
import { type BoardImageErrorType, COMMENT_IMAGE_LIMIT } from '@/features/board/constants/board'
import type { BoardAttachedImage } from '@/features/board/types/detail'

/** 첨부 목록 항목 — 새로 고른 파일이거나 이미 올라가 있던 이미지다 */
type CommentImage = File | BoardAttachedImage

export interface CommentImagePreview {
  url: string
  key: string
}

const isAllowedType = (file: File) => {
  return (COMMENT_IMAGE_LIMIT.ALLOWED_TYPES as readonly string[]).includes(file.type.toLowerCase())
}

/**
 * 댓글 이미지 첨부. 레거시 `lib/composables/useCommentImageList.js` 이식.
 *
 * **신규 `File`과 기존 이미지를 한 배열에 섞어 보관한다** — 수정 화면에서 기존 이미지를
 * 지우고 새 이미지를 더하는 조작이 한 목록에서 일어나기 때문이다. 제출할 때
 * `convertFormDataFile`이 둘을 구분해 보낸다.
 *
 * ⚠️ **검증 순서가 정해져 있다**: 슬롯 없음 → 타입 → 크기. 순서를 바꾸면 사용자가 보는
 * 안내 문구가 달라진다.
 *
 * ⚠️ **남은 슬롯보다 많이 고르면 앞에서부터 잘라 담고 `countLimit` 안내를 함께 띄운다** —
 * 통째로 거부하지 않는다.
 *
 * ⚠️ 제약이 게시글 폼과 다르다 — 크기 상한이 10,485,760 B(폼은 10,000,000 B)이고
 * **gif를 받지 않는다**(폼은 받는다). `board.md` §3-4.
 */
export const useCommentImageList = () => {
  const [imageList, setImageList] = useState<CommentImage[]>([])

  /**
   * `File` → objectURL 캐시. 같은 파일에 같은 URL을 재사용하고 쓰지 않게 된 것은 해제한다.
   * ref에 두는 이유는 **렌더와 무관한 브라우저 자원**이기 때문이다.
   */
  const urlCacheRef = useRef(new Map<File, string>())

  const previewImageList: CommentImagePreview[] = imageList.map((image, index) => {
    if (image instanceof File) {
      const cache = urlCacheRef.current
      const cached = cache.get(image) ?? URL.createObjectURL(image)
      cache.set(image, cached)

      return { url: cached, key: `${image.name}-${String(index)}` }
    }

    return {
      url: `${env.VITE_S3_BUCKET_URL_FILE}${image.fileUrl ?? ''}`,
      key: image.fileUuid ?? '',
    }
  })

  // 목록에서 빠진 파일의 objectURL을 해제한다. 렌더 중에 하면 방금 만든 URL을 지울 수 있다.
  useEffect(() => {
    const activeFiles = new Set(
      imageList.filter((image): image is File => {
        return image instanceof File
      }),
    )
    const cache = urlCacheRef.current

    cache.forEach((url, file) => {
      if (activeFiles.has(file)) return

      URL.revokeObjectURL(url)
      cache.delete(file)
    })
  }, [imageList])

  // 언마운트 시 남은 것을 일괄 정리한다
  useEffect(() => {
    const cache = urlCacheRef.current

    return () => {
      cache.forEach((url) => {
        URL.revokeObjectURL(url)
      })
      cache.clear()
    }
  }, [])

  /**
   * `<input type="file" multiple>`의 change 핸들러.
   * 매번 `value`를 비워 **같은 파일을 다시 고를 수 있게** 한다.
   */
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    onError: (errorType: BoardImageErrorType) => void,
  ) => {
    const input = event.target
    const selected = Array.from(input.files ?? [])
    const remainingSlots = COMMENT_IMAGE_LIMIT.MAX_COUNT - imageList.length

    const fail = (errorType: BoardImageErrorType) => {
      onError(errorType)
      input.value = ''
    }

    if (remainingSlots <= 0) {
      fail('countLimit')
      return
    }

    const targetFiles = selected.slice(0, remainingSlots)

    if (!targetFiles.every(isAllowedType)) {
      fail('fileTypeLimit')
      return
    }
    if (
      !targetFiles.every((file) => {
        return file.size <= COMMENT_IMAGE_LIMIT.MAX_SIZE
      })
    ) {
      fail('sizeLimit')
      return
    }

    // 슬롯을 넘겨 잘린 경우에도 담기는 담고 안내만 덧붙인다
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

  return {
    imageList,
    previewImageList,
    handleFileChange,
    removeImage,
    clearImages: () => {
      setImageList([])
    },
    /** 수정 화면에서 기존 이미지를 주입한다 */
    setImageList,
  }
}
