import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import {
  getFireInspectionDetail,
  getFireInspectionStatus,
  postFireInspectionSubmit,
} from '@/features/fireInspection/api/fireInspection'
import { FIRE_INSPECTION_ERROR_MESSAGE } from '@/features/fireInspection/constants/fireInspection'
import type { FireInspectionAnswerPayload } from '@/features/fireInspection/types/fireInspection'
import { ROUTE_PATH } from '@/shared/constants/routes'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 소방점검 쿼리 3개. 레거시 `lib/queries/fireInspection/*` 이식.
 *
 * ✅ **이 도메인의 `invalidateQueries`는 원래부터 v5 객체 형식이다** — 레거시 28곳 중
 * 몇 안 되는 정상 호출이다(가장 늦게 개발된 기능이라 그렇다). 되돌리지 않았다.
 */
const useAptResidentUuid = () => {
  return useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid ?? ''
  })
}

/**
 * 점검 회차 목록 (F1).
 *
 * ⚠️ **쿼리 키에 `aptResidentUuid`가 없다** — 단지를 전환해도 이전 단지의 목록이 남는다
 * (`fire-inspection.md` F-Q6). 레거시 그대로 뒀다.
 *
 * ⚠️ **레거시가 반환하던 `refetchInspectionStatus`는 호출부가 0곳이라 옮기지 않았다.**
 */
export const useFireInspectionStatus = () => {
  const aptResidentUuid = useAptResidentUuid()

  const { data: inspectionStatusData, isLoading: isInspectionStatusLoading } = useQuery({
    queryKey: ['fireInspectionStatus'],
    queryFn: () => {
      return getFireInspectionStatus({ aptResidentUuid })
    },
  })

  return { inspectionStatusData, isInspectionStatusLoading }
}

/**
 * 점검 상세 (F4).
 *
 * ⚠️ **레거시 `select`가 `normalCount`·`defectiveCount`·`notApplicableCount` 3개를 세는데
 * 화면이 하나도 쓰지 않는다** — 집계 요약을 만들려다 만 흔적이라 옮기지 않았다.
 */
export const useFireInspectionDetail = () => {
  const aptResidentUuid = useAptResidentUuid()
  const { fireInspectionUuid = '', householdFireInspectionUuid = '' } = useParams()

  const { data: inspectionDetail, isLoading: isInspectionDetailLoading } = useQuery({
    queryKey: ['fireInspectionDetail', fireInspectionUuid, householdFireInspectionUuid],
    queryFn: () => {
      return getFireInspectionDetail({
        aptResidentUuid,
        fireInspectionUuid,
        householdFireInspectionUuid,
      })
    },
    enabled: Boolean(fireInspectionUuid) && Boolean(householdFireInspectionUuid),
  })

  return { inspectionDetail, isInspectionDetailLoading }
}

/**
 * 점검표 제출 (F2b).
 *
 * ⚠️ **화면을 먼저 바꾸고 그 다음에 무효화한다** — F1로 돌아왔을 때 최신 상태가 보장된다.
 * 순서를 바꾸지 않는다.
 *
 * ⚠️ **완료 화면으로 `replace` 이동한다** — 히스토리에 점검 화면이 남지 않는다.
 * 라우터 가드(`app/navigationBlocking.ts`)가 popstate까지 막아 이중으로 차단된다.
 */
export const usePostFireInspectionResult = () => {
  const aptResidentUuid = useAptResidentUuid()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutate: submitInspectionResult, isPending: isSubmitPending } = useMutation({
    mutationFn: (payload: {
      householdFireInspectionUuid: string
      signatureFile: File
      questionAnswerList: FireInspectionAnswerPayload[]
    }) => {
      return postFireInspectionSubmit({ aptResidentUuid, ...payload })
    },
    onSuccess: async () => {
      await navigate(ROUTE_PATH.FIRE_INSPECTION_COMPLETE, { replace: true })
      await queryClient.invalidateQueries({ queryKey: ['fireInspectionStatus'] })
    },
    onError: (error: ApiError) => {
      showErrorModal({
        text: FIRE_INSPECTION_ERROR_MESSAGE[error.code ?? ''] ?? error.message,
      })
    },
  })

  return { submitInspectionResult, isSubmitPending }
}
