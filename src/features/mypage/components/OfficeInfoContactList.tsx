import { MYPAGE_EMPTY_TEXT } from '@/features/mypage/constants/mypage'
import { useOfficeContactList } from '@/features/mypage/queries/useOfficeInfo'
import { formatPhone } from '@/shared/utils/formatPhone'

/**
 * 관리사무소 부서별 연락처. 레거시 `OfficeInfoContactList.vue` 이식.
 *
 * ⚠️ **`tel:` 링크다.** 웹뷰에서 네이티브 전화 앱이 열린다 — 브릿지를 타지 않는다.
 * 실기기 확인 항목이다 (`mypage.md` QA).
 *
 * ⚠️ 아이콘 두 개의 `alt`가 둘 다 `전화기 아이콘`이다 (제목의 `Phone.svg`,
 * 행의 `PhoneRing.svg`). 레거시 그대로.
 */
export const OfficeInfoContactList = () => {
  const { officeContactList } = useOfficeContactList()

  return (
    <div className="flex flex-col items-start gap-1 self-stretch border-b border-b-neutral-b-gray-200 bg-base-b-white px-5 py-4">
      <h2 className="flex items-center justify-center gap-1 px-2.5 py-[7px] pretendard-13SemiBold text-brand-default-text-brand">
        <img src="/assets/icons/Phone.svg" className="h-4 w-4" alt="전화기 아이콘" />
        <span>연락처</span>
      </h2>

      {officeContactList && officeContactList.length > 0 ? (
        <ul className="flex w-full flex-col items-start">
          {officeContactList.map((item, index) => {
            return (
              <li
                // 서버가 식별자를 주지 않는다. 레거시도 index를 key로 쓴다
                key={`${item.name ?? ''}-${index}`}
                className="flex w-full items-center justify-between px-2.5 py-3"
              >
                <span className="pretendard-15SemiBold text-neutral-b-gray-900">{item.name}</span>
                <a
                  className="flex items-center justify-end gap-[2px] pretendard-15Regular text-brand-default-text-brand underline underline-offset-4"
                  href={`tel:${item.phone ?? ''}`}
                >
                  <img src="/assets/icons/PhoneRing.svg" className="h-4 w-4" alt="전화기 아이콘" />
                  <span>{formatPhone({ phone: item.phone })}</span>
                </a>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="flex h-[100px] w-full items-center justify-center pretendard-15Regular text-neutral-b-gray-900">
          {MYPAGE_EMPTY_TEXT.OFFICE_CONTACT}
        </p>
      )}
    </div>
  )
}
