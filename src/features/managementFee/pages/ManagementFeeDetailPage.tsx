import { useState } from 'react'

import { ManagementFeeDetailSkeleton } from '@/features/managementFee/components/ManagementFeeDetailSkeleton'
import {
  useImposeYearMonths,
  useManagementFeeBill,
} from '@/features/managementFee/queries/useManagementFee'
import { DrawerMonth } from '@/shared/components/common/DrawerMonth'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import type { YearMonth } from '@/shared/types/drawerMonth'
import { cn } from '@/shared/utils/cn'

const EXPAND_ICON = {
  expanded: '/assets/icons/icon-minus-circle-common.svg',
  // ⚠️ 파일명이 비대칭이다 — 이쪽만 `icons`(복수)다. 실제 파일이 그렇다
  collapsed: '/assets/icons/icons-plus-circle-common.svg',
} as const

/** 레거시 `formatAmount` — 숫자만 돌려주고 `원`은 마크업이 붙인다 */
const formatAmount = (amount: number | undefined) => {
  return (amount ?? 0).toLocaleString('ko-KR')
}

/**
 * 관리비 상세 (MF1). 레거시 `ManagementFeeDetailView.vue`(336줄) 이식.
 *
 * **진입은 메인 관리비 카드가 유일하다** — 메인 메뉴에 관리비 항목이 없다.
 *
 * ⚠️ **월 선택기는 년월 목록이 로드되고 에러가 아닐 때만 보인다.** 고지서가 로딩·에러여도
 * 월 선택기는 남아 있다 — 년월 조회가 실패하면 **월 선택기까지 사라진다.**
 *
 * ⚠️ **에러 문구가 고정 텍스트다.** 서버 `message`를 쓰지 않고 재시도 버튼도 없다.
 *
 * ⚠️ **종료일에서 연도를 잘라낸다** — `2026.07.01 ~ 07.31`.
 *
 * ⚠️ **큰 금액과 `당월부과액`이 같은 값이다** — 큰 금액이 당월부과액이고,
 * `납기내 금액`은 거기에 미납금·연체료를 더한 합계다.
 *
 * ✅ **MF-Q5 결정 적용** — 자동이체 칩 조건을 `autoTransfer === 'Y'`로 바꿨다.
 * 레거시는 `!== 'N'`이라 **필드가 아예 없는 세대에도 칩이 떴다.**
 *
 * ✅ **MF-Q7 결정 적용** — 증감 표시를 `!= null`로 바꿔 `undefined`까지 거른다.
 * 레거시는 `!== null`만 봐서 필드가 없으면 **`▲ NaN원`** 이 보였다.
 *
 * ⚠️ **아코디언이 `<button>`이 아니라 `<div>`다** — 키보드 접근이 안 된다. 레거시 그대로다.
 */
