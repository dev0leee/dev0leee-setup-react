import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getLobbyPhonePushAlarmState,
  patchWallPadNotification,
  putExternalPush,
  putLobbyPhonePushAlarmState,
  putRegularPush,
} from '@/features/mypage/api/alarm'
import { putMarketingConsent } from '@/features/mypage/api/mypage'
import { lobbyPhonePushAlarmQueryKey } from '@/features/mypage/constants/query'
import { showErrorModal } from '@/shared/lib/errorModal'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 알림 토글 뮤테이션 5종 + 로비폰 조회. 레거시 훅 6개를 한 파일로 모았다 —
 * 알림 설정 화면 하나만 쓰고, 파일을 나눠도 같은 보일러플레이트가 6번 반복된다.
 *
 * ⚠️ **공통 규칙 2개:**
 *  1. 응답 body(`success`)를 `data`로 들고 있다가 화면이 조회값보다 **우선** 쓴다
 *     (`mypage.md` P4 `getFlag`). 낙관적 업데이트도 무효화도 하지 않는다
 *  2. 실패하면 서버 메시지로 에러 모달을 띄운다. 토글은 되돌리지 않는다 —
 *     조회값을 그대로 다시 그리므로 화면은 실패 전 상태로 남는다
 */

/** 단지 컨텍스트에서 입주민 uuid를 꺼낸다. 알림 API 전부가 이것을 쓴다 */
const useAptResidentUuid = () => {
  return useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
}

const showApiErrorModal = (error: Error) => {
  showErrorModal({ text: error.message })
}

/** 정기 차량 입출차 알림 */
export const useRegularPushAlarm = () => {
  const aptResidentUuid = useAptResidentUuid()

  const { data, mutate, isPending } = useMutation({
    mutationFn: ({ regularPushFlag }: { regularPushFlag: boolean }) => {
      return putRegularPush({ aptResidentUuid: aptResidentUuid ?? '', regularPushFlag })
    },
    onError: showApiErrorModal,
  })

  return { regularPushResult: data, mutateRegularPush: mutate, isRegularPushPending: isPending }
}

/** 외부 차량 입출차 알림 */
export const useExternalPushAlarm = () => {
  const aptResidentUuid = useAptResidentUuid()

  const { data, mutate, isPending } = useMutation({
    mutationFn: ({ externalPushFlag }: { externalPushFlag: boolean }) => {
      return putExternalPush({ aptResidentUuid: aptResidentUuid ?? '', externalPushFlag })
    },
    onError: showApiErrorModal,
  })

  return { externalPushResult: data, mutateExternalPush: mutate, isExternalPushPending: isPending }
}

/** 우리집 월패드 입출차 알림 */
export const useWallPadAlarm = () => {
  const aptResidentUuid = useAptResidentUuid()

  const { data, mutate, isPending } = useMutation({
    mutationFn: ({
      wallPadParkingNotificationFlag,
    }: {
      wallPadParkingNotificationFlag: boolean
    }) => {
      return patchWallPadNotification({
        aptResidentUuid: aptResidentUuid ?? '',
        wallPadParkingNotificationFlag,
      })
    },
    onError: showApiErrorModal,
  })

  return { wallPadResult: data, mutateWallPad: mutate, isWallPadPending: isPending }
}

/**
 * 로비폰 세대호출 알림 조회.
 *
 * ⚠️ **로비폰 단지에서만 조회한다.** 미구독 단지에서 부르면 서버가 에러를 준다.
 * 판정 근거는 `contentList`이고, 그 값은 `useResidentDetailInfo`가 적재한다 —
 * 화면이 `hasLobbyPhone`을 넘겨준다.
 */
export const useLobbyPhonePushAlarm = ({ enabled }: { enabled: boolean }) => {
  const aptResidentUuid = useAptResidentUuid()
  const queryClient = useQueryClient()

  const { data: lobbyPhonePushAlarmState } = useQuery({
    queryKey: lobbyPhonePushAlarmQueryKey({ aptResidentUuid }),
    queryFn: () => {
      return getLobbyPhonePushAlarmState({ aptResidentUuid: aptResidentUuid ?? '' })
    },
    enabled: enabled && Boolean(aptResidentUuid),
  })

  const { mutate, isPending } = useMutation({
    // 본문이 없다. 서버가 현재 값을 뒤집는다
    mutationFn: () => {
      return putLobbyPhonePushAlarmState({ aptResidentUuid: aptResidentUuid ?? '' })
    },
    onSuccess: async () => {
      // 응답에 값이 없으니 재조회로만 결과를 안다. 다른 토글과 다른 유일한 지점이다.
      await queryClient.invalidateQueries({
        queryKey: lobbyPhonePushAlarmQueryKey({ aptResidentUuid }),
      })
    },
    onError: showApiErrorModal,
  })

  return {
    lobbyPhonePushAlarmState,
    mutateLobbyPhonePushAlarm: mutate,
    isLobbyPhonePushAlarmPending: isPending,
  }
}

/**
 * 마케팅·광고성 동의.
 *
 * `mutateAsync`를 쓴다 — 화면이 **응답을 기다린 뒤** 동의 일시를 토스트로 보여줘야 한다
 * (`mypage.md` P4). 응답 전에 토스트를 띄우면 이전 일시가 표시된다.
 */
export const useMarketingConsent = () => {
  const aptResidentUuid = useAptResidentUuid()

  const { data, mutateAsync, isPending } = useMutation({
    mutationFn: ({
      marketingDataConsentFlag,
      receiveAdvertsConsentFlag,
    }: {
      marketingDataConsentFlag: boolean
      receiveAdvertsConsentFlag: boolean
    }) => {
      return putMarketingConsent({
        aptResidentUuid: aptResidentUuid ?? '',
        marketingDataConsentFlag,
        receiveAdvertsConsentFlag,
      })
    },
    onError: showApiErrorModal,
  })

  return {
    marketingConsentResult: data,
    mutateMarketingConsent: mutateAsync,
    isMarketingConsentPending: isPending,
  }
}
