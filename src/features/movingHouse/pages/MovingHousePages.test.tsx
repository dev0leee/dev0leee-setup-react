import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MovingHouseConfirmPage } from '@/features/movingHouse/pages/MovingHouseConfirmPage'
import { MovingHouseDetailPage } from '@/features/movingHouse/pages/MovingHouseDetailPage'
import { MovingHouseListPage } from '@/features/movingHouse/pages/MovingHouseListPage'
import { MovingHouseWritePage } from '@/features/movingHouse/pages/MovingHouseWritePage'
import { useMovingHouseFormStore } from '@/features/movingHouse/stores/movingHouseFormStore'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const MOVING_UUID = 'moving-uuid-1'

const BASE = `${API_PREFIX.BOARD}/${RESIDENT_UUID}/move`
const LIST_PATH = `${BASE}/reservation`
const DETAIL_PATH = `${BASE}/reservation/${MOVING_UUID}`
const SETTING_PATH = `${BASE}/setting`
const TIME_PATH = `${BASE}/reservation-time`
const HOLIDAY_PATH = `${BASE}/setting/move-holiday`

const LIST_ITEM = {
  uuid: MOVING_UUID,
  receiptNum: 'MV-00123',
  moveType: 'MOVE_IN',
  moveReservationStatus: 'WAITING' as const,
  moveReservationTimeName: '오전',
  moveStartDateTime: '2026-08-01T09:00:00',
  moveEndDateTime: '2026-08-01T12:00:00',
  createdDate: '2026-07-30T14:00:00',
}

const DETAIL = {
  ...LIST_ITEM,
  emergencyPhone: '01012345678',
  moveReservationPrice: 12000,
  memo: '엘리베이터 사용 예정',
}

const TIME_SLOTS = [
  { uuid: 'slot-1', name: '오전', startTime: '09:00:00', endTime: '12:00:00' },
  { uuid: 'slot-2', name: '오후', startTime: '13:00:00', endTime: '18:00:00' },
]

const SETTING_CHARGED = {
  chargeFlag: true,
  moveReservationPrice: 12000,
  depositBank: '국민은행',
  depositAccountHolder: '아파트관리사무소',
  depositAccount: '123456-78-901234',
}

