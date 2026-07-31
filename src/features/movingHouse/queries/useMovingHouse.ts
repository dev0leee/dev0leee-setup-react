import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  deleteMovingHouseReceipt,
  getMovingHouseDetail,
  getMovingHouseHolidayList,
  getMovingHouseList,
  getMovingHouseReservationTimeList,
  getMovingHouseSetting,
  postMovingHouse,
} from '@/features/movingHouse/api/movingHouse'
import {
  MOVING_HOUSE_ERROR_MESSAGE,
  MOVING_HOUSE_TOAST_MESSAGE,
} from '@/features/movingHouse/constants/movingHouse'
import { toTimeSlotRadioList } from '@/features/movingHouse/lib/movingHouseDate'
import { useMovingHouseFormStore } from '@/features/movingHouse/stores/movingHouseFormStore'
import type { MovingHouseFormData } from '@/features/movingHouse/types/movingHouse'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'
import { cleanPhoneHyphen } from '@/shared/utils/cleanPhoneHyphen'
import { formatObjectDate } from '@/shared/utils/formatObjectDate'

/**
 * 이사예약 쿼리 7개. 레거시 `lib/queries/movingHouse/*` 이식.
 *
 * ⚠️ **어느 mutation도 무효화를 부르지 않는다** — 등록·취소 후 목록·상세가 무효화되지
 * 않는다. `staleTime: 0`이라 화면을 옮기면 재조회돼 눈에 띄지 않는다. 레거시 그대로다
 * (`moving-house.md` MH-Q5 · `deferred.md`).
 *
 * ✅ 레거시는 훅마다 `getAptInfo()`의 옵셔널 체이닝이 달랐다(4개는 없고 3개는 있음).
 * 하나로 통일했다 — 동작 차이는 없다.
 */
const useAptResidentUuid = () => {
  return useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid ?? ''
  })
}

/**
 * 예약 목록 (MH1).
 *
 * ⚠️ **페이징이 없다.** 무한 스크롤을 붙이지 않는다.
 * ✅ 필터 초기값이 레거시는 빈 객체 `{}`였다 — 의도는 전체 조회이므로 `undefined`로 시작한다
 * (`moving-house.md` MH-Q6 · `deferred.md` D-91).
 */
export const useMovingHouseList = ({
  moveReservationStatus,
}: {
  moveReservationStatus: string | undefined
}) => {
  const aptResidentUuid = useAptResidentUuid()

  const { data: movingHouseList, isLoading: isMovingHouseListLoading } = useQuery({
    queryKey: ['movingHouseList', aptResidentUuid, moveReservationStatus],
    queryFn: () => {
      return getMovingHouseList({ aptResidentUuid, moveReservationStatus })
    },
  })

  return { movingHouseList, isMovingHouseListLoading }
}

/**
 * 예약 상세 (MH2).
 *
 * ⚠️ **쿼리 키에 `aptResidentUuid`가 없다** — 이 도메인의 다른 4개 훅에는 있다.
 * `movingUuid`가 전역 유일하다는 가정이다. 레거시 그대로 뒀다
 * (`moving-house.md` MH-Q4).
 */
export const useMovingHouseDetail = () => {
  const aptResidentUuid = useAptResidentUuid()
  const { movingUuid = '' } = useParams()

  const { data: movingHouseDetail, isLoading: isMovingHouseDetailLoading } = useQuery({
    queryKey: ['movingHouseDetail', movingUuid],
    queryFn: () => {
      return getMovingHouseDetail({ aptResidentUuid, movingUuid })
    },
    enabled: Boolean(movingUuid),
  })

  return { movingHouseDetail, isMovingHouseDetailLoading }
}

/** 단지 설정 (MH2·MH3·MH4). `chargeFlag`가 세 화면의 6곳을 바꾼다 */
export const useMovingHouseSetting = () => {
  const aptResidentUuid = useAptResidentUuid()

  const { data: movingHouseSetting, isLoading: isMovingHouseSettingLoading } = useQuery({
    queryKey: ['movingHouseSetting', aptResidentUuid],
    queryFn: () => {
      return getMovingHouseSetting({ aptResidentUuid })
    },
  })

  return { movingHouseSetting, isMovingHouseSettingLoading }
}

/**
 * 선택한 날짜의 시간대 슬롯 (MH3·MH4).
 *
 * ✅ **레거시는 `select` 안에서 외부 ref에 라디오 목록을 대입했다.** `useMemo` 파생으로
 * 옮겼다 — `select`는 실행 횟수가 보장되지 않는 순수 변환 자리다 (`moving-house.md` §4-3).
 *
 * ⚠️ **`moveDate`가 없으면 오늘로 조회한다.** 레거시 변수명이 `formattedToday`인
 * 이유이고, MH2·MH4는 날짜를 넘기지 않아 실제로 오늘 것을 받는다.
 */
