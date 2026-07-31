import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MainNavigationSwiper } from '@/features/main/components/MainNavigationSwiper'
import { API_PREFIX } from '@/shared/constants/api'
import { STORAGE_KEY } from '@/shared/constants/storage'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'

/** 구독 콘텐츠를 주고 스와이퍼를 띄운다 */
const renderSwiper = async ({
  contentList,
  ui,
}: {
  contentList: string[]
  ui?: React.ReactElement
}) => {
  server.use(
    http.get(url({ path: `${API_PREFIX.APARTMANT}/apt-resident/${RESIDENT_UUID}` }), () => {
      return HttpResponse.json({
        success: {
          aptName: '아파트먼트',
          aptId: 'APT-1',
          oldApartmantToken: 'community-token',
          contentList: contentList.map((name) => {
            return { name }
          }),
        },
      })
    }),
  )

  renderWithProviders({ ui: ui ?? <MainNavigationSwiper onOpenShoppingTerms={vi.fn()} /> })

  // 로딩 스피너가 사라질 때까지 기다린다
  await waitFor(() => {
    expect(screen.getByText('관리사무소')).toBeInTheDocument()
  })
}

describe('MainNavigationSwiper', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  })

  it('구독 메뉴 뒤에 고정 메뉴가 붙는다', async () => {
    await renderSwiper({ contentList: ['주차', '소통'] })

    const menuLabels = screen.getAllByRole('listitem').map((item) => {
      return item.textContent
    })
    expect(menuLabels).toEqual(['주차관리', '소통공간', '관리사무소'])
  })

  it('소방자가점검에 New 배지가 붙는다', async () => {
    await renderSwiper({ contentList: ['소방 자가 점검'] })

    expect(screen.getByText('N')).toBeInTheDocument()
  })

  it('9개가 넘으면 슬라이드가 2장으로 나뉜다', async () => {
    // 조건부 8개 + 고정 1개 = 9개 → 8 + 1
    await renderSwiper({
      contentList: ['주차', '커뮤니티', '소통', '민원', '하자보수', '이사예약', '투표', '쇼핑몰'],
    })

    // '투표'는 전자투표·설문조사 둘을 만든다 → 조건부 9개 + 고정 1개 = 10개
    expect(screen.getAllByRole('listitem')).toHaveLength(10)
    expect(document.querySelectorAll('.swiper-slide')).toHaveLength(2)
  })

  it('일반 메뉴를 누르면 해당 경로로 이동한다', async () => {
    await renderSwiper({
      contentList: ['주차'],
      ui: (
        <Routes>
          <Route path="/" element={<MainNavigationSwiper onOpenShoppingTerms={vi.fn()} />} />
          <Route path="/parking" element={<h1>주차 화면</h1>} />
        </Routes>
      ),
    })

    await userEvent.click(screen.getByText('주차관리'))

    expect(await screen.findByRole('heading', { name: '주차 화면' })).toBeInTheDocument()
  })

  it('커뮤니티V2는 uuid와 액세스 토큰을 쿼리스트링에 실어 외부로 나간다', async () => {
    // ⚠️ 토큰이 URL에 남는 구조를 등가 이관으로 유지한다 (`deferred.md` D-39)
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, 'access-token-1')
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)

    await renderSwiper({ contentList: ['커뮤니티V2'] })
    await userEvent.click(screen.getByText('커뮤니티V2'))

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `/login?residentUUID=${RESIDENT_UUID}&residentToken=access-token-1`,
      ) as string,
      '_self',
    )
  })

  it('동의 이력이 없으면 쇼핑몰 클릭이 약관 시트를 연다', async () => {
    const onOpenShoppingTerms = vi.fn()

    await renderSwiper({
      contentList: ['쇼핑몰'],
      ui: <MainNavigationSwiper onOpenShoppingTerms={onOpenShoppingTerms} />,
    })
    await userEvent.click(screen.getByText('쇼핑몰'))

    await waitFor(() => {
      expect(onOpenShoppingTerms).toHaveBeenCalled()
    })
  })
})
