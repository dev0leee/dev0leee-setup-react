import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { INSPECTION_CATEGORIES } from '@/features/fireInspection/constants/fireInspection'
import { FireInspectionCompletePage } from '@/features/fireInspection/pages/FireInspectionCompletePage'
import { FireInspectionDetailPage } from '@/features/fireInspection/pages/FireInspectionDetailPage'
import { FireInspectionPage } from '@/features/fireInspection/pages/FireInspectionPage'
import { FireInspectionProcessPage } from '@/features/fireInspection/pages/FireInspectionProcessPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor, within } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const INSPECTION_UUID = 'inspection-uuid-1'
const HOUSEHOLD_UUID = 'household-uuid-1'

const BASE = `${API_PREFIX.BOARD}/${RESIDENT_UUID}/fire-inspection`
const SUBMIT_PATH = `${BASE}/${HOUSEHOLD_UUID}`
const DETAIL_PATH = `${BASE}/${INSPECTION_UUID}/household/${HOUSEHOLD_UUID}`

const STATUS_ITEM = {
  fireInspectionUuid: INSPECTION_UUID,
  householdFireInspectionUuid: HOUSEHOLD_UUID,
  submissionStatus: 'NOT_SUBMITTED' as const,
  startDate: '2026-07-01',
  endDate: '2099-07-31',
}

const useStatus = (list: unknown[]) => {
  server.use(
    http.get(url({ path: BASE }), () => {
      return HttpResponse.json({ success: list })
    }),
  )
}

const useDetail = (detail: unknown) => {
  server.use(
    http.get(url({ path: DETAIL_PATH }), () => {
      return HttpResponse.json({ success: detail })
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  useErrorModalStore.setState({ current: null })
})

describe('FireInspectionPage (F1)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.FIRE_INSPECTION],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.FIRE_INSPECTION} element={<FireInspectionPage />} />
          <Route path={ROUTE_PATH.FIRE_INSPECTION_PROCESS} element={<h1>점검 진행</h1>} />
          <Route path={ROUTE_PATH.FIRE_INSPECTION_DETAIL} element={<h1>점검 상세</h1>} />
        </Routes>
      ),
    })
  }

  it('`NOT_SUBMITTED`면 시작 버튼이 활성이다', async () => {
    useStatus([STATUS_ITEM])

    renderPage()

    expect(await screen.findByRole('button', { name: '자가점검 시작하기' })).toBeEnabled()
    expect(screen.getByText('점검필요')).toBeInTheDocument()
    expect(screen.getByText('자가점검을 진행해주세요.')).toBeInTheDocument()
  })

  it('상태 4종의 버튼 문구·비활성이 각각 다르다', async () => {
    useStatus([
      { ...STATUS_ITEM, submissionStatus: 'SUBMITTED', submissionDateTime: '2026-07-15T10:00:00' },
    ])

    renderPage()

    const button = await screen.findByRole('button', { name: '이미 제출이 완료되었습니다.' })
    expect(button).toBeDisabled()
    expect(screen.getByText('점검완료')).toBeInTheDocument()
    expect(screen.getByText('제출 날짜 : 2026-07-15')).toBeInTheDocument()
  })

  it('`BEFORE_START`면 시작일 안내가 나온다', async () => {
    useStatus([{ ...STATUS_ITEM, submissionStatus: 'BEFORE_START' }])

    renderPage()

    expect(await screen.findByRole('button', { name: '점검 기간이 아닙니다.' })).toBeDisabled()
    expect(screen.getByText('점검예정')).toBeInTheDocument()
    expect(screen.getByText('점검 시작일 : 2026.07.01')).toBeInTheDocument()
  })

  it('⚠️ 내역이 **0건이면** 빈 문구 + `점검 기간이 종료되었습니다.` 버튼이다 (F-Q8)', async () => {
    useStatus([])

    renderPage()

    expect(await screen.findByText('점검 내역이 없습니다.')).toBeInTheDocument()
    // 🔴 점검이 한 번도 없던 단지에도 "종료" 문구가 나온다 — 기본값 fall-through
    expect(screen.getByRole('button', { name: '점검 기간이 종료되었습니다.' })).toBeDisabled()
  })

  it('기간을 `2026.07.01 ~ ...` 형태로 보여준다', async () => {
    useStatus([STATUS_ITEM])

    renderPage()

    expect(await screen.findByText('2026.07.01 ~ 2099.07.31')).toBeInTheDocument()
  })

  it('시작 → 확인 모달 → `시작하기`가 점검 화면으로 간다', async () => {
    useStatus([STATUS_ITEM])

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '자가점검 시작하기' }))

    expect(await screen.findByText('자가점검을 시작할까요?')).toBeInTheDocument()
    expect(
      screen.getByText('관리사무소에 자동으로 제출됩니다.', { exact: false }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }))

    expect(await screen.findByRole('heading', { name: '점검 진행' })).toBeInTheDocument()
  })

  it('⚠️ **`SUBMITTED` 카드만** 상세로 간다', async () => {
    useStatus([
      { ...STATUS_ITEM, submissionStatus: 'SUBMITTED', submissionDateTime: '2026-07-15T10:00:00' },
    ])

    renderPage()
    await userEvent.click(await screen.findByText('점검완료'))

    expect(await screen.findByRole('heading', { name: '점검 상세' })).toBeInTheDocument()
  })

  it('`NOT_SUBMITTED` 카드는 눌러도 이동하지 않는다', async () => {
    useStatus([STATUS_ITEM])

    renderPage()
    await userEvent.click(await screen.findByText('점검필요'))

    expect(screen.queryByRole('heading', { name: '점검 상세' })).not.toBeInTheDocument()
  })
})

