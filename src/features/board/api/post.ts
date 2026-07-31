import type { BoardCategory, BoardPostListItemData } from '@/features/board/types/post'
import { BOARD_TYPE, type BoardType } from '@/features/board/types/post'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 소통공간·민원공간 목록 API. 레거시 `api/board.js`의 두 구획을 합쳤다.
 *
 * ⚠️ **경로가 대칭이 아니다.** 소통은 `/community`인데 민원은 **`/complaint/list`**로
 * `/list` 접미사가 붙는다. 카테고리도 `/community/category` vs `/complaint/category`로
 * 단·복수가 다르다. 서버 계약이라 그대로 옮긴다 (`board.md` §4 #1).
 */
const POST_PATH_SEGMENT: Record<BoardType, { list: string; category: string }> = {
  [BOARD_TYPE.COMMUNITY]: { list: 'community', category: 'community/category' },
  [BOARD_TYPE.COMPLAINTS]: { list: 'complaint/list', category: 'complaint/category' },
}

/** 게시판 카테고리 목록 */
export const getBoardCategoryList = async ({
  boardType,
  aptResidentUuid,
}: {
  boardType: BoardType
  aptResidentUuid: string
}): Promise<BoardCategory[]> => {
  const response = await api.get<ServerSuccessBody<BoardCategory[]>>(
    `${API_PREFIX.BOARD}/${aptResidentUuid}/${POST_PATH_SEGMENT[boardType].category}`,
  )

  return response.data.success ?? []
}

/**
 * 게시글 목록. `useInfiniteList`가 부르므로 시그니처를 팩토리에 맞춘다.
 * `boardType`은 호출부가 미리 묶어 넘긴다.
 */
export const getBoardPostList = ({ boardType }: { boardType: BoardType }) => {
  return async ({
    aptResidentUuid,
    page,
    size,
    keyword,
    categoryUuid,
  }: InfiniteListFetchParams): Promise<PageResponse<BoardPostListItemData>> => {
    const response = await api.get<ServerSuccessBody<PageResponse<BoardPostListItemData>>>(
      `${API_PREFIX.BOARD}/${String(aptResidentUuid)}/${POST_PATH_SEGMENT[boardType].list}`,
      { params: { page, size, keyword, categoryUuid } },
    )

    return response.data.success as PageResponse<BoardPostListItemData>
  }
}

/**
 * 내 활동 목록. `작성한 글`과 `댓글 쓴 글` 두 종류다.
 *
 * ⚠️ **검색·카테고리 파라미터가 없다.** `page`·`size`만 받는다.
 */
export const getMyActivityList = ({
  boardType,
  activityType,
}: {
  boardType: BoardType
  activityType: 'posts' | 'comments'
}) => {
  const base = boardType === BOARD_TYPE.COMMUNITY ? 'community' : 'complaint'
  const suffix = activityType === 'posts' ? 'my' : 'my/comment'

  return async ({
    aptResidentUuid,
    page,
    size,
  }: InfiniteListFetchParams): Promise<PageResponse<BoardPostListItemData>> => {
    const response = await api.get<ServerSuccessBody<PageResponse<BoardPostListItemData>>>(
      `${API_PREFIX.BOARD}/${String(aptResidentUuid)}/${base}/${suffix}`,
      { params: { page, size } },
    )

    return response.data.success as PageResponse<BoardPostListItemData>
  }
}
