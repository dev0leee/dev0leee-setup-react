import { useState } from 'react'

import { VISIT_PURPOSE_MESSAGE } from '@/features/parking/constants/parking'
import type { VisitPurpose } from '@/features/parking/types/parking'
import { DrawerBase } from '@/shared/components/common/DrawerBase'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { cn } from '@/shared/utils/cn'

/** 로딩 스켈레톤 행 수. 레거시 값이다 */
const SKELETON_ROW_INDEXES = [0, 1, 2, 3, 4]

/**
 * 방문목적 선택 (PK6·PK12·PK13). 레거시 `VisitPurposeSelect.vue`(126 LOC) 이식.
 *
 * 읽기 전용 입력처럼 보이지만 실제로는 드로어를 여는 버튼이고, **값은 `{ name, uuid }`
 * 객체 통째로** 폼에 담긴다 — 전송 직전에 `uuid`만 꺼낸다.
 *
 * ⚠️ **드로어 제목이 placeholder와 같다.** 그래서 항상허용은 `방문 목적을 선택해주세요`,
 * 방문예약은 `방문 목적을 선택하세요`로 **문구가 갈린다** (`deferred.md` 「오타·표기」).
 *
 * ⚠️ 레거시는 `:value="inputValue.name"`에 옵셔널 체이닝이 없어 값이 없으면 템플릿이
 * 터질 구조다(PK-Q8). 화면은 실제로 동작하므로 **빈 문자열로 안전하게** 옮겼다 —
 * placeholder가 보이는 결과는 같다.
 *
 * ⚠️ 레거시는 `TextEmpty`(`<p>`) 안에 다시 `<p>`를 넣어 HTML 규격을 어긴다.
 * **클래스를 합쳐 한 요소로 그린다** — 보이는 결과가 같다.
 */
export const VisitPurposeSelect = ({
  id,
  value,
  list,
  isLoading,
  isError,
  placeholder,
  onChange,
}: {
  id: string
  value: VisitPurpose | undefined
  list: VisitPurpose[]
  isLoading: boolean
  isError: boolean
  placeholder: string
  onChange: (visitPurpose: VisitPurpose) => void
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="relative w-full"
        onClick={() => {
          setIsDrawerOpen(true)
        }}
      >
        <input
          id={id}
          name={id}
          type="text"
          readOnly
          value={value?.name ?? ''}
          placeholder={placeholder}
          className="flex h-10 w-full flex-col justify-center gap-[10px] self-stretch rounded-[4px] border border-defaults-tertiary-border-tertiary px-4 py-[10px] pretendard-16Regular text-defaults-primary-text-primary caret-brand-default-background-brand placeholder:text-defaults-tertiary-text-tertiary"
        />
        <img
          className="absolute top-1/2 right-[10px] h-4 w-4 translate-y-[-50%]"
          src="/assets/icons/DownArrowSmall.svg"
          alt="화살표 아이콘"
        />
      </button>

      <DrawerBase
        open={isDrawerOpen}
        title={placeholder}
        hasCloseButton
        onClose={() => {
          setIsDrawerOpen(false)
        }}
      >
        <div className="flex max-h-[70vh] w-full flex-col gap-3 overflow-auto px-5 py-4">
          {isLoading && (
            <div>
              {SKELETON_ROW_INDEXES.map((index) => {
                return (
                  <div
                    key={index}
                    className="flex items-center border-b border-b-defaults-tertiary-border-tertiary pb-4"
                  >
                    <SkeletonBase className="h-5 w-40 rounded" />
                  </div>
                )
              })}
            </div>
          )}

          {!isLoading && isError && (
            <TextEmpty className="flex-col py-10 text-center">
              {VISIT_PURPOSE_MESSAGE.error[0]}
              <br />
              {VISIT_PURPOSE_MESSAGE.error[1]}
            </TextEmpty>
          )}

          {!isLoading && !isError && list.length > 0 && (
            <ul>
              {list.map((visitPurpose, index) => {
                return (
                  <li
                    key={visitPurpose.uuid}
                    className={cn(
                      'flex items-center self-stretch p-4 text-center pretendard-16Regular text-defaults-primary-text-primary',
                      index !== list.length - 1 &&
                        'border-b border-b-defaults-tertiary-border-tertiary',
                    )}
                    onClick={() => {
                      onChange(visitPurpose)
                      setIsDrawerOpen(false)
                    }}
                  >
                    {visitPurpose.name}
                  </li>
                )
              })}
            </ul>
          )}

          {!isLoading && !isError && list.length === 0 && (
            <TextEmpty className="flex-col py-10 text-center">
              {VISIT_PURPOSE_MESSAGE.empty[0]}
              <br />
              {VISIT_PURPOSE_MESSAGE.empty[1]}
            </TextEmpty>
          )}
        </div>
      </DrawerBase>
    </>
  )
}
