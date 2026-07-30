import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ModalButton } from '@/shared/components/common/ModalButton'
import { ACCESS_DENIED_MODAL_DATA } from '@/shared/constants/message'
import type { CertResponseProps } from '@/shared/types/cert'

/**
 * 본인인증(KMC) 결과 수신 화면의 공통 껍데기. 레거시 `CertResponse.vue`.
 *
 * 외부 인증 서비스가 쿼리스트링을 붙여 이 화면으로 돌려보낸다.
 * **쿼리스트링이 하나도 없으면** 직접 URL을 친 것으로 보고 "잘못된 접근입니다" 모달을
 * 띄운다. 있으면 `onCertResponse`로 넘겨 각 도메인이 처리한다.
 *
 * 판정을 마운트 시 한 번만 한다 — 리다이렉트로 들어온 순간의 URL이 판단 근거이고,
 * 이후 쿼리가 정리돼도 다시 묻지 않아야 한다.
 */
export const CertResponse = ({ onCertResponse, onAccessDenied }: CertResponseProps) => {
  const [searchParams] = useSearchParams()
  const [isAccessDeniedOpen, setIsAccessDeniedOpen] = useState(false)

  useEffect(() => {
    if ([...searchParams.keys()].length === 0) {
      setIsAccessDeniedOpen(true)
      return
    }
    onCertResponse()
    // 마운트 시 한 번만. 이후 쿼리 변화로 다시 판정하지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClose = () => {
    setIsAccessDeniedOpen(false)
    onAccessDenied()
  }

  return (
    <ModalButton
      open={isAccessDeniedOpen}
      onClose={handleClose}
      buttonType="single"
      modalData={ACCESS_DENIED_MODAL_DATA}
      onFirstClick={handleClose}
    />
  )
}
