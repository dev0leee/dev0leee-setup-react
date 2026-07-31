import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const SELECTED_GRADIENT_ID = 'energyUsageSelected'
const UNSELECTED_COLOR = '#6C727E'

/** 말풍선 치수. 레거시 annotation의 `padding`이 상하 비대칭(8/10)이라 그대로 옮겼다 */
const BUBBLE = {
  paddingX: 12,
  paddingTop: 8,
  paddingBottom: 10,
  fontSize: 12,
  radius: 8,
  offsetY: -15,
} as const

export interface EnergyUsage {
  label: string
  value: number
}

/**
 * 에너지 사용현황 — 세로 막대 + 말풍선 (MF2 차트 ②).
 *
 * 🔴 **recharts에는 annotation 개념이 없다.** 레거시가 `annotations.points`로 만들던
 * 다크 말풍선을 **`<LabelList content>`에서 둥근 사각형 + 텍스트로 직접 그린다** —
 * 이 도메인 이관의 가장 큰 작업이었다.
 *
 * ⚠️ **그라데이션 방향이 차트 ①과 반대다** — 이쪽은 `#0082FE → #0037BE`(아래→위)다.
 * ⚠️ **`dataLabels`가 꺼져 있다** — 말풍선이 그 역할을 대신한다.
 * ⚠️ **①과 달리 x축 축선이 보인다** (`axisBorder.show: true`).
 *
 * ⚠️ **x축 라벨 색이 배열 하드코딩이다**(`['#6C727E', '#111927']`) — `selectedIndex`를
 * 보지 않는다. 즉 **선택이 바뀌어도 라벨 색은 그대로**고 막대 색만 따라간다.
 * 비대칭이지만 레거시 그대로 옮겼다.
 */
export const EnergyUsageChart = ({
  energyData,
  selectedIndex,
}: {
  energyData: EnergyUsage[]
  selectedIndex: number
}) => {
  const maxValue = Math.max(
    ...energyData.map((item) => {
      return item.value
    }),
    0,
  )
  const labelColors = ['#6C727E', '#111927']

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={energyData} margin={{ top: 20, right: -40, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={SELECTED_GRADIENT_ID} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0082FE" />
            <stop offset="100%" stopColor="#0037BE" />
          </linearGradient>
        </defs>

        <XAxis
          dataKey="label"
          axisLine
          tickLine={false}
          tick={({ x, y, payload, index }) => {
            return (
              <text
                x={Number(x)}
                y={Number(y)}
                dy={-3 + 14}
                textAnchor="middle"
                fontSize={12}
                fontWeight={500}
                fill={labelColors[index] ?? UNSELECTED_COLOR}
              >
                {payload.value}
              </text>
            )
          }}
        />
        <YAxis domain={[0, maxValue]} hide />

        <Bar dataKey="value" barSize={24} radius={[8, 8, 0, 0]} isAnimationActive={false}>
          {energyData.map((item, index) => {
            return (
              <Cell
                key={item.label}
                fill={index === selectedIndex ? `url(#${SELECTED_GRADIENT_ID})` : UNSELECTED_COLOR}
              />
            )
          })}
          <LabelList
            dataKey="value"
            content={({ x, y, width, index }) => {
              const item = energyData[Number(index)]
              if (!item) return null

              const text = `${item.value.toLocaleString('ko-KR')}원`
              // 문자 폭을 대략 잡는다 — 숫자·한글이 섞여 있어 12px 기준 0.62em
              const textWidth = text.length * BUBBLE.fontSize * 0.62
              const bubbleWidth = textWidth + BUBBLE.paddingX * 2
              const bubbleHeight = BUBBLE.fontSize + BUBBLE.paddingTop + BUBBLE.paddingBottom
              const centerX = Number(x) + Number(width) / 2
              const bubbleY = Number(y) + BUBBLE.offsetY - bubbleHeight

              return (
                <g>
                  <rect
                    x={centerX - bubbleWidth / 2}
                    y={bubbleY}
                    width={bubbleWidth}
                    height={bubbleHeight}
                    rx={BUBBLE.radius}
                    fill="#111927"
                  />
                  <text
                    x={centerX}
                    y={bubbleY + BUBBLE.paddingTop + BUBBLE.fontSize}
                    textAnchor="middle"
                    fontSize={BUBBLE.fontSize}
                    fontWeight={500}
                    fill="#FFFFFF"
                  >
                    {text}
                  </text>
                </g>
              )
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
