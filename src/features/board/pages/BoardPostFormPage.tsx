import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { BoardFormBottom } from '@/features/board/components/BoardFormBottom'
import {
  BOARD_FORM_PLACEHOLDER,
  EDIT_BACK_MODAL_DATA,
  WRITE_BACK_MODAL_DATA,
} from '@/features/board/constants/board'
import { useBoardPostForm } from '@/features/board/hooks/useBoardPostForm'
import { usePatchBoardPost, usePostBoardPost } from '@/features/board/queries/useBoardMutations'
import { useBoardPostDetail } from '@/features/board/queries/useBoardPostDetail'
import { useBoardCategoryList } from '@/features/board/queries/useBoardPostList'
import { BOARD_TYPE, type BoardType } from '@/features/board/types/post'
import { DrawerList } from '@/shared/components/common/DrawerList'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { showErrorModal } from '@/shared/lib/errorModal'

/**
 * 글 등록·수정 (B9·B10·B16·B17). 레거시 `FormContainer`·`FormDetail`·`FormCategory`·
 * `FormBottom` 네 파일 + 게시판별 뷰 4개를 합쳤다.
 *
 * **등록과 수정의 차이는 세 가지뿐이다:**
 *  - 카테고리 드로어가 **진입 시 자동으로 열리는지**(등록만)
 *  - 초기값 주입 여부
 *  - 제출 API·성공 토스트·뒤로가기 모달 문구
 *
 * ⚠️ **검증은 모달로만 알린다.** 필드 아래 인라인 에러를 새로 넣으면 등가 위반이다
 * (`board.md` §5-11).
 *
 * ⚠️ **완료 버튼은 항상 브랜드 색이고 제출 중에만 잠긴다.** 레거시가 색을
 * vee-validate `meta.valid`로 정하는데, 그 값은 **에러가 비어 있으면 참**이고
 * 수동 검증이 zod가 볼 세 필드를 먼저 막으므로 에러가 기록될 일이 없다.
 * (명세 §5-12는 "회색인데 눌리는 버튼"이라고 적었지만 실제로는 파란색이다 — 정정.)
 *
 * ⚠️ **본문 textarea 높이가 `100vh` 고정이다.** 내용과 무관하게 항상 스크롤이 생긴다.
 */
