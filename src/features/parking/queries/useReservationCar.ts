import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import {
  deleteReservedCar,
  getReservationCarDetail,
  getReservationCarList,
  postReservationCar,
} from '@/features/parking/api/reservation'
import {
  RESERVATION_DELETE_ERROR_CODES,
  RESERVATION_DELETE_ERROR_MESSAGE,
  RESERVATION_MAX_DAYS,
  RESERVATION_POST_ERROR_CODES,
  RESERVATION_PRECHECK_MESSAGE,
  RESERVATION_TOAST_MESSAGE,
} from '@/features/parking/constants/parking'
import {
  RESERVATION_CAR_LIST_QUERY_KEY,
  reservationCarDetailQueryKey,
} from '@/features/parking/constants/query'
import { useResetListCacheOnMount } from '@/features/parking/hooks/useResetListCacheOnMount'
import { useReturnFromDetail } from '@/features/parking/hooks/useReturnFromDetail'
import { showCarMutationError } from '@/features/parking/queries/carMutationError'
import type { ReservationForm } from '@/features/parking/schemas/carManagement'
import type { ReservationCar } from '@/features/parking/types/parking'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'
import type { YearMonth } from '@/shared/types/drawerMonth'
import { cleanPhoneHyphen } from '@/shared/utils/cleanPhoneHyphen'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'
import { getCurrentMonthRange } from '@/shared/utils/getCurrentMonthRange'

/**
 * 방문예약 목록 (PK11). 입출차 목록(PK8)과 **같은 구조**다 —
 * 상세에서 돌아오면 캐시를 살리고 `staleTime: Infinity`를 건다.
 */
export const useReservationCarList = ({ selectedMonth }: { selectedMonth: YearMonth }) => {
  const { isFromDetail, markLeavingToDetail } = useReturnFromDetail({
    listKey: RESERVATION_CAR_LIST_QUERY_KEY,
  })

  useResetListCacheOnMount({
    queryKey: RESERVATION_CAR_LIST_QUERY_KEY,
    enabled: !isFromDetail,
  })

  const monthRange = getCurrentMonthRange({
    baseDate: new Date(selectedMonth.year, selectedMonth.month - 1),
  })

  const {
    list: reservationCarList,
    isListLoading: isReservationCarListLoading,
    isListError: isReservationCarListError,
    hasListNextPage: hasReservationCarListNextPage,
    fetchListNextPage: fetchReservationCarListNextPage,
    resetCache,
  } = useInfiniteList<ReservationCar>({
    queryKey: RESERVATION_CAR_LIST_QUERY_KEY,
    defaultStoreKey: ['aptResidentUuid'],
    fetchFunction: getReservationCarList,
    additionalParams: {
      startDate: `${monthRange.startDate} 00:00:00`,
      endDate: `${monthRange.endDate} 23:59:59`,
    },
    additionalOptions: isFromDetail ? { staleTime: Infinity } : {},
  })

  return {
    reservationCarList,
    isReservationCarListLoading,
    isReservationCarListError,
    hasReservationCarListNextPage,
    fetchReservationCarListNextPage,
    resetCache,
    markLeavingToDetail,
  }
}

/**
 * 방문예약 상세 (PK14) · 재등록 초기값 (PK13).
 *
 * ⚠️ **`parkingUuid`가 없으면 조회하지 않는다.** 그래서 등록 화면(`/add`)과
 * 재등록 화면(`/add/:uuid`)이 **같은 컴포넌트인데도** 초기값 조회가 갈린다 —
 * 레거시가 훅 안에서 `getParams().uuid`를 읽고 `enabled`로 판정하던 것과 같다.
 */
export const useReservationCarDetail = ({ parkingUuid }: { parkingUuid: string | undefined }) => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const {
    data: reservationCarDetail,
    isLoading: isReservationCarDetailLoading,
    isError: isReservationCarDetailError,
  } = useQuery({
    queryKey: reservationCarDetailQueryKey({ aptResidentUuid, parkingUuid }),
    queryFn: () => {
      return getReservationCarDetail({
        aptResidentUuid: aptResidentUuid ?? '',
        parkingUuid: parkingUuid ?? '',
      })
    },
    enabled: Boolean(aptResidentUuid) && Boolean(parkingUuid),
  })

  return { reservationCarDetail, isReservationCarDetailLoading, isReservationCarDetailError }
}

/**
 * 로컬 날짜를 `YYYY-MM-DD`로. 레거시 `formatToDate`.
 *
 * 🔴 **타임존 오프셋을 빼고 나서 `toISOString()`을 부른다.** 그냥 부르면 UTC로 바뀌면서
 * **자정 근처에서 날짜가 하루 밀린다**(한국은 UTC+9라 09:00 이전이 전날이 된다).
 * 반드시 재현해야 하는 처리다 (`parking.md` 「반드시 지켜야 할 것」 #7).
 */
