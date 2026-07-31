import { useQuery } from '@tanstack/react-query'

import {
  getBoardCommentDetail,
  getBoardCommentList,
  getBoardPostDetail,
} from '@/features/board/api/detail'
import {
  boardCommentDetailQueryKey,
  boardCommentListQueryKey,
  boardPostDetailQueryKey,
} from '@/features/board/constants/query'
import type { BoardType } from '@/features/board/types/post'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 게시글 상세 (B6·B13). 레거시 `useGetCommunityPostDetail` / `...Complaints...` 이식.
 *
 * ✅ **쿼리 키에 `postUuid`를 넣었다** — 레거시에는 없어 모든 글이 한 슬롯을 공유했다
 * (2026-07-31 BD-Q11 확정 · D-225). 정상 경로 화면은 같고, `staleTime`이 0이 아니게
 * 되는 순간 다른 글이 보이던 위험이 사라진다.
 */
export const useBoardPostDetail = ({
  boardType,
  postUuid,
}: {
  boardType: BoardType
  postUuid: string | undefined
}) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { data: postDetail, isLoading: isPostDetailLoading } = useQuery({
    queryKey: boardPostDetailQueryKey({ boardType, aptResidentUuid, postUuid }),
    queryFn: () => {
      return getBoardPostDetail({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        postUuid: postUuid ?? '',
      })
    },
    enabled: Boolean(postUuid),
  })

  return { postDetail, isPostDetailLoading }
}

/** 댓글 목록 (B6·B13). 대댓글은 각 댓글의 `childCommentList`에 담겨 온다 */
export const useBoardCommentList = ({
  boardType,
  postUuid,
}: {
  boardType: BoardType
  postUuid: string | undefined
}) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { data: commentList, isLoading: isCommentListLoading } = useQuery({
    queryKey: boardCommentListQueryKey({ boardType, aptResidentUuid, postUuid }),
    queryFn: () => {
      return getBoardCommentList({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        postUuid: postUuid ?? '',
      })
    },
    enabled: Boolean(postUuid),
  })

  return { commentList: commentList ?? [], isCommentListLoading }
}

/**
 * 댓글 1건 상세 (B7 답글 작성 · B8 댓글 수정).
 * 답글 화면은 이 응답의 `childCommentList`로 기존 답글까지 함께 그린다.
 */
export const useBoardCommentDetail = ({
  boardType,
  postUuid,
  commentUuid,
}: {
  boardType: BoardType
  postUuid: string | undefined
  commentUuid: string | undefined
}) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { data: commentDetail, isLoading: isCommentDetailLoading } = useQuery({
    queryKey: boardCommentDetailQueryKey({ boardType, aptResidentUuid, postUuid, commentUuid }),
    queryFn: () => {
      return getBoardCommentDetail({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        postUuid: postUuid ?? '',
        commentUuid: commentUuid ?? '',
      })
    },
    enabled: Boolean(postUuid) && Boolean(commentUuid),
  })

  return { commentDetail, isCommentDetailLoading }
}
