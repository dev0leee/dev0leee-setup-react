import { useNavigate } from 'react-router-dom'

import { ROUTE_PATH } from '@/shared/constants/routes'
import { TERMS_ITEMS } from '@/shared/constants/terms'

/**
 * 약관 및 정책 (P6). 레거시 `TermsOfUse/TermsOfUseView.vue` 이식.
 *
 * ⚠️ **표시하는 것은 `title`이다** (`label` 아님). `label`은 회원가입 동의
 * 체크박스용 문구(`~ 동의`)라 여기서 쓰면 문구가 달라진다.
 *
 * ⚠️ **화살표 아이콘이 없다.** 다른 메뉴 목록(마이페이지·알림)과 다르다. 레거시 그대로.
 */
export const TermsOfUsePage = () => {
  const navigate = useNavigate()

  return (
    <ul className="flex w-full flex-col items-start self-stretch bg-base-b-white">
      {TERMS_ITEMS.map((item) => {
        return (
          <li key={item.id} className="w-full">
            <button
              type="button"
              className="flex w-full items-center justify-between self-stretch px-5 py-4 text-left pretendard-15SemiBold text-base-b-black"
              onClick={() => {
                void navigate(`${ROUTE_PATH.TERMS_OF_USE_DETAIL}/${item.id}`)
              }}
            >
              {item.title}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