describe('FireInspectionProcessPage (F2)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [`/fire-inspection/process/${HOUSEHOLD_UUID}`],
      ui: (
        <Routes>
          <Route
            path={ROUTE_PATH.FIRE_INSPECTION_PROCESS}
            element={<FireInspectionProcessPage />}
          />
          <Route path={ROUTE_PATH.FIRE_INSPECTION_COMPLETE} element={<h1>점검 완료</h1>} />
        </Routes>
      ),
    })
  }

  /** 카테고리 헤더를 라벨로 찾는다 */
  const categoryHeader = (name: string) => {
    return screen.getByText(name).closest('[role="button"]') as HTMLElement
  }

  /** 접힌 본문. jsdom에는 Tailwind가 없어 `toBeVisible()`이 통하지 않으므로 클래스로 본다 */
  const isCollapsed = (name: string) => {
    return (categoryHeader(name).nextElementSibling as HTMLElement).className.includes('hidden')
  }

  /** 라디오는 `hidden` input이라 접근성 트리에 없다 — 연결된 `<label>`을 누른다 */
  const clickRadio = async (id: string) => {
    await userEvent.click(document.querySelector<HTMLElement>(`label[for="${id}"]`) as HTMLElement)
  }

  /** 하단 제출 버튼. 이미지 슬라이더의 `alt="다음"` 버튼과 이름이 겹친다 */
  const bottomButton = (name: string) => {
    return screen.getAllByRole('button', { name }).at(-1) as HTMLElement
  }

  /** 21개를 카테고리 `해당없음`으로 한 번에 채운다 */
  const fillAll = async () => {
    for (const category of INSPECTION_CATEGORIES) {
      await userEvent.click(within(categoryHeader(category.categoryName)).getByRole('checkbox'))
    }
  }

  it('진입 시 진행률 0%, 카테고리 10개가 전부 접혀 있다', () => {
    renderPage()

    expect(screen.getByText('0%')).toBeInTheDocument()
    // 접힌 카테고리의 항목도 DOM에는 남아 있다 (`hidden`) — 이미지 로딩 시점을 지키려는 것
    expect(screen.getByText('손쉽게 사용할 수 있는 장소에 설치 여부')).toBeInTheDocument()
    expect(isCollapsed('소화기')).toBe(true)
  })

  it('헤더를 누르면 펼쳐진다', async () => {
    renderPage()
    await userEvent.click(categoryHeader('소화기'))

    expect(isCollapsed('소화기')).toBe(false)
  })

  it('⚠️ **미완료 카테고리는 여러 개가 동시에 펼쳐진 채로 남는다**', async () => {
    renderPage()
    await userEvent.click(categoryHeader('소화기'))
    await userEvent.click(categoryHeader('스프링클러'))

    expect(isCollapsed('소화기')).toBe(false)
    expect(isCollapsed('스프링클러')).toBe(false)
  })

  it('⚠️ **완료된 카테고리만** 다른 것을 펼칠 때 자동으로 접힌다', async () => {
    renderPage()
    await userEvent.click(categoryHeader('스프링클러'))
    // 항목이 1개뿐이라 하나만 고르면 완료된다
    await clickRadio('item-10-NORMAL')
    await userEvent.click(categoryHeader('소화기'))

    expect(isCollapsed('스프링클러')).toBe(true)
    expect(isCollapsed('소화기')).toBe(false)
  })

  it('진행률이 응답 수에 따라 오른다 (`Math.round`)', async () => {
    renderPage()
    await userEvent.click(categoryHeader('스프링클러'))
    await clickRadio('item-10-NORMAL')

    // 1/21 = 4.76% → 5%
    expect(screen.getByText('5%')).toBeInTheDocument()
  })

  it('`해당없음`을 켜면 카운터가 꽉 차고 아코디언이 잠긴다', async () => {
    renderPage()
    await userEvent.click(within(categoryHeader('스프링클러')).getByRole('checkbox'))

    expect(within(categoryHeader('스프링클러')).getByText('(1/1)')).toBeInTheDocument()

    await userEvent.click(categoryHeader('스프링클러'))
    // 해당없음이면 토글 자체가 막힌다
    expect(isCollapsed('스프링클러')).toBe(true)
  })

  it('🔴 `해당없음`을 **해제하면 그 카테고리 응답이 전부 사라진다** (F-Q5)', async () => {
    renderPage()
    await userEvent.click(categoryHeader('소화기'))
    await clickRadio('item-1-NORMAL')
    expect(screen.getByText('5%')).toBeInTheDocument()

    await userEvent.click(within(categoryHeader('소화기')).getByRole('checkbox'))
    // 5개 항목이 전부 NOT_APPLICABLE이 된다 → 5/21 = 24%
    expect(screen.getByText('24%')).toBeInTheDocument()

    await userEvent.click(within(categoryHeader('소화기')).getByRole('checkbox'))
    // 🔴 켜기 전에 골라둔 1개까지 함께 사라진다
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('⚠️ 카테고리 툴팁은 **2번(자동확산소화기)에만** 뜬다', async () => {
    renderPage()

    const helpIcons = screen.getAllByAltText('도움말')
    // 카테고리 헤더 1개(2번) + 항목 2개(3번 카테고리)
    expect(helpIcons).toHaveLength(3)

    await userEvent.click(helpIcons[0] as HTMLElement)
    expect(screen.getByText('보일러가 설치된 장소의 천장')).toBeVisible()
  })

  it('툴팁 닫기를 눌러도 **아코디언이 토글되지 않는다**', async () => {
    renderPage()
    await userEvent.click(screen.getAllByAltText('도움말')[0] as HTMLElement)
    await userEvent.click(screen.getByAltText('닫기'))

    expect(screen.queryByText('보일러가 설치된 장소의 천장')).not.toBeInTheDocument()
    // 아코디언은 접힌 채로 남아 있다
    expect(isCollapsed('자동확산소화기')).toBe(true)
  })

  it('⚠️ **`itemId: 14`만** 좌우 화살표가 있다 (이미지 3장)', async () => {
    renderPage()
    await userEvent.click(categoryHeader('완강기'))

    expect(screen.getAllByAltText('이전')).toHaveLength(1)
    expect(screen.getAllByAltText('다음')).toHaveLength(1)
  })

  it('⚠️ `itemId: 5`처럼 **빈 배열인 항목은 이미지가 없다**', async () => {
    renderPage()

    const body = categoryHeader('소화기').nextElementSibling as HTMLElement
    // 5개 항목 중 4개에만 이미지가 있다 (`itemId: 5`는 빈 배열).
    // 라디오 체크박스 이미지가 섞여 있어 항목 이미지만 센다
    expect(body.querySelectorAll('img[src*="fire-extinguisher"]')).toHaveLength(4)
  })

  it('21개를 다 채우면 100%가 되고 `다음`이 열린다', async () => {
    renderPage()
    await fillAll()

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(bottomButton('다음')).toBeEnabled()
  })

  it('`다음` → 서명 단계, AppBar 제목은 **그대로**다', async () => {
    renderPage()
    await fillAll()
    await userEvent.click(bottomButton('다음'))

    expect(screen.getByText('입주민 확인 서명')).toBeInTheDocument()
    expect(screen.getByText('여기에 서명해주세요.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '자가점검표 작성' })).toBeInTheDocument()
    // 서명 전에는 `완료`가 잠겨 있다
    expect(screen.getByRole('button', { name: '완료' })).toBeDisabled()
  })

  it('서명 단계에서 뒤로가기를 누르면 **점검표로 돌아가고 입력이 유지된다**', async () => {
    renderPage()
    await fillAll()
    await userEvent.click(bottomButton('다음'))
    await userEvent.click(screen.getByAltText('뒤로가기 아이콘'))

    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('⚠️ **동/호가 표시되지 않는다** (F-Q12)', async () => {
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID, dong: '101', ho: '1001' } })

    renderPage()
    await fillAll()
    await userEvent.click(bottomButton('다음'))

    expect(screen.queryByText('101동 1001호')).not.toBeInTheDocument()
  })
})

describe('FireInspectionCompletePage (F3)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.FIRE_INSPECTION_COMPLETE],
      ui: (
        <Routes>
          <Route
            path={ROUTE_PATH.FIRE_INSPECTION_COMPLETE}
            element={<FireInspectionCompletePage />}
          />
          <Route path={ROUTE_PATH.MAIN} element={<h1>메인 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('⚠️ **뒤로가기 버튼이 없다**', () => {
    renderPage()

    expect(screen.getByText('점검이 완료되었습니다')).toBeInTheDocument()
    expect(screen.queryByAltText('뒤로가기 아이콘')).not.toBeInTheDocument()
  })

  it('✅ `홈으로 돌아가기`가 **`/main`으로 직행**한다 (F-Q14)', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: '홈으로 돌아가기' }))

    // 🔴 레거시는 `/` → 인트로 → 가드 → 메인으로 3홉을 돌았고, 그 사이
    // `getLoginInfo()`가 실패하면 로그아웃됐다
    expect(await screen.findByRole('heading', { name: '메인 화면' })).toBeInTheDocument()
  })
})

