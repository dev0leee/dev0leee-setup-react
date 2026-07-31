import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import {
  deleteAlwaysAllowCar,
  deleteBookmarkCar,
  patchBookmarkCar,
  postAlwaysAllowCar,
  postBookmarkCar,
} from '@/features/parking/api/carManagement'
import { CAR_HANDLED_ERROR_CODES, CAR_TOAST_MESSAGE } from '@/features/parking/constants/parking'
import {
  ALWAYS_ALLOW_CAR_LIST_QUERY_KEY,
  BOOKMARK_CAR_LIST_QUERY_KEY,
} from '@/features/parking/constants/query'
import { showCarMutationError } from '@/features/parking/queries/carMutationError'
import type { AlwaysAllowCarForm, BookmarkCarForm } from '@/features/parking/schemas/carManagement'
import { ROUTE_PATH } from '@/shared/constants/routes'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'
import { cleanPhoneHyphen } from '@/shared/utils/cleanPhoneHyphen'

/**
 * 차량관리 mutation 5종. 레거시 `lib/queries/parking/*.js` 이식.
 *
 * ⚠️ **레거시 `invalidateQueries(['key'])`는 v4 위치인자다.** v5에서는 조용히 no-op이
 * 되므로 전부 `{ queryKey: [...] }`로 옮겼다 (`tech-mapping.md` R6).
 *
 * ⚠️ **`phone`은 전송 직전에 하이픈을 뺀다.** 입력창은 하이픈이 있는 상태로 들고
 * 스키마도 그 상태를 검증한다 — 왕복 규칙을 깨면 서버 값이 달라진다.
 */
const useInvalidateCarList = () => {
  const queryClient = useQueryClient()

  return (queryKey: string) => {
    void queryClient.invalidateQueries({ queryKey: [queryKey] })
  }
}

/** 즐겨찾기 등록 (PK5). 성공하면 **뒤로** 간다 */
export const usePostBookmarkCar = () => {
  const navigate = useNavigate()
  const invalidateCarList = useInvalidateCarList()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: postBookmarkCarMutation, isPending: isPostBookmarkCarPending } = useMutation({
    mutationFn: ({ carNum, nickName, phone }: BookmarkCarForm) => {
      return postBookmarkCar({
        aptResidentUuid: aptResidentUuid ?? '',
        carNum,
        nickName,
        phone: cleanPhoneHyphen({ phone }),
      })
    },
    onSuccess: () => {
      invalidateCarList(BOOKMARK_CAR_LIST_QUERY_KEY)
      void navigate(-1)
      showToast({ message: CAR_TOAST_MESSAGE.bookmarkCreated })
    },
    onError: (error: ApiError) => {
      showCarMutationError({ error, handledCodes: CAR_HANDLED_ERROR_CODES.postBookmark })
    },
  })

  return { postBookmarkCarMutation, isPostBookmarkCarPending }
}

/**
 * 즐겨찾기 수정 (PK7).
 *
 * ⚠️ **성공 시 `navigate(-1)`이 아니라 목록으로 이동한다.** 등록과 달라 히스토리 스택이
 * 쌓이고, 수정 후 뒤로 가면 목록이 아니라 **그 이전 화면**으로 간다. 레거시 그대로다.
 */
export const usePatchBookmarkCar = () => {
  const navigate = useNavigate()
  const invalidateCarList = useInvalidateCarList()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: patchBookmarkCarMutation, isPending: isPatchBookmarkCarPending } = useMutation({
    mutationFn: ({
      bookmarkUuid,
      carNum,
      nickName,
      phone,
    }: BookmarkCarForm & { bookmarkUuid: string }) => {
      return patchBookmarkCar({
        aptResidentUuid: aptResidentUuid ?? '',
        bookmarkUuid,
        carNum,
        nickName,
        phone: cleanPhoneHyphen({ phone }),
      })
    },
    onSuccess: () => {
      invalidateCarList(BOOKMARK_CAR_LIST_QUERY_KEY)
      void navigate(ROUTE_PATH.PARKING_CAR_BOOKMARK_LIST)
      showToast({ message: CAR_TOAST_MESSAGE.updated })
    },
    // 전용 분기가 없다 — 전부 서버 원문이다
    onError: (error: ApiError) => {
      showCarMutationError({ error, handledCodes: CAR_HANDLED_ERROR_CODES.none })
    },
  })

  return { patchBookmarkCarMutation, isPatchBookmarkCarPending }
}

