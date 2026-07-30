import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'

/**
 * 주차 마일리지 도넛. 레거시 `MainCardParkingMileageChart.vue`(ApexCharts `radialBar`)를
 * **recharts로 옮겼다** (`decisions/tech-choices.md` 0-5).
 *
 * ApexCharts 설정값을 그대로 재현한다:
 *
 * | ApexCharts                    | recharts                                    |
 * | ----------------------------- | ------------------------------------------- |
 * | `height/width: 74`            | 컨테이너 74×74                              |
 * | `hollow.size: '68%'`          | `innerRadius="68%"` · `outerRadius="100%"`   |
 * | `startAngle: 0, endAngle: 360`| `startAngle={90} endAngle={-270}` (12시→시계) |
 * | `track.background`            | `background={{ fill: TRACK_COLOR }}`         |
 * | `dataLabels.value`            | 중앙 텍스트를 겹쳐 그린다                    |
 *
 * ⚠️ **각도 기준이 다르다.** ApexCharts는 12시에서 시작해 시계방향이고, recharts는 3시가
 * `0`이며 반시계가 양수다. 그래서 `90 → -270`으로 적어야 같은 그림이 된다.
 *
 * ⚠️ 중앙 텍스트를 recharts `label`이 아니라 겹친 `div`로 그린다 — ApexCharts의
 * `offsetY: 6`(중앙에서 6px 아래)을 그대로 맞추기 쉽고, 폰트 굵기·색도 그대로 준다.
 */
const CHART_SIZE = 74
const PROGRESS_COLOR = '#0037BE'
const TRACK_COLOR = '#E5E7EB'

/** 중앙 텍스트를 정중앙에서 6px 내린다 (ApexCharts `offsetY: 6`) */
const CENTER_TEXT_OFFSET_Y = 6

export const MainCardParkingMileageChart = ({
  total,
  remaining,
}: {
  total?: number
  remaining?: number
}) => {
  const percent = (() => {
    const totalValue = Number(total)
    const remainingValue = Number(remaining)

    if (!Number.isFinite(totalValue) || totalValue <= 0) return 0
    if (!Number.isFinite(remainingValue)) return 0

    return (remainingValue / totalValue) * 100
  })()

  return (
    <div className="relative" style={{ width: CHART_SIZE, height: CHART_SIZE }}>
      <RadialBarChart
        width={CHART_SIZE}
        height={CHART_SIZE}
        data={[{ value: percent }]}
        innerRadius="68%"
        outerRadius="100%"
        startAngle={90}
        endAngle={-270}
      >
        {/* 도메인을 고정해야 값이 0~100 비율로 그려진다. 눈금·축선은 숨긴다 */}
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
        <RadialBar
          dataKey="value"
          fill={PROGRESS_COLOR}
          background={{ fill: TRACK_COLOR }}
          cornerRadius={0}
          isAnimationActive={false}
        />
      </RadialBarChart>

      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translateY(${String(CENTER_TEXT_OFFSET_Y)}px)`,
          color: PROGRESS_COLOR,
          fontWeight: 800,
          fontSize: '15px',
        }}
      >
        {Math.floor(percent)}%
      </span>
    </div>
  )
}