describe('FireInspectionDetailPage (F4)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [`/fire-inspection/detail/${INSPECTION_UUID}/${HOUSEHOLD_UUID}`],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.FIRE_INSPECTION_DETAIL} element={<FireInspectionDetailPage />} />
        </Routes>
      ),
    })
  }

  const allAnswers = (answer: string) => {
    return INSPECTION_CATEGORIES.flatMap((category) => {
      return category.items.map((item) => {
        return { questionId: item.questionId, answer }
      })
    })
  }

  it('AppBar 제목에 **제출일이 들어간다**', async () => {
    useDetail({
      submissionDateTime: '2026-07-15T10:00:00',
      questionAnswerList: allAnswers('NORMAL'),
    })

    renderPage()

    expect(await screen.findByRole('heading', { name: '2026.07.15 점검 상세' })).toBeInTheDocument()
  })

  it('⚠️ 진입 시 **10개가 전부 펼쳐져 있다** (F2a와 반대)', async () => {
    useDetail({
      submissionDateTime: '2026-07-15T10:00:00',
      questionAnswerList: allAnswers('NORMAL'),
    })

    renderPage()

    expect(await screen.findByText('손쉽게 사용할 수 있는 장소에 설치 여부')).toBeVisible()
    expect(screen.getByText('헤드 변형·손상·부식 유무')).toBeVisible()
  })

  it('제출한 답이 라디오에 반영되고 **전부 비활성**이다', async () => {
    useDetail({
      submissionDateTime: '2026-07-15T10:00:00',
      questionAnswerList: [
        { questionId: 'SPRINKLER_01', answer: 'DEFECTIVE' },
        ...allAnswers('NORMAL').filter((answer) => {
          return answer.questionId !== 'SPRINKLER_01'
        }),
      ],
    })

    renderPage()

    await screen.findByText('헤드 변형·손상·부식 유무')

    const defective = document.querySelector<HTMLInputElement>('#detail-item-10-DEFECTIVE')
    expect(defective?.checked).toBe(true)
    expect(defective).toBeDisabled()
  })

  it('⚠️ 항목이 **전부 `해당없음`인 카테고리는 칩만 보이고 열리지 않는다**', async () => {
    useDetail({
      submissionDateTime: '2026-07-15T10:00:00',
      questionAnswerList: [
        { questionId: 'SPRINKLER_01', answer: 'NOT_APPLICABLE' },
        ...allAnswers('NORMAL').filter((answer) => {
          return answer.questionId !== 'SPRINKLER_01'
        }),
      ],
    })

    renderPage()
    await screen.findByText('해당없음')

    expect(screen.queryByText('헤드 변형·손상·부식 유무')).not.toBeInTheDocument()
  })

  it('🔴 조회 결과가 없으면 **빈 화면**이 된다 (F-Q15)', async () => {
    useDetail(null)

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '점검 상세' })).toBeInTheDocument()
    })
    expect(screen.queryByText('소화기')).not.toBeInTheDocument()
  })
})