export const useMovingHouseReservationTimeList = ({ moveDate }: { moveDate?: Date } = {}) => {
  const aptResidentUuid = useAptResidentUuid()

  const formattedDate =
    formatObjectDate({ date: moveDate, type: 'hyphen' }) ??
    formatObjectDate({ date: new Date(), type: 'hyphen' })

  const {
    data: movingHouseReservationTimeList,
    isLoading: isMovingHouseReservationTimeListLoading,
  } = useQuery({
    queryKey: ['movingHouseReservationTimeList', aptResidentUuid, formattedDate],
    queryFn: () => {
      return getMovingHouseReservationTimeList({ aptResidentUuid, moveDate: formattedDate })
    },
  })

  const timeSlotRadioList = useMemo(() => {
    return toTimeSlotRadioList({
      slotList: movingHouseReservationTimeList,
      moveDate: formattedDate,
    })
  }, [movingHouseReservationTimeList, formattedDate])

  return {
    movingHouseReservationTimeList,
    timeSlotRadioList,
    isMovingHouseReservationTimeListLoading,
  }
}

/** 휴무일 범위 목록 (MH3) */
export const useMovingHouseHolidayList = () => {
  const aptResidentUuid = useAptResidentUuid()

  const { data: movingHouseHolidayList, isLoading: isMovingHouseHolidayListLoading } = useQuery({
    queryKey: ['movingHouseHolidayList', aptResidentUuid],
    queryFn: () => {
      return getMovingHouseHolidayList({ aptResidentUuid })
    },
  })

  return { movingHouseHolidayList, isMovingHouseHolidayListLoading }
}

/**
 * 예약 취소 (MH2).
 *
 * ⚠️ **뒤로 간 다음 토스트를 띄운다** — 토스트가 목록 화면에서 보인다. 레거시 순서 그대로다.
 */
export const useDeleteMovingHouseReceipt = () => {
  const aptResidentUuid = useAptResidentUuid()
  const { movingUuid = '' } = useParams()
  const navigate = useNavigate()

  const { mutate: deleteMovingHouseReceiptMutation, isPending: isDeleteMovingHouseReceiptPending } =
    useMutation({
      mutationFn: () => {
        return deleteMovingHouseReceipt({ aptResidentUuid, movingUuid })
      },
      onSuccess: () => {
        void navigate(-1)
        showToast({ message: MOVING_HOUSE_TOAST_MESSAGE.delete })
      },
      onError: (error: ApiError) => {
        showErrorModal({ text: error.message })
      },
    })

  return { deleteMovingHouseReceiptMutation, isDeleteMovingHouseReceiptPending }
}

/**
 * 예약 등록 (MH4).
 *
 * ⚠️ **신축 입주 에러코드 4종만 전용 문구로 바꾸고 나머지는 서버 원문을 띄운다** —
 * `switch`가 아니라 맵 조회다.
 *
 * ✅ **레거시는 `mutateAsync`를 화면에서 `await`만 하고 잡지 않아 unhandled rejection이
 * 남았다.** `mutate` + `onSuccess`로 바꿨다 — 화면 동작(성공 시 완료 모달, 실패 시 에러
 * 모달)은 같다 (`moving-house.md` MH-Q14 · `deferred.md` D-98).
 */
export const usePostMovingHouse = ({ onCreated }: { onCreated: () => void }) => {
  const aptResidentUuid = useAptResidentUuid()

  const setMovingHouseFormData = useMovingHouseFormStore((state) => {
    return state.setMovingHouseFormData
  })

  const { mutate: postMovingHouseMutation, isPending: isPostMovingHousePending } = useMutation({
    mutationFn: (formData: MovingHouseFormData) => {
      return postMovingHouse({
        aptResidentUuid,
        moveType: formData.moveType,
        moveDate: formatObjectDate({ date: formData.moveDate, type: 'hyphen' }),
        moveReservationTimeUuid: formData.moveTime,
        depositorName: formData.depositorName,
        emergencyPhone: cleanPhoneHyphen({ phone: formData.emergencyPhone ?? '' }),
        memo: formData.memo,
      })
    },
    onSuccess: () => {
      setMovingHouseFormData(undefined)
      onCreated()
    },
    onError: (error: ApiError) => {
      showErrorModal({
        text: MOVING_HOUSE_ERROR_MESSAGE[error.code ?? ''] ?? error.message,
      })
    },
  })

  return { postMovingHouseMutation, isPostMovingHousePending }
}
