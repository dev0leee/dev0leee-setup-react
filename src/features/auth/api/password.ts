import { API_PREFIX } from '@/shared/constants/api'
import { publicApi } from '@/shared/lib/apiClient'
import { readHeader } from '@/shared/lib/responseHeaders'

/**
 * 비밀번호 재설정 3단계 API. 레거시 `api/resident.js` 이식 (`endpoints.md` #14·15·16).
 *
 * 세 요청 모두 **로그인 전**이므로 `publicApi`다.
 */

/**
 * 문자 인증 경로. **`API_PREFIX.APARTMANT`(`/apartmant/resident`)와 다른 갈래다** —
 * 문자 발송은 입주민 API가 아니라 `/apartmant/sms` 아래에 있다. 접두사가 하나뿐이라
 * 공용 상수로 올리지 않고 여기서 소유한다.
 */
const SMS_PASSWORD_RESET_PATH = '/apartmant/sms/password-reset'

/** 인증번호 문자 발송. 하이픈을 뗀 번호를 `phone`으로 보낸다(필드명이 폼과 다르다) */
export const postPasswordResetSendCode = async ({ phone }: { phone: string }): Promise<void> => {
  await publicApi.post(`${SMS_PASSWORD_RESET_PATH}/send-code`, { phone })
}

/**
 * 인증번호 검증. **성공하면 재설정용 토큰이 응답 헤더로 온다.**
 *
 * ⚠️ 레거시는 뮤테이션 결과(`data.headers.authorization`)를 화면에서 직접 꺼냈다.
 * 헤더를 읽는 책임은 API 계층에서 끝내고 호출부에는 토큰만 넘긴다 —
 * 로그인(`postLogin`)과 같은 처리 방식이다.
 */
export const postPasswordResetCodeVerify = async ({
  code,
  phone,
}: {
  code: string
  phone: string
}): Promise<string | null> => {
  const response = await publicApi.post(`${SMS_PASSWORD_RESET_PATH}/code-verify`, { code, phone })

  return readHeader({ headers: response.headers, key: 'authorization' })
}

/**
 * 새 비밀번호 저장.
 *
 * ⚠️ **레거시가 이 요청만 별도 axios 인스턴스로 보냈다** — 아직 로그인 상태가 아니어서
 * 인터셉터가 붙일 액세스 토큰이 없고, 대신 A2에서 받은 인증 토큰을 직접 넣어야 하기
 * 때문이다(`endpoints.md` #14). 타깃에서는 `publicApi`에 헤더만 얹어 같은 결과를 만든다 —
 * `publicApi`는 애초에 토큰을 붙이지 않으므로 덮어쓸 것도 없다.
 */
export const patchPasswordReset = async ({
  token,
  password,
}: {
  token: string
  password: string
}): Promise<void> => {
  await publicApi.patch(
    `${API_PREFIX.APARTMANT}/re-set-password`,
    { password },
    { headers: { Authorization: `Bearer ${token}` } },
  )
}