const useEndpoints = ({
  list = [LIST_ITEM] as unknown[],
  detail = DETAIL as unknown,
  setting = {} as unknown,
  slots = TIME_SLOTS as unknown[],
  holidays = [] as unknown[],
} = {}) => {
  server.use(
    http.get(url({ path: LIST_PATH }), () => {
      return HttpResponse.json({ success: list })
    }),
    http.get(url({ path: DETAIL_PATH }), () => {
      return HttpResponse.json({ success: detail })
    }),
    http.get(url({ path: SETTING_PATH }), () => {
      return HttpResponse.json({ success: setting })
    }),
    http.get(url({ path: TIME_PATH }), () => {
      return HttpResponse.json({ success: slots })
    }),
    http.get(url({ path: HOLIDAY_PATH }), () => {
      return HttpResponse.json({ success: holidays })
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  useErrorModalStore.setState({ current: null })
  useMovingHouseFormStore.setState({ movingHouseFormData: undefined })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('MovingHouseListPage (MH1)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.MOVING_HOUSE_LIST],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.MOVING_HOUSE_LIST} element={<MovingHouseListPage />} />
          <Route path={ROUTE_PATH.MOVING_HOUSE_DETAIL} element={<h1>상세 화면</h1>} />
          <Route path={ROUTE_PATH.MOVING_HOUSE_WRITE} element={<h1>작성 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('카드에 상태 칩과 4개 행을 보여준다', async () => {
    useEndpoints()

    renderPage()

    // `예약대기`는 탭에도 있어 데이터 도착 전에 잡힌다 — 카드에만 있는 값을 먼저 기다린다
    expect(await screen.findByText('MV-00123')).toBeInTheDocument()
    // 탭에도 같은 라벨이 있다 — 카드의 칩은 뒤쪽이다
    expect(screen.getAllByText('예약대기').at(-1)).toBeInTheDocument()
    expect(screen.getByText('전입')).toBeInTheDocument()
    expect(screen.getByText('2026-08-01')).toBeInTheDocument()
    expect(screen.getByText('2026-07-30 14:00')).toBeInTheDocument()
  })

  it('⚠️ `이사 시간`이 **`오전 09:00 - 12:00`** 형태다 (MH4는 `~`를 쓴다)', async () => {
    useEndpoints()

    renderPage()

    expect(await screen.findByText('오전 09:00 - 12:00')).toBeInTheDocument()
  })

  it('탭을 바꾸면 `moveReservationStatus`를 실어 다시 조회한다', async () => {
    useEndpoints()
    const requested: (string | null)[] = []
    server.use(
      http.get(url({ path: LIST_PATH }), ({ request }) => {
        requested.push(new URL(request.url).searchParams.get('moveReservationStatus'))
        return HttpResponse.json({ success: [LIST_ITEM] })
      }),
    )

    renderPage()
    await screen.findByText('MV-00123')

    await userEvent.click(screen.getByText('확정'))

    await waitFor(() => {
      expect(requested).toContain('CONFIRMED')
    })
    // ✅ 최초 요청은 **빈 객체가 아니라 파라미터 없음**이다 (MH-Q6)
    expect(requested[0]).toBeNull()
  })

  it('0건이면 빈 문구가 뜬다', async () => {
    useEndpoints({ list: [] })

    renderPage()

    expect(await screen.findByText('이사 예약 이력이 없습니다')).toBeInTheDocument()
  })

  it('카드를 누르면 상세로 간다', async () => {
    useEndpoints()

    renderPage()
    await userEvent.click(await screen.findByText('MV-00123'))

    expect(await screen.findByRole('heading', { name: '상세 화면' })).toBeInTheDocument()
  })

  it('`이사 예약하기`가 작성 화면으로 간다', async () => {
    useEndpoints({ list: [] })

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '이사 예약하기' }))

    expect(await screen.findByRole('heading', { name: '작성 화면' })).toBeInTheDocument()
  })
})

describe('MovingHouseDetailPage (MH2)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [`/movingHouse/detail/${MOVING_UUID}`],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.MOVING_HOUSE_DETAIL} element={<MovingHouseDetailPage />} />
          <Route path={ROUTE_PATH.MOVING_HOUSE_LIST} element={<h1>목록 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('`chargeFlag: false`면 **사용료 행과 입금 정보가 없다**', async () => {
    useEndpoints({ setting: { chargeFlag: false } })

    renderPage()

    expect(await screen.findByText('MV-00123')).toBeInTheDocument()
    expect(screen.queryByText('사용료')).not.toBeInTheDocument()
    expect(screen.queryByText('무통장 입금 정보')).not.toBeInTheDocument()
  })

  it('`chargeFlag: true`면 사용료 + 무통장 입금 정보가 붙는다', async () => {
    useEndpoints({ setting: SETTING_CHARGED })

    renderPage()

    expect(await screen.findByText('사용료')).toBeInTheDocument()
    expect(screen.getByText('12,000원')).toBeInTheDocument()
    expect(screen.getByText('무통장 입금 정보')).toBeInTheDocument()
    expect(screen.getByText('123456-78-901234')).toBeInTheDocument()
  })

  it('비상연락처를 하이픈 붙여 보여준다', async () => {
    useEndpoints({ setting: { chargeFlag: false } })

    renderPage()

    expect(await screen.findByText('010-1234-5678')).toBeInTheDocument()
  })

  it('`WAITING`이면 취소 모달이 **2버튼**이고 확인하면 삭제 요청이 나간다', async () => {
    useEndpoints({ setting: { chargeFlag: false } })

    let deleted = false
    server.use(
      http.delete(url({ path: DETAIL_PATH }), () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '예약취소' }))

    expect(await screen.findByText('취소하시겠어요?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '닫기' }))

    await userEvent.click(screen.getByRole('button', { name: '예약취소' }))
    // 모달 안의 두 번째 버튼이 실제 삭제다
    await userEvent.click(screen.getAllByRole('button', { name: '예약취소' }).at(-1) as HTMLElement)

    await waitFor(() => {
      expect(deleted).toBe(true)
    })
  })

  it('⚠️ `CONFIRMED`면 버튼은 있지만 **안내 모달만 뜨고 취소되지 않는다**', async () => {
    useEndpoints({
      detail: { ...DETAIL, moveReservationStatus: 'CONFIRMED' },
      setting: { chargeFlag: false },
    })

    let deleted = false
    server.use(
      http.delete(url({ path: DETAIL_PATH }), () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '예약취소' }))

    expect(await screen.findByText('취소가 불가능합니다.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    expect(deleted).toBe(false)
  })

  it('`CANCELED`면 **취소 버튼이 없고** 취소 사유가 나온다', async () => {
    useEndpoints({
      detail: { ...DETAIL, moveReservationStatus: 'CANCELED', cancelReason: '중복 예약' },
      setting: SETTING_CHARGED,
    })

    renderPage()

    expect(await screen.findByText('취소 사유')).toBeInTheDocument()
    expect(screen.getByText('중복 예약')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '예약취소' })).not.toBeInTheDocument()
    // 취소된 예약은 입금 정보 대신 취소 사유를 보여준다
    expect(screen.queryByText('무통장 입금 정보')).not.toBeInTheDocument()
  })

  it('계좌 `복사`를 누르면 완료 모달이 뜬다', async () => {
    useEndpoints({ setting: SETTING_CHARGED })

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /복사/ }))

    expect(await screen.findByText('복사가 완료되었습니다')).toBeInTheDocument()
  })

  it('✅ 안내문 3단락이 **회색 카드 안에** 들어간다 (MH-Q10 결정)', async () => {
    useEndpoints({ setting: SETTING_CHARGED })

    renderPage()

    const paragraph = await screen.findByText(/입금이 완료되어 예약 확정이 되면/)
    // 레거시는 `<p>` 안의 `<div>` 때문에 배경이 통째로 빠졌다
    expect(paragraph.closest('.bg-defaults-secondary-background-secondary')).not.toBeNull()
  })
})

