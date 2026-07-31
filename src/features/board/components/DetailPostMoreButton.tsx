import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  complaintsNonEditableModalData,
  DETAIL_DELETE_MODAL_DATA,
  DETAIL_MORE_AUTHOR,
  DETAIL_MORE_VIEWER,
  detailBlockModalData,
} from '@/features/board/constants/board'
import { useBlockBoardUser } from '@/features/board/queries/useBoardMutations'
import type { BoardPostDetail } from '@/features/board/types/detail'
import { type BoardType, COMPLAINT_STATUS } from '@/features/board/types/post'
import { DrawerList } from '@/shared/components/common/DrawerList'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { useAuthStore } from '@/shared/stores/authStore'

type ModalType = 'delete' | 'block' | 'complaintsNonEditable'

/**
 * AppBar 우측 더보기. 레거시 `DetailPostMoreButton.vue`(199 LOC) 이식.
 *
 * 작성자 본인이면 **수정·삭제**, 남의 글이면 **차단·신고**가 뜬다.
 *
 * ⚠️ **차단에 성공하면 버튼 자체가 사라진다.** 목록·상세는 갱신되지 않아 보고 있던 글은
 * 그대로 남는다 — 목록으로 돌아가야 사라진다.
 *
 * 🔴 **익명 작성자의 `이 사용자의 글 보지 않기`가 숨겨지지 않는다.** 레거시가
 * `enabled: !isAnonymousAuthor`를 넘기지만 `DrawerList`의 조건식이 **거짓일 때도 참**이
 * 되어 아무 효과가 없다. 등가 이관이라 그 상태를 유지한다 — `DrawerList`에서 죽은
 * prop을 없앤 이유이기도 하다 (`DrawerList.tsx` 주석).
 *
 * 🔴 **`authorText`가 없으면 레거시는 여기서 TypeError로 화면이 깨진다**
 * (`postData?.authorText.split(...)` — `?.`가 `authorText`까지만 걸려 있다).
 * 옵셔널 체이닝을 이어 붙여 **깨지지 않게** 했다 — 크래시는 재현할 가치가 없고
 * 정상 응답에서는 결과가 같다.
 */
export const DetailPostMoreButton = ({
  postData,
  boardType,
  editPath,
  reportPath,
  onDelete,
}: {
  postData: BoardPostDetail
  boardType: BoardType
  editPath: string
  reportPath: string
  onDelete: () => void
}) => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const { blockUser, isBlockUserSuccess } = useBlockBoardUser()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [modalType, setModalType] = useState<ModalType | null>(null)

  const authorName = postData.authorText?.split(',')[0] ?? '이름없음'
  const isPostAuthor = aptResidentUuid === postData.authorAptResidentUuid

  /** 민원이 `접수` 이후 단계면 수정·삭제가 막힌다. 소통공간은 `status`가 없어 항상 거짓 */
  const isComplaintsNonModified =
    postData.status !== undefined && postData.status !== COMPLAINT_STATUS.RECEIVED

  // 차단이 성공하면 모달을 닫는다 (버튼은 아래 조건으로 사라진다)
  useEffect(() => {
    if (!isBlockUserSuccess) return

    setModalType(null)
  }, [isBlockUserSuccess])

  const openModal = (type: ModalType) => {
    setIsDrawerOpen(false)
    setModalType(type)
  }

  const authorItems = [
    {
      ...DETAIL_MORE_AUTHOR.EDIT,
      onClick: () => {
        if (isComplaintsNonModified) {
          openModal('complaintsNonEditable')
          return
        }
        setIsDrawerOpen(false)
        void navigate(editPath)
      },
    },
    {
      ...DETAIL_MORE_AUTHOR.DELETE,
      onClick: () => {
        openModal(isComplaintsNonModified ? 'complaintsNonEditable' : 'delete')
      },
    },
  ]

  const viewerItems = [
    {
      ...DETAIL_MORE_VIEWER.BLOCK,
      onClick: () => {
        openModal('block')
      },
    },
    {
      ...DETAIL_MORE_VIEWER.REPORT,
      onClick: () => {
        setIsDrawerOpen(false)
        // 신고 화면은 어느 게시판인지를 라우터 state로 받는다 (`board.md` §5-13)
        void navigate(reportPath, { state: { boardType } })
      },
    },
  ]

  if (isBlockUserSuccess) return null

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsDrawerOpen(true)
        }}
      >
        <img src="/assets/icons/More.svg" alt="더보기 아이콘" />
      </button>

      <DrawerList
        open={isDrawerOpen}
        textAlign="center"
        list={isPostAuthor ? authorItems : viewerItems}
        onClose={() => {
          setIsDrawerOpen(false)
        }}
      />

      <ModalButton
        open={modalType === 'delete'}
        buttonType="outline"
        modalData={DETAIL_DELETE_MODAL_DATA}
        onFirstClick={() => {
          setModalType(null)
        }}
        onSecondClick={() => {
          setModalType(null)
          onDelete()
        }}
        onClose={() => {
          setModalType(null)
        }}
      />

      <ModalButton
        open={modalType === 'block'}
        buttonType="outline"
        modalData={detailBlockModalData({ authorName: authorName || '이름 없음' })}
        onFirstClick={() => {
          setModalType(null)
        }}
        onSecondClick={() => {
          blockUser({
            authorUuid: postData.authorAptResidentUuid ?? '',
            authorTextName: postData.authorText ?? '',
          })
        }}
        onClose={() => {
          setModalType(null)
        }}
      />

      <ModalButton
        open={modalType === 'complaintsNonEditable'}
        buttonType="single"
        modalData={complaintsNonEditableModalData({ status: postData.status })}
        onFirstClick={() => {
          setModalType(null)
        }}
        onClose={() => {
          setModalType(null)
        }}
      />
    </>
  )
}
