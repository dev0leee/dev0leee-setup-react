import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * A-PASS API. 레거시 `api/apass.js` 이식.
 *
 * ⚠️ **토글 API가 본문을 받지 않는다** — 서버가 현재 값을 뒤집는다. 그래서 "켜라/꺼라"를
 * 지정할 수 없고, 호출 전에 앱이 알려준 디바이스 상태와 서버 상태를 비교해 **다를 때만**
 * 부른다. 그 비교가 유일한 방향 제어 수단이다 (`apass.md` §4-3).
 */
export const getIsApassActive = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<{ apassOnOffFlag?: boolean } | undefined> => {
  const response = await api.get<ServerSuccessBody<{ apassOnOffFlag?: boolean }>>(
    `${API_PREFIX.APARTMANT}/a-pass/${aptResidentUuid}/apass-on-off-flag`,
  )

  return response.data.success
}

export const patchApassActive = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<void> => {
  await api.patch(`${API_PREFIX.APARTMANT}/a-pass/${aptResidentUuid}/apass-on-off-flag`)
}
