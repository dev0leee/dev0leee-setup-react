import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { RepairDetailPage } from '@/features/repair/pages/RepairDetailPage'
import { RepairFormPage } from '@/features/repair/pages/RepairFormPage'
import { RepairListPage } from '@/features/repair/pages/RepairListPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const APT_UUID = 'apt-uuid-1'
const REPAIR_UUID = 'repair-uuid-1'

const BASE = `${API_PREFIX.BOARD}/repair/${APT_UUID}/${RESIDENT_UUID}`
const COUNT_PATH = `${BASE}/state-list`
const LIST_PATH = `${BASE}/list`
const DETAIL_PATH = `${BASE}/${REPAIR_UUID}`

const LIST_ITEM = {
  repairUuid: REPAIR_UUID,
  state: 'WAITING',
  location: '거실',
  content: '타일이\n깨졌어요',
  createdDate: '2026-07-30T14:00:00',
}

const DETAIL = {
  repairUuid: REPAIR_UUID,
  repairState: 'WAITING',
  receiptNum: 'R-2026-0001',
  createdDate: '2026-07-30T14:00:00',
  location: '거실',
  emergencyPhone: '01012345678',
  content: '타일이 깨졌어요',
  requirement: '오전 방문 희망',
  visitDateTime: null,
  adminComment: null,
  fileList: [],
}

const page = (content: unknown[], totalElements = content.length) => {
  return {
    content,
    number: 0,
    totalPages: 1,
    totalElements,
    last: true,
    empty: content.length === 0,
    numberOfElements: content.length,
  }
}

const useList = (content: unknown[], totalElements?: number) => {
  server.use(
    http.get(url({ path: LIST_PATH }), () => {
      return HttpResponse.json({ success: page(content, totalElements) })
    }),
  )
}

const useCount = (count: Record<string, number>) => {
  server.use(
    http.get(url({ path: COUNT_PATH }), () => {
      return HttpResponse.json({ success: count })
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
  sessionStorage.clear()
  useAuthStore.setState({
    aptInfo: {
      aptResidentUuid: RESIDENT_UUID,
      aptUuid: APT_UUID,
      dong: '101',
      ho: '1001',
      residentId: '01012345678',
    },
  })
  useErrorModalStore.setState({ current: null })
})

describe('RepairListPage (RP1)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.REPAIR_LIST],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.REPAIR_LIST} element={<RepairListPage />} />
          <Route path={ROUTE_PATH.REPAIR_CREATE} element={<h1>등록 화면</h1>} />
          <Route path={ROUTE_PATH.REPAIR_DETAIL} element={<h1>상세 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('상태 4칸의 건수와 총 건수를 보여준다', async () => {
    useCount({ waiting: 2, received: 1, completed: 5, impossible: 0 })
    useList([LIST_ITEM], 8)

    renderPage()

    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('총 8건')).toBeInTheDocument()
  })

  it('⚠️ 카드 내용이 **한 줄로 눌려** 보인다', async () => {
    useCount({})
    useList([LIST_ITEM])

    renderPage()

    // 개행이 제거돼 붙어서 나온다
    expect(await screen.findByText('타일이깨졌어요')).toBeInTheDocument()
    expect(screen.getByText('2026-07-30 14:00')).toBeInTheDocument()
  })

  it('`접수하기`를 누르면 등록 화면으로 간다', async () => {
    useCount({})
    useList([])

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '접수하기' }))

    expect(await screen.findByRole('heading', { name: '등록 화면' })).toBeInTheDocument()
  })

  it('필터를 바꾸면 `state`를 실어 다시 조회한다', async () => {
    useCount({})
    const requested: (string | null)[] = []
    server.use(
      http.get(url({ path: LIST_PATH }), ({ request }) => {
        requested.push(new URL(request.url).searchParams.get('state'))
        return HttpResponse.json({ success: page([LIST_ITEM]) })
      }),
    )

    renderPage()
    await screen.findByText('거실')

    // `처리 완료`는 현황 칩에도 있다 — 탭은 뒤쪽이다
    await userEvent.click(screen.getAllByText('처리 완료').at(-1) as HTMLElement)

    await waitFor(() => {
      expect(requested).toContain('COMPLETED')
    })
  })

  it('0건이면 빈 문구가 뜬다', async () => {
    useCount({})
    useList([])

    renderPage()

    expect(await screen.findByText('하자 접수 이력이 없습니다')).toBeInTheDocument()
  })
})

