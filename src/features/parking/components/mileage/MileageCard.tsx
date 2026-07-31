/**
 * 마일리지 카드 1개 (PK2 상단). 레거시 `MileageCard.vue`(41 LOC) 이식.
 *
 * ⚠️ **숫자만 Outfit 폰트다** (`outfit-18SemiBold`). 단위(`시간`·`분`)는 Pretendard다.
 */
export const MileageCard = ({
  title,
  hours,
  minutes,
}: {
  title: string
  hours: number
  minutes: number
}) => {
  return (
    <div className="flex flex-1 flex-col items-start justify-between gap-3 self-stretch rounded-xl bg-white px-4 py-3 shadow-md">
      <span className="pretendard-14Bold break-keep text-defaults-secondary-text-secondary">
        {title}
      </span>
      <div className="flex flex-wrap items-end gap-1">
        <div className="flex items-end text-center">
          <span className="text-right outfit-18SemiBold">{hours || 0}</span>
          <span className="mb-1 pretendard-13SemiBold">시간</span>
        </div>
        <div className="flex items-end text-center">
          <span className="text-right outfit-18SemiBold">{minutes || 0}</span>
          <span className="mb-1 pretendard-13SemiBold">분</span>
        </div>
      </div>
    </div>
  )
}
