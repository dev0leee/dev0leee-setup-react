import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import {
  deleteBoardBlockUser,
  deleteBoardComment,
  deleteBoardPost,
  patchBoardComment,
  patchBoardPost,
  patchBoardPostLike,
  postBoardBlockUser,
  postBoardComment,
  postBoardPost,
  postBoardPostReport,
  postBoardReply,
} from '@/features/board/api/detail'
import { BOARD_TOAST_MESSAGE } from '@/features/board/constants/board'
import {
  boardCommentDetailQueryKey,
  boardCommentListQueryKey,
} from '@/features/board/constants/query'
import { showBoardMutationError } from '@/features/board/queries/boardMutationError'
import type { BoardPostSubmitPayload, CommentSubmitPayload } from '@/features/board/types/detail'
import { BOARD_TYPE, type BoardType } from '@/features/board/types/post'
import { useUploadProgress } from '@/shared/hooks/useUploadProgress'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'
import { convertFormDataFile } from '@/shared/utils/convertFormDataFile'

interface PostRef {
  boardType: BoardType
  postUuid: string | undefined
}

/** 소통공간만 `BOARD_BLACK_LIST`를 전용 안내문으로 바꾼다 (`board.md` §4 #10~#13) */
const handlesBlackList = (boardType: BoardType) => {
  return boardType === BOARD_TYPE.COMMUNITY
}

/**
 * 좋아요 토글. 레거시 `usePatchCommunityPostLike` / `...Complaints...` 이식.
 *
 * 🔴 **`isSuccess`를 그대로 노출한다.** 화면이 이 값의 `false → true` 전이에만 반응하는데
 * `isSuccess`는 한 번 참이 되면 계속 참이라 **두 번째 클릭부터는 화면이 바뀌지 않는다.**
 * 서버에는 매번 전달되므로 재진입하면 반영돼 있다. 레거시 동작이라 그대로 옮긴다
 * (`board.md` §DetailPostLikeButton).
 *
 * `onSuccess` 콜백으로 옮기면 매번 발화해 **동작이 달라진다** — 하지 않는다.
 */
export const useBoardPostLike = ({ boardType, postUuid }: PostRef) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: patchPostLike, isSuccess: isPostLikeSuccess } = useMutation({
    mutationFn: () => {
      return patchBoardPostLike({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        postUuid: postUuid ?? '',
      })
    },
    onError: (error) => {
      // 좋아요는 어느 게시판도 블랙리스트를 따로 다루지 않는다
      showBoardMutationError({ error, handlesBlackList: false })
    },
  })

  return { patchPostLike, isPostLikeSuccess }
}

/** 게시글 삭제. 성공하면 **뒤로 가고** 토스트를 띄운다 */
export const useDeleteBoardPost = ({ boardType, postUuid }: PostRef) => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: deletePost } = useMutation({
    mutationFn: () => {
      return deleteBoardPost({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        postUuid: postUuid ?? '',
      })
    },
    onSuccess: () => {
      void navigate(-1)
      showToast({ message: BOARD_TOAST_MESSAGE.delete })
    },
    onError: (error) => {
      showBoardMutationError({ error, handlesBlackList: handlesBlackList(boardType) })
    },
  })

  return { deletePost }
}

/**
 * 게시판 사용자 차단.
 *
 * ⚠️ **목록·상세를 무효화하지 않는다.** 보고 있던 글은 그대로 남고, 목록으로 돌아가면
 * `staleTime: 0` 덕에 재조회되어 사라진다. 레거시 그대로다.
 */
export const useBlockBoardUser = () => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: blockUser, isSuccess: isBlockUserSuccess } = useMutation({
    mutationFn: ({
      authorUuid,
      authorTextName,
    }: {
      authorUuid: string
      authorTextName: string
    }) => {
      return postBoardBlockUser({
        aptResidentUuid: aptResidentUuid ?? '',
        authorUuid,
        authorTextName,
      })
    },
    onSuccess: () => {
      showToast({ message: BOARD_TOAST_MESSAGE.blocked })
    },
    onError: (error) => {
      showBoardMutationError({ error, handlesBlackList: false })
    },
  })

  return { blockUser, isBlockUserSuccess }
}

/**
 * 게시글 등록 (B9·B16). 성공하면 뒤로 가고 `등록되었습니다` 토스트가 뜬다.
 * ⚠️ 민원공간은 `BOARD_BLACK_LIST` 분기가 없다 (`board.md` §4 #10).
 */
