import { useQuery } from '@tanstack/react-query'

import {
  getGlobalNoticeDetail,
  getNoticeCategoryList,
  getNoticeDetail,
  getNoticePopupThumbnail,
} from '@/features/board/api/notice'
import {
  globalNoticeDetailQueryKey,
  noticeCategoryListQueryKey,
  noticeDetailQueryKey,
  noticePopupThumbnailQueryKey,
} from '@/features/board/constants/query'
import { useAuthStore } from '@/shared/stores/authStore'

/** 공지 카테고리 (B1 탭). 레거시 `useGetNoticeCategoryList.js` */
export const useNoticeCategoryList = () => {
  const aptUuid = useAuthStore((state) => {
    return state.aptInfo.aptUuid
  })

  const { data: noticeCategoryList, isLoading: isNoticeCategoryListLoading } = useQuery({
    queryKey: noticeCategoryListQueryKey({ aptUuid }),
    queryFn: () => {
      return getNoticeCategoryList({ aptUuid: aptUuid ?? '' })
    },
  })

  return { noticeCategoryList, isNoticeCategoryListLoading }
}

/**
 * 공지 상세 (B2). 레거시 `useGetNoticeDetail.js`.
 *
 * ⚠️ 레거시는 `onMounted`에서 uuid를 채워 **첫 렌더에 쿼리가 꺼져 있다.**
 * React는 `useParams()`가 즉시 값을 주므로 처음부터 켜진다 — 조회가 한 박자 빨라질 뿐
 * 결과는 같다 (`board.md` B2 · `recipe.md`).
 */
export const useNoticeDetail = ({ noticeUuid }: { noticeUuid: string | undefined }) => {
  const aptUuid = useAuthStore((state) => {
    return state.aptInfo.aptUuid
  })

  const { data: noticeDetail, isLoading: isNoticeDetailLoading } = useQuery({
    queryKey: noticeDetailQueryKey({ aptUuid, noticeUuid }),
    queryFn: () => {
      return getNoticeDetail({ aptUuid: aptUuid ?? '', noticeUuid: noticeUuid ?? '' })
    },
    enabled: Boolean(noticeUuid),
  })

  return { noticeDetail, isNoticeDetailLoading }
}

/**
 * 팝업 공지 (B21). 레거시 `useGetNoticePopupThumbnail.js`.
 * 대상이 없으면 `{}`가 오므로 호출부가 `uuid` 유무로 판단한다.
 */
export const useNoticePopupThumbnail = () => {
  const aptUuid = useAuthStore((state) => {
    return state.aptInfo.aptUuid
  })

  const { data: noticePopupThumbnail } = useQuery({
    queryKey: noticePopupThumbnailQueryKey({ aptUuid }),
    queryFn: () => {
      return getNoticePopupThumbnail({ aptUuid: aptUuid ?? '' })
    },
  })

  return { noticePopupThumbnail }
}

/** 아파트먼트 공지 상세 (B4). 레거시 `useGetGlobalNoticeDetail.js` */
export const useGlobalNoticeDetail = ({
  globalNoticeUuid,
}: {
  globalNoticeUuid: string | undefined
}) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { data: globalNoticeDetail, isLoading: isGlobalNoticeDetailLoading } = useQuery({
    queryKey: globalNoticeDetailQueryKey({ aptResidentUuid, globalNoticeUuid }),
    queryFn: () => {
      return getGlobalNoticeDetail({
        aptResidentUuid: aptResidentUuid ?? '',
        apartmantNoticeUuid: globalNoticeUuid ?? '',
      })
    },
    enabled: Boolean(globalNoticeUuid),
  })

  return { globalNoticeDetail, isGlobalNoticeDetailLoading }
}