/** 항상허용 등록 (PK6). 토스트 문구만 다르다 */
export const usePostAlwaysAllowCar = () => {
  const navigate = useNavigate()
  const invalidateCarList = useInvalidateCarList()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: postAlwaysAllowCarMutation, isPending: isPostAlwaysAllowCarPending } =
    useMutation({
      mutationFn: ({
        carNum,
        phone,
        visitPurpose,
        memo,
        parkingWallPadAlarm,
      }: AlwaysAllowCarForm) => {
        return postAlwaysAllowCar({
          aptResidentUuid: aptResidentUuid ?? '',
          carNum,
          phone: cleanPhoneHyphen({ phone }),
          visitPurposeUuid: visitPurpose.uuid,
          memo,
          notificationFlag: parkingWallPadAlarm,
        })
      },
      onSuccess: () => {
        invalidateCarList(ALWAYS_ALLOW_CAR_LIST_QUERY_KEY)
        void navigate(-1)
        showToast({ message: CAR_TOAST_MESSAGE.alwaysAllowCreated })
      },
      onError: (error: ApiError) => {
        showCarMutationError({ error, handledCodes: CAR_HANDLED_ERROR_CODES.postAlwaysAllow })
      },
    })

  return { postAlwaysAllowCarMutation, isPostAlwaysAllowCarPending }
}

/** 즐겨찾기 삭제 (PK3 드로어). **화면 이동이 없다** — 목록만 갱신된다 */
export const useDeleteBookmarkCar = () => {
  const invalidateCarList = useInvalidateCarList()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: deleteBookmarkCarMutation, isPending: isDeleteBookmarkCarPending } = useMutation({
    mutationFn: ({ bookmarkUuid }: { bookmarkUuid: string }) => {
      return deleteBookmarkCar({ aptResidentUuid: aptResidentUuid ?? '', bookmarkUuid })
    },
    onSuccess: () => {
      invalidateCarList(BOOKMARK_CAR_LIST_QUERY_KEY)
      showToast({ message: CAR_TOAST_MESSAGE.deleted })
    },
    onError: (error: ApiError) => {
      showCarMutationError({ error, handledCodes: CAR_HANDLED_ERROR_CODES.none })
    },
  })

  return { deleteBookmarkCarMutation, isDeleteBookmarkCarPending }
}

/** 항상허용 삭제 (PK4 드로어). 전용 에러 문구가 2개 있다 */
export const useDeleteAlwaysAllowCar = () => {
  const invalidateCarList = useInvalidateCarList()

  const { mutate: deleteAlwaysAllowCarMutation, isPending: isDeleteAlwaysAllowCarPending } =
    useMutation({
      mutationFn: ({ alwaysAllowUuid }: { alwaysAllowUuid: string }) => {
        return deleteAlwaysAllowCar({ alwaysAllowUuid })
      },
      onSuccess: () => {
        invalidateCarList(ALWAYS_ALLOW_CAR_LIST_QUERY_KEY)
        showToast({ message: CAR_TOAST_MESSAGE.deleted })
      },
      onError: (error: ApiError) => {
        showCarMutationError({ error, handledCodes: CAR_HANDLED_ERROR_CODES.deleteAlwaysAllow })
      },
    })

  return { deleteAlwaysAllowCarMutation, isDeleteAlwaysAllowCarPending }
}
