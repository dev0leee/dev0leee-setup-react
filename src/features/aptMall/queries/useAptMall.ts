import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import {
  deleteAptMallMyOrder,
  getAptMallDetail,
  getAptMallList,
  getAptMallMyOrderDetail,
  getAptMallMyOrderList,
  getAptMallOrderMenuList,
  getAptMallOrderTimeList,
  postAptMallOrder,
} from '@/features/aptMall/api/aptMall'
import { WEEKEND_MEAL_NAME } from '@/features/aptMall/constants/aptMall'
import { useAptMallFormStore } from '@/features/aptMall/stores/aptMallFormStore'
import {
  APT_MALL_ORDER_TYPE,
  type AptMallMyOrderListItemData,
} from '@/features/aptMall/types/aptMall'
import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import type { ApiError } from '@/shared/lib/apiErrors'
import { hasAptContent } from '@/shared/lib/aptContext'
import { showErrorModal } from '@/shared/lib/errorModal'
import { useAuthStore } from '@/shared/stores/authStore'
import { formatObjectDate } from '@/shared/utils/formatObjectDate'

/**
 * 아파트몰 쿼리. 레거시 `lib/queries/aptMall/*` 이식.
 *
 * ⚠️ **쿼리 키에 `aptResidentUuid`가 없다**(`['aptMallList']`·`['aptMallDetail']`) —
 * 단지를 전환해도 캐시가 갈리지 않는다 (`apt-mall.md` AM-Q8). 레거시 그대로 뒀다.
 */
const useAptMallGate = () => {
  const aptInfo = useAuthStore((state) => {
    return state.aptInfo
  })

  return {
    aptResidentUuid: aptInfo.aptResidentUuid ?? '',
    // ✅ 레거시는 `getAptInfo().contentList`에 `?.`가 없어 `aptInfo`가 비면 훅에서 즉시
    // throw했다(AM-Q7). 공용 판정 함수로 바꿔 trim 비교까지 한곳에서 처리한다
    hasAptMall: hasAptContent({
      contentList: aptInfo.contentList,
      contentName: APT_CONTENT_NAME.APT_MALL,
    }),
  }
}

/** 몰 목록 (AM1) */
export const useAptMallList = () => {
  const { aptResidentUuid, hasAptMall } = useAptMallGate()

  const { data: aptMallList, isLoading: isAptMallListLoading } = useQuery({
    queryKey: ['aptMallList'],
    queryFn: () => {
      return getAptMallList({ aptResidentUuid })
    },
    enabled: hasAptMall,
  })

  return { aptMallList, isAptMallListLoading }
}

/**
 * 주말조식 몰 상세 (AM4~AM11).
 *
 * ⚠️ **목록을 먼저 받아 이름으로 몰을 찾은 뒤 상세를 받는다** — 요청이 2회다.
 * 🔴 **레거시는 `.find(...)` 뒤에 `?.`가 없어 `주말조식`이 없으면 `queryFn`이 던지고
 * 화면이 스피너에서 멈췄다**(에러 UI 없음). 옵셔널을 붙여 크래시는 막았지만
 * 응답이 없으면 여전히 상세가 비어 있다 (`apt-mall.md` AM-Q3).
 */
export const useAptMallDetail = () => {
  const { aptResidentUuid, hasAptMall } = useAptMallGate()

  const { data: aptMallDetail, isLoading: isAptMallDetailLoading } = useQuery({
    queryKey: ['aptMallDetail'],
    queryFn: async () => {
      const mallList = await getAptMallList({ aptResidentUuid })
      const aptMallUuid = mallList?.find((mall) => {
        return mall.aptMallName === WEEKEND_MEAL_NAME
      })?.aptMallUuid

      if (!aptMallUuid) return undefined

      return getAptMallDetail({ aptResidentUuid, aptMallUuid })
    },
    enabled: hasAptMall,
  })

  return { aptMallDetail, isAptMallDetailLoading }
}

