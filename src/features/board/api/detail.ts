import type { AxiosProgressEvent } from 'axios'

import type { BoardComment, BoardPostDetail } from '@/features/board/types/detail'
import { BOARD_TYPE, type BoardType } from '@/features/board/types/post'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * 게시글 상세·댓글 API. 레거시 `api/board.js`의 소통공간·민원공간 구획 이식.
 *
 * **목록과 달리 여기서는 경로가 완전히 대칭이다** — 게시판 세그먼트만 다르다
 * (`community` / `complaint`). 비대칭인 것은 목록 엔드포인트뿐이다(`api/post.ts`).
 */
const SEGMENT: Record<BoardType, string> = {
  [BOARD_TYPE.COMMUNITY]: 'community',
  [BOARD_TYPE.COMPLAINTS]: 'complaint',
}

/** `/board/resident/{입주민}/community|complaint/{글}` */
const postBase = ({
  boardType,
  aptResidentUuid,
  postUuid,
}: {
  boardType: BoardType
  aptResidentUuid: string
  postUuid: string
}) => {
  return `${API_PREFIX.BOARD}/${aptResidentUuid}/${SEGMENT[boardType]}/${postUuid}`
}

interface PostRef {
  boardType: BoardType
  aptResidentUuid: string
  postUuid: string
}

/**
 * 게시글 상세.
 *
 * ⚠️ **첨부를 `orderNum`으로 다시 정렬한다.** 서버가 순서를 보장하지 않아
 * 레거시가 `select`에서 정렬한다. 등록 시 배열 순서로 `orderNum`을 다시 매기므로
 * 이 정렬이 있어야 왕복이 일관된다.
 */
export const getBoardPostDetail = async (ref: PostRef): Promise<BoardPostDetail | undefined> => {
  const response = await api.get<ServerSuccessBody<BoardPostDetail>>(postBase(ref))
  const detail = response.data.success

  detail?.fileList?.sort((a, b) => {
    return (a.orderNum ?? 0) - (b.orderNum ?? 0)
  })

  return detail
}

/** 좋아요 토글. 응답을 쓰지 않고 성공 여부만 본다 */
export const patchBoardPostLike = async (ref: PostRef): Promise<void> => {
  await api.patch(`${postBase(ref)}/like`)
}

export const deleteBoardPost = async (ref: PostRef): Promise<void> => {
  await api.delete(postBase(ref))
}

/** 댓글 목록. 대댓글은 각 댓글의 `childCommentList`에 담겨 온다 */
export const getBoardCommentList = async (ref: PostRef): Promise<BoardComment[]> => {
  const response = await api.get<ServerSuccessBody<BoardComment[]>>(`${postBase(ref)}/comment`)

  return response.data.success ?? []
}

/** 댓글 1건 상세. 답글 작성(B7)과 댓글 수정(B8)이 같은 엔드포인트를 쓴다 */
export const getBoardCommentDetail = async ({
  commentUuid,
  ...ref
}: PostRef & { commentUuid: string }): Promise<BoardComment | undefined> => {
  const response = await api.get<ServerSuccessBody<BoardComment>>(
    `${postBase(ref)}/comment/${commentUuid}`,
  )

  return response.data.success
}

/** 댓글 등록 (multipart). 업로드 진행률을 위해 콜백을 받는다 */
export const postBoardComment = async ({
  formData,
  onUploadProgress,
  ...ref
}: PostRef & {
  formData: FormData
  onUploadProgress: (event: AxiosProgressEvent) => void
}): Promise<void> => {
  await api.post(`${postBase(ref)}/comment`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
}

/**
 * 답글 등록.
 * ⚠️ **댓글 수정과 경로가 같고 메서드만 다르다** (POST=답글, PATCH=수정).
 */
export const postBoardReply = async ({
  commentUuid,
  formData,
  onUploadProgress,
  ...ref
}: PostRef & {
  commentUuid: string
  formData: FormData
  onUploadProgress: (event: AxiosProgressEvent) => void
}): Promise<void> => {
  await api.post(`${postBase(ref)}/comment/${commentUuid}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
}

export const patchBoardComment = async ({
  commentUuid,
  formData,
  onUploadProgress,
  ...ref
}: PostRef & {
  commentUuid: string
  formData: FormData
  onUploadProgress: (event: AxiosProgressEvent) => void
}): Promise<void> => {
  await api.patch(`${postBase(ref)}/comment/${commentUuid}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
}

export const deleteBoardComment = async ({
  commentUuid,
  ...ref
}: PostRef & { commentUuid: string }): Promise<void> => {
  await api.delete(`${postBase(ref)}/comment/${commentUuid}`)
}

/**
 * 게시판 사용자 차단.
 * ⚠️ **`authorTextName`은 쉼표 앞부분만 보낸다** — 훅이 아니라 여기서 자른다(레거시 동일).
 */
export const postBoardBlockUser = async ({
  aptResidentUuid,
  authorUuid,
  authorTextName,
}: {
  aptResidentUuid: string
  authorUuid: string
  authorTextName: string
}): Promise<void> => {
  await api.post(`${API_PREFIX.BOARD}/${aptResidentUuid}/block/${authorUuid}`, {
    authorTextName: authorTextName.split(',')[0],
  })
}
