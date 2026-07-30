export interface CertResponseProps {
  /** 쿼리스트링이 있을 때(정상 콜백) 호출된다 */
  onCertResponse: () => void
  /** "잘못된 접근입니다" 모달을 닫았을 때. 보통 이전 화면으로 되돌린다 */
  onAccessDenied: () => void
}

/** KMC 본인인증 진입 유형. 서버가 유형별로 다른 인증 필드를 준다 */
export const KMC_TYPE = {
  JOIN: 'JOIN',
  USER_VOTE: 'USER_VOTE',
  NON_USER_VOTE: 'NON_USER_VOTE',
} as const

export type KmcType = (typeof KMC_TYPE)[keyof typeof KMC_TYPE]

/**
 * KMC 폼에 실어 보내는 hidden 필드. **이름이 KMC와의 계약이므로 바꾸지 않는다.**
 * 서버가 `GET /apartmant/resident/kmc`로 내려준다.
 */
export interface CertificationField {
  tr_cert?: string
  tr_add?: string
  tr_ver?: string
}

export interface CertButtonProps {
  /** 인증 후 KMC가 돌려보낼 절대 URL. `env.VITE_BASE_URL`로 시작해야 한다 */
  responseUrl: string
  text: string
  type: KmcType
  disabled?: boolean
  className?: string
}

export interface TermsAgreeFormProps {
  certButtonText: string
  /** 앱 안의 콜백 경로. 절대 URL 조합은 이 컴포넌트가 한다 */
  certResponsePath: string
}
