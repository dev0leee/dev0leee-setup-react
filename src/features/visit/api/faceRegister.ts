import type { FaceRecog } from '@/features/visit/types/visit'
import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * 안면인식 얼굴 등록 API (V7~V13). 레거시 `api/faceRegister.js` 이식.
 *
 * ⚠️ **목록·등록·수정·삭제가 전부 같은 경로다.** 메서드로만 갈린다. 단건 조회만
 * 뒤에 `faceRecogGuid`가 붙는다 — 삭제는 경로가 아니라 **body**로 guid를 보낸다.
 */
const faceRecogPath = ({ aptResidentUuid }: { aptResidentUuid: string }) => {
  return `${API_PREFIX.APARTMANT}/${aptResidentUuid}/lobby-phone/face-recog`
}

export const getFaceRecogList = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<FaceRecog[]> => {
  const response = await api.get<ServerSuccessBody<FaceRecog[]>>(faceRecogPath({ aptResidentUuid }))

  return response.data.success ?? []
}

export const getFaceRecogDetail = async ({
  aptResidentUuid,
  faceRecogGuid,
}: {
  aptResidentUuid: string
  faceRecogGuid: string
}): Promise<FaceRecog | undefined> => {
  const response = await api.get<ServerSuccessBody<FaceRecog>>(
    `${faceRecogPath({ aptResidentUuid })}/${faceRecogGuid}`,
  )

  return response.data.success
}

/**
 * 얼굴 등록 (V11·V12).
 *
 * ⚠️ **`Content-Type`을 지정하지 않는다.** axios가 `FormData`를 보고 boundary까지
 * 알아서 붙인다. 게시판은 명시하는데 여기는 안 한다 — 결과는 같다.
 *
 * ⚠️ **비고는 값이 있을 때만 넣는다.** 빈 문자열을 보내지 않는다.
 * ⚠️ **`onUploadProgress`가 없다.** 진행률을 보여주지 않고 버튼만 잠근다.
 */
export const postFaceRecog = async ({
  aptResidentUuid,
  faceRecogName,
  faceRecogDescription,
  faceRecogFile,
}: {
  aptResidentUuid: string
  faceRecogName: string
  faceRecogDescription?: string
  faceRecogFile: File
}): Promise<void> => {
  const formData = new FormData()
  formData.append('faceRecogName', faceRecogName)
  if (faceRecogDescription) formData.append('faceRecogDescription', faceRecogDescription)
  formData.append('faceRecogFile', faceRecogFile)

  await api.post(faceRecogPath({ aptResidentUuid }), formData)
}

export const putFaceRecog = async ({
  aptResidentUuid,
  faceRecogGuid,
  faceRecogName,
  faceRecogDescription,
}: {
  aptResidentUuid: string
  faceRecogGuid: string
  faceRecogName: string
  faceRecogDescription: string
}): Promise<void> => {
  await api.put(faceRecogPath({ aptResidentUuid }), {
    faceRecogGuid,
    faceRecogName,
    faceRecogDescription,
  })
}

/**
 * 얼굴 등록 삭제 (V8).
 *
 * ⚠️ **DELETE에 body를 싣는다.** guid가 경로가 아니라 `{ faceRecogGuid }`로 간다 —
 * 서버 계약이라 그대로 옮긴다 (`endpoints.md` #123과 같은 패턴).
 */
export const deleteFaceRecog = async ({
  aptResidentUuid,
  faceRecogGuid,
}: {
  aptResidentUuid: string
  faceRecogGuid: string
}): Promise<void> => {
  await api.delete(faceRecogPath({ aptResidentUuid }), { data: { faceRecogGuid } })
}
