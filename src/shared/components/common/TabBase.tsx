import { useEffect, useRef, useState } from 'react'

import type { TabBaseProps } from '@/shared/types/tab'

/**
 * 밑줄 인디케이터가 움직이는 탭. 레거시 `TabBase.vue`.
 *
 * ⚠️ 인디케이터 위치를 **DOM 측정(`offsetLeft`/`offsetWidth`)으로** 잡는다.
 * 탭 개수·라벨 길이가 화면마다 달라 CSS만으로는 폭을 맞출 수 없다.
 * 측정은 외부 시스템(레이아웃) 읽기이므로 `useLayoutEffect` 대신
 * 페인트 전 반영이 필요한 첫 렌더에서만 문제가 되는데, 레거시도 `onMounted`
 * 이후에 잡으므로 동작이 같다.
 *
 * shadcn `tabs`를 쓰지 않았다 — 인디케이터를 이렇게 측정 기반으로 움직이지 않는다.
 */
export const TabBase = ({ tabList, selectedIndex, onSelect }: TabBaseProps) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const current = tabRefs.current[selectedIndex]
    if (!current) return

    setIndicator({ left: current.offsetLeft, width: current.offsetWidth })
    // 라벨이 바뀌면 폭도 바뀐다.
  }, [selectedIndex, tabList])

  return (
    <ul className="relative flex h-12 w-full overflow-auto border-b border-b-defaults-secondary-border-secondary bg-base-b-white py-0">
      {tabList.map((tab, index) => {
        return (
          <li key={tab.label} className="flex w-full items-center justify-center">
            <button
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              type="button"
              className={`flex h-full w-full items-center justify-center transition-colors ${
                selectedIndex === index
                  ? 'pretendard-16Bold text-brand-default-text-brand'
                  : 'pretendard-16Regular text-defaults-secondary-text-secondary'
              }`}
              onClick={() => {
                onSelect({ index, tab })
              }}
            >
              {tab.label}
            </button>
          </li>
        )
      })}
      <div
        className="absolute bottom-0 h-0.5 bg-brand-default-background-brand transition-all duration-300 ease-in-out"
        style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
      />
    </ul>
  )
}