export const usePostBoardPost = ({ boardType }: { boardType: BoardType }) => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const { progressPercent, onUploadProgress, onUploadSuccess, onUploadError } = useUploadProgress()

  const { mutate: createPost, isPending: isCreatePostPending } = useMutation({
    mutationFn: (payload: BoardPostSubmitPayload) => {
      return postBoardPost({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        formData: convertFormDataFile({ ...payload }),
        onUploadProgress,
      })
    },
    onSuccess: () => {
      onUploadSuccess()
      void navigate(-1)
      showToast({ message: BOARD_TOAST_MESSAGE.create })
    },
    onError: (error) => {
      onUploadError()
      showBoardMutationError({
        error,
        handlesBlackList: handlesBlackList(boardType),
        handlesFileUploadFail: true,
      })
    },
  })

  return { createPost, isCreatePostPending, progressPercent }
}

/** 게시글 수정 (B10·B17). ⚠️ 민원공간은 `BOARD_BLACK_LIST` 분기가 없다 (§4 #11) */
export const usePatchBoardPost = ({ boardType, postUuid }: PostRef) => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const { progressPercent, onUploadProgress, onUploadSuccess, onUploadError } = useUploadProgress()

  const { mutate: editPost, isPending: isEditPostPending } = useMutation({
    mutationFn: (payload: BoardPostSubmitPayload) => {
      return patchBoardPost({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        postUuid: postUuid ?? '',
        formData: convertFormDataFile({ ...payload }),
        onUploadProgress,
      })
    },
    onSuccess: () => {
      onUploadSuccess()
      void navigate(-1)
      showToast({ message: BOARD_TOAST_MESSAGE.edit })
    },
    onError: (error) => {
      onUploadError()
      showBoardMutationError({
        error,
        handlesBlackList: handlesBlackList(boardType),
        handlesFileUploadFail: true,
      })
    },
  })

  return { editPost, isEditPostPending, progressPercent }
}

/** 게시글 신고 (B20). 성공하면 해당 게시판 목록으로 간다 */
export const useReportBoardPost = ({ boardType, postUuid }: PostRef) => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: reportPost } = useMutation({
    mutationFn: ({ content }: { content: string }) => {
      return postBoardPostReport({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        postUuid: postUuid ?? '',
        content,
      })
    },
    onSuccess: () => {
      void navigate(`/board/${boardType}`)
      showToast({ message: BOARD_TOAST_MESSAGE.reported })
    },
    onError: (error) => {
      showBoardMutationError({ error, handlesBlackList: false })
    },
  })

  return { reportPost }
}

/** 차단 해제 (B19). ⚠️ 목록을 무효화하지 않는다 — 항목이 남고 버튼만 바뀐다 */
export const useUnblockBoardUser = () => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: unblockUser, isSuccess: isUnblockUserSuccess } = useMutation({
    mutationFn: ({ authorUuid }: { authorUuid: string }) => {
      return deleteBoardBlockUser({ aptResidentUuid: aptResidentUuid ?? '', authorUuid })
    },
    onSuccess: () => {
      showToast({ message: BOARD_TOAST_MESSAGE.unblocked })
    },
    onError: (error) => {
      showBoardMutationError({ error, handlesBlackList: false })
    },
  })

  return { unblockUser, isUnblockUserSuccess }
}

/** 댓글 등록. multipart + 업로드 진행률 */
export const usePostBoardComment = ({ boardType, postUuid }: PostRef) => {
  const queryClient = useQueryClient()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const { progressPercent, onUploadProgress, onUploadSuccess, onUploadError } = useUploadProgress()

  const { mutate: postComment, isPending: isPostCommentPending } = useMutation({
    mutationFn: ({ content, fileList }: CommentSubmitPayload) => {
      return postBoardComment({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        postUuid: postUuid ?? '',
        formData: convertFormDataFile({ content, fileList }),
        onUploadProgress,
      })
    },
    onSuccess: async () => {
      onUploadSuccess()
      await queryClient.invalidateQueries({
        queryKey: boardCommentListQueryKey({ boardType, aptResidentUuid, postUuid }),
      })
    },
    onError: (error) => {
      onUploadError()
      showBoardMutationError({
        error,
        handlesBlackList: true,
        handlesFileUploadFail: true,
      })
    },
  })

  return { postComment, isPostCommentPending, progressPercent }
}

