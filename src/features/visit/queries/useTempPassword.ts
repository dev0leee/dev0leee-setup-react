import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  deleteTempPassword,
  getLobbyPhoneQrData,
  getTempPasswordList,
  postTempPassword,
} from '@/features/visit/api/visit'
import { lobbyPhoneQrQueryKey, tempPasswordListQueryKey } from '@/features/visit/constants/query'
import { LOBBY_PHONE_CONTENT_NAME, TEMP_PASSWORD_MESSAGE } from '@/features/visit/constants/visit'
import { ROUTE_PATH } from '@/shared/constants/routes'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 임시 비밀번호 목록 (V4).
 *
 * ⚠️ **조회에 실패하면 모달을 띄우고 `/main`으로 보낸다.** 이 화면에 머무를 수 없다 —
 * 그래서 화면의 "에러 시 회색 생성 버튼"은 사실상 볼 일이 없다. 레거시 그대로다.
 */
export const useTempPasswordList = () => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const {
    data: tempPasswordList,
    isLoading: isTempPasswordListLoading,
    isError: isTempPasswordListError,
  } = useQuery({
    queryKey: tempPasswordListQueryKey({ aptResidentUuid }),
    queryFn: () => {
      return getTempPasswordList({ aptResidentUuid: aptResidentUuid ?? '' })
    },
    enabled: Boolean(aptResidentUuid),
  })

  // 레거시 `watch(isError)`. 모달이 겹치지 않게 한 번만 실행한다
  const hasHandledErrorRef = useRef(false)

  useEffect(() => {
    if (!isTempPasswordListError || hasHandledErrorRef.current) return
    hasHandledErrorRef.current = true

    showErrorModal({
      text: TEMP_PASSWORD_MESSAGE.listError,
      callback: () => {
        void navigate(ROUTE_PATH.MAIN)
      },
    })
  }, [isTempPasswordListError, navigate])

  return { tempPasswordList, isTempPasswordListLoading, isTempPasswordListError }
}

/**
 * 임시 비밀번호 삭제 (V4).
 *
 * 🔴 **확인 모달이 없다.** 휴지통을 누르면 바로 지워진다 — 게시판·주차는 전부 확인
 * 모달을 거치는데 이 도메인만 다르다 (`deferred.md`). 등가 이관이라 그대로 둔다.
 */
export const useDeleteTempPassword = () => {
  const queryClient = useQueryClient()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: deleteTempPasswordMutation, isPending: isDeleteTempPasswordPending } =
    useMutation({
      mutationFn: ({ uuid }: { uuid: string }) => {
        return deleteTempPassword({ aptResidentUuid: aptResidentUuid ?? '', uuid })
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: tempPasswordListQueryKey({ aptResidentUuid }),
        })
        showToast({ message: TEMP_PASSWORD_MESSAGE.deleted })
      },
      onError: (error: ApiError) => {
        showErrorModal({ text: error.message })
      },
    })

  return { deleteTempPasswordMutation, isDeleteTempPasswordPending }
}

/**
 * 임시 비밀번호 생성 (V5).
 *
 * ⚠️ 레거시는 성공 후 **`history.go(-1)` + 50ms `setTimeout` + `navigateReplace`**로
 * "생성 화면을 히스토리에서 지우고 목록으로" 만들었다. 타이밍에 기대는 해킹이라
 * **`navigate(목록, { replace: true })` 한 줄로 옮겼다** — 결과(히스토리에 생성 화면이
 * 남지 않고 목록이 보임)가 같다 (`visit.md` V-Q7).
 *
 * ⚠️ **목록 무효화가 없다.** 레거시도 없고, 목록이 재마운트되며 `staleTime: 0`이라
 * 어차피 다시 조회된다.
 */
export const usePostTempPassword = () => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: postTempPasswordMutation, isPending: isPostTempPasswordPending } = useMutation({
    mutationFn: (params: {
      tempPasswordType: string
      startDate: string
      endDate: string
      description?: string
    }) => {
      return postTempPassword({ aptResidentUuid: aptResidentUuid ?? '', ...params })
    },
    onSuccess: () => {
      void navigate(ROUTE_PATH.VISIT_TEMP_PASSWORD_LIST, { replace: true })
      showToast({ message: TEMP_PASSWORD_MESSAGE.created })
    },
    onError: (error: ApiError) => {
      showErrorModal({ text: error.message })
    },
  })

  return { postTempPasswordMutation, isPostTempPasswordPending }
}

/**
 * 1회용 출입 QR 데이터 (V6).
 *
 * 🔴 **구독 판정에 `.trim()`이 없다.** 서버 값에 공백이 섞이면 QR이 아예 조회되지 않는다.
 * 레거시가 그렇고 `parking.md` PK-Q1과 같은 유형이다 (`visit.md` V-Q1).
 * **등가 이관이라 `trim` 없이 비교한다.**
 *
 * 🔴 레거시는 `contentList`에 옵셔널 체이닝이 없어 목록이 없으면 TypeError였다.
 * 안전하게 옮겼다 — 정상 응답에서는 결과가 같다.
 */
export const useLobbyPhoneQrData = () => {
  const aptInfo = useAuthStore((state) => {
    return state.aptInfo
  })

  // 🔴 trim 없음 — 레거시 그대로다 (V-Q1)
  const hasLobbyPhone = Boolean(
    aptInfo.contentList?.some((content) => {
      return content.name === LOBBY_PHONE_CONTENT_NAME
    }),
  )

  const { data: lobbyPhoneQrData } = useQuery({
    queryKey: lobbyPhoneQrQueryKey({ aptResidentUuid: aptInfo.aptResidentUuid }),
    queryFn: () => {
      return getLobbyPhoneQrData({ aptResidentUuid: aptInfo.aptResidentUuid ?? '' })
    },
    enabled: hasLobbyPhone && Boolean(aptInfo.aptResidentUuid),
  })

  return { lobbyPhoneQrData }
}
