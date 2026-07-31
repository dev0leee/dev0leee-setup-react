import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { RejectReasonPage } from '@/features/parking/pages/RejectReasonPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const PARKING_UUID = 'inout-1'
const REJECT_PATH = `${API_PREFIX.PARKING}/reject/${RESIDENT_UUID}`

const renderRejectPage = ({ state }: { state?: Record<string, unknown> } = {}) => {
  return renderWithProviders({
    initialEntries: [{ pathname: `/parking/reject/${PARKING_UUID}`, state }],
    ui: (
      <Routes>
        <Route path={ROUTE_PATH.PARKING_REJECT} element={<RejectReasonPage />} />
      </Routes>
    ),
  })
}

describe('RejectReasonPage (PK10)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
    useErrorModalStore.setState({ current: null })
  })

  it('글자 수 카운터가 입력에 따라 늘어난다', async () => {
    renderRejectPage({ state: { carNum: '12가3456' } })

    expect(screen.getByText('0/100')).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('내용을 입력해주세요'), '무단주차')
    expect(await screen.findByText('4/100')).toBeInTheDocument()
  })

  it('⚠️ 100자를 넘겨 입력할 수 있고, 제출할 때 에러가 뜬다 (게시글 신고는 잘라낸다)', async () => {
    renderRejectPage({ state: { carNum: '12가3456' } })

    const textarea = screen.getByPlaceholderText('내용을 입력해주세요')
    await userEvent.click(textarea)
    await userEvent.paste('가'.repeat(101))

    // 잘리지 않는다
    expect(await screen.findByText('101/100')).toBeInTheDocument()
    expect(await screen.findByText('최대 100자 이내로 입력해주세요')).toBeInTheDocument()
  })

  it('빈 내용으로 제출하면 인라인 에러가 뜬다', async () => {
    renderRejectPage({ state: { carNum: '12가3456' } })

    await userEvent.click(screen.getByRole('button', { name: '거부하기' }))

    expect(await screen.findByText('최소 1자 이상 입력해주세요')).toBeInTheDocument()
  })

  it('차량번호와 사유를 보낸다 — 입출차 uuid는 보내지 않는다', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(url({ path: REJECT_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderRejectPage({ state: { carNum: '12가3456' } })

    await userEvent.type(screen.getByPlaceholderText('내용을 입력해주세요'), '무단주차')
    await userEvent.click(screen.getByRole('button', { name: '거부하기' }))

    await screen.findByRole('button', { name: '거부하기' })
    expect(body).toEqual({ carNum: '12가3456', reason: '무단주차' })
  })

  it('🔴 state 없이 들어오면 **빈 차량번호로 거부 요청이 나간다** — 레거시와 같다', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(url({ path: REJECT_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderRejectPage()

    await userEvent.type(screen.getByPlaceholderText('내용을 입력해주세요'), '무단주차')
    await userEvent.click(screen.getByRole('button', { name: '거부하기' }))

    await screen.findByRole('button', { name: '거부하기' })
    expect(body).toEqual({ carNum: '', reason: '무단주차' })
  })

  it('이미 거부된 차량이면 전용 문구가 뜬다', async () => {
    server.use(
      http.post(url({ path: REJECT_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'REJECT_ALREADY_EXISTS', message: '서버 원문' } },
          { status: 400 },
        )
      }),
    )

    renderRejectPage({ state: { carNum: '12가3456' } })

    await userEvent.type(screen.getByPlaceholderText('내용을 입력해주세요'), '무단주차')
    await userEvent.click(screen.getByRole('button', { name: '거부하기' }))

    await screen.findByRole('button', { name: '거부하기' })
    expect(useErrorModalStore.getState().current?.text).toBe('이미 거부된 차량이 존재합니다.')
  })

  it('표에 없는 에러코드는 서버 원문이 그대로 보인다', async () => {
    server.use(
      http.post(url({ path: REJECT_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'SOMETHING_ELSE', message: '알 수 없는 오류' } },
          { status: 400 },
        )
      }),
    )

    renderRejectPage({ state: { carNum: '12가3456' } })

    await userEvent.type(screen.getByPlaceholderText('내용을 입력해주세요'), '무단주차')
    await userEvent.click(screen.getByRole('button', { name: '거부하기' }))

    await screen.findByRole('button', { name: '거부하기' })
    expect(useErrorModalStore.getState().current?.text).toBe('알 수 없는 오류')
  })
})
