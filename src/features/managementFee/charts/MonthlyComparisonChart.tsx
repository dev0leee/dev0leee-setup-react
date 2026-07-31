import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'

/** 선택 막대의 그라데이션 (가로 방향). 비선택은 단색 회색이다 */
const SELECTED_GRADIENT_ID = 'monthlyComparisonSelected'
const UNSELECTED_COLOR = '#D2D6DB'

export interface MonthlyAmount {
  year: number
  month: number
  amount: number
}

/**
 * 전월대비 관리비 — 가로 막대 (MF2 차트 ①).
 * 레거시 ApexCharts `horizontal: true` 옵션 250줄 중 이 차트 몫을 recharts로 대조 이관.
 *
 * | ApexCharts                          | recharts                                    |
 * | ----------------------------------- | ------------------------------------------- |
 * | `horizontal: true`                  | `layout="vertical"`                         |
 * | `barHeight: '40px'`                 | `barSize={40}`                              |
 * | `distributed: true`                 | `<Cell>` per 데이터                         |
 * | `borderRadius: 8` + `end`           | `radius={[0, 8, 8, 0]}`                     |
 * | `fill.gradient` `horizontal`        | `<linearGradient x1="0" x2="1">`            |
 * | `grid.padding` `top/bottom: -10`    | `margin={{ top: -10, bottom: -10 }}`        |
 * | `states.hover/active: 'none'`       | recharts 기본이 무효과 — 대응 불필요        |
 *
 * ⚠️ **선택 판정이 `month`만 본다** — 연도를 보지 않는다. 목업이라 12월→1월 경계가
 * 생기지 않지만 규칙은 그대로 옮겼다.
 *
 * ⚠️ **선택 막대의 라벨에만 뒤에 `>`가 붙는다.**
 * ⚠️ **라벨을 오른쪽으로 12px 민다** — 레거시가 `<style scoped>`의
 * `:deep(.apexcharts-data-labels text) { transform: translateX(12px) }`로 하던 것이다.
 */
export const MonthlyComparisonChart = ({
  monthlyData,
  selectedMonth,
}: {
  monthlyData: MonthlyAmount[]
  selectedMonth: number
}) => {
  const maxAmount = Math.max(
    ...monthlyData.map((item) => {
      return item.amount
    }),
    0,
  )

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        layout="vertical"
        data={monthlyData}
        margin={{ top: -10, bottom: -10, left: 0, right: 0 }}
      >
        <defs>
          <linearGradient id={SELECTED_GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0037BE" />
            <stop offset="100%" stopColor="#0082FE" />
          </linearGradient>
        </defs>

        <XAxis type="number" domain={[0, maxAmount]} hide />
        <YAxis
          type="category"
          dataKey="month"
          axisLine={false}
          tickLine={false}
          width={40}
          tick={({ x, y, payload }) => {
            const isSelected = Number(payload.value) === selectedMonth

            return (
              <text
                x={Number(x)}
                y={Number(y)}
                dy={4}
                textAnchor="end"
                fontSize={14}
                fontWeight={500}
                fill={isSelected ? '#111927' : '#6C727E'}
              >
                {payload.value}월
              </text>
            )
          }}
        />

        <Bar dataKey="amount" barSize={40} radius={[0, 8, 8, 0]} isAnimationActive={false}>
          {monthlyData.map((item) => {
            return (
              <Cell
                key={`${item.year}-${item.month}`}
                fill={
                  item.month === selectedMonth ? `url(#${SELECTED_GRADIENT_ID})` : UNSELECTED_COLOR
                }
              />
            )
          })}
          <LabelList
            dataKey="amount"
            content={({ x, y, height, index }) => {
              const item = monthlyData[Number(index)]
              if (!item) return null

              const isSelected = item.month === selectedMonth

              return (
                <text
                  // 레거시가 CSS로 12px 밀던 것을 좌표로 옮겼다
                  x={Number(x) + 12}
                  y={Number(y) + Number(height) / 2}
                  dy={5}
                  fontSize={16}
                  fontWeight={500}
                  fill={isSelected ? '#FCFCFD' : '#6C727E'}
                >
                  {item.amount.toLocaleString('ko-KR')}원{isSelected ? ' >' : ''}
                </text>
              )
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