describe('RepairFormPage (RP2 등록)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.REPAIR_CREATE],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.REPAIR_CREATE} element={<RepairFormPage mode="create" />} />
        </Routes>
      ),
    })
  }

  it('✅ 제목이 **`하자보수 등록`**이다 (레거시는 `하자보수 수정`이었다)', () => {
    renderPage()

    expect(screen.getByText('하자보수 등록')).toBeInTheDocument()
  })

  it('동·호수·연락처가 세대 정보로 채워지고 비활성이다', () => {
    renderPage()

    expect(screen.getByDisplayValue('101')).toBeDisabled()
    expect(screen.getByDisplayValue('1001')).toBeDisabled()
    expect(screen.getByDisplayValue('010-1234-5678')).toBeDisabled()
  })

  it('필수 2개를 비우고 제출하면 문구가 뜬다', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    // ⚠️ 초기값이 빈 문자열이라 `required` 문구가 아니라 `min(1)` 문구가 나온다
    expect(await screen.findByText('위치를 한 글자 이상 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('내용을 한 글자 이상 입력해주세요')).toBeInTheDocument()
  })

  it('제출하면 **선택 항목은 값이 있을 때만** 실린다', async () => {
    let body = ''
    server.use(
      http.post(url({ path: BASE }), async ({ request }) => {
        body = await request.text()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await userEvent.type(screen.getByPlaceholderText('ex) 거실, 발코니, 화장실 등'), '거실')
    await userEvent.type(
      screen.getByPlaceholderText('하자 내용을 상세히 작성해주세요'),
      '타일이 깨졌어요',
    )
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    await waitFor(() => {
      expect(body).toContain('name="location"')
    })
    expect(body).toContain('거실')
    // 비상 연락처·요청사항은 비어 있어 키가 없다
    expect(body).not.toContain('name="emergencyPhone"')
    expect(body).not.toContain('name="requirement"')
  })

  it('✅ 뒤로가기 모달이 **`작성 그만두기`**다 (레거시는 `수정 그만두기`였다)', async () => {
    renderPage()
    await userEvent.click(screen.getByAltText('뒤로가기 아이콘'))

    expect(await screen.findByText('작성 그만두기')).toBeInTheDocument()
  })
})

describe('RepairDetailPage (RP4)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [`/repair/detail/${REPAIR_UUID}`],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.REPAIR_DETAIL} element={<RepairDetailPage />} />
          <Route path={ROUTE_PATH.REPAIR_EDIT} element={<h1>수정 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('접수 내용 6필드를 보여준다', async () => {
    useDetail(DETAIL)

    renderPage()

    expect(await screen.findByText('R-2026-0001')).toBeInTheDocument()
    expect(screen.getByText('2026-07-30 14:00')).toBeInTheDocument()
    expect(screen.getByText('010-1234-5678')).toBeInTheDocument()
    expect(screen.getByText('오전 방문 희망')).toBeInTheDocument()
  })

  it('`접수 대기`면 `수정`이 수정 화면으로 간다', async () => {
    useDetail(DETAIL)

    renderPage()
    await screen.findByText('R-2026-0001')
    await userEvent.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByRole('heading', { name: '수정 화면' })).toBeInTheDocument()
  })

  it('⚠️ 그 밖의 상태면 **라벨을 끼운 안내 모달**이 뜬다', async () => {
    useDetail({ ...DETAIL, repairState: 'IMPOSSIBLE' })

    renderPage()
    await screen.findByText('R-2026-0001')
    await userEvent.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByText('처리 불가된 접수는 수정할 수 없습니다')).toBeInTheDocument()
  })

  it('`접수 대기`에만 취소 버튼이 있고, 확인하면 삭제 요청이 나간다', async () => {
    useDetail(DETAIL)

    let deleted = false
    server.use(
      http.delete(url({ path: DETAIL_PATH }), () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '접수 취소하기' }))
    await userEvent.click(screen.getByRole('button', { name: '접수취소' }))

    await waitFor(() => {
      expect(deleted).toBe(true)
    })
  })

  it('⚠️ `접수 완료`면 취소 대신 **안내 문구**가 나온다', async () => {
    useDetail({ ...DETAIL, repairState: 'RECEIVED' })

    renderPage()

    expect(
      await screen.findByText(/접수가 완료되어 직접 접수 취소가 불가능합니다/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '접수 취소하기' })).not.toBeInTheDocument()
  })

  it('⚠️ `처리 불가`면 **방문일자 줄이 사라진다**', async () => {
    useDetail({ ...DETAIL, repairState: 'IMPOSSIBLE' })

    renderPage()

    // 데이터가 와야 상태 분기가 적용된다
    await screen.findByText('R-2026-0001')
    expect(screen.getByText('접수상태')).toBeInTheDocument()
    expect(screen.queryByText('방문일자')).not.toBeInTheDocument()
  })
})
