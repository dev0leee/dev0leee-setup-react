import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EnergyUsageChart } from '@/features/managementFee/charts/EnergyUsageChart'
import { MonthlyComparisonChart } from '@/features/managementFee/charts/MonthlyComparisonChart'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { DrawerMonth } from '@/shared/components/common/DrawerMonth'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { cn } from '@/shared/utils/cn'

const now = new Date()

// Mock data - TODO: API 연동 시 실제 데이터로 교체
const generateMonthlyData = () => {
  const amounts = [277000, 288030, 210070] // TODO: API 연동 시 실제 데이터로 교체

  return Array.from({ length: 3 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (2 - index), 1)

    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      amount: amounts[index] ?? 0,
    }
  })
}

const MOCK_DATA = {
  totalAmount: 210070,
  /** ⚠️ MF1은 `'납부완료'`(공백 없음)다. 이쪽만 공백이 있다 */
  paymentStatus: '납부 완료',
  monthlyData: generateMonthlyData(),
}

const ENERGY_DATA = [
  { label: '동일면적 평균', value: 61642 },
  { label: '우리집', value: 48750 },
]

/** 우리집이 강조된다 */
const SELECTED_ENERGY_INDEX = 1

/**
 * 관리비 조회 (MF2). 레거시 `ManagementFeeInfoView.vue`(524줄) 이식.
 *
 * 🔴 **진입 경로가 없는 미완성 화면이다.** 메뉴·카드·딥링크 어디에도
 * `/managementFee/info`가 없고 데이터가 전부 하드코딩 목업이다.
 * **`MF-Q1` 확정에 따라 목업째로 이관했다** — 나중에 API가 붙을 때 UI를 다시 만들지
 * 않아도 되게 한다. **진입 경로도 만들지 않는다.**
 *
 * ⚠️ **`TODO` 주석을 유지한다** — 미완성 표시가 사라지면 안 된다.
 * ⚠️ **`12,892원`·`-21%`는 템플릿에 손계산으로 박힌 리터럴이다** (`61642 - 48750`).
 * ⚠️ **월을 바꿔도 금액은 `210,070원` 그대로다** — `handleMonthChange`가 데이터를
 * 갱신하지 않는다(원본에 `// TODO: API 호출하여 해당 월 데이터 조회`만 있다).
 * 강조 막대와 전월 대비 문구만 바뀐다.
 * ⚠️ **가장 오래된 달을 고르면 `0원 많이 나왔어요.`** 가 된다 — 비교 대상이 없어
 * 차이가 `0`이고 `< 0`이 거짓이라 `많이`가 나온다.
 * ⚠️ **상단 카드만 테두리가 있다.** 차트 카드 2개는 없다.
 * ⚠️ **월 선택기 글씨가 MF1보다 작고 회색이다** — `!important`로 덮는다.
 * ⚠️ **`'납부 완료'`는 `'미납'`이 아니라 항상 초록이다.**
 */
export const ManagementFeeInfoPage = () => {
  const navigate = useNavigate()

  const [selected, setSelected] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  })

  const currentIndex = MOCK_DATA.monthlyData.findIndex((item) => {
    return item.year === selected.year && item.month === selected.month
  })

  const previousMonthDiff =
    currentIndex > 0
      ? (MOCK_DATA.monthlyData[currentIndex]?.amount ?? 0) -
        (MOCK_DATA.monthlyData[currentIndex - 1]?.amount ?? 0)
      : 0

  return (
    <div className="h-full w-full overflow-auto bg-neutral-b-gray-50">
      <div className="p-5">
        <div className="rounded-xl border border-neutral-b-gray-200 bg-base-b-white p-4">
          <div className="mb-2">
            <DrawerMonth
              selected={selected}
              hasNoPadding
              className="pretendard-13Medium !text-defaults-secondary-text-secondary"
              onChange={(yearMonth) => {
                // TODO: API 호출하여 해당 월 데이터 조회
                setSelected(yearMonth)
              }}
            />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <div className="pretendard-32Bold text-defaults-primary-text-primary">
              {MOCK_DATA.totalAmount.toLocaleString('ko-KR')}원
            </div>
            <div
              className={cn(
                'rounded-full px-2 py-1 pretendard-13Medium',
                MOCK_DATA.paymentStatus === '미납'
                  ? 'bg-alerts-error-background-error-primary text-alerts-error-text-error'
                  : 'bg-alerts-success-background-success-primary text-alerts-success-text-success',
              )}
            >
              {MOCK_DATA.paymentStatus}
            </div>
          </div>

          <ButtonBase
            type="button"
            className="w-full rounded-[8px]"
            onClick={() => {
              void navigate(ROUTE_PATH.MANAGEMENT_FEE_DETAIL)
            }}
          >
            관리비 내역 확인
          </ButtonBase>
        </div>

        <div className="mt-5 rounded-xl bg-base-b-white p-4">
          <div className="mb-1 pretendard-12Medium text-defaults-secondary-text-secondary">
            전월대비 관리비
          </div>
          <div className="pretendard-18SemiBold">
            <div className="text-defaults-primary-text-primary">지난 달보다</div>
            <div>
              <span className="text-brand-default-text-brand">
                {Math.abs(previousMonthDiff).toLocaleString('ko-KR')}원{' '}
                {previousMonthDiff < 0 ? '적게' : '많이'}
              </span>
              <span className="text-defaults-primary-text-primary"> 나왔어요. </span>
            </div>
          </div>
          <MonthlyComparisonChart
            monthlyData={MOCK_DATA.monthlyData}
            selectedMonth={selected.month}
          />
        </div>

        <div className="mt-5 rounded-xl bg-base-b-white p-4">
          <div className="mb-1 pretendard-12Medium text-defaults-secondary-text-secondary">
            에너지 사용현황
          </div>
          <div className="pretendard-16SemiBold">
            <div className="text-defaults-primary-text-primary">동일면적 평균보다</div>
            <div>
              {/* 61,642 - 48,750을 손으로 계산해 넣은 리터럴이다 */}
              <span className="text-brand-default-text-brand">12,892원 적게</span>
              <span className="text-defaults-primary-text-primary"> 쓰고있어요. </span>
            </div>
          </div>

          <div className="mt-4">
            <EnergyUsageChart energyData={ENERGY_DATA} selectedIndex={SELECTED_ENERGY_INDEX} />
          </div>

          <div className="rounded-lg bg-primary-pc-indigo-25 p-3 text-center pretendard-14Medium">
            전체 사용량 기준 평균 대비 <span className="text-brand-default-text-brand">-21%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