describe('MovingHouseWritePage (MH3)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.MOVING_HOUSE_WRITE],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.MOVING_HOUSE_WRITE} element={<MovingHouseWritePage />} />
          <Route path={ROUTE_PATH.MOVING_HOUSE_WRITE_CONFIRM} element={<h1>확인 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('`chargeFlag: false`면 **입금자명과 총 사용료가 없다**', async () => {
    useEndpoints({ setting: { chargeFlag: false } })

    renderPage()

    expect(await screen.findByText('유형 선택')).toBeInTheDocument()
    expect(screen.queryByText('입금자명')).not.toBeInTheDocument()
    expect(screen.queryByText('총 사용료')).not.toBeInTheDocument()
  })

  it('`chargeFlag: true`면 입금자명 입력과 총 사용료가 붙는다', async () => {
    useEndpoints({ setting: SETTING_CHARGED })

    renderPage()

    expect(await screen.findByText('입금자명')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('입금자명을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('총 사용료')).toBeInTheDocument()
    expect(screen.getByText('12,000')).toBeInTheDocument()
  })

  it('신축 입주 기간이면 파란 안내 배너가 뜬다', async () => {
    useEndpoints({
      setting: { chargeFlag: false, newOccupancyEndDate: '2099-12-31' },
    })

    renderPage()

    expect(await screen.findByRole('note')).toHaveTextContent('신축 입주 기간(~ 2099-12-31)')
  })

  it('⚠️ `다음`은 **비활성이 아니다** — 누르면 각 필드에 에러가 뜬다', async () => {
    useEndpoints({ setting: { chargeFlag: false } })

    renderPage()
    const nextButton = await screen.findByRole('button', { name: '다음' })

    expect(nextButton).toBeEnabled()
    await userEvent.click(nextButton)

    expect(await screen.findByText('유형을 선택해주세요')).toBeInTheDocument()
  })

  it('⚠️ `시간대` 에러는 **만지기 전에는 뜨지 않는다**', async () => {
    useEndpoints({ setting: { chargeFlag: false } })

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '다음' }))

    await screen.findByText('유형을 선택해주세요')
    expect(screen.queryByText('시간대를 선택해주세요')).not.toBeInTheDocument()
  })

  it('전화번호를 입력하면 하이픈이 자동으로 붙는다', async () => {
    useEndpoints({ setting: { chargeFlag: false } })

    renderPage()
    const phoneInput = await screen.findByPlaceholderText('휴대폰 번호(- 없이 숫자만 입력)')
    await userEvent.type(phoneInput, '01012345678')

    expect(phoneInput).toHaveValue('010-1234-5678')
  })

  it('유형·시간대를 고르고 제출하면 **저장한 뒤 확인 화면으로** 간다', async () => {
    useEndpoints({ setting: { chargeFlag: false } })

    // ⚠️ 슬롯은 **당일 지난 시각이면 비활성**이라 실행 시각에 따라 클릭이 먹지 않는다.
    // 오전으로 시각을 고정해 두 슬롯 모두 선택 가능한 상태로 만든다
    vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date('2026-07-31T08:00:00') })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderPage()
    await user.click(await screen.findByText('전입'))
    await user.click(await screen.findByText('오후 13:00~18:00'))
    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(await screen.findByRole('heading', { name: '확인 화면' })).toBeInTheDocument()
    expect(useMovingHouseFormStore.getState().movingHouseFormData?.moveTime).toBe('slot-2')
  })

  it('뒤로가기는 `작성 그만두기` 모달을 띄우고, `그만두기`가 폼을 비운다', async () => {
    useEndpoints({ setting: { chargeFlag: false } })
    useMovingHouseFormStore.setState({
      movingHouseFormData: { moveType: 'MOVE_IN', moveDate: new Date(), moveTime: 'slot-1' },
    })

    renderPage()
    await userEvent.click(await screen.findByAltText('뒤로가기 아이콘'))

    expect(await screen.findByText('작성 그만두기')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '그만두기' }))

    expect(useMovingHouseFormStore.getState().movingHouseFormData).toBeUndefined()
  })

  it('MH4에서 돌아오면 **폼이 복원된다**', async () => {
    useEndpoints({ setting: { chargeFlag: false } })
    useMovingHouseFormStore.setState({
      movingHouseFormData: {
        moveType: 'MOVE_OUT',
        moveDate: new Date('2099-08-01T00:00:00'),
        moveTime: 'slot-1',
        memo: '복원된 메모',
      },
    })

    renderPage()

    expect(await screen.findByDisplayValue('복원된 메모')).toBeInTheDocument()
  })
})

