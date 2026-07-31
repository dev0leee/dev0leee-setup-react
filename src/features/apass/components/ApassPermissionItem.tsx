import { APASS_CHECK_ICON, APASS_PERMISSION_ICON } from '@/features/apass/constants/apass'

/**
 * 권한 항목 카드 1개 (AP1). 레거시 `ApassPermissionItem.vue`(81 LOC) 이식.
 *
 * ⚠️ **누를 수 없다.** 상태만 보여주고 클릭 핸들러가 없다 — 사용자가 권한을 허용하려면
 * 직접 OS 설정으로 가야 한다 (`apass.md` AP-Q2).
 *
 * ⚠️ **높이가 `h-[52px]`로 고정이다.** 아이콘(20px) + 패딩(32px)이 딱 맞아서
 * **폰트 배율을 키우면 넘친다** — 등가 대조 시 확인 항목이다.
 *
 * ⚠️ **체크 아이콘의 alt가 상태를 구분하지 않는다** — 허용이든 아니든 `선택 아이콘`이다.
 */
export const ApassPermissionItem = ({
  type,
  title,
  isAllowed,
}: {
  type: string
  title: string
  isAllowed: boolean
}) => {
  const icon = APASS_PERMISSION_ICON[type]

  return (
    <div className="flex h-[52px] w-full flex-col gap-3 self-stretch rounded-lg border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-secondary p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <img
              className="h-5 w-5"
              src={isAllowed ? icon.on : icon.off}
              alt={`${icon.alt} ${isAllowed ? '활성' : '비활성'} 아이콘`}
            />
          )}
          <p className="pretendard-15Medium">{title}</p>
        </div>
        <img
          className="h-5 w-5"
          src={isAllowed ? APASS_CHECK_ICON.on : APASS_CHECK_ICON.off}
          alt={APASS_CHECK_ICON.alt}
        />
      </div>
    </div>
  )
}