/**
 * 나의 예약 목록 (AM2).
 *
 * ⚠️ **레거시가 넘기던 `enable: hasAptMall`은 `useInfiniteList`가 받지 않아 무시됐다** —
 * 구독이 없어도 목록 요청이 나간다. 메뉴가 진입을 막으므로 눈에 띄지 않는다.
 * 등가 이관이라 게이트를 붙이지 않았다 (`apt-mall.md` §7-1).
 *
 * ⚠️ **`setAdditionalParams`(상태 필터)는 호출부가 0곳이라 옮기지 않았다.**
 */
export const useAptMallMyOrderList = () => {
  const { list, isListLoading, hasListNextPage, fetchListNextPage } =
    useInfiniteList<AptMallMyOrderListItemData>({
      queryKey: 'aptMallMyOrderList',
      defaultStoreKey: ['aptResidentUuid'],
      fetchFunction: getAptMallMyOrderList,
    })

  return {
    aptMallMyOrderList: list?.pages ?? [],
    totalElements: list?.pageable.totalElements ?? 0,
    isAptMallMyOrderListLoading: isListLoading,
    hasAptMallMyOrderListNextPage: hasListNextPage,
    fetchAptMallMyOrderListNextPage: fetchListNextPage,
  }
}

/** 예약 상세 (AM3) */
export const useAptMallMyOrderDetail = () => {
  const { aptResidentUuid } = useAptMallGate()
  const { aptMallOrderUuid = '' } = useParams()

  const { data: aptMallMyOrderDetail, isLoading: isAptMallMyOrderDetailLoading } = useQuery({
    queryKey: ['aptMallMyOrderDetail', aptMallOrderUuid],
    queryFn: () => {
      return getAptMallMyOrderDetail({ aptResidentUuid, aptMallOrderUuid })
    },
    enabled: Boolean(aptMallOrderUuid),
  })

  return { aptMallMyOrderDetail, isAptMallMyOrderDetailLoading }
}

/**
 * 예약 취소 (AM3).
 *
 * ✅ **`invalidateQueries`를 v5 객체 형식으로 고쳤다.** 레거시는 v4 위치인자라
 * **조용히 no-op**이었고, 그래서 취소해도 상태 칩과 하단 버튼이 `예약완료`/`취소하기`에
 * 그대로 머물렀다 (`apt-mall.md` §5-4).
 *
 * ⚠️ **목록은 무효화하지 않는다** — 레거시가 상세만 무효화한다. `staleTime: 0`이라
 * 목록으로 돌아가면 재조회되므로 화면 결과는 같다 (AM-Q9).
 */
export const useDeleteAptMallMyOrder = () => {
  const { aptResidentUuid } = useAptMallGate()
  const queryClient = useQueryClient()

  const { mutate: deleteAptMallMyOrderMutation, isPending: isDeleteAptMallMyOrderPending } =
    useMutation({
      mutationFn: (aptMallOrderUuid: string) => {
        return deleteAptMallMyOrder({ aptResidentUuid, aptMallOrderUuid })
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['aptMallMyOrderDetail'] })
      },
      onError: (error: ApiError) => {
        showErrorModal({ text: error.message })
      },
    })

  return { deleteAptMallMyOrderMutation, isDeleteAptMallMyOrderPending }
}

/**
 * 선택한 날짜의 예약 가능 시간대 (AM11).
 *
 * ✅ **레거시는 스토어 전체를 `watch`해서 날짜를 밀어 넣었다** — `menu`·`time`이 바뀌어도
 * 콜백이 돌았고, 초기 1회는 **형제 컴포넌트의 마운트 순서**에 기대어 채워졌다.
 * 여기서는 "선택된 날짜가 곧 조회 파라미터"로 직접 배선한다 (`apt-mall.md` AM11).
 */
