import { PHONE_AUTO_HYPHEN_REGEX } from '@/shared/constants/regex'
import { cleanPhoneHyphen } from '@/shared/utils/cleanPhoneHyphen'

/**
 * 전화번호에 하이픈을 넣는다. 레거시 `lib/utils/formatPhone.js` 이식.
 *
 * 분기 순서와 길이 조건을 그대로 옮겼다:
 *  - 8자리는 `1234-5678` (지역번호 없는 대표번호)
 *  - 9자리 미만·11자리 초과는 **원본을 그대로** 돌려준다 (입력 중인 값을 망가뜨리지 않는다)
 *  - `02`로 시작하면 지역번호 2자리로 끊는다
 *  - 그 외는 3-3/4-4
 */
export const formatPhone = ({ phone }: { phone: string | undefined }): string => {
  if (!phone) return ''

  const cleaned = cleanPhoneHyphen({ phone })

  if (cleaned.length === 8) {
    return cleaned.replace(/^(\d{4})(\d{4})$/, '$1-$2')
  }

  // 형식에 맞지 않으면 손대지 않는다. 입력 중에는 자릿수가 계속 바뀐다.
  if (cleaned.length < 9 || cleaned.length > 11) return phone

  if (cleaned.startsWith('02')) {
    return cleaned.replace(/^(\d{2})(\d{3,4})(\d{4})$/, '$1-$2-$3')
  }

  return cleaned.replace(PHONE_AUTO_HYPHEN_REGEX, '$1-$2-$3')
}
