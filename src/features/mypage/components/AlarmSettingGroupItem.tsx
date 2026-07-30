import type { AlarmSettingItem } from '@/features/mypage/types/mypage'
import { ToggleBase } from '@/shared/components/common/ToggleBase'
import { cn } from '@/shared/utils/cn'

/**
 * 알림 그룹 하나. 레거시 `AlarmSettingMenuGroupItem.vue` 이식.
 *
 * ⚠️ **마지막 항목만 아래 테두리가 없다.** 그룹 자체에 `border-b`가 있어 겹치면
 * 선이 두 겹으로 보인다.
 *
 * ⚠️ **`isDisabled`를 넘기지 않는다.** 레거시가 광고성 항목에 `isDisabled`를
 * 정의해두고 이 컴포넌트에서는 `isPending`만 `disabled`로 넘긴다 — 즉 정의된 값이
 * 무시된다. 마케팅 미동의 상태에서도 광고성 토글을 누를 수 있고, 누르면
 * 마케팅까지 켜진다 (`deferred.md` D-46). 그대로 재현했다.
 *
 * ⚠️ 부가 설명이 빈 문자열이어도 `span`이 그려진다 — 레거시에 `v-if`가 없어서
 * 항목 높이에 영향이 있다. 조건 렌더로 바꾸면 여백이 달라진다.
 */
export const AlarmSettingGroupItem = ({
  title,
  items,
}: {
  title: string
  items: AlarmSettingItem[]
}) => {
  return (
    <div className="border-neutral-20 flex flex-col items-start gap-0.5 self-stretch border-b bg-base-b-white p-4">
      <div className="flex items-center justify-center gap-2.5 px-2.5 py-1.5">
        <h2 className="pretendard-14SemiBold text-defaults-secondary-text-secondary">{title}</h2>
      </div>
      <ul className="w-full">
        {items.map((item, index) => {
          return (
            <li
              key={item.key}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-2.5 py-4',
                index !== items.length - 1 &&
                  'border-b border-defaults-secondary-background-secondary',
              )}
            >
              <div className="flex flex-col items-start gap-1.5">
                <span className="text-neutral-90 pretendard-15SemiBold">{item.label}</span>
                <span className="w-full pretendard-12Regular text-defaults-secondary-text-secondary">
                  {item.info}
                </span>
              </div>
              <ToggleBase
                disabled={item.isPending}
                checked={item.isActive ?? false}
                onChange={item.onChange}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