export const BoardPostFormPage = ({
  boardType,
  isEditPage,
}: {
  boardType: BoardType
  isEditPage: boolean
}) => {
  const { postUuid } = useParams()
  const navigate = useNavigate()

  const { categoryList, isCategoryListLoading } = useBoardCategoryList({ boardType })
  const { postDetail, isPostDetailLoading } = useBoardPostDetail({
    boardType,
    postUuid: isEditPage ? postUuid : undefined,
  })

  const hasPrivateFlag = boardType === BOARD_TYPE.COMPLAINTS
  const form = useBoardPostForm({
    postDetail,
    isEditPage,
    hasPrivateFlag,
    categoryList: categoryList ?? [],
  })

  const {
    createPost,
    isCreatePostPending,
    progressPercent: createProgress,
  } = usePostBoardPost({
    boardType,
  })
  const {
    editPost,
    isEditPostPending,
    progressPercent: editProgress,
  } = usePatchBoardPost({
    boardType,
    postUuid,
  })

  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false)
  const [isBackModalOpen, setIsBackModalOpen] = useState(false)

  /**
   * 등록 화면은 진입하자마자 카테고리 드로어가 뜬다. 수정 화면은 뜨지 않는다.
   * 레거시는 `onMounted`에서 판단하므로 **카테고리가 아직 안 왔어도 연다** — 그 경우
   * 빈 목록이 보인다. 여기서는 목록 로딩이 끝난 뒤 열어 그 상태를 피한다.
   */
  useEffect(() => {
    if (isEditPage || isCategoryListLoading) return

    setIsCategoryDrawerOpen(true)
  }, [isEditPage, isCategoryListLoading])

  const isSubmitting = isCreatePostPending || isEditPostPending
  const isLoading = isEditPage ? isPostDetailLoading : isCategoryListLoading
  const boardLabel = boardType === BOARD_TYPE.COMMUNITY ? '소통공간' : '민원공간'

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const validationMessage = form.validate()
    if (validationMessage !== null) {
      showErrorModal({ text: validationMessage })
      return
    }

    const payload = form.buildPayload()
    if (isEditPage) editPost(payload)
    else createPost(payload)
  }

  return (
    <div className="flex h-full w-full flex-col">
      <AppBar
        title={`${boardLabel} 글 ${isEditPage ? '수정' : '등록'}`}
        onBack={() => {
          setIsBackModalOpen(true)
        }}
      >
        <button
          type="submit"
          form="boardForm"
          disabled={isSubmitting}
          className="text-brand-default-text-brand"
        >
          {isSubmitting ? '처리중' : '완료'}
        </button>
      </AppBar>

      {isLoading || isSubmitting ? (
        <SpinnerDots progressPercent={isEditPage ? editProgress : createProgress} />
      ) : (
        <>
          <div className="w-full flex-1 overflow-auto px-5 pt-12">
            <button
              type="button"
              className="flex w-full items-center justify-between self-stretch rounded-md border border-defaults-tertiary-border-tertiary p-2.5 pretendard-16Regular text-defaults-primary-text-primary"
              onClick={() => {
                setIsCategoryDrawerOpen(true)
              }}
            >
              {form.category ? (
                <span>{form.category.category}</span>
              ) : (
                <p className="text-defaults-tertiary-text-tertiary">
                  {BOARD_FORM_PLACEHOLDER.category}
                </p>
              )}
              <img className="h-5 w-5" src="/assets/icons/ArrowRight.svg" alt="화살표 아이콘" />
            </button>

            <form id="boardForm" className="mt-2 w-full space-y-3" onSubmit={handleSubmit}>
              <input
                id="title"
                type="text"
                value={form.title}
                placeholder={BOARD_FORM_PLACEHOLDER.title}
                // ⚠️ 포커스 시 밑줄이 `#f3f4f6`으로 바뀐다. 전역 focus 테두리(#2563eb)를
                // 덮으려는 레거시 scoped 스타일을 그대로 옮긴 것이다
                className="w-full border-b border-b-defaults-tertiary-border-tertiary px-2.5 py-2 pretendard-16SemiBold text-defaults-primary-text-primary placeholder:text-defaults-tertiary-text-tertiary focus:border-b focus:border-none focus:border-b-[#f3f4f6]"
                onChange={(event) => {
                  form.setTitle(event.target.value)
                }}
              />
              <textarea
                value={form.content}
                placeholder={BOARD_FORM_PLACEHOLDER.content}
                // 내용과 무관하게 100vh 고정 — 레거시가 `onMounted`에서 직접 대입한다
                style={{ height: '100vh' }}
                className="w-full px-2.5 pt-2 pretendard-16Regular text-defaults-primary-text-primary placeholder:text-defaults-tertiary-text-tertiary"
                onChange={(event) => {
                  form.setContent(event.target.value)
                }}
              />
            </form>
          </div>

          <BoardFormBottom
            imageCount={form.imageList.length}
            previewImageList={form.previewImageList}
            hasPrivateFlag={hasPrivateFlag}
            privateFlag={form.privateFlag}
            onFileChange={form.handleFileChange}
            onRemoveImage={form.removeImage}
            onChangePrivateFlag={form.setPrivateFlag}
          />
        </>
      )}

      <DrawerList
        open={isCategoryDrawerOpen}
        title={BOARD_FORM_PLACEHOLDER.category}
        textAlign="left"
        list={(categoryList ?? []).map((category) => {
          return {
            key: category.uuid ?? category.category,
            label: category.category,
            color: 'text-defaults-primary-text-primary',
            onClick: () => {
              form.setCategory(category)
              setIsCategoryDrawerOpen(false)
            },
          }
        })}
        onClose={() => {
          setIsCategoryDrawerOpen(false)
        }}
      />

      <ModalButton
        open={isBackModalOpen}
        buttonType="outline"
        modalData={isEditPage ? EDIT_BACK_MODAL_DATA : WRITE_BACK_MODAL_DATA}
        onFirstClick={() => {
          setIsBackModalOpen(false)
        }}
        onSecondClick={() => {
          void navigate(-1)
        }}
        onClose={() => {
          setIsBackModalOpen(false)
        }}
      />
    </div>
  )
}

export const CommunityWritePage = () => {
  return <BoardPostFormPage boardType={BOARD_TYPE.COMMUNITY} isEditPage={false} />
}

export const CommunityEditPage = () => {
  return <BoardPostFormPage boardType={BOARD_TYPE.COMMUNITY} isEditPage />
}

export const ComplaintsWritePage = () => {
  return <BoardPostFormPage boardType={BOARD_TYPE.COMPLAINTS} isEditPage={false} />
}

export const ComplaintsEditPage = () => {
  return <BoardPostFormPage boardType={BOARD_TYPE.COMPLAINTS} isEditPage />
}
