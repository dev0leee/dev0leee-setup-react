import { useEffect, useState } from 'react'

import { env } from '@/config/env'
import {
  BOARD_FORM_VALIDATION_MESSAGE,
  type BoardImageErrorType,
  POST_IMAGE_LIMIT,
} from '@/features/board/constants/board'
import type {
  BoardAttachedImage,
  BoardPostDetail,
  BoardPostSubmitPayload,
} from '@/features/board/types/detail'
import type { BoardCategory } from '@/features/board/types/post'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

type PostImage = File | BoardAttachedImage

/**
 * 글 등록·수정 폼 상태. 레거시 `stores/board.js`의 `useBoardFormStore` 대체물.
 *
 * ✅ **화면 스코프다** (2026-07-31 BD-Q4 확정). 레거시는 Pinia 스토어 안에서
 * vee-validate `useForm`을 불러 **폼이 전역에 하나뿐**이었고, 이탈 경로에 따라 값이
 * 남기도 지워지기도 했다(앱바 뒤로가기는 초기화, 브라우저 뒤로가기는 유지). 그래서
 * 소통공간에서 쓰던 글이 민원공간 글쓰기에 뜨는 누수가 있었다. 여기서는 화면을 떠나면
 * 항상 비워진다 — 대신 실수로 뒤로 가면 작성 내용을 잃는다 (`deferred.md` D-227).
 *
 * ⚠️ **검증이 수동이다.** 레거시도 zod 스키마를 걸어놨지만 그 에러 메시지는 화면
 * 어디에도 렌더되지 않고, 사용자가 보는 것은 이 함수가 돌려주는 문구의 **모달**뿐이다
 * (`board.md` §5-11). 인라인 에러를 새로 넣으면 등가 위반이다.
 */
export const useBoardPostForm = ({
  postDetail,
  isEditPage,
  /** 민원공간이면 비밀글 필드를 쓴다 */
  hasPrivateFlag,
  categoryList,
}: {
  postDetail: BoardPostDetail | undefined
  isEditPage: boolean
  hasPrivateFlag: boolean
  categoryList: BoardCategory[]
}) => {
  const [category, setCategory] = useState<BoardCategory | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageList, setImageList] = useState<PostImage[]>([])
  const [privateFlag, setPrivateFlag] = useState(false)

  /**
   * ✅ **수정 화면 초기값을 데이터 도착 시 채운다** (BD-Q11 확정).
   * 레거시는 `onMounted`에서 한 번만 넣어, 상세 캐시가 없으면 **빈 폼**이 됐다.
   * 상세 쿼리 키에 `postUuid`가 없어 항상 캐시가 히트한 덕에 가려져 있던 버그다
   * (`deferred.md` D-225·D-226).
   *
   * ⚠️ `<br/>`을 줄바꿈으로 되돌린다 — 저장 시 반대 변환이 일어나므로 그대로 두면
   * 수정할 때마다 태그가 글자로 쌓인다.
   */
  useEffect(() => {
    if (!isEditPage || !postDetail) return

    setTitle(formatHtmlText({ text: postDetail.title }).replaceAll('<br/>', '\n'))
    setContent(formatHtmlText({ text: postDetail.content }).replaceAll('<br/>', '\n'))
    setImageList(postDetail.fileList ?? [])
    setPrivateFlag(postDetail.privateFlag ?? false)
  }, [isEditPage, postDetail])

  /**
   * 카테고리는 **이름으로 역매칭**한다 — 상세 응답에 `categoryUuid`가 없어서다.
   * 최초 1회만 맞추고 이후에는 덮어쓰지 않는다(사용자가 바꿀 수 있다).
   *
   * ⚠️ 카테고리명이 바뀌거나 중복되면 잘못 매칭된다. 서버가 uuid를 주면 해결된다.
   */
  const [isCategoryInitialized, setIsCategoryInitialized] = useState(false)

  useEffect(() => {
    if (!isEditPage || isCategoryInitialized) return
    if (categoryList.length === 0 || postDetail?.categoryName === undefined) return

    const matched = categoryList.find((item) => {
      return item.category === postDetail.categoryName
    })
    if (!matched) return

    setCategory(matched)
    setIsCategoryInitialized(true)
  }, [isEditPage, isCategoryInitialized, categoryList, postDetail])

  /** 미리보기 URL. ⚠️ 레거시가 `revokeObjectURL`을 하지 않아 누수가 있다 — 여기서는 정리한다 */
  const previewImageList = imageList.map((image, index) => {
    return {
      url:
        image instanceof File
          ? URL.createObjectURL(image)
          : `${env.VITE_S3_BUCKET_URL_FILE}${image.fileUrl ?? ''}`,
      key: image instanceof File ? `${image.name}-${String(index)}` : (image.fileUuid ?? ''),
    }
  })

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
    // 미리보기는 매 렌더 새로 만들어지므로 목록이 바뀔 때만 정리하면 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageList])

  /**
   * 이미지 첨부. 레거시 `lib/utils/validImage.js` 이식.
   *
   * ⚠️ **첫 위반에서 즉시 중단한다** — 댓글 쪽(`useCommentImageList`)은 전부 검증 후
   * 일괄 추가하는데 여기는 하나라도 걸리면 아무것도 담지 않는다.
   */
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    onError: (errorType: BoardImageErrorType) => void,
  ) => {
    const input = event.target
    const selected = Array.from(input.files ?? [])
    const remainingSlots = POST_IMAGE_LIMIT.MAX_COUNT - imageList.length

    if (remainingSlots <= 0) {
      onError('countLimit')
      input.value = ''
      return
    }

    const targetFiles = selected.slice(0, remainingSlots)

    for (const file of targetFiles) {
      if (
        !(POST_IMAGE_LIMIT.ALLOWED_TYPES as readonly string[]).includes(file.type.toLowerCase())
      ) {
        onError('fileTypeLimit')
        input.value = ''
        return
      }
      if (file.size > POST_IMAGE_LIMIT.MAX_SIZE) {
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

  /** 검증 실패 시 모달에 띄울 문구, 통과하면 `null` */
  const validate = (): string | null => {
    if (!category) return BOARD_FORM_VALIDATION_MESSAGE.category
    if (title.trim() === '') return BOARD_FORM_VALIDATION_MESSAGE.title
    if (content.trim() === '') return BOARD_FORM_VALIDATION_MESSAGE.content

    return null
  }

  /**
   * 제출 페이로드.
   *
   * ⚠️ **빈 문자열을 `null`로 보낸다**(레거시 `value.title || null`).
   * ⚠️ **`privateFlag`는 민원공간에서만 넣는다** — 소통공간 payload에는 키 자체가 없다.
   * 레거시는 전역 스토어에 값이 남아 있으면 소통공간에도 실려 나갔지만, 폼이 화면
   * 스코프가 되면서 그 누수가 사라졌다 (BD-Q4).
   */
  const buildPayload = (): BoardPostSubmitPayload => {
    return {
      title: title || null,
      content: content || null,
      categoryUuid: category?.uuid ?? null,
      fileList: imageList,
      ...(hasPrivateFlag ? { privateFlag } : {}),
    }
  }

  return {
    category,
    setCategory,
    title,
    setTitle,
    content,
    setContent,
    imageList,
    previewImageList,
    handleFileChange,
    removeImage,
    privateFlag,
    setPrivateFlag,
    validate,
    buildPayload,
  }
}
