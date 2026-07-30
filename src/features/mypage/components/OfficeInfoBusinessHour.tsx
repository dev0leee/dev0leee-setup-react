import { BUSINESS_HOUR_LENGTH, MYPAGE_EMPTY_TEXT } from '@/features/mypage/constants/mypage'
import { useOfficeBusinessHours } from '@/features/mypage/queries/useOfficeInfo'
import { formatDay } from '@/shared/utils/formatDay'

/**
 * 관리사무소 운영시간. 레거시 `OfficeInfoBusinessHour.vue` 이식.
 *
 * ⚠️ 연락처 섹션과 달리 **`border-b`가 없다.** 마지막 섹션이라 선을 넣지 않았다.
 * ⚠️ `HH:mm:ss`를 `slice(0, 5)`로 잘라 `HH:mm`으로 만든다. 서버가 초까지 준다.
 */
export const OfficeInfoBusinessHour = () => {
  const { officeBusinessHours } = useOfficeBusinessHours()

  return (
    <div className="flex flex-col items-start gap-1 self-stretch bg-base-b-white px-5 py-4">
      <h2 className="flex items-center justify-center gap-1 px-2.5 py-[7px] pretendard-13SemiBold text-brand-default-text-brand">
        <img src="/assets/icons/Clock.svg" className="h-4 w-4" alt="시간 아이콘" />
        <span>운영시간</span>
      </h2>

      {officeBusinessHours && officeBusinessHours.length > 0 ? (
        <ul className="flex w-full flex-col items-start">
          {officeBusinessHours.map((item) => {
            return (
              <li key={item.uuid} className="flex w-full items-center justify-between px-2.5 py-3">
                <span className="pretendard-15SemiBold text-neutral-b-gray-900">
                  {formatDay({ dayType: item.dayType })}
                </span>
                <div className="flex items-center justify-end gap-[2px] pretendard-15Regular text-brand-default-text-brand">
                  {item.startTime?.slice(0, BUSINESS_HOUR_LENGTH)}~
                  {item.endTime?.slice(0, BUSINESS_HOUR_LENGTH)}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="flex h-[100px] w-full items-center justify-center pretendard-15Regular text-neutral-b-gray-900">
          {MYPAGE_EMPTY_TEXT.OFFICE_BUSINESS_HOUR}
        </p>
      )}
    </div>
  )
}
