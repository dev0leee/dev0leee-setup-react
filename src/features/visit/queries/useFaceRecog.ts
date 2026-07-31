import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  deleteFaceRecog,
  getFaceRecogDetail,
  getFaceRecogList,
  postFaceRecog,
  putFaceRecog,
} from '@/features/visit/api/faceRegister'
import { FACE_RECOG_ERROR_MESSAGE, FACE_RECOG_MESSAGE } from '@/features/visit/constants/faceRecog'
import { faceRecogDetailQueryKey, faceRecogListQueryKey } from '@/features/visit/constants/query'
import { faceRegisterDetailPath, ROUTE_PATH } from '@/shared/constants/routes'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 안면인식 쿼리 (V7~V13). 레거시 `lib/queries/faceRegister/*` 5개 이식.
 *
 * ⚠️ **에러 문구는 전부 `FACE_RECOG_ERROR_MESSAGE[code] ?? 기본문구`다.** 서버 원문을
 * 그대로 보여주지 않는다 — 등록(POST)만 예외로, 미정의 코드일 때 서버 `message`를 쓴다.
 */

/** 에러코드를 문구로. 매핑에 없으면 화면별 기본 문구로 떨어진다 */
const toFaceRecogMessage = ({ error, fallback }: { error: ApiError; fallback: string }) => {
  return (error.code ? FACE_RECOG_ERROR_MESSAGE[error.code] : undefined) ?? fallback
}

/**
 * 얼굴 목록 (V7).
 *
 * ⚠️ **조회에 실패하면 모달을 띄우고 `/main`으로 보낸다.** 로비폰 화면(V3)이 아니라
 * 메인이다 — 레거시 그대로다.
 */
export const useFaceRecogList = () => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const {
    data: faceRecogList,
    isLoading: isFaceRecogListLoading,
    isError: isFaceRecogListError,
    error: faceRecogListError,
  } = useQuery({
    queryKey: faceRecogListQueryKey({ aptResidentUuid }),
    queryFn: () => {
      return getFaceRecogList({ aptResidentUuid: aptResidentUuid ?? '' })
    },
    enabled: Boolean(aptResidentUuid),
  })

  // 레거시 `watch(isError)`. 모달이 겹치지 않게 한 번만 띄운다
  const hasHandledErrorRef = useRef(false)

  useEffect(() => {
    if (!isFaceRecogListError || hasHandledErrorRef.current) return
    hasHandledErrorRef.current = true

    showErrorModal({
      text: toFaceRecogMessage({
        error: faceRecogListError as ApiError,
        fallback: FACE_RECOG_MESSAGE.listError,
      }),
      callback: () => {
        void navigate(ROUTE_PATH.MAIN)
      },
    })
  }, [isFaceRecogListError, faceRecogListError, navigate])

  return { faceRecogList, isFaceRecogListLoading, isFaceRecogListError }
}

/**
 * 얼굴 단건 (V8·V9).
 *
 * ⚠️ **조회에 실패하면 모달을 띄우고 목록(V7)으로 보낸다.** 목록 실패와 목적지가 다르다.
 */
export const useFaceRecogDetail = ({ faceRecogGuid }: { faceRecogGuid: string }) => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const {
    data: faceRecogDetail,
    isLoading: isFaceRecogDetailLoading,
    isError: isFaceRecogDetailError,
    error: faceRecogDetailError,
  } = useQuery({
    queryKey: faceRecogDetailQueryKey({ aptResidentUuid, faceRecogGuid }),
    queryFn: () => {
      return getFaceRecogDetail({ aptResidentUuid: aptResidentUuid ?? '', faceRecogGuid })
    },
    enabled: Boolean(aptResidentUuid) && Boolean(faceRecogGuid),
  })

  const hasHandledErrorRef = useRef(false)

  useEffect(() => {
    if (!isFaceRecogDetailError || hasHandledErrorRef.current) return
    hasHandledErrorRef.current = true

    showErrorModal({
      text: toFaceRecogMessage({
        error: faceRecogDetailError as ApiError,
        fallback: FACE_RECOG_MESSAGE.detailError,
      }),
      callback: () => {
        void navigate(ROUTE_PATH.VISIT_FACE_REGISTER_MANAGEMENT)
      },
    })
  }, [isFaceRecogDetailError, faceRecogDetailError, navigate])

  return { faceRecogDetail, isFaceRecogDetailLoading, isFaceRecogDetailError }
}

