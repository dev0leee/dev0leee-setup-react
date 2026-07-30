export interface CertResponseProps {
  /** 쿼리스트링이 있을 때(정상 콜백) 호출된다 */
  onCertResponse: () => void
  /** "잘못된 접근입니다" 모달을 닫았을 때. 보통 이전 화면으로 되돌린다 */
  onAccessDenied: () => void
}
