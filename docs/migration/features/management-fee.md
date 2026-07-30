# 도메인 명세 — 관리비 (managementFee)

> 기준 SHA `6d5bf22` · 레거시 `views/ManagementFeeView/` 3개 파일 906 LOC
> (쿼리 94 + API 25 포함 **도메인 1,025 LOC**, 메인 카드 193 별도)
> 타깃 슬라이스 `features/management-fee/`
> API 2개 (`endpoints.md` #146~#147) · 쿼리 훅 2개 · Pinia 스토어 **없음** · 라우트 2개

**파일 수는 3개인데 906줄이다.** 파일당 평균 302줄로 전 도메인 중 가장 밀도가 높다.

**그런데 그 절반(524줄)이 진입 경로 없는 목업 화면이다** — 그래도 이관한다(`MF-Q1` 확정).

| 화면                             | 라인 | 데이터                 | UI 진입 경로 | 이관        |
| -------------------------------- | ---: | ---------------------- | ------------ | ----------- |
| `ManagementFeeDetailView.vue`    |  336 | **실 API** (#146·#147) | 메인 카드    | ✅          |
| `ManagementFeeInfoView.vue`      |  524 | **전부 하드코딩 목업** | 🔴 **없음**  | ✅ **한다** |
| `ManagementFeeDetailLoading.vue` |   46 | (스켈레톤)             | —            | ✅          |

> ✅ **2026-07-30 `MF-Q1` 확정 — MF2도 이관한다** (사용자 결정).
> ApexCharts 2개를 recharts로 옮기고 목업 데이터도 그대로 유지한다. 상세는 §1-2.

> ⚠️ **화면 ID는 `MF*`, 확인 항목은 `MF-Q*`를 쓴다.**

---

## 화면 목록

### 라우트 (`router/ManagementFeeIndex.js` — 2개)

| #   | 경로                    | name        | 컴포넌트                  | meta                                       |
| --- | ----------------------- | ----------- | ------------------------- | ------------------------------------------ |
| MF1 | `/managementFee/detail` | 관리비 상세 | `ManagementFeeDetailView` | AppBar `관리비 상세` · `hasBackButton`     |
| MF2 | `/managementFee/info`   | 관리비 정보 | `ManagementFeeInfoView`   | AppBar **`관리비 조회`** · `hasBackButton` |

**둘 다 `showBottomNav: false`, `showAppBar: true`.** eager 라우트 없음.

⚠️ **라우트 name(`관리비 정보`)과 AppBar 제목(`관리비 조회`)이 다르다** (MF2).

### 진입 경로

| 화면 | 진입 출처                                                                                       |
| ---- | ----------------------------------------------------------------------------------------------- |
| MF1  | **메인 관리비 카드 클릭** (`MainCardManagementFee.vue` → `navigateTo('/managementFee/detail')`) |
| MF2  | 🔴 **없음** (아래)                                                                              |

**메인 메뉴(`MAIN_SWIPER_MENU_LIST`)에 관리비 항목이 없다.** 진입은 메인 카드가 유일하다.
메인 카드는 `hasAptManagementFeeContent`로 게이팅된다 (→ `main.md` §7-2).

---

## 1. MF2는 524줄짜리 목업이고 진입 경로가 없다 — 그래도 이관한다

### 근거

```bash
$ grep -rn "managementFee/info" src
src/router/ManagementFeeIndex.js:4:    path: '/managementFee/info',
```

**라우터 정의 외에 참조가 0곳이다.** 메인 카드도, 메뉴도, 딥링크도 `/managementFee/detail`만 가리킨다.

### 데이터가 전부 하드코딩이다

```js
// ManagementFeeInfoView.vue
// Mock data - TODO: API 연동 시 실제 데이터로 교체
const generateMonthlyData = () => {
  const amounts = [277000, 288030, 210070];   // TODO: API 연동 시 실제 데이터로 교체
  return times(3, (i) => { … });
};

const mockData = ref({
  totalAmount: 210070,
  paymentStatus: '납부 완료',
  monthlyData: generateMonthlyData(),
});

const energyData = ref([
  { label: '동일면적 평균', value: 61642 },
  { label: '우리집', value: 48750 },
]);
```

**템플릿에도 리터럴이 박혀 있다.**

```html
<span class="text-brand-default-text-brand">12,892원 적게</span>
<span>쓰고있어요.</span>
… 전체 사용량 기준 평균 대비 <span class="text-brand-default-text-brand">-21%</span>
```

⚠️ `12,892`는 `61642 - 48750 = 12892`를 손으로 계산해 넣은 값이다. `-21%`도 하드코딩이다.
⚠️ `handleMonthChange`에 `// TODO: API 호출하여 해당 월 데이터 조회`만 있고 아무 동작이 없다.

### 이 화면이 유일한 ApexCharts 사용처 중 하나다

```bash
$ grep -rln "ApexCharts" src
src/views/ManagementFeeView/ManagementFeeInfoView.vue          ← MF2
src/views/MainView/MainCardMenu/MainCardParkingMileageChart.vue ← main.md 소관
```

MF2는 **차트 2개**를 명령형 API로 만든다.

| 차트            | 종류                             | 특징                                                              |
| --------------- | -------------------------------- | ----------------------------------------------------------------- |
| 전월대비 관리비 | 가로 막대 (`horizontal: true`)   | `distributed` · bar별 gradient colorStops · dataLabels에 `>` 부착 |
| 에너지 사용현황 | 세로 막대 (`columnWidth: '20%'`) | `annotations.points`로 **말풍선** 구현 · dataLabels 비활성        |

```js
horizontalChart = new ApexCharts(horizontalChartRef.value, options);
horizontalChart.render();
…
watch([chartOptions, chartSeries], () => {
  horizontalChart.updateOptions(chartOptions.value);
  horizontalChart.updateSeries(chartSeries.value);
});
onUnmounted(() => { horizontalChart?.destroy(); verticalChart?.destroy(); });
```

**옵션 총량이 약 250줄**이다. recharts로 등가 이관하려면
gradient colorStops · borderRadius `end` · annotation 말풍선 · 축 숨김 · `padding` 음수값 ·
`states.hover/active` 무효화를 전부 재현해야 한다.

`<style scoped>`도 살아 있다.

```css
.chart-container :deep(.apexcharts-data-labels text) {
  transform: translateX(12px);
}
```

**ApexCharts 내부 DOM(`.apexcharts-data-labels`)에 의존하는 선택자다.**
recharts로 바꾸면 이 규칙은 의미가 없어지고 라벨 위치를 다른 방법으로 맞춰야 한다.

### ✅ 이관한다 — `MF-Q1` 확정 (2026-07-30)

> **"도달불가라는게 사용하고 있지 않다는거지? 이거 이관하자."**

**"도달 불가"의 정확한 의미를 먼저 분명히 한다.**

| 질문                              | 답                                                                   |
| --------------------------------- | -------------------------------------------------------------------- |
| 앱 UI에서 이 화면에 갈 수 있는가? | **아니다.** 메뉴·카드·딥링크 어디에도 `/managementFee/info`가 없다   |
| 그럼 아무도 못 보는가?            | **URL을 직접 입력하면 보인다.** 라우터에 등록돼 있고 가드도 없다     |
| 보이는 숫자는 실제 관리비인가?    | **아니다.** 전부 하드코딩된 목업이다 (`210,070원`·`12,892원`·`-21%`) |
| 서버 API가 있는가?                | **없다.** `TODO: API 연동 시 실제 데이터로 교체` 주석이 3곳          |

**즉 "기능이 아직 안 붙은 미완성 화면"이고, 그래서 메뉴에서 빼둔 상태다.**

**결정: 목업째로 이관한다.** 나중에 API가 붙을 때 UI를 다시 만들지 않아도 되게 한다.

| 이관 방침        | 내용                                                         |
| ---------------- | ------------------------------------------------------------ |
| 목업 데이터      | **하드코딩 그대로 유지한다.** 값을 바꾸지 않는다             |
| `TODO` 주석      | **유지한다.** 미완성 표시가 사라지면 안 된다                 |
| 차트             | ApexCharts 2개 → **recharts로 옵션 대조 이관** (§1-2)        |
| 라우트           | `/managementFee/info` 유지. **진입 경로도 만들지 않는다**    |
| `<style scoped>` | ApexCharts 내부 DOM 선택자 → recharts 방식으로 재현 (§1-2-3) |

> ⚠️ **이 결정으로 `recharts` 대조 작업이 2건이 된다** —
> MF2의 차트 2개 + `MainCardParkingMileageChart`(`main.md` 소관).
> **MF2가 옵션이 훨씬 복잡하므로 recharts 규격은 MF2 기준으로 먼저 세운다.**

---

## 1-2. MF2 화면 상세 — 관리비 정보 (`ManagementFeeInfoView` 524줄)

**목업 화면이지만 이관 대상이므로 전수로 명세한다.**

### 1-2-1. 레이아웃

```
┌────────────────────────────┐
│ AppBar  관리비 조회         │
├────────────────────────────┤  ← bg-neutral-b-gray-50 (전체 배경)
│ ┌────────────────────────┐ │
│ │ 2026년 7월분 ▾         │ │  ← DrawerMonth (작은 회색 글씨)
│ │ 210,070원 [납부 완료]  │ │  ← pretendard-32Bold
│ │ [ 관리비 내역 확인 ]   │ │  ← ButtonBase → MF1로 이동
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ 전월대비 관리비         │ │
│ │ 지난 달보다             │ │
│ │ 77,960원 적게 나왔어요. │ │
│ │ 7월 ████████ 210,070원 >│ │  ← 가로 막대 3개
│ │ 6월 ██████████ 288,030원│ │
│ │ 5월 █████████ 277,000원 │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ 에너지 사용현황         │ │
│ │ 동일면적 평균보다        │ │
│ │ 12,892원 적게 쓰고있어요.│ │
│ │   [61,642원] [48,750원] │ │  ← 말풍선 annotation
│ │      ██        ██       │ │  ← 세로 막대 2개
│ │  동일면적 평균   우리집  │ │
│ │ [전체 사용량 기준 평균 대비 -21%]│
│ └────────────────────────┘ │
└────────────────────────────┘
```

| 영역           | 클래스                                                                       |
| -------------- | ---------------------------------------------------------------------------- |
| 루트           | `h-full w-full overflow-auto bg-neutral-b-gray-50`                           |
| 내부 패딩      | `p-5`                                                                        |
| 상단 카드      | `rounded-xl border border-neutral-b-gray-200 bg-base-b-white p-4`            |
| 월 선택 래퍼   | `mb-2`                                                                       |
| 금액 행        | `mb-4 flex items-center gap-2`                                               |
| 금액           | `text-defaults-primary-text-primary pretendard-32Bold`                       |
| 상태 칩        | `rounded-full px-2 py-1 pretendard-13Medium` (색은 아래)                     |
| 차트 카드 2개  | `mt-5 rounded-xl bg-base-b-white p-4` (**테두리 없음** — 상단 카드와 다르다) |
| 카드 라벨      | `mb-1 text-defaults-secondary-text-secondary pretendard-12Medium`            |
| 문구(전월대비) | `pretendard-18SemiBold`                                                      |
| 문구(에너지)   | `pretendard-16SemiBold`                                                      |
| 강조 색        | `text-brand-default-text-brand`                                              |
| 하단 배너      | `rounded-lg bg-primary-pc-indigo-25 p-3 text-center pretendard-14Medium`     |

⚠️ **상단 카드만 테두리가 있고 차트 카드 2개는 없다.**

⚠️ **`DrawerMonth`에 `custom-class="!text-defaults-secondary-text-secondary pretendard-13Medium"`** 를 넘겨
`!important`로 색을 덮고 글씨를 작게 만든다. MF1은 기본값(`16SemiBold`)이다.

⚠️ **`ButtonBase`에 `color`를 넘기지 않는다** → 기본값 `brand`. `custom-class="w-full rounded-[8px]"`.

### 1-2-2. 목업 데이터 (그대로 유지)

```js
const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)

// 현재 달 기준 최근 3개월 데이터 생성
const generateMonthlyData = () => {
  const amounts = [277000, 288030, 210070] // TODO: API 연동 시 실제 데이터로 교체
  return times(3, (i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1)
    return { year: date.getFullYear(), month: date.getMonth() + 1, amount: amounts[i] }
  })
}

const mockData = ref({
  totalAmount: 210070,
  paymentStatus: '납부 완료',
  monthlyData: generateMonthlyData(),
})

const energyData = ref([
  { label: '동일면적 평균', value: 61642 },
  { label: '우리집', value: 48750 },
])
const selectedEnergyIndex = ref(1)
```

| 값                    | 내용                                                     |
| --------------------- | -------------------------------------------------------- |
| `amounts`             | `[277000, 288030, 210070]` — **2개월 전 → 이번 달 순**   |
| `totalAmount`         | `210070` (= `amounts[2]`, 이번 달)                       |
| `paymentStatus`       | **`'납부 완료'`** (MF1은 `'납부완료'` — **공백이 있다**) |
| `energyData`          | 동일면적 평균 `61642` · 우리집 `48750`                   |
| `selectedEnergyIndex` | `1` (= 우리집이 강조된다)                                |
| 템플릿 리터럴         | `12,892원 적게` (= `61642 - 48750`, 손계산) · `-21%`     |

🔴 **`times`는 `lodash`다.** `Array.from({ length: 3 }, (_, i) => …)`로 대체한다 (`tech-mapping.md` §12).

**전월 대비 차이 계산**

```js
const previousMonthDiff = computed(() => {
  const currentIdx = mockData.value.monthlyData.findIndex(
    (d) => d.year === selectedYear.value && d.month === selectedMonth.value,
  )
  if (currentIdx > 0) {
    return (
      mockData.value.monthlyData[currentIdx].amount -
      mockData.value.monthlyData[currentIdx - 1].amount
    )
  }
  return 0
})
```

`210070 - 288030 = -77960` → 문구는 `77,960원 적게 나왔어요.`

```html
<span class="text-brand-default-text-brand">
  {{ formatAmount(Math.abs(previousMonthDiff)) }}원 {{ previousMonthDiff < 0 ? '적게' : '많이' }}
</span>
<span class="text-defaults-primary-text-primary"> 나왔어요. </span>
```

⚠️ **`0`이면 `0원 많이 나왔어요.`** 가 된다 (`< 0`이 거짓 → `많이`).

⚠️ **월 선택기로 가장 오래된 달을 고르면** `currentIdx`가 `0`이 되어 `previousMonthDiff`가 `0`이다
(비교 대상이 없다). 그래도 문구는 `0원 많이 나왔어요.`로 뜬다.

⚠️ **`handleMonthChange`가 `selectedYear`/`selectedMonth`만 바꾸고 데이터는 갱신하지 않는다**
(`// TODO: API 호출하여 해당 월 데이터 조회`). 즉 **금액은 항상 `210,070원`으로 고정**이고
차트의 강조 막대와 `previousMonthDiff`만 바뀐다.

**납부 상태 칩**

```html
:class="mockData.paymentStatus === '미납' ? 'bg-alerts-error-background-error-primary
text-alerts-error-text-error' : 'bg-alerts-success-background-success-primary
text-alerts-success-text-success'"
```

**`'납부 완료'`는 `'미납'`이 아니므로 항상 초록**이다. MF1과 같은 색 토큰을 쓴다.

### 1-2-3. 차트 ① 전월대비 관리비 (가로 막대)

**ApexCharts 옵션 전수 → recharts 대조표**

| ApexCharts 옵션                           | 값                                                        | recharts 대응                                              |
| ----------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| `chart.type`                              | `'bar'`                                                   | `<BarChart layout="vertical">`                             |
| `chart.height` (init에서 주입)            | **`180`**                                                 | `<ResponsiveContainer height={180}>`                       |
| `chart.toolbar.show`                      | `false`                                                   | (recharts에 없음)                                          |
| `chart.parentHeightOffset`                | `0`                                                       | —                                                          |
| `plotOptions.bar.horizontal`              | `true`                                                    | `layout="vertical"`                                        |
| `plotOptions.bar.barHeight`               | `'40px'`                                                  | `<Bar barSize={40}>`                                       |
| `plotOptions.bar.distributed`             | `true` (막대별 색)                                        | `<Cell>` per 데이터                                        |
| `plotOptions.bar.borderRadius`            | `8`                                                       | `<Bar radius={[0, 8, 8, 0]}>`                              |
| `plotOptions.bar.borderRadiusApplication` | `'end'`                                                   | 위 radius 배열로 표현                                      |
| `plotOptions.bar.dataLabels.position`     | `'bottom'`                                                | `<LabelList position="insideLeft">`                        |
| `fill.type` / `gradient.type`             | `'gradient'` / `'horizontal'`                             | `<linearGradient x1="0" x2="1">` + `<Cell fill="url(#…)">` |
| `colorStops` (선택 막대)                  | `#0037BE` → `#0082FE`                                     | `<stop offset="0%"/><stop offset="100%"/>`                 |
| `colorStops` (비선택)                     | `#D2D6DB` 단색                                            | 〃                                                         |
| `dataLabels.enabled`                      | `true`                                                    | `<LabelList content={…}>`                                  |
| `dataLabels.formatter`                    | 선택 막대만 **`{금액}원 >`**, 나머지 `{금액}원`           | 커스텀 렌더러                                              |
| `dataLabels.style`                        | `16px` Pretendard 500 · 선택 `#FCFCFD` / 비선택 `#6C727E` | `<Text>` props                                             |
| `xaxis.categories`                        | `['5월', '6월', '7월']` (`{month}월`)                     | `<YAxis dataKey="month" type="category">`                  |
| `xaxis.min` / `max`                       | `0` / `maxAmount`                                         | `<XAxis type="number" domain={[0, max]}>`                  |
| `xaxis.labels/axisBorder/axisTicks.show`  | 전부 `false`                                              | `<XAxis hide>`                                             |
| `yaxis.labels.style`                      | `14px` 500 · 선택 `#111927` / 비선택 `#6C727E`            | `<YAxis tick={커스텀}>`                                    |
| `grid.show`                               | `false`                                                   | `<CartesianGrid>` 미사용                                   |
| `grid.padding`                            | `top: -10, bottom: -10` (**음수**)                        | `<BarChart margin={{ top: -10, bottom: -10 }}>`            |
| `tooltip.enabled` / `legend.show`         | `false` / `false`                                         | `<Tooltip>`·`<Legend>` 미사용                              |
| `states.hover.filter.type` / `active`     | `'none'` / `'none'`                                       | recharts 기본이 무효과 — 대응 불필요                       |

**선택 판정은 `month === selectedMonth`다** (연도를 보지 않는다).

```js
const colorStops = mockData.value.monthlyData.map((d) =>
  d.month === selectedMonth.value
    ? [
        { offset: 0, color: '#0037BE', opacity: 1 },
        { offset: 100, color: '#0082FE', opacity: 1 },
      ]
    : [
        { offset: 0, color: '#D2D6DB', opacity: 1 },
        { offset: 100, color: '#D2D6DB', opacity: 1 },
      ],
)
```

⚠️ **연도가 다른 같은 월이 목록에 있으면 둘 다 강조된다** (12월→1월 경계). 목업이라 발생하지 않는다.

🔴 **`<style scoped>`가 ApexCharts 내부 DOM에 의존한다.**

```css
.chart-container :deep(.apexcharts-data-labels text) {
  transform: translateX(12px);
}
```

**데이터 라벨을 오른쪽으로 12px 밀어** 막대 안쪽 여백을 만든 것이다.
recharts에서는 `<LabelList dx={12}>` 또는 커스텀 렌더러의 `x + 12`로 재현한다.

⚠️ **주석 처리된 옵션 5줄이 있다** (`plotOptions.bar.colors.backgroundBarColors` 등).
**이관하지 않는다.**

### 1-2-4. 차트 ② 에너지 사용현황 (세로 막대 + 말풍선)

| ApexCharts 옵션                 | 값                                       | recharts 대응                         |
| ------------------------------- | ---------------------------------------- | ------------------------------------- |
| `chart.height` (init에서 주입)  | **`200`**                                | `<ResponsiveContainer height={200}>`  |
| `plotOptions.bar.columnWidth`   | `'20%'`                                  | `<Bar barSize>` 또는 `barCategoryGap` |
| `plotOptions.bar.distributed`   | `true`                                   | `<Cell>`                              |
| `plotOptions.bar.borderRadius`  | `8` · application `'end'`                | `<Bar radius={[8, 8, 0, 0]}>`         |
| `fill.gradient.type`            | `'vertical'`                             | `<linearGradient y1="0" y2="1">`      |
| colorStops (선택 = 우리집)      | `#0082FE` → `#0037BE`                    | **① 차트와 방향이 반대다**            |
| colorStops (비선택)             | `#6C727E` 단색                           | 〃                                    |
| `dataLabels.enabled`            | **`false`** (말풍선이 대신한다)          | `<LabelList>` 미사용                  |
| **`annotations.points`**        | 막대마다 말풍선 1개                      | **커스텀 `<LabelList content>`**      |
| `xaxis.labels.style`            | `12px` 500 · 색 `['#6C727E', '#111927']` | `<XAxis tick={커스텀}>`               |
| `xaxis.labels.offsetY`          | `-3`                                     | `tick={{ dy: -3 }}`                   |
| `xaxis.axisBorder.show`         | **`true`** (①과 달리 축선을 보인다)      | `<XAxis axisLine>`                    |
| `yaxis.min/max/floating/labels` | `0` / `maxValue` / `true` / 숨김         | `<YAxis hide domain={[0, max]}>`      |
| `grid.padding`                  | `top: 20, right: -40`                    | `<BarChart margin>`                   |

**말풍선 annotation 전수**

```js
label: {
  text: `${item.value.toLocaleString('ko-KR')}원`,
  offsetY: -15,                 // 막대 위로 15px
  borderRadius: 8,
  borderWidth: 0,
  style: {
    background: '#111927',      // 다크 배경
    color: '#FFFFFF',
    fontSize: '12px', fontFamily: 'Pretendard', fontWeight: 500,
    padding: { left: 12, right: 12, top: 8, bottom: 10 },   // ⚠️ 상하 비대칭
  },
},
marker: { size: 0, strokeWidth: 0, fillColor: 'transparent' },   // 점 숨김
```

🔴 **recharts에는 annotation 개념이 없다.** `<LabelList content={커스텀 SVG}>`로
**둥근 사각형 + 텍스트를 직접 그려야 한다.** 이 도메인 이관의 가장 큰 작업이다.

⚠️ **`padding`이 `top: 8` / `bottom: 10`으로 비대칭**이다. 텍스트를 살짝 위로 올린 것이다.

⚠️ **`x: item.label`** — x축 카테고리 이름과 문자열이 일치해야 annotation이 붙는다.

⚠️ **x축 라벨 색이 배열 하드코딩(`['#6C727E', '#111927']`)이다.** `selectedEnergyIndex`를 보지 않는다 —
즉 **선택이 바뀌어도 라벨 색은 그대로**다. 막대 색만 `selectedEnergyIndex`를 따른다. **비대칭이지만 그대로 옮긴다.**

### 1-2-5. 명령형 차트 생명주기 (recharts에서는 전부 사라진다)

```js
const initHorizontalChart = () => {
  if (!horizontalChartRef.value) return
  const options = {
    ...chartOptions.value,
    chart: { ...chartOptions.value.chart, height: 180 }, // ← height가 여기서 주입된다
    series: chartSeries.value,
  }
  horizontalChart = new ApexCharts(horizontalChartRef.value, options)
  horizontalChart.render()
}

onMounted(() => {
  initHorizontalChart()
  initVerticalChart()
})
onUnmounted(() => {
  horizontalChart?.destroy()
  verticalChart?.destroy()
})

watch([chartOptions, chartSeries], () => {
  horizontalChart.updateOptions(chartOptions.value)
  horizontalChart.updateSeries(chartSeries.value)
})
```

**recharts는 선언형이므로 `init`/`destroy`/`updateOptions`/`updateSeries`가 모두 불필요하다.**

⚠️ **`height`가 옵션 객체가 아니라 `init` 함수에서 주입된다** (180 / 200). 값을 놓치지 않는다.

⚠️ **`watch` 콜백에 `if (horizontalChart)` 가드가 있다** — `onMounted` 이전에 옵션이 바뀌는 경우 대비.

### 1-2-6. QA 체크리스트 (MF2)

**진입 경로가 없으므로 URL을 직접 입력해 확인한다** — `/managementFee/info`

- [ ] AppBar 제목이 **`관리비 조회`** (MF1은 `관리비 상세`)
- [ ] 전체 배경이 `neutral-b-gray-50`, 카드 3개가 흰색
- [ ] **상단 카드만 테두리가 있다**
- [ ] 월 선택기 글씨가 **MF1보다 작고 회색**이다 (`!important` 오버라이드)
- [ ] 금액 `210,070원` + 초록 `납부 완료` 칩 (**공백 있음**)
- [ ] `관리비 내역 확인` → **MF1로 이동**
- [ ] 전월대비: `지난 달보다` / `77,960원 적게` / `나왔어요.`
- [ ] 가로 막대 3개, **이번 달만 파란 그라데이션 + 흰 글씨 + 뒤에 `>`**
- [ ] 나머지 2개는 회색 막대 + 회색 글씨
- [ ] 막대 라벨이 왼쪽 끝에서 **12px 안쪽**에 있다
- [ ] y축 월 라벨: 이번 달만 검정(`#111927`), 나머지 회색
- [ ] 에너지: `동일면적 평균보다` / `12,892원 적게` / `쓰고있어요.`
- [ ] 세로 막대 2개, **우리집만 파란 그라데이션**(아래→위), 평균은 회색
- [ ] 두 막대 위에 **다크 말풍선** `61,642원` · `48,750원`
- [ ] x축 라벨 `동일면적 평균`(회색) · `우리집`(검정), **축선 보임**
- [ ] 하단 배너 `전체 사용량 기준 평균 대비 -21%` (연한 인디고 배경)
- [ ] **월 선택기로 다른 달을 골라도 금액은 `210,070원` 그대로**이고 강조 막대만 바뀐다
- [ ] 가장 오래된 달을 고르면 **`0원 많이 나왔어요.`**
- [ ] 차트에 툴팁·범례·격자선이 **없다**
- [ ] 막대에 마우스를 올려도 **밝아지지 않는다** (`states.hover: none`)

---

## 2. API 2개 — `startDateTIme` 오타를 반드시 유지한다

접두사 `/apartmant/resident/{aptResidentUuid}`. 둘 다 `auth`.

|   # | 함수                   | METHOD | 경로                      | 파라미터                                       |
| --: | ---------------------- | ------ | ------------------------- | ---------------------------------------------- |
| 146 | `getImposeYearMonths`  | GET    | `/bill/impose-yearmonths` | path                                           |
| 147 | `getManagementFeeBill` | GET    | `/bill`                   | query: **`startDateTIme`** · **`endDateTIme`** |

```js
export const getManagementFeeBill = async ({ aptResidentUuid, startDateTime, endDateTime }) => {
  const response = await auth.get(`${apiApartmant}/${aptResidentUuid}/bill`, {
    params: {
      startDateTIme: startDateTime, // 🔴 대문자 I — 서버 계약
      endDateTIme: endDateTime, // 🔴
    },
  })
  return response
}
```

🔴 **함수 인자는 `startDateTime`(정상)인데 쿼리 키는 `startDateTIme`(대문자 `I`)다.**
`deferred.md` **D-9**로 이미 기록됐고 **"이관 중 절대 수정 금지. 고치면 조회가 깨진다"** 로 확정돼 있다.

**타깃에서도 쿼리 키 문자열을 그대로 쓴다.** 함수 인자명은 정상 표기를 유지한다 (현재와 동일).

### 날짜 범위 계산

```js
const dateRange = computed(() => {
  const y = year.value,
    m = month.value
  if (!y || !m) return null
  const monthStr = String(m).padStart(2, '0')
  const lastDay = new Date(y, m, 0).getDate() // 그 달의 말일
  return {
    startDateTime: `${y}-${monthStr}-01 00:00:00`,
    endDateTime: `${y}-${monthStr}-${lastDay} 23:59:59`,
  }
})
```

- **공백 구분 포맷** (`2026-07-01 00:00:00`) — ISO `T`가 아니다
- `new Date(y, m, 0).getDate()` — `m`은 1-based이므로 "다음 달 0일" = 이번 달 말일. 윤년도 정확하다
- `lastDay`에 **zero-pad가 없다** — 말일이 항상 2자리(28~31)이므로 결과는 같다

---

## 3. 쿼리 훅 2개

| 훅                                    | API  | 쿼리 키                                               | `enabled`                 |
| ------------------------------------- | ---- | ----------------------------------------------------- | ------------------------- |
| `useGetManagementFeeImposeYearMonths` | #146 | `['imposeYearMonths', aptResidentUuid]`               | `hasManagementFeeContent` |
| `useGetManagementFeeBill`             | #147 | `['managementFeeBill', aptResidentUuid, year, month]` | `!!dateRange`             |

> ✅ **둘 다 쿼리 키에 `aptResidentUuid`가 들어 있다.** 단지 전환에 안전하다.
> ✅ **`enabled`가 둘 다 있다.** 이 도메인의 훅 위생이 가장 좋다.
> ✅ **mutation이 없다** — 조회 전용 도메인이라 `invalidateQueries` 문제가 없다.

### 3-1. 콘텐츠 게이트

```js
const hasManagementFeeContent = computed(() => {
  const contentList = authStore.getAptInfo()?.contentList || [];
  return contentList.some((content) => content.name.trim() === '관리비');
});
// …
enabled: hasManagementFeeContent,
```

✅ **`getAptInfo()` 뒤에 `?.`가 있고 `|| []` 폴백까지 있다.**
AptMall(`AM-Q7`)·소방(`F-Q6`)의 크래시 위험이 여기엔 없다. **가장 방어적으로 작성된 훅이다.**

⚠️ 단 **같은 파일의 `queryKey`·`queryFn`에서는 `getAptInfo().aptResidentUuid`(옵셔널 없음)를 쓴다.**
`enabled`가 막아주지만 `queryKey`는 `enabled`와 무관하게 평가되므로 **`aptInfo`가 없으면 여전히 throw**한다.
→ `MF-Q2`

⚠️ **`.trim()`이 붙어 있다** — AptMall과 같이 서버 `contentList`에 공백이 섞여 온다는 뜻이다.

### 3-2. `select` 경로

| 훅        | `select`                             | 반환                                                               |
| --------- | ------------------------------------ | ------------------------------------------------------------------ |
| 년월 목록 | `data.data.success.imposeYearmonths` | `['2026-07', '2026-06', …]`                                        |
| 고지서    | `data.data.success`                  | `{ houseHolder, imposeAmount, billInfo, itemDetails, reductions }` |

⚠️ **응답 필드가 `imposeYearmonths`다** — `Y`가 소문자다(`imposeYearMonths`가 아니다).
훅의 반환 변수명은 `imposeYearMonths`(대문자 `M`)로 다르게 쓴다. **서버 필드는 그대로 유지한다.**

### 3-3. 고지서 응답 구조 (화면에서 쓰는 필드 전수)

| 그룹           | 필드                                                                   | 쓰는 곳                       |
| -------------- | ---------------------------------------------------------------------- | ----------------------------- |
| `houseHolder`  | `periodStartDate` · `periodEndDate`                                    | 날짜 범위 표시                |
|                | `paymentFlag` (`'Y'`/`'N'`)                                            | 납부 상태 칩                  |
|                | `autoTransfer` (`'N'` 여부)                                            | 자동이체 칩                   |
| `imposeAmount` | `imposeAmount`                                                         | 큰 금액 · 당월부과액          |
|                | `previousMonthComparedAmount`                                          | **메인 카드만** (→ `main.md`) |
| `billInfo`     | `beforeDeliveryAmountSum`                                              | 납기내 금액                   |
|                | `unpaidAmount` · `unpaidLatefee`                                       | 납기내 상세                   |
|                | `afterDeliveryAmountSum`                                               | 납기 후 청구 금액             |
| `itemDetails`  | `itemName` · `thisMonthAmount` · `prevMonthComparedIncreOrDecreAmount` | 상세내역                      |
| `reductions`   | `name` · `amount`                                                      | 할인내역                      |

⚠️ **`prevMonthComparedIncreOrDecreAmount`** — 서버 필드명이 길고 `Incre`/`Decre`가 축약형이다.
**그대로 쓴다.** 타깃 타입 정의에도 이 이름을 유지한다.

---

## MF1 — 관리비 상세 (`ManagementFeeDetailView` 336줄)

### 레이아웃

```
┌────────────────────────────┐
│ AppBar  관리비 상세         │
├────────────────────────────┤
│ 2026년 7월분 ▾             │  ← DrawerMonth (항상 표시)
├────────────────────────────┤
│ 2026년 7월분 관리비  2026.07.01 ~ 07.31 │
│ 210,070원  [납부완료]      │  ← pretendard-32Bold
├────────────────────────────┤  ← mt-2 회색 띠
│ ⊕ 납기내 금액     215,300원 │  ← 클릭 시 펼침
│   (당월부과액/미납금/미납연체료) │
│   납기 후 청구 금액 220,000원 │
├────────────────────────────┤
│ ⊕ 할인내역                  │  ← reductions.length > 0일 때만
├────────────────────────────┤
│ 상세내역                    │
│ 일반관리비        45,000원  │
│                   ▲ 1,200원 │
│ 청소비            12,000원  │
│                   ▼ 300원   │
└────────────────────────────┘
```

| 영역      | 클래스                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 루트      | `border-default-secondary-border-secondary flex h-full w-full flex-col overflow-auto border-t bg-defaults-secondary-background-mono` |
| 월 선택   | `bg-base-b-white px-5 pb-3 pt-4`                                                                                                     |
| 요약      | `flex flex-col gap-3 bg-base-b-white px-5 pb-5`                                                                                      |
| 금액      | `text-defaults-primary-text-primary pretendard-32Bold`                                                                               |
| 섹션 간격 | `mt-2` (루트 배경 `background-mono`가 회색 띠로 보인다)                                                                              |
| 상세내역  | `mt-2 flex flex-1 flex-col bg-base-b-white pb-8`                                                                                     |

🔴 **루트에 `border-default-secondary-border-secondary`가 있다** —
`defaults`가 아니라 `default`(단수) 오타다. `broken-styles.md` **§1 명백한 오타**에 등록돼 있고
**수정 확정** 상태다 (→ `border-defaults-secondary-border-secondary`).
현재는 `border-t`의 기본색으로 렌더된다. **수정하면 상단 테두리 색이 바뀐다.**

### 상태 분기 3가지

```html
<!-- 월 선택: 년월 목록이 로드되고 에러가 아닐 때만 -->
<div
  v-if="!isImposeYearMonthsLoading && !isImposeYearMonthsError"
  class="bg-base-b-white px-5 pt-4 pb-3"
>
  <DrawerMonth
    :available-yearmonths="imposeYearMonths"
    none-padding
    @change-month="handleMonthChange"
  />
</div>

<ManagementFeeDetailLoading v-if="isManagementFeeBillLoading || isImposeYearMonthsLoading" />

<div v-else-if="isManagementFeeBillError || isImposeYearMonthsError" class="…">
  관리비 정보를 불러오는데 실패했습니다.<br />
  잠시 후 다시 시도해주세요.
</div>

<template v-else> … </template>
```

| 상태        | 월 선택기 | 본문                        |
| ----------- | --------- | --------------------------- |
| 년월 로딩   | 숨김      | 스켈레톤                    |
| 년월 에러   | **숨김**  | 에러 문구                   |
| 고지서 로딩 | **표시**  | 스켈레톤                    |
| 고지서 에러 | **표시**  | 에러 문구                   |
| 정상        | 표시      | 요약 + 납기내 + 할인 + 상세 |

⚠️ **에러 문구가 고정 텍스트다.** 서버 `message`를 쓰지 않는다.
`관리비 정보를 불러오는데 실패했습니다.` / `잠시 후 다시 시도해주세요.` — **원문 그대로.**

⚠️ **재시도 버튼이 없다.** `managementFeeBillRefetch`를 훅이 반환하지만 **아무도 쓰지 않는다** (죽은 반환값).

### 로딩 스켈레톤 (`ManagementFeeDetailLoading` 46줄)

**실제 화면 구조를 그대로 흉내낸 스켈레톤이다.** `SkeletonBase`(= `animate-pulse` + `bg-[#CDCBCBFF]`)를 조합한다.

| 블록           | 스켈레톤                                                           |
| -------------- | ------------------------------------------------------------------ |
| 월 선택        | `h-6 w-28 rounded`                                                 |
| 요약 라벨/날짜 | `h-5 w-28` + `h-5 w-32`                                            |
| 금액/칩        | `h-10 w-40` + `h-6 w-12 rounded-full`                              |
| 납기내 헤더    | `h-4 w-4 rounded-full`(아이콘) + `h-5 w-20` + `h-5 w-24`           |
| 납기 후        | `h-5 w-28` + `h-5 w-24`                                            |
| 상세내역       | **`상세내역` 텍스트는 실제로 렌더** + `SpinnerCircle color="blue"` |

⚠️ **스켈레톤 안에 `상세내역` 글자가 그대로 들어 있다** (`border-b-2 border-neutral-b-gray-100 px-5 py-4`).
🔴 **실제 화면의 같은 요소는 `border-b`(1px)이고 텍스트 스타일도 있다** —
스켈레톤은 `border-b-2`(2px)에 텍스트 클래스가 없다. **로딩 → 완료 시 미세하게 튄다.** → `MF-Q3`

⚠️ **스켈레톤이 월 선택기 영역을 포함한다.** 하지만 실제 월 선택기도 동시에 렌더되므로
(위 표: 고지서 로딩 시 월 선택기 표시) **월 선택기가 2개로 보인다** —
실제 것 아래에 스켈레톤 것이 하나 더. 🔴 → `MF-Q4`

### 요약 섹션

```js
const dateRange = computed(() => {
  if (!houseHolder.value) return ''
  const start = houseHolder.value.periodStartDate?.replace(/-/g, '.')
  const end = houseHolder.value.periodEndDate?.replace(/-/g, '.').slice(5)
  return `${start} ~ ${end}`
})
```

**종료일은 `slice(5)`로 연도를 잘라낸다** → `2026.07.01 ~ 07.31`.

```js
const paymentStatus = computed(() => (houseHolder.value?.paymentFlag === 'Y' ? '납부완료' : '미납'))
const showAutoTransfer = computed(
  () => houseHolder.value?.paymentFlag === 'N' && houseHolder.value?.autoTransfer !== 'N',
)
```

| 칩         | 조건                                          | 색                                                                              |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| `납부완료` | `paymentFlag === 'Y'`                         | `bg-alerts-success-background-success-primary text-alerts-success-text-success` |
| `미납`     | 그 외                                         | `bg-alerts-error-background-error-primary text-alerts-error-text-error`         |
| `자동이체` | `paymentFlag === 'N' && autoTransfer !== 'N'` | `bg-blue-s-info-100 text-blue-s-info-500`                                       |

전부 `rounded-full px-2 py-1 pretendard-13Medium`.

⚠️ **`autoTransfer !== 'N'`** 이므로 `undefined`·`null`이면 **자동이체 칩이 뜬다.**
`=== 'Y'`가 아니다. 미납 세대에 자동이체 필드가 없으면 잘못 표시된다. → `MF-Q5`

⚠️ **납부 상태가 `paymentFlag === 'Y'`의 이진 판정이다.** 부분납부 같은 상태가 없다.

⚠️ **`{{ selectedYear }}년 {{ selectedMonth }}월분 관리비`** — `selectedMonth`에 zero-pad가 없다
(`7월분`). `DrawerMonth`의 표기와 같다.

### 납기내 금액 (아코디언)

```js
const beforeDeliveryTotal = computed(() => billInfo.value?.beforeDeliveryAmountSum || 0)
const isDueDateExpanded = ref(false)
const toggleDueDateSection = () => {
  isDueDateExpanded.value = !isDueDateExpanded.value
}
```

| 요소        | 값                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| 헤더        | `flex cursor-pointer items-center justify-between p-5`                                                        |
| 토글 아이콘 | `isDueDateExpanded ? 'icon-minus-circle-common.svg' : 'icons-plus-circle-common.svg'` · `h-4 w-4`             |
| 라벨/금액   | `pretendard-16SemiBold`                                                                                       |
| 펼친 상세   | `flex flex-col gap-3 bg-base-b-white pl-12 pr-5` — **`pl-12`로 아이콘 폭만큼 들여쓴다**                       |
| 상세 항목   | `당월부과액` · `미납금` · `미납연체료` — 전부 `pretendard-13Regular` `text-defaults-secondary-text-secondary` |
| 납기 후     | `납기 후 청구 금액` — `pretendard-16SemiBold`, 아코디언 밖 (항상 표시)                                        |

⚠️ **아이콘 파일명이 비대칭이다** — `icon-minus-circle-common.svg`(단수) vs
**`icons-plus-circle-common.svg`(복수 `icons`)**.

**`public/assets/icons/`를 확인했고 두 파일명이 실제로 그렇다.**

```
icon-minus-circle-common.svg
icons-plus-circle-common.svg
```

**파일을 그대로 복사하므로 이관에 문제가 없다.** 리네이밍은 `deferred.md`로. (`MF-Q6` 해소)

⚠️ **`당월부과액`이 `imposeAmount?.imposeAmount`** — 상단 큰 금액과 **같은 값**이다.
즉 큰 금액은 "당월부과액"이고 `납기내 금액`은 미납금·연체료를 더한 합계다.

⚠️ **아코디언에 `<button>`이 아니라 `<div @click>`을 쓴다.** 키보드 접근 불가.
`할인내역` 아코디언도 같다.

### 할인내역 (조건부 아코디언)

```html
<div v-if="reductions.length > 0" class="bg-base-b-white mt-2 flex flex-col"></div>
```

- **`reductions`가 비면 섹션 전체가 없다**
- 헤더: `flex cursor-pointer items-center gap-2 border-b border-neutral-b-gray-100 px-5 py-4` ·
  라벨 `text-defaults-secondary-text-secondary pretendard-14Medium`
- 항목: `flex items-center justify-between px-5 py-4` · 이름 `pretendard-16Medium` / 금액 `pretendard-16SemiBold`
- `:key="index"` (인덱스 키 — `name`이 중복될 수 있어서인지 불명)

⚠️ **헤더 스타일이 `납기내 금액`과 다르다** — `p-5`/`16SemiBold`/`primary` vs
`px-5 py-4`/`14Medium`/`secondary`. 같은 아코디언인데 위계가 다르다. 의도로 보인다.

### 상세내역

```html
<span
  v-dompurify-html="item.itemName"
  class="text-defaults-primary-text-primary pretendard-16Medium"
/>
```

⚠️ **`itemName`만 `v-dompurify-html`이다.** 금액은 텍스트 보간.

**증감 표시**

```html
<span
  v-if="item.prevMonthComparedIncreOrDecreAmount !== null && item.prevMonthComparedIncreOrDecreAmount !== 0"
  class="pretendard-12Regular"
  :class="item.prevMonthComparedIncreOrDecreAmount < 0 ? 'text-blue-s-info-500' : 'text-alerts-error-text-error'"
>
  {{ item.prevMonthComparedIncreOrDecreAmount < 0 ? '▼' : '▲' }} {{
  formatAmount(Math.abs(item.prevMonthComparedIncreOrDecreAmount)) }}원
</span>
```

| 값         | 기호       | 색                                    |
| ---------- | ---------- | ------------------------------------- |
| 음수       | `▼`        | `text-blue-s-info-500` (파랑)         |
| 양수       | `▲`        | `text-alerts-error-text-error` (빨강) |
| `0`·`null` | 표시 안 함 |                                       |

⚠️ **`undefined`는 걸러지지 않는다** (`!== null`만 검사). 필드가 없으면 `undefined < 0`은 `false`이므로
**`▲ NaN원`** 이 보인다. → `MF-Q7`

⚠️ **한국 관례상 증가=빨강, 감소=파랑이다.** 관리비는 증가가 나쁜 것이므로 맞다.

**빈 상태**: `상세내역이 없습니다.` — `flex flex-1 items-center justify-center … pretendard-14Regular`

⚠️ `itemDetails`·`reductions`는 `|| []` 폴백이 있어 `undefined`에 안전하다.
⚠️ **불필요한 래퍼가 있다** — `<div class="flex flex-col gap-0.5">` 안에 `<span>` 하나뿐.
증감 표시용 두 번째 줄을 넣으려다 만 흔적으로 보인다.

### 🔴 `isReductionsExpanded`에 토글 함수가 없다

```js
const isDueDateExpanded = ref(false)
const isReductionsExpanded = ref(false)
const toggleDueDateSection = () => {
  isDueDateExpanded.value = !isDueDateExpanded.value
}
// toggleReductionsSection 이 없다
```

```html
@click="isReductionsExpanded = !isReductionsExpanded"
<!-- 템플릿에서 직접 토글 -->
```

**두 아코디언의 구현 방식이 다르다** (함수 vs 인라인). 동작은 같다. 정리 대상.

### QA 체크리스트 (MF1)

- [ ] 진입 시 **가장 최신 년월**이 자동 선택된다 (`DrawerMonth`의 `immediate` watch)
- [ ] 월 선택기를 눌러 바텀시트에서 다른 달을 고르면 고지서가 재조회된다
- [ ] 조회 가능 년월 목록에 없는 달은 **선택할 수 없다**
- [ ] 날짜 범위가 `2026.07.01 ~ 07.31` (종료일에 연도 없음)
- [ ] `paymentFlag: 'Y'` → 초록 `납부완료`, `'N'` → 빨강 `미납`
- [ ] `미납` + `autoTransfer !== 'N'` → 파란 `자동이체` 칩이 추가로 뜬다
- [ ] `납기내 금액` 클릭 → 당월부과액·미납금·미납연체료 3행 펼침, 아이콘이 ⊕ → ⊖
- [ ] `납기 후 청구 금액`은 **아코디언 밖**에서 항상 보인다
- [ ] 할인내역이 없으면 **섹션 자체가 없다**
- [ ] 상세내역 증감이 음수면 파란 `▼`, 양수면 빨간 `▲`, 0이면 표시 없음
- [ ] 상세내역이 없으면 `상세내역이 없습니다.`
- [ ] 로딩 시 스켈레톤 (🔴 **월 선택기가 2개로 보인다** — `MF-Q4`)
- [ ] 조회 실패 시 고정 문구 2줄, **재시도 버튼 없음**
- [ ] 년월 목록 조회 실패 시 **월 선택기까지 사라진다**

---

## 4. `DrawerMonth` — 공용 연월 선택기 (계획서 3-4의 자체 작성 대상)

`components/common/DrawerMonth.vue`. **이 도메인과 메인 카드가 쓴다.**

| prop                         | 기본값  | 용도                                     |
| ---------------------------- | ------- | ---------------------------------------- |
| `nonePadding`                | `false` | `true`면 `px-6 py-3` 제거                |
| `initialYear`/`initialMonth` | `null`  | 초기 선택 (**두 호출부 모두 안 넘긴다**) |
| `customClass`                | `''`    | 트리거 텍스트 스타일                     |
| `availableYearmonths`        | `[]`    | `['2026-07', …]`. 비면 최근 3개월 생성   |

### 트리거

```html
<div
  class="text-base-b-black pretendard-16SemiBold flex items-center gap-1.5"
  :class="[customClass, nonePadding ? '' : 'px-6 py-3']"
  @click="openDrawer"
>
  <span>{{ selectedYear }}년 {{ selectedMonth }}월분</span>
  <img src="/assets/icons/icon-select-dropdown.svg" class="h-3.5 w-3.5" />
</div>
```

⚠️ **`<div @click>`이다** (버튼 아님). 키보드 접근 불가.
⚠️ MF2는 `custom-class="!text-defaults-secondary-text-secondary pretendard-13Medium"`로
**`!important`로 색을 덮고 타이포를 작게** 만든다. MF1은 기본값(`16SemiBold`)을 쓴다.

### 목록 생성

```js
const availableMonths = computed(() => {
  if (props.availableYearmonths?.length > 0) {
    return props.availableYearmonths
      .map((ym) => {
        const [year, month] = ym.split('-')
        return { year: Number(year), month: Number(month) }
      })
      .sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month)) // 최신순
  }
  return generateMonths() // 폴백: 최근 3개월
})

const generateMonths = () => {
  const currentDate = new Date()
  currentDate.setDate(1)
  return times(3, () => {
    const year = currentDate.getFullYear(),
      month = currentDate.getMonth() + 1
    currentDate.setMonth(currentDate.getMonth() - 1)
    return { year, month }
  })
}
```

⚠️ **`setDate(1)`을 먼저 호출한다** — 31일에 `setMonth(-1)`을 하면 월이 튀는 문제를 막는다. 의도적이다.
⚠️ **폴백 3개월은 MF2(목업)에서만 쓰인다.** MF1은 항상 `availableYearmonths`를 넘긴다.

### 최신 년월 자동 선택

```js
watch(
  () => props.availableYearmonths,
  (newYearMonths) => {
    if (newYearMonths?.length > 0) {
      const sorted = [...newYearMonths].sort().reverse() // 문자열 정렬 ('2026-07' > '2026-06')
      const [year, month] = sorted[0].split('-')
      selectedYear.value = Number(year)
      selectedMonth.value = Number(month)
      emits('changeMonth', { year: Number(year), month: Number(month) })
    }
  },
  { immediate: true },
)
```

🔴 **`sort()` 문자열 정렬과 `availableMonths`의 숫자 정렬이 별도로 구현돼 있다.**
`'2026-07'` 형식은 zero-pad라 문자열 정렬로도 맞지만 **같은 일을 두 번 다르게 한다.**

⚠️ **`props.availableYearmonths` 배열 참조가 바뀔 때마다 `changeMonth`를 emit한다.**
쿼리 refetch로 새 배열이 오면 **사용자가 고른 달이 최신 달로 되돌아간다.** → `MF-Q8`

### 바텀시트

```html
<DrawerBase v-if="isDrawerOpen" :is-close="true" @close="closeDrawer">
  <template #content>
    <ul class="flex max-h-[80vh] flex-col items-start self-stretch overflow-auto px-5">
      <li
        class="border-defaults-tertiary-border-tertiary flex items-center self-stretch border-b p-4 last:border-b-0"
        :class="isSelected(…) ? 'font-semibold text-brand-default-text-brand' : ''"
        @click="selectDate(month.year, month.month)"
      >
        {{ month.year }}년 {{ month.month }}월
      </li>
    </ul></template
  ></DrawerBase
>
```

⚠️ **`DrawerBase`에 `title`을 넘기지 않으므로 제목 줄과 X 버튼이 렌더되지 않는다**
(`v-if="title"`로 묶여 있다). `is-close="true"`가 무효화된다. 🔴 **닫기는 배경 클릭뿐이다.** → `MF-Q9`

⚠️ **목록 항목이 `{{ year }}년 {{ month }}월`**, 트리거는 `{{ year }}년 {{ month }}월분` — **`분`이 있고 없다.**
⚠️ **선택 표시가 `font-semibold`(Tailwind 기본)다.** 다른 곳은 `pretendard-*` 유틸을 쓴다.
⚠️ `:key="index"` (년월 문자열이 더 안정적인 키다)

**계획서 3-4에 `DrawerMonth`는 "모양이 크게 다른 것 → 자체 작성"으로 분류돼 있다.**
Base UI `Dialog`(바텀시트 변형) 위에 목록을 올리는 형태로 재작성한다.

---

## 타깃 슬라이스 구조 (제안)

```
src/features/management-fee/
├── api/
│   └── managementFee.ts              # #146 · #147 (startDateTIme 오타 유지)
├── queries/
│   └── managementFeeQueries.ts        # imposeYearMonths · bill queryOptions
├── components/
│   ├── ManagementFeeSummary.tsx        # 금액 + 상태 칩 + 날짜 범위
│   ├── ManagementFeeDueSection.tsx     # 납기내 아코디언 + 납기 후
│   ├── ManagementFeeReductions.tsx     # 할인내역 아코디언
│   ├── ManagementFeeItemList.tsx       # 상세내역 + 증감
│   └── ManagementFeeDetailSkeleton.tsx # 로딩
├── charts/
│   ├── MonthlyComparisonChart.tsx      # MF2 차트 ① (가로 막대 + 그라데이션)
│   └── EnergyUsageChart.tsx            # MF2 차트 ② (세로 막대 + 말풍선 라벨)
├── pages/
│   ├── ManagementFeeDetailPage.tsx     # MF1
│   └── ManagementFeeInfoPage.tsx       # MF2 (목업 유지)
├── types/
│   └── managementFee.ts                # 서버 응답 타입 (필드명 그대로)
└── index.ts
```

✅ **`MF-Q1` 확정에 따라 `ManagementFeeInfoPage.tsx` + 차트 2개를 포함한다.**

> **`charts/`는 이 도메인 안에 둔다.** `MainCardParkingMileageChart`(`main.md`)와 옵션이 달라
> 공용화 이득이 없다. **recharts 사용 규격만 MF2 기준으로 먼저 세우고 메인 카드가 따른다.**

### `shared`로 올릴 것

| 항목          | 이유                                                                     |
| ------------- | ------------------------------------------------------------------------ |
| `DrawerMonth` | MF1 + 메인 카드. **자체 작성 대상** (계획서 3-4)                         |
| `Skeleton`    | `SkeletonBase`(= `animate-pulse` + `bg-[#CDCBCBFF]`) → shadcn `skeleton` |
| `Accordion`   | 납기내·할인내역. 소방 F2a/F4와 공용 후보                                 |
| `Drawer`      | `DrawerBase` (11-overlay 규격)                                           |

⚠️ **`SkeletonBase`의 기본색이 `bg-[#CDCBCBFF]` 하드코딩 hex다** (8자리 = 알파 `FF`).
shadcn `skeleton`은 `bg-muted`를 쓰므로 **색이 달라진다.** 레거시 색으로 덮어야 한다.

---

## 이관 순서 — 2개 PR

| PR       | 범위    | 선행                                                            |
| -------- | ------- | --------------------------------------------------------------- |
| **MF-1** | MF1     | Phase 4 (`Drawer`·`DrawerMonth`·`Skeleton`·`Accordion`)         |
| **MF-2** | **MF2** | MF-1 · **recharts 규격 확정** (그라데이션 `Cell` · 커스텀 라벨) |

**MF2를 MF1과 분리한다.** 데이터 출처가 전혀 다르고(목업 vs 실 API),
차트 2개가 이 도메인 작업량의 대부분이기 때문이다.

> ⚠️ **MF-2는 `main.md`의 `MainCardParkingMileageChart`보다 먼저 한다.**
> ApexCharts→recharts 변환 패턴(그라데이션 `<linearGradient>` + `<Cell>`, 커스텀 `<LabelList>`)을
> **옵션이 더 복잡한 MF2에서 먼저 확립**하고 메인 카드가 물려받는다.

> **`DrawerMonth`가 이 PR의 유일한 외부 블로커다.** 메인 카드(`main.md` §7-2)도 같은 컴포넌트를
> 쓰므로 **Main 이관과 함께 확정한다.** 관리비 상세를 Main보다 먼저 이관하지 않는다.

---

## 반드시 지켜야 할 것

1. **쿼리 파라미터 `startDateTIme`·`endDateTIme`(대문자 `I`)를 그대로 보낸다.** (D-9)
2. **날짜 포맷은 공백 구분** `YYYY-MM-DD HH:mm:ss`다. ISO `T`가 아니다.
3. **범위는 그 달 1일 `00:00:00` ~ 말일 `23:59:59`** 이다.
4. **응답 필드 `imposeYearmonths`(소문자 `m`)** 를 그대로 읽는다.
5. **`prevMonthComparedIncreOrDecreAmount` 필드명을 그대로 쓴다.**
6. **진입 시 가장 최신 년월이 자동 선택되고 `changeMonth`가 즉시 emit된다.**
7. **날짜 범위 표시는 종료일의 연도를 `slice(5)`로 잘라낸다** — `2026.07.01 ~ 07.31`.
8. **납부 상태는 `paymentFlag === 'Y'` 이진 판정이다.**
9. **자동이체 칩은 `paymentFlag === 'N' && autoTransfer !== 'N'`** 일 때만 (`=== 'Y'`가 아니다).
10. **`납기 후 청구 금액`은 아코디언 밖에서 항상 보인다.**
11. **할인내역이 비면 섹션 전체가 없다.**
12. **증감은 음수 파란 `▼`, 양수 빨간 `▲`, `0`·`null`은 표시하지 않는다.**
13. **에러 문구는 고정 텍스트 2줄이고 재시도 버튼이 없다.**
14. **년월 목록 조회 실패 시 월 선택기까지 사라진다.**
15. **`DrawerMonth`의 두 아코디언 헤더 위계가 다르다** (`16SemiBold`/`primary` vs `14Medium`/`secondary`).
16. **`SkeletonBase` 색은 `#CDCBCBFF`다.** shadcn 기본색으로 두지 않는다.

### MF2 (목업 화면)

17. **목업 값을 바꾸지 않는다** — `[277000, 288030, 210070]` · `210070` · `61642`/`48750` ·
    템플릿의 `12,892원` · `-21%`.
18. **`TODO: API 연동 시 실제 데이터로 교체` 주석 3곳을 유지한다.**
19. **월을 바꿔도 금액은 `210,070원` 그대로**이고 강조 막대와 전월대비 문구만 바뀐다.
20. **`납부 완료`에 공백이 있다** (MF1은 `납부완료`).
21. **`/managementFee/info`에 진입 경로를 만들지 않는다.**
22. **차트 높이는 180 / 200이다.**
23. **막대 선택 판정은 `month === selectedMonth`** (연도를 보지 않는다).
24. **에너지 차트 x축 라벨 색은 하드코딩 배열**이라 선택이 바뀌어도 변하지 않는다.
25. **툴팁·범례·격자선·호버 효과가 전부 없다.**
26. **가로 막대 데이터 라벨은 12px 오른쪽으로 밀려 있다.**

---

## 정리해도 되는 것 (등가 영향 없음)

| 항목                                                         | 근거                                    |
| ------------------------------------------------------------ | --------------------------------------- |
| `managementFeeBillRefetch`                                   | 반환되지만 쓰이지 않는다                |
| `beforeDeliveryTotal`의 `if (!billInfo.value) return 0`      | `\|\| 0`이 이미 처리한다                |
| `isReductionsExpanded`의 인라인 토글                         | `toggleDueDateSection`과 방식 통일      |
| 상세내역의 `<div class="flex flex-col gap-0.5">` 래퍼        | 자식이 `<span>` 하나뿐                  |
| `DrawerMonth`의 이중 정렬 구현 (문자열 `sort` + 숫자 `sort`) | 같은 일을 두 번                         |
| `DrawerMonth`의 `initialYear`/`initialMonth` prop            | 두 호출부 모두 안 넘긴다                |
| `DrawerMonth`의 `is-close="true"`                            | `title`이 없어 X 버튼이 렌더되지 않는다 |
| `lastDay`의 zero-pad 없음                                    | 말일은 항상 2자리                       |
| 아코디언의 `<div @click>` → `<button>`                       | 접근성 개선 (렌더 결과 동일하게 유지)   |

---

## 스타일

| 항목                                                                                 | 상태                                                                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `border-default-secondary-border-secondary`                                          | 🔴 **오타** (`defaults` 단수). `broken-styles.md` §1 — **수정 확정.** 상단 테두리 색이 바뀐다                |
| `bg-[#CDCBCBFF]` (`SkeletonBase`)                                                    | 하드코딩 hex 8자리 → `deferred.md`                                                                           |
| MF2 차트 hex (`#0037BE`·`#0082FE`·`#D2D6DB`·`#111927`·`#FCFCFD`·`#6C727E`·`#FFFFFF`) | JS 하드코딩. **이관 확정** — 차트 색은 토큰화하지 않고 그대로 옮긴다 (그라데이션 정지점이라 임의값이 불가피) |
| 스켈레톤의 `border-b-2` vs 실제 `border-b`                                           | 로딩 → 완료 시 1px 튐 → `MF-Q3`                                                                              |
| 그 외 클래스                                                                         | ✅ 확인한 토큰 전부 존재 (`primary-pc-indigo-25`·`neutral-b-gray-50`·`blue-s-info-*`·`pretendard-32Bold`)    |

---

## 확인 필요 (`MF-Q*`)

| #         | 질문                                                                                                                                                 | 관련      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| ~~MF-Q1~~ | ~~MF2 이관 여부~~ → ✅ **2026-07-30 확정: 이관한다.** 목업 데이터·`TODO` 주석 유지, ApexCharts 2개를 recharts로 대조 이관. 진입 경로는 만들지 않는다 | §1 · §1-2 |
| MF-Q2     | 두 훅의 `queryKey`가 `getAptInfo().aptResidentUuid`(옵셔널 없음)를 쓴다. `enabled`와 무관하게 평가되므로 `aptInfo`가 없으면 throw. `?.`를 붙이는가   | §3-1      |
| MF-Q3     | 스켈레톤의 `상세내역` 헤더가 `border-b-2`인데 실제는 `border-b`다. 로딩→완료 시 1px 튄다. 맞추는가                                                   | MF1       |
| MF-Q4     | 🔴 **고지서 로딩 중 월 선택기가 2개로 보인다** (실제 것 + 스켈레톤 것). 스켈레톤에서 제거하는가                                                      | MF1       |
| MF-Q5     | 자동이체 칩 조건이 `autoTransfer !== 'N'`이다 → 필드가 없으면(`undefined`) 칩이 뜬다. `=== 'Y'`로 바꾸는가                                           | MF1       |
| ~~MF-Q6~~ | ~~아이콘 파일명 비대칭~~ → **해소.** `public/assets/icons/`에 두 이름 그대로 존재. 파일을 그대로 복사한다                                            | MF1       |
| MF-Q7     | 증감 표시가 `!== null`만 검사한다 → 필드가 `undefined`면 **`▲ NaN원`** 이 보인다. `!= null`로 바꾸는가                                               | MF1       |
| MF-Q8     | `DrawerMonth`가 `availableYearmonths` 참조 변경마다 `changeMonth`를 emit한다 → refetch 시 **사용자 선택이 최신 달로 되돌아간다.** 고치는가           | §4        |
| MF-Q9     | `DrawerMonth`의 바텀시트에 **X 버튼이 없다** (`title` 미전달로 헤더가 렌더되지 않음). 배경 클릭만 가능하다. 추가하는가                               | §4        |

---

## 등가 대조 (레거시 :3000 ↔ 신규 :5173, 392px)

| 대조 지점                                                                   |
| --------------------------------------------------------------------------- |
| MF1 루트 상단 `border-t` 색 (**오타 수정 후 달라진다**)                     |
| 금액 `pretendard-32Bold` 크기와 칩 정렬                                     |
| 상태 칩 3종의 배경/글자색, `rounded-full px-2 py-1`                         |
| 섹션 간 `mt-2` 회색 띠 (루트 `background-mono`)                             |
| ⊕/⊖ 아이콘 16×16과 라벨 `gap-2`                                             |
| 펼친 상세의 `pl-12` 들여쓰기 정렬                                           |
| 두 아코디언 헤더의 위계 차이 (`p-5`/`16SemiBold` vs `px-5 py-4`/`14Medium`) |
| 상세내역 `▲`/`▼` 기호 크기와 색                                             |
| **스켈레톤 → 실제 전환 시 튐** (`MF-Q3`·`MF-Q4`)                            |
| `SkeletonBase` 색 `#CDCBCBFF` + `animate-pulse` 주기                        |
| `DrawerMonth` 트리거 텍스트 + 드롭다운 아이콘 14×14                         |
| `DrawerMonth` 바텀시트 항목 `p-4` + `last:border-b-0`                       |
| 선택 항목의 `font-semibold` (Tailwind 기본 굵기)                            |
| 폰트 배율 5단계에서 `pretendard-32Bold` 금액이 칩과 겹치지 않는지           |
| **MF2 카드 3개 중 상단만 테두리** · 차트 카드 `mt-5` 간격                   |
| **MF2 가로 막대** 높이 40px · `radius 8` 오른쪽만 · 그라데이션 좌→우        |
| **MF2 막대 라벨** 16px · 선택 흰색 / 비선택 회색 · **12px 오른쪽 이동**     |
| **MF2 세로 막대** 폭 20% · 그라데이션 아래→위 (①과 반대)                    |
| **MF2 말풍선** 다크 `#111927` · `radius 8` · 패딩 상8/하10 · 막대 위 15px   |
| **MF2 하단 배너** `bg-primary-pc-indigo-25` 연한 인디고                     |

---

## 회귀 위험 지점

| 지점                                 | 위험                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| **`startDateTIme` 오타**             | 정상 표기로 "고치면" **관리비 조회가 전부 실패한다.** 가장 위험한 한 글자                   |
| **`DrawerMonth` 자동 선택**          | `immediate` watch + emit 조합. 놓치면 진입 시 아무 달도 선택되지 않는다                     |
| **`DrawerMonth` 재emit** (`MF-Q8`)   | 고치면 **refetch 후에도 선택이 유지**된다 — 레거시와 다른 동작                              |
| **`border-default-…` 오타 수정**     | 상단 테두리 색이 바뀐다. `broken-styles.md`에서 이미 **수정 확정**                          |
| **`SkeletonBase` 색**                | shadcn 기본값을 쓰면 회색 톤이 달라진다                                                     |
| **MF2 ApexCharts → recharts** (확정) | 옵션 약 250줄. **annotation 말풍선은 recharts에 대응 개념이 없어 커스텀 SVG로 그려야 한다** |
| **MF2 `:deep(.apexcharts-*)`**       | 라이브러리 내부 DOM 선택자. recharts에서는 `dx`/커스텀 렌더러로 재현                        |
| **MF2 그라데이션 방향**              | ① 가로(좌→우) `#0037BE`→`#0082FE` / ② 세로(아래→위) `#0082FE`→`#0037BE` — **반대다**        |
| **응답 필드명**                      | `imposeYearmonths`·`prevMonthComparedIncreOrDecreAmount` 등 비관습적 이름 다수              |