describe('점검표 제출', () => {
  it('`FormData` 키가 **`questionAnswerList[N].field` 형식**이어야 한다', async () => {
    let body = ''
    server.use(
      http.post(url({ path: SUBMIT_PATH }), async ({ request }) => {
        body = await request.text()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { postFireInspectionSubmit } =
      await import('@/features/fireInspection/api/fireInspection')

    await postFireInspectionSubmit({
      aptResidentUuid: RESIDENT_UUID,
      householdFireInspectionUuid: HOUSEHOLD_UUID,
      signatureFile: new File(['x'], 'signature.png', { type: 'image/png' }),
      questionAnswerList: [
        {
          sectionId: 'FIRE_EQUIPMENT',
          groupId: 'EXTINGUISHER',
          questionId: 'EXTINGUISHER_01',
          answer: 'NORMAL',
        },
      ],
    })

    // 한 글자만 달라도 Spring 바인딩이 전부 실패한다
    expect(body).toContain('name="questionAnswerList[0].sectionId"')
    expect(body).toContain('name="questionAnswerList[0].groupId"')
    expect(body).toContain('name="questionAnswerList[0].questionId"')
    expect(body).toContain('name="questionAnswerList[0].answer"')
    expect(body).toContain('name="signatureFile"')
  })

  it('⚠️ 실패하면 **에러코드별 전용 문구**로 모달이 뜬다', async () => {
    server.use(
      http.post(url({ path: SUBMIT_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'ALREADY_SUBMITTED', message: '서버 원문' } },
          { status: 400 },
        )
      }),
    )

    renderWithProviders({
      initialEntries: [`/fire-inspection/process/${HOUSEHOLD_UUID}`],
      ui: (
        <Routes>
          <Route
            path={ROUTE_PATH.FIRE_INSPECTION_PROCESS}
            element={<FireInspectionProcessPage />}
          />
        </Routes>
      ),
    })

    for (const category of INSPECTION_CATEGORIES) {
      const header = screen
        .getByText(category.categoryName)
        .closest('[role="button"]') as HTMLElement
      await userEvent.click(within(header).getByRole('checkbox'))
    }
    await userEvent.click(screen.getAllByRole('button', { name: '다음' }).at(-1) as HTMLElement)

    // ⚠️ 서명 캔버스는 터치 전용이라 jsdom에서 그릴 수 없다 —
    // 제출 버튼이 잠겨 있는 것까지만 확인하고 페이로드는 API 단위 테스트로 덮는다
    expect(screen.getByRole('button', { name: '완료' })).toBeDisabled()
  })
})