/**
 * 답글 등록 (B7).
 * 목록과 **부모 댓글 상세를 함께 무효화**한다 — 답글 화면이 상세로 그려지기 때문이다.
 */
export const usePostBoardReply = ({
  boardType,
  postUuid,
  commentUuid,
}: PostRef & { commentUuid: string | undefined }) => {
  const queryClient = useQueryClient()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const { progressPercent, onUploadProgress, onUploadSuccess, onUploadError } = useUploadProgress()

  const { mutate: postReply, isPending: isPostReplyPending } = useMutation({
    mutationFn: ({ content, fileList }: CommentSubmitPayload) => {
      return postBoardReply({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        postUuid: postUuid ?? '',
        commentUuid: commentUuid ?? '',
        formData: convertFormDataFile({ content, fileList }),
        onUploadProgress,
      })
    },
    onSuccess: async () => {
      onUploadSuccess()
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: boardCommentListQueryKey({ boardType, aptResidentUuid, postUuid }),
        }),
        queryClient.invalidateQueries({
          queryKey: boardCommentDetailQueryKey({
            boardType,
            aptResidentUuid,
            postUuid,
            commentUuid,
          }),
        }),
      ])
    },
    onError: (error) => {
      onUploadError()
      showBoardMutationError({
        error,
        handlesBlackList: true,
        handlesFileUploadFail: true,
      })
    },
  })

  return { postReply, isPostReplyPending, progressPercent }
}

/**
 * 댓글 수정 (B8).
 *
 * ⚠️ **성공해도 무효화하지 않고 토스트도 없다** — 뒤로 가기만 한다. 그래도 목록이
 * 갱신되는 것은 `staleTime: 0`이라 상세 화면이 다시 마운트되며 재조회되기 때문이다.
 * 무효화나 토스트를 더하면 없던 동작이 생긴다. 레거시 그대로 옮겼다.
 */
export const usePatchBoardComment = ({
  boardType,
  postUuid,
  commentUuid,
}: PostRef & { commentUuid: string | undefined }) => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const { progressPercent, onUploadProgress, onUploadSuccess, onUploadError } = useUploadProgress()

  const { mutate: patchComment, isPending: isPatchCommentPending } = useMutation({
    mutationFn: ({ content, fileList }: CommentSubmitPayload) => {
      return patchBoardComment({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        postUuid: postUuid ?? '',
        commentUuid: commentUuid ?? '',
        formData: convertFormDataFile({ content, fileList }),
        onUploadProgress,
      })
    },
    onSuccess: () => {
      onUploadSuccess()
      void navigate(-1)
    },
    onError: (error) => {
      onUploadError()
      showBoardMutationError({
        error,
        handlesBlackList: true,
        handlesFileUploadFail: true,
      })
    },
  })

  return { patchComment, isPatchCommentPending, progressPercent }
}

/**
 * 댓글 삭제.
 *
 * ⚠️ **답글 화면에서 원댓글이 삭제되면 게시글 상세로 되돌린다** — 부모가 사라져
 * 그 화면이 의미를 잃기 때문이다. 답글이 삭제된 경우에는 그대로 머문다.
 *
 * ⚠️ 민원공간은 `BOARD_BLACK_LIST` 분기가 없어 서버 원문 메시지가 보인다 (§4 #12).
 */
export const useDeleteBoardComment = ({
  boardType,
  postUuid,
  /** 답글 작성 화면(B7·B14)인지. 라우터 경로를 훅이 직접 읽지 않고 화면이 알려준다 */
  isReplyPage,
}: PostRef & { isReplyPage: boolean }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: deleteComment } = useMutation({
    mutationFn: ({ commentUuid }: { commentUuid: string; isReplyComment: boolean }) => {
      return deleteBoardComment({
        boardType,
        aptResidentUuid: aptResidentUuid ?? '',
        postUuid: postUuid ?? '',
        commentUuid,
      })
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: boardCommentListQueryKey({ boardType, aptResidentUuid, postUuid }),
      })

      if (isReplyPage && !variables.isReplyComment) {
        void navigate(`/board/${boardType}/detail/${postUuid ?? ''}`)
      }
    },
    onError: (error) => {
      showBoardMutationError({ error, handlesBlackList: handlesBlackList(boardType) })
    },
  })

  return { deleteComment }
}