export const ManagementFeeDetailPage = () => {
  const { imposeYearMonths, isImposeYearMonthsLoading, isImposeYearMonthsError } =
    useImposeYearMonths()

  // 년월 목록이 도착하면 가장 최신 달을 고른다. 레거시는 `DrawerMonth`가 스스로 했고
  // 그래서 refetch마다 선택이 튕겼다 (MF-Q8) — 부모가 소유하면 그 문제가 사라진다
  const [selected, setSelected] = useState<YearMonth | null>(null)
  const latest = [...(imposeYearMonths ?? [])].sort().reverse()[0]

  if (!selected && latest) {
    const [year, month] = latest.split('-')
    setSelected({ year: Number(year), month: Number(month) })
  }

  const { managementFeeBill, isManagementFeeBillLoading, isManagementFeeBillError } =
    useManagementFeeBill({ selected })

  const [isDueDateExpanded, setIsDueDateExpanded] = useState(false)
  const [isReductionsExpanded, setIsReductionsExpanded] = useState(false)

  const houseHolder = managementFeeBill?.houseHolder
  const imposeAmount = managementFeeBill?.imposeAmount
  const billInfo = managementFeeBill?.billInfo
  const itemDetails = managementFeeBill?.itemDetails ?? []
  const reductions = managementFeeBill?.reductions ?? []

  const dateRange = houseHolder
    ? `${houseHolder.periodStartDate?.replaceAll('-', '.')} ~ ${houseHolder.periodEndDate
        ?.replaceAll('-', '.')
        .slice(5)}`
    : ''

  const isPaid = houseHolder?.paymentFlag === 'Y'
  const paymentStatus = isPaid ? '납부완료' : '미납'
  // ✅ 레거시는 `autoTransfer !== 'N'`이라 필드가 없어도 칩이 떴다 (MF-Q5)
  const showAutoTransfer = houseHolder?.paymentFlag === 'N' && houseHolder.autoTransfer === 'Y'

  const isLoading = isManagementFeeBillLoading || isImposeYearMonthsLoading
  const isError = isManagementFeeBillError || isImposeYearMonthsError

  return (
    <div className="flex h-full w-full flex-col overflow-auto border-t border-defaults-secondary-border-secondary bg-defaults-secondary-background-mono">
      {!isImposeYearMonthsLoading && !isImposeYearMonthsError && selected && (
        <div className="bg-base-b-white px-5 pt-4 pb-3">
          <DrawerMonth
            selected={selected}
            availableYearmonths={imposeYearMonths}
            hasNoPadding
            onChange={setSelected}
          />
        </div>
      )}

      {isLoading ? (
        <ManagementFeeDetailSkeleton />
      ) : isError ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-base-b-white px-5 py-8 text-center pretendard-14Regular text-defaults-secondary-text-secondary">
          관리비 정보를 불러오는데 실패했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 bg-base-b-white px-5 pb-5">
            <div className="flex items-center justify-between">
              <span className="pretendard-13Medium text-defaults-primary-text-primary">
                {selected?.year}년 {selected?.month}월분 관리비
              </span>
              <span className="pretendard-13Medium text-defaults-secondary-text-secondary">
                {dateRange}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="pretendard-32Bold text-defaults-primary-text-primary">
                {formatAmount(imposeAmount?.imposeAmount)}원
              </div>
              <div
                className={cn(
                  'rounded-full px-2 py-1 pretendard-13Medium',
                  isPaid
                    ? 'bg-alerts-success-background-success-primary text-alerts-success-text-success'
                    : 'bg-alerts-error-background-error-primary text-alerts-error-text-error',
                )}
              >
                {paymentStatus}
              </div>
              {showAutoTransfer && (
                <div className="rounded-full bg-blue-s-info-100 px-2 py-1 pretendard-13Medium text-blue-s-info-500">
                  자동이체
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 bg-base-b-white">
            <div
              className="flex cursor-pointer items-center justify-between p-5"
              onClick={() => {
                setIsDueDateExpanded((expanded) => {
                  return !expanded
                })
              }}
            >
              <div className="flex items-center gap-2">
                <img
                  src={isDueDateExpanded ? EXPAND_ICON.expanded : EXPAND_ICON.collapsed}
                  alt={isDueDateExpanded ? '접기' : '펼치기'}
                  className="h-4 w-4"
                />
                <span className="pretendard-16SemiBold text-defaults-primary-text-primary">
                  납기내 금액
                </span>
              </div>
              <span className="pretendard-16SemiBold text-defaults-primary-text-primary">
                {formatAmount(billInfo?.beforeDeliveryAmountSum)}원
              </span>
            </div>

            {/* `pl-12`로 아이콘 폭만큼 들여쓴다 */}
            {isDueDateExpanded && (
              <div className="flex flex-col gap-3 bg-base-b-white pr-5 pl-12">
                {[
                  { label: '당월부과액', value: imposeAmount?.imposeAmount },
                  { label: '미납금', value: billInfo?.unpaidAmount },
                  { label: '미납연체료', value: billInfo?.unpaidLatefee },
                ].map((row) => {
                  return (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="pretendard-13Regular text-defaults-secondary-text-secondary">
                        {row.label}
                      </span>
                      <span className="pretendard-13Regular text-defaults-secondary-text-secondary">
                        {formatAmount(row.value)}원
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 아코디언 밖이라 항상 보인다 */}
            <div className="flex items-center justify-between p-5">
              <span className="pretendard-16SemiBold text-defaults-primary-text-primary">
                납기 후 청구 금액
              </span>
              <span className="pretendard-16SemiBold text-defaults-primary-text-primary">
                {formatAmount(billInfo?.afterDeliveryAmountSum)}원
              </span>
            </div>
          </div>

          {reductions.length > 0 && (
            <div className="mt-2 flex flex-col bg-base-b-white">
              <div
                className="flex cursor-pointer items-center gap-2 border-b border-neutral-b-gray-100 px-5 py-4"
                onClick={() => {
                  setIsReductionsExpanded((expanded) => {
                    return !expanded
                  })
                }}
              >
                <img
                  src={isReductionsExpanded ? EXPAND_ICON.expanded : EXPAND_ICON.collapsed}
                  alt={isReductionsExpanded ? '접기' : '펼치기'}
                  className="h-4 w-4"
                />
                {/* ⚠️ 같은 아코디언인데 `납기내 금액`과 위계가 다르다 (14Medium · secondary) */}
                <span className="pretendard-14Medium text-defaults-secondary-text-secondary">
                  할인내역
                </span>
              </div>

              {isReductionsExpanded && (
                <ul className="flex flex-col">
                  {reductions.map((reduction, index) => {
                    return (
                      <li
                        key={`${reduction.name}-${index}`}
                        className="flex items-center justify-between px-5 py-4"
                      >
                        <span className="pretendard-16Medium text-defaults-primary-text-primary">
                          {reduction.name}
                        </span>
                        <span className="pretendard-16SemiBold text-defaults-primary-text-primary">
                          {formatAmount(reduction.amount)}원
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-1 flex-col bg-base-b-white pb-8">
            <div className="border-b border-neutral-b-gray-100 px-5 py-4 pretendard-14Medium text-defaults-secondary-text-secondary">
              상세내역
            </div>

            {itemDetails.length > 0 ? (
              <ul className="flex flex-col">
                {itemDetails.map((item, index) => {
                  const diff = item.prevMonthComparedIncreOrDecreAmount
                  // ✅ `!= null`이라 `undefined`도 걸러진다 (MF-Q7)
                  const hasDiff = diff != null && diff !== 0

                  return (
                    <li
                      key={`${item.itemName}-${index}`}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      {/* ⚠️ `itemName`만 HTML로 렌더된다 — 금액은 텍스트다 */}
                      <span
                        className="pretendard-16Medium text-defaults-primary-text-primary"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml({ html: item.itemName ?? '' }),
                        }}
                      />
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="pretendard-16SemiBold text-defaults-primary-text-primary">
                          {formatAmount(item.thisMonthAmount)}원
                        </span>
                        {hasDiff && (
                          <span
                            className={cn(
                              'pretendard-12Regular',
                              diff < 0 ? 'text-blue-s-info-500' : 'text-alerts-error-text-error',
                            )}
                          >
                            {diff < 0 ? '▼' : '▲'} {formatAmount(Math.abs(diff))}원
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="flex flex-1 items-center justify-center pretendard-14Regular text-defaults-secondary-text-secondary">
                상세내역이 없습니다.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