/**
 * 얼굴 삭제 (V8).
 *
 * 성공하면 **상세 캐시를 지우고**(`removeQueries`) 목록을 무효화한 뒤 목록으로 간다.
 * 상세를 무효화가 아니라 제거하는 이유는 그 항목이 더 이상 존재하지 않기 때문이다.
 */
export const useDeleteFaceRecog = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: deleteFaceRecogMutation, isPending: isFaceRecogDeletePending } = useMutation({
    mutationFn: ({ faceRecogGuid }: { faceRecogGuid: string }) => {
      return deleteFaceRecog({ aptResidentUuid: aptResidentUuid ?? '', faceRecogGuid })
    },
    onSuccess: (_, { faceRecogGuid }) => {
      queryClient.removeQueries({
        queryKey: faceRecogDetailQueryKey({ aptResidentUuid, faceRecogGuid }),
      })
      void queryClient.invalidateQueries({ queryKey: faceRecogListQueryKey({ aptResidentUuid }) })

      void navigate(ROUTE_PATH.VISIT_FACE_REGISTER_MANAGEMENT)
      showToast({ message: FACE_RECOG_MESSAGE.deleted })
    },
    onError: (error: ApiError) => {
      showErrorModal({
        text: toFaceRecogMessage({ error, fallback: FACE_RECOG_MESSAGE.deleteError }),
      })
    },
  })

  return { deleteFaceRecogMutation, isFaceRecogDeletePending }
}

/**
 * 얼굴 정보 수정 (V9).
 *
 * ⚠️ **무효화가 하나도 없다.** 상세는 `staleTime: 0`이라 되돌아가면 다시 조회되지만
 * **목록(V7)은 다녀와야 갱신된다** — 레거시 그대로다.
 */
export const usePutFaceRecog = () => {
  const navigate = useNavigate()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: putFaceRecogMutation, isPending: isFaceRecogPutPending } = useMutation({
    mutationFn: (params: {
      faceRecogGuid: string
      faceRecogName: string
      faceRecogDescription: string
    }) => {
      return putFaceRecog({ aptResidentUuid: aptResidentUuid ?? '', ...params })
    },
    onSuccess: (_, { faceRecogGuid }) => {
      void navigate(faceRegisterDetailPath({ guid: faceRecogGuid }))
      showToast({ message: FACE_RECOG_MESSAGE.updated })
    },
    onError: (error: ApiError) => {
      showErrorModal({ text: toFaceRecogMessage({ error, fallback: FACE_RECOG_MESSAGE.putError }) })
    },
  })

  return { putFaceRecogMutation, isFaceRecogPutPending }
}

/**
 * 얼굴 등록 (V11·V12).
 *
 * ⚠️ **실패해도 에러 모달을 띄우지 않는다.** 전용 실패 화면(V12)으로 보내면서 이름·비고·
 * 사유를 `state`로 넘긴다 — 이 도메인만의 패턴이다. 그래서 V12에서 바로 재시도할 수 있다.
 *
 * ⚠️ **미정의 에러코드일 때만 서버 `message`를 그대로 보여준다.** 다른 훅은 전부 화면별
 * 기본 문구로 떨어지는데 여기만 다르다.
 */
export const usePostFaceRecog = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })

  const { mutate: postFaceRecogMutation, isPending: isFaceRecogPostPending } = useMutation({
    mutationFn: (params: {
      faceRecogName: string
      faceRecogDescription?: string
      faceRecogFile: File
    }) => {
      return postFaceRecog({ aptResidentUuid: aptResidentUuid ?? '', ...params })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: faceRecogListQueryKey({ aptResidentUuid }) })
      void navigate(ROUTE_PATH.VISIT_FACE_REGISTER_COMPLETE)
    },
    onError: (error: ApiError, { faceRecogName, faceRecogDescription }) => {
      void navigate(ROUTE_PATH.VISIT_FACE_REGISTER_FAIL, {
        state: {
          name: faceRecogName,
          memo: faceRecogDescription ?? '',
          reason: toFaceRecogMessage({ error, fallback: error.message }),
        },
      })
    },
  })

  return { postFaceRecogMutation, isFaceRecogPostPending }
}
