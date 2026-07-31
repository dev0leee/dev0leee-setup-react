import { useEffect, useState } from 'react'

import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { fetchCertificationField, KMC_REQUEST_URL } from '@/shared/lib/certification'
import type { CertButtonProps, CertificationField } from '@/shared/types/cert'

/**
 * KMC 본인인증 시작 버튼. 레거시 `views/TermsOfUseView/CertButton.vue` 이식.
 *
 * ⚠️ **진짜 `<form method="post">`로 외부 사이트에 제출한다.** fetch·XHR로 바꿀 수 없다 —
 * 사용자를 KMC 페이지로 **이동**시켜야 하고, 그 이동을 브라우저가 해야 한다.
 * 따라서 **`onSubmit`에서 `preventDefault()`를 부르면 안 된다.** 핸들러 자체를 달지 않는다.
 *
 * ⚠️ hidden 필드 이름 4개(`tr_cert`·`tr_add`·`tr_ver`·`tr_url`)는 **KMC와의 계약**이다.
 * `tr_url`은 인증 후 돌아올 우리 앱의 **절대 URL**이다.
 *
 * ⚠️ 마운트 시 인증 필드를 받아온다. **응답 전에 눌리면 빈 값으로 제출된다** — 레거시도
 * 같아서 그대로 뒀다. 실제로는 필수 약관 동의를 먼저 해야 버튼이 활성화돼 시간이 벌린다
 * (`deferred.md` D-211).
 */
export const CertButton = ({
  responseUrl,
  text,
  type,
  disabled = false,
  className,
  roundType = 'rounded',
  size = 'xl',
}: CertButtonProps) => {
  const [certificationField, setCertificationField] = useState<CertificationField>({})

  // 외부 시스템에서 값을 받아오는 일이므로 effect가 맞다. 화면에 그리는 값이 아니라
  // 제출에 실릴 값이라 쿼리 캐시에 둘 이유가 없다(레거시도 그냥 ref였다).
  useEffect(() => {
    const loadCertificationField = async () => {
      try {
        setCertificationField((await fetchCertificationField({ type })) ?? {})
      } catch (error) {
        console.error('[CertButton] KMC 인증 필드 조회에 실패했습니다.', error)
      }
    }

    void loadCertificationField()
  }, [type])

  return (
    <form name="reqKMCISForm" method="post" action={KMC_REQUEST_URL} className={className}>
      <input type="hidden" name="tr_cert" value={certificationField.tr_cert ?? ''} />
      <input type="hidden" name="tr_add" value={certificationField.tr_add ?? ''} />
      <input type="hidden" name="tr_ver" value={certificationField.tr_ver ?? ''} />
      <input type="hidden" name="tr_url" value={responseUrl} />
      <ButtonBase
        type="submit"
        roundType={roundType}
        hasOutline={disabled}
        color="brand"
        size={size}
        disabled={disabled}
      >
        {text}
      </ButtonBase>
    </form>
  )
}