const formatToLocalDate = (date: Date): string | undefined => {
  const offset = date.getTimezoneOffset() * 60000
  const localDate = new Date(date.getTime() - offset)

  return formatIsoStringDate({ dateTimeString: localDate.toISOString() }).date()
}

/**
 * 방문예약 등록 (PK12·PK13). 레거시 `usePostReservationCar.js` 이식.
 *
 * ⚠️ **서버에 가기 전에 화면이 먼저 막는다.** 스키마가 아니라 `mutate` 직전의 사전 검증이고,
 * 인라인 에러가 아니라 **모달**로 뜬다 — 같은 폼의 다른 필드와 표시 방식이 다르다.
 *
 * ⚠️ **종료일이 없거나 시작일과 같으면 하루짜리 예약**이 된다
 * (`in: {날짜} 00:00:00`, `out: {같은 날짜} 23:59:59`).
 */
export const usePostReservationCar = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate, isPending: isPostReservationCarPending } = useMutation({
    mutationFn: ({
      carNum,
      inOutParkingScheduledDate,
      phone,
      visitPurpose,
      memo,
      parkingWallPadAlarm,
    }: ReservationForm) => {
      const [startDate, endDate] = inOutParkingScheduledDate

      const startText = formatToLocalDate(startDate)
      const endText = endDate ? formatToLocalDate(endDate) : undefined
      const isSingleDay = !endText || startText === endText

      return postReservationCar({
        aptResidentUuid: aptResidentUuid ?? '',
        carNum,
        inParkingScheduledDate: `${startText ?? ''} 00:00:00`,
        outParkingScheduledDate: `${(isSingleDay ? startText : endText) ?? ''} 23:59:59`,
        phone: cleanPhoneHyphen({ phone }),
        visitPurposeUuid: visitPurpose.uuid,
        memo,
        notificationFlag: parkingWallPadAlarm,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [RESERVATION_CAR_LIST_QUERY_KEY] })
      void navigate(-1)
      showToast({ message: RESERVATION_TOAST_MESSAGE.created })
    },
    onError: (error: ApiError) => {
      showCarMutationError({ error, handledCodes: RESERVATION_POST_ERROR_CODES })
    },
  })

  /** 사전 검증을 통과해야 실제 요청이 나간다 */
  const postReservationCarMutation = (formValues: ReservationForm) => {
    const [startDate, endDate] = formValues.inOutParkingScheduledDate ?? []

    if (!(startDate instanceof Date)) {
      showErrorModal({ text: RESERVATION_PRECHECK_MESSAGE.noDate })
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      showErrorModal({ text: RESERVATION_PRECHECK_MESSAGE.pastDate })
      return
    }

    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + RESERVATION_MAX_DAYS - 1)

    if (startDate > maxDate || (endDate instanceof Date && endDate > maxDate)) {
      showErrorModal({ text: RESERVATION_PRECHECK_MESSAGE.tooLong })
      return
    }

    mutate(formValues)
  }

  return { postReservationCarMutation, isPostReservationCarPending }
}

/**
 * 방문예약 삭제 (PK14). 레거시 `useDeleteReservedCar.js` 이식.
 *
 * ✅ **`RESERVATION_DATE_INVALID(`의 괄호 오타를 고쳤다** (PK-Q11 확정) — 레거시에서는
 * 이 분기가 절대 매치되지 않아 서버 원문이 떴다.
 *
 * ⚠️ **문구 표가 등록과 다르다.** 같은 코드라도 삭제는 `예약일자는 7일 이내로
 * 선택가능합니다.`다.
 */
export const useDeleteReservedCar = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: deleteReservedCarMutation, isPending: isDeleteReservedCarPending } = useMutation({
    mutationFn: ({ reservationUuid }: { reservationUuid: string }) => {
      return deleteReservedCar({ aptResidentUuid: aptResidentUuid ?? '', reservationUuid })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [RESERVATION_CAR_LIST_QUERY_KEY] })
      void navigate(-1)
      showToast({ message: RESERVATION_TOAST_MESSAGE.deleted })
    },
    onError: (error: ApiError) => {
      showCarMutationError({
        error,
        handledCodes: RESERVATION_DELETE_ERROR_CODES,
        messages: RESERVATION_DELETE_ERROR_MESSAGE,
      })
    },
  })

  return { deleteReservedCarMutation, isDeleteReservedCarPending }
}
