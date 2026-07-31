import type {
  FireInspectionAnswerPayload,
  FireInspectionDetailData,
  FireInspectionStatusData,
} from '@/features/fireInspection/types/fireInspection'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * 소방 자가점검 API 3개. 레거시 `api/fireInspection.js` 이식 (`endpoints.md` #137~#139).
 *
 * ⚠️ **접두사가 게시판(`/board/resident`)이다.** 도메인 분류상 어긋나지만 서버 경로다.
 */
const fireInspectionPath = ({ aptResidentUuid }: { aptResidentUuid: string }) => {
  return `${API_PREFIX.BOARD}/${aptResidentUuid}/fire-inspection`
}

export const getFireInspectionStatus = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<FireInspectionStatusData[] | undefined> => {
  const response = await api.get<ServerSuccessBody<FireInspectionStatusData[]>>(
    fireInspectionPath({ aptResidentUuid }),
  )

  return response.data.success
}

export const getFireInspectionDetail = async ({
  aptResidentUuid,
  fireInspectionUuid,
  householdFireInspectionUuid,
}: {
  aptResidentUuid: string
  fireInspectionUuid: string
  householdFireInspectionUuid: string
}): Promise<FireInspectionDetailData | undefined> => {
  const response = await api.get<ServerSuccessBody<FireInspectionDetailData>>(
    `${fireInspectionPath({ aptResidentUuid })}/${fireInspectionUuid}/household/${householdFireInspectionUuid}`,
  )

  return response.data.success
}

/**
 * 점검표 제출 (#138). **multipart**다.
 *
 * ⚠️ **`FormData` 키가 `questionAnswerList[N].field` 형식이다** — Spring MVC의 중첩 리스트
 * 바인딩이다. **한 글자만 달라도 서버 바인딩이 전부 실패한다.**
 * 21개 항목 × 4필드 = 84개 필드 + 서명 파일 1개가 나간다.
 */
export const postFireInspectionSubmit = async ({
  aptResidentUuid,
  householdFireInspectionUuid,
  signatureFile,
  questionAnswerList,
}: {
  aptResidentUuid: string
  householdFireInspectionUuid: string
  signatureFile: File
  questionAnswerList: FireInspectionAnswerPayload[]
}): Promise<void> => {
  const formData = new FormData()
  formData.append('signatureFile', signatureFile)

  questionAnswerList.forEach((item, index) => {
    formData.append(`questionAnswerList[${index}].sectionId`, item.sectionId)
    formData.append(`questionAnswerList[${index}].groupId`, item.groupId)
    formData.append(`questionAnswerList[${index}].questionId`, item.questionId)
    formData.append(`questionAnswerList[${index}].answer`, item.answer)
  })

  await api.post(
    `${fireInspectionPath({ aptResidentUuid })}/${householdFireInspectionUuid}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
}
