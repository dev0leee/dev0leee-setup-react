import type { AptSearchResult, SignUpPayload, SignUpResult } from '@/features/signup/types/signup'
import { API_PREFIX } from '@/shared/constants/api'
import { publicApi } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'

/**
 * 회원가입 API. 레거시 `api/auth.js` 이식 (`endpoints.md` #3·#4).
 * 둘 다 **로그인 전**이므로 `publicApi`다.
 */

/**
 * 아파트 검색. `keyword`는 단지명 또는 지역명이다.
 *
 * ⚠️ 레거시는 빈 키워드로도 호출한다(`enabled` 가드 없음). 서버가 빈 키워드에 무엇을
 * 주는지는 확인되지 않았다 (`signup.md` S-Q6 · `deferred.md` D-29).
 */
export const getAptList = async ({ keyword }: { keyword: string }): Promise<AptSearchResult[]> => {
  const response = await publicApi.get<ServerSuccessBody<AptSearchResult[]>>(
    `${API_PREFIX.APARTMANT}/apt`,
    { params: { keyword } },
  )

  return response.data.success ?? []
}

/** 회원가입. 14필드를 한 번에 보낸다 */
export const postSignUp = async (payload: SignUpPayload): Promise<SignUpResult | undefined> => {
  const response = await publicApi.post<ServerSuccessBody<SignUpResult>>(
    `${API_PREFIX.APARTMANT}/sign-up`,
    payload,
  )

  return response.data.success
}