export const useAptMallOrderTimeList = ({
  aptMallUuid,
  orderDate,
}: {
  aptMallUuid: string | undefined
  orderDate: Date | undefined
}) => {
  const { aptResidentUuid } = useAptMallGate()

  const formattedOrderDate = formatObjectDate({ date: orderDate, type: 'hyphen' })

  const { data: aptMallOrderTimeList, isLoading: isAptMallOrderTimeListLoading } = useQuery({
    queryKey: ['aptMallOrderCalendarTimeList', formattedOrderDate],
    queryFn: () => {
      return getAptMallOrderTimeList({
        aptResidentUuid,
        aptMallUuid: aptMallUuid ?? '',
        orderDate: formattedOrderDate ?? '',
      })
    },
    enabled: Boolean(aptMallUuid) && Boolean(formattedOrderDate),
  })

  return { aptMallOrderTimeList, isAptMallOrderTimeListLoading }
}

/** 메뉴 목록 (AM6) */
export const useAptMallOrderMenuList = ({ aptMallUuid }: { aptMallUuid: string | undefined }) => {
  const { aptResidentUuid } = useAptMallGate()

  const { data: aptMallOrderMenuList } = useQuery({
    queryKey: ['aptMallOrderMenuList', aptMallUuid],
    queryFn: () => {
      return getAptMallOrderMenuList({ aptResidentUuid, aptMallUuid: aptMallUuid ?? '' })
    },
    enabled: Boolean(aptMallUuid),
  })

  return { aptMallOrderMenuList }
}

/**
 * 예약 등록 (AM7).
 *
 * ⚠️ **`포장`은 `personCount`를 보내지 않는다** — 키 자체가 빠진다.
 * ⚠️ **수량이 0인 메뉴는 실리지 않는다.**
 *
 * ✅ **`invalidateQueries`를 v5 객체 형식으로 고쳤다** — 레거시는 v4 위치인자라 no-op이어서
 * 예약을 만들어도 목록에 새 예약이 보이지 않았다.
 *
 * ✅ **`mutate` + `onSuccess`로 바꿨다.** 레거시는 `mutateAsync`를 화면에서 `await`만 하고
 * 잡지 않아 unhandled rejection이 남았고, 실패 모달은 별도 `watch`가 띄웠는데 **연속 실패
 * 시 두 번째부터는 뜨지 않았다**(`false → true` 전이가 없어서). 이제 실패할 때마다 뜬다
 * (`apt-mall.md` AM-Q20).
 */
export const usePostAptMallOrder = ({
  aptMallUuid,
  onCreated,
  onFailed,
}: {
  aptMallUuid: string | undefined
  onCreated: () => void
  onFailed: (message: string) => void
}) => {
  const { aptResidentUuid } = useAptMallGate()
  const queryClient = useQueryClient()

  const aptMallFormData = useAptMallFormStore((state) => {
    return state.aptMallFormData
  })

  const { mutate: postAptMallOrderMutation, isPending: isPostAptMallOrderPending } = useMutation({
    mutationFn: (orderNote: string | undefined) => {
      const isVisit = aptMallFormData.selectedType?.key === APT_MALL_ORDER_TYPE.VISIT

      return postAptMallOrder({
        aptResidentUuid,
        aptMallUuid: aptMallUuid ?? '',
        aptMallOrderMenuList: (aptMallFormData.menu ?? [])
          .filter((item) => {
            return item.count > 0
          })
          .map((item) => {
            return { aptMallOrderMenuUuid: item.uuid, count: item.count }
          }),
        aptMallOrderTimeUuid: aptMallFormData.time?.aptMallOrderTimeUuid ?? '',
        orderDate: formatObjectDate({ date: aptMallFormData.date, type: 'hyphen' }),
        aptMallOrderType: aptMallFormData.selectedType?.key ?? '',
        personCount: isVisit ? aptMallFormData.personCount : undefined,
        orderNote,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['aptMallMyOrderList'] })
      onCreated()
    },
    onError: (error: ApiError) => {
      onFailed(error.message)
    },
  })

  return { postAptMallOrderMutation, isPostAptMallOrderPending }
}
