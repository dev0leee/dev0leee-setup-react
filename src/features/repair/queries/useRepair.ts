import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import {
  deleteRepairReceipt,
  getRepairDetail,
  getRepairList,
  getRepairStatusCount,
  patchRepairSubmission,
  postRepairSubmission,
} from '@/features/repair/api/repair'
import { REPAIR_TOAST_MESSAGE } from '@/features/repair/constants/repair'
import type { RepairListItemData } from '@/features/repair/types/repair'
import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import { useUploadProgress } from '@/shared/hooks/useUploadProgress'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'
import { convertFormDataFile } from '@/shared/utils/convertFormDataFile'

/**
 * 하자보수 쿼리. 레거시 `lib/queries/repair/*` 6개 이식.
 *
 * ✅ **쿼리 키에 `aptUuid`와 `aptResidentUuid`가 전부 들어 있다** — 이 도메인이 단지
 * 전환에 가장 안전하다.
 *
 * ⚠️ **어느 mutation도 무효화를 부르지 않는다.** 전부 `navigate(-1)`로 화면을 떠나고
 * `staleTime: 0`이라 재조회돼서 눈에 띄지 않는다 (`repair.md` RP-Q7). 레거시 그대로다.
 */
const useAptKeys = () => {
  const aptInfo = useAuthStore((state) => {
    return state.aptInfo
  })

  return {
    aptUuid: aptInfo.aptUuid ?? '',
    aptResidentUuid: aptInfo.aptResidentUuid ?? '',
  }
}

/** 상태별 접수 건수 (RP1) */
export const useRepairStatusCount = () => {
  const { aptUuid, aptResidentUuid } = useAptKeys()

  const { data: repairStatusCount } = useQuery({
    queryKey: ['repairStatusCount', aptUuid, aptResidentUuid],
    queryFn: () => {
      return getRepairStatusCount({ aptUuid, aptResidentUuid })
    },
    enabled: Boolean(aptUuid) && Boolean(aptResidentUuid),
  })

  return { repairStatusCount }
}

/** 접수 목록 (RP1). 필터 파라미터는 `state`다 */
export const useRepairList = ({ state }: { state: string | undefined }) => {
  const { list, isListLoading, hasListNextPage, fetchListNextPage } =
    useInfiniteList<RepairListItemData>({
      queryKey: 'repairList',
      defaultStoreKey: ['aptResidentUuid', 'aptUuid'],
      fetchFunction: getRepairList,
      additionalParams: { state },
    })

  return {
    repairList: list?.pages ?? [],
    totalElements: list?.pageable.totalElements ?? 0,
    isRepairListLoading: isListLoading,
    hasRepairListNextPage: hasListNextPage,
    fetchRepairListNextPage: fetchListNextPage,
  }
}

/** 접수 상세 (RP3·RP4) */
export const useRepairDetail = ({ repairUuid }: { repairUuid: string }) => {
  const { aptUuid, aptResidentUuid } = useAptKeys()

  const { data: repairDetail, isLoading: isRepairDetailLoading } = useQuery({
    queryKey: ['repairDetail', aptUuid, aptResidentUuid, repairUuid],
    queryFn: () => {
      return getRepairDetail({ aptUuid, aptResidentUuid, repairUuid })
    },
    // ⚠️ 레거시에는 `enabled`가 없어 uuid 없이도 요청이 나갔다. 안전하게 막았다
    enabled: Boolean(aptUuid) && Boolean(aptResidentUuid) && Boolean(repairUuid),
  })

  return { repairDetail, isRepairDetailLoading }
}

/** 접수 취소 (RP4). 성공하면 뒤로 가고 목록에서 토스트가 보인다 */
export const useDeleteRepairReceipt = ({ repairUuid }: { repairUuid: string }) => {
  const navigate = useNavigate()
  const { aptUuid, aptResidentUuid } = useAptKeys()

  const { mutate: deleteRepairReceiptMutation, isPending: isDeleteRepairReceiptPending } =
    useMutation({
      mutationFn: () => {
        return deleteRepairReceipt({ aptUuid, aptResidentUuid, repairUuid })
      },
      onSuccess: () => {
        void navigate(-1)
        showToast({ message: REPAIR_TOAST_MESSAGE.delete })
      },
      onError: (error: ApiError) => {
        showErrorModal({ text: error.message })
      },
    })

  return { deleteRepairReceiptMutation, isDeleteRepairReceiptPending }
}

/** 제출 페이로드. 값이 없는 선택 항목은 **키 자체를 만들지 않는다** */
export interface RepairSubmitPayload {
  location: string | null
  content: string | null
  fileList: (File | { fileUuid: string })[]
  emergencyPhone?: string
  requirement?: string
}

/** 접수 등록 (RP2). 업로드 진행률을 함께 돌려준다 */
export const usePostRepairSubmission = () => {
  const navigate = useNavigate()
  const { aptUuid, aptResidentUuid } = useAptKeys()
  const { progressPercent, onUploadProgress, onUploadSuccess, onUploadError } = useUploadProgress()

  const { mutate: postRepairSubmissionMutation, isPending: isPostRepairSubmissionPending } =
    useMutation({
      mutationFn: (payload: RepairSubmitPayload) => {
        return postRepairSubmission({
          aptUuid,
          aptResidentUuid,
          formData: convertFormDataFile({ ...payload }),
          onUploadProgress,
        })
      },
      onSuccess: () => {
        onUploadSuccess()
        void navigate(-1)
        showToast({ message: REPAIR_TOAST_MESSAGE.create })
      },
      onError: (error: ApiError) => {
        onUploadError()
        showErrorModal({ text: error.message })
      },
    })

  return { postRepairSubmissionMutation, isPostRepairSubmissionPending, progressPercent }
}

/** 접수 수정 (RP3) */
export const usePatchRepairSubmission = ({ repairUuid }: { repairUuid: string }) => {
  const navigate = useNavigate()
  const { aptUuid, aptResidentUuid } = useAptKeys()
  const { progressPercent, onUploadProgress, onUploadSuccess, onUploadError } = useUploadProgress()

  const { mutate: patchRepairSubmissionMutation, isPending: isPatchRepairSubmissionPending } =
    useMutation({
      mutationFn: (payload: RepairSubmitPayload) => {
        return patchRepairSubmission({
          aptUuid,
          aptResidentUuid,
          repairUuid,
          formData: convertFormDataFile({ ...payload }),
          onUploadProgress,
        })
      },
      onSuccess: () => {
        onUploadSuccess()
        void navigate(-1)
        showToast({ message: REPAIR_TOAST_MESSAGE.edit })
      },
      onError: (error: ApiError) => {
        onUploadError()
        showErrorModal({ text: error.message })
      },
    })

  return { patchRepairSubmissionMutation, isPatchRepairSubmissionPending, progressPercent }
}
