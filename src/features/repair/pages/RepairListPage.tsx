import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { RepairListItem } from '@/features/repair/components/RepairListItem'
import { REPAIR_MESSAGE, REPAIR_STATUS_LIST } from '@/features/repair/constants/repair'
import { useRepairList, useRepairStatusCount } from '@/features/repair/queries/useRepair'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { TabCategory } from '@/shared/components/common/TabCategory'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { repairDetailPath, ROUTE_PATH } from '@/shared/constants/routes'
import { useInfiniteScrollPosition } from '@/shared/hooks/useInfiniteScrollPosition'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'

/**
 * 접수 목록 (RP1). 레거시 `RepairView.vue`(105 LOC) + `RepairList` + `RepairListItem` 이식.
 *
 * ✅ **무한 스크롤을 살렸다** (RP-Q4). 레거시는 관측 대상(`ref="target"`)을 템플릿에
 * 넣지 않아 **2페이지가 아예 로드되지 않았다** — 접수가 11건 이상이어도 10건만 보이고
 * `총 N건`과 어긋났다. 관측 요소를 목록 끝에 붙였다.
 *
 * ⚠️ **스크롤 복원 대상이 화면 전체다** — 접수 현황 카드까지 포함해 위치를 되살린다.
 *
 * ⚠️ **건수 키를 소문자로 만들어 찾는다**(`WAITING` → `waiting`). 레거시가
 * `toLocaleLowerCase()`를 썼는데 **터키어 로케일에서 `I`가 깨질 수 있어** `toLowerCase()`로
 * 옮겼다 — 한국어·영어 환경에서 결과는 같다.
 */
export const RepairListPage = () => {
  const navigate = useNavigate()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [state, setState] = useState<string | undefined>(undefined)

  const { repairStatusCount } = useRepairStatusCount()
  const { repairList, totalElements, hasRepairListNextPage, fetchRepairListNextPage } =
    useRepairList({ state })

  const { targetRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>()
  const { scrollContainerRef } = useInfiniteScrollPosition<HTMLDivElement>({
    rules: { moveFrom: '/detail', moveTo: [ROUTE_PATH.REPAIR_LIST] },
  })

  useEffect(() => {
    if (!hasRepairListNextPage || !isIntersecting) return

    fetchRepairListNextPage()
  }, [hasRepairListNextPage, isIntersecting, fetchRepairListNextPage])

  return (
    <div
      ref={scrollContainerRef}
      className="h-full w-full space-y-2 overflow-auto bg-defaults-secondary-background-secondary"
    >
      <section className="w-full space-y-4 border-b border-b-defaults-tertiary-border-tertiary bg-base-b-white px-5 pt-[18px] pb-[29px]">
        <h2 className="pretendard-16SemiBold">{REPAIR_MESSAGE.statusTitle}</h2>
        <ol className="flex gap-2">
          {REPAIR_STATUS_LIST.map((status) => {
            return (
              <li
                key={status.status}
                className="flex flex-1 flex-col items-center justify-center gap-2 self-stretch rounded-xl bg-base-b-white px-3 py-1.5 shadow-md"
              >
                <ChipBase color={status.color}>{status.label}</ChipBase>
                {/* ⚠️ 로딩 중에는 칩만 보이고 숫자가 없다 — 레거시 그대로 */}
                {repairStatusCount && (
                  <span className="outfit-20SemiBold">
                    {repairStatusCount[status.status.toLowerCase()] || 0}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
        <ButtonBase
          type="button"
          color="brand"
          roundType="rounded"
          onClick={() => {
            void navigate(ROUTE_PATH.REPAIR_CREATE)
          }}
        >
          {REPAIR_MESSAGE.submitButton}
        </ButtonBase>
      </section>

      <section className="flex h-full w-full flex-col items-start border-b border-b-defaults-tertiary-border-tertiary bg-base-b-white">
        <div className="flex w-full items-start justify-between px-6 py-4">
          <h2 className="pretendard-16SemiBold">{REPAIR_MESSAGE.historyTitle}</h2>
          <span className="pretendard-14SemiBold">총 {totalElements}건</span>
        </div>

        <TabCategory
          categories={REPAIR_STATUS_LIST.map((status) => {
            return { uuid: status.status, category: status.label }
          })}
          selectedIndex={selectedIndex}
          hasTotalType
          className="pb-4"
          onSelect={({ index, category }) => {
            setSelectedIndex(index)
            setState(category.uuid)
          }}
        />

        {repairList.length > 0 ? (
          <ul className="w-full space-y-3 px-5 pb-14">
            {repairList.map((item) => {
              return (
                <RepairListItem
                  key={item.repairUuid}
                  item={item}
                  onClick={() => {
                    void navigate(repairDetailPath({ repairUuid: item.repairUuid }))
                  }}
                />
              )
            })}
            {/* ✅ 레거시에 없던 관측 대상. 이게 없어 2페이지가 로드되지 않았다 (RP-Q4) */}
            <div ref={targetRef} className="w-full pt-4" />
          </ul>
        ) : (
          <div className="flex w-full justify-center py-28">
            <TextEmpty>{REPAIR_MESSAGE.listEmpty}</TextEmpty>
          </div>
        )}
      </section>
    </div>
  )
}
