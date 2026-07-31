import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { VoteVoterHasPendingModal } from '@/features/vote/components/VoteVoterHasPendingModal'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const RESIDENT_DETAIL_PATH = `${API_PREFIX.APARTMANT}/apt-resident/:uuid`
const PENDING_PATH = `${API_PREFIX.BOARD}/vote/${RESIDENT_UUID}/progress-vote`

const useContentList = (contentList: { name: string }[]) => {
  server.use(
    http.get(url({ path: RESIDENT_DETAIL_PATH }), () => {
      return HttpResponse.json({ success: { ...MOCK_RESIDENT_DETAIL_INFO, contentList } })
    }),
  )
}

const usePending = (progressVoteFlag: boolean) => {
  server.use(
    http.get(url({ path: PENDING_PATH }), () => {
      return HttpResponse.json({ success: { progressVoteFlag } })
    }),
  )
}

const clearCookies = () => {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim()
    if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  })
}

beforeEach(() => {
  localStorage.clear()
  clearCookies()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
})

afterEach(() => {
  clearCookies()
})

const renderModal = () => {
  return renderWithProviders({
    initialEntries: [ROUTE_PATH.MAIN],
    ui: (
      <Routes>
        <Route path={ROUTE_PATH.MAIN} element={<VoteVoterHasPendingModal />} />
        <Route path={ROUTE_PATH.VOTE_LIST} element={<h1>투표 목록</h1>} />
      </Routes>
    ),
  })
}

describe('VoteVoterHasPendingModal (VT10)', () => {
  it('투표 구독 + 미완료 투표가 있으면 뜬다', async () => {
    useContentList([{ name: '투표' }])
    usePending(true)

    renderModal()

    expect(await screen.findByText('미완료 투표')).toBeInTheDocument()
    expect(screen.getByText('진행중인 투표가 존재합니다.')).toBeInTheDocument()
  })

  it('⚠️ 구독 이름이 **`투표`**다 — `전자투표`면 뜨지 않는다', async () => {
    useContentList([{ name: '전자투표' }])
    usePending(true)

    renderModal()

    await waitFor(() => {
      expect(screen.queryByText('미완료 투표')).not.toBeInTheDocument()
    })
  })

  it('미완료 투표가 없으면 뜨지 않는다', async () => {
    useContentList([{ name: '투표' }])
    usePending(false)

    renderModal()

    await waitFor(() => {
      expect(screen.queryByText('미완료 투표')).not.toBeInTheDocument()
    })
  })

  it('`투표하기`를 누르면 목록으로 간다', async () => {
    useContentList([{ name: '투표' }])
    usePending(true)

    renderModal()
    await userEvent.click(await screen.findByRole('button', { name: '투표하기' }))

    expect(await screen.findByRole('heading', { name: '투표 목록' })).toBeInTheDocument()
  })

  it('`오늘하루 보지 않기`는 쿠키를 심고 닫는다', async () => {
    useContentList([{ name: '투표' }])
    usePending(true)

    renderModal()
    await userEvent.click(await screen.findByRole('button', { name: /오늘하루/ }))

    expect(screen.queryByText('미완료 투표')).not.toBeInTheDocument()
    // ⚠️ 공지 팝업(`noticePopupHideToday`)과 **다른 키**다
    expect(document.cookie).toContain('hidePopup=true')
  })

  it('쿠키가 있으면 처음부터 뜨지 않는다', async () => {
    document.cookie = 'hidePopup=true;path=/'
    useContentList([{ name: '투표' }])
    usePending(true)

    renderModal()

    await waitFor(() => {
      expect(screen.queryByText('미완료 투표')).not.toBeInTheDocument()
    })
  })
})