describe('MovingHouseConfirmPage (MH4)', () => {
  const FORM_DATA = {
    moveType: 'MOVE_IN',
    moveDate: new Date('2099-08-01T00:00:00'),
    moveTime: 'slot-1',
    emergencyPhone: '010-1234-5678',
    memo: '확인 화면 메모',
    moveReservationPrice: 12000,
  }

  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.MOVING_HOUSE_WRITE_CONFIRM],
      ui: (
        <Routes>
          <Route
            path={ROUTE_PATH.MOVING_HOUSE_WRITE_CONFIRM}
            element={<MovingHouseConfirmPage />}
          />
        </Routes>
      ),
    })
  }

  it('⚠️ **예약번호·예약일시·예약상태 행이 없다**', async () => {
    useEndpoints({ setting: { chargeFlag: false } })
    useMovingHouseFormStore.setState({ movingHouseFormData: FORM_DATA })

    renderPage()

    expect(await screen.findByText('전입')).toBeInTheDocument()
    expect(screen.queryByText('예약번호')).not.toBeInTheDocument()
    expect(screen.queryByText('예약일시')).not.toBeInTheDocument()
    expect(screen.queryByText('예약상태')).not.toBeInTheDocument()
  })

  it('⚠️ `이사 시간`이 **슬롯 라벨(`~`)** 로 나온다 (MH2는 ` - `)', async () => {
    useEndpoints({ setting: { chargeFlag: false } })
    useMovingHouseFormStore.setState({ movingHouseFormData: FORM_DATA })

    renderPage()

    expect(await screen.findByText('오전 09:00~12:00')).toBeInTheDocument()
    expect(screen.getByText('2099-08-01')).toBeInTheDocument()
  })

  it('`예약확정`이 폼 값을 **`moveReservationTimeUuid`로 바꿔** 보낸다', async () => {
    useEndpoints({ setting: { chargeFlag: false } })
    useMovingHouseFormStore.setState({ movingHouseFormData: FORM_DATA })

    let body: Record<string, unknown> = {}
    server.use(
      http.post(url({ path: LIST_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '예약확정' }))

    await waitFor(() => {
      expect(body.moveReservationTimeUuid).toBe('slot-1')
    })
    expect(body.moveDate).toBe('2099-08-01')
    // 하이픈을 떼고 보낸다
    expect(body.emergencyPhone).toBe('01012345678')
  })

  it('성공하면 `chargeFlag`에 맞는 완료 모달이 뜨고 스토어가 비워진다', async () => {
    useEndpoints({ setting: SETTING_CHARGED })
    useMovingHouseFormStore.setState({ movingHouseFormData: FORM_DATA })

    server.use(
      http.post(url({ path: LIST_PATH }), () => {
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '예약확정' }))

    expect(await screen.findByText('사용료 입금완료시 순차적으로 확인 후')).toBeInTheDocument()
    expect(useMovingHouseFormStore.getState().movingHouseFormData).toBeUndefined()
  })

  it('⚠️ 신축 입주 에러코드는 **전용 문구**로 바뀐다', async () => {
    useEndpoints({ setting: { chargeFlag: false } })
    useMovingHouseFormStore.setState({ movingHouseFormData: FORM_DATA })

    server.use(
      http.post(url({ path: LIST_PATH }), () => {
        return HttpResponse.json(
          {
            error: {
              errorCode: 'MOVE_RESERVATION_HOUSEHOLD_LIMIT_EXCEEDED',
              message: '서버 원문 메시지',
            },
          },
          { status: 400 },
        )
      }),
    )

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '예약확정' }))

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe(
        '신축 입주 기간에는 세대당 1건만 이사 예약이 가능합니다.',
      )
    })
  })
})
