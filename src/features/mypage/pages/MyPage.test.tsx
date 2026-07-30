import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { MyPage } from '@/features/mypage/pages/MyPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen } from '@/testing/utils'

/**
 * 마이페이지 메뉴 게이팅 검증. **이 화면의 핵심 로직은 구독 콘텐츠 필터**다
 * (`mypage.md` QA 1·2번 항목).
 *
 * 단지 컨텍스트는 스토어에 직접 넣는다 — 로그인 흐름을 다시 타면 무엇을 검증하는지
 * 흐려진다. 로그인부터의 경로는 `app/router.test.tsx`가 덮는다.
 */
const seedAptInfo = () => {
  useAuthStore.setState({
    aptInfo: {
      aptResidentUuid: 'resident-uuid-1',
      aptUuid: 'apt-uuid-1',
      aptName: '아파트먼트 1단지',
      residentName: '홍길동',
    },
  })
}

const mockContentList = (contentList: { name: string }[]) => {
  server.use(
    http.get(url({ path: `${API_PREFIX.APARTMANT}/apt-resident/:uuid` }), () => {
      return HttpResponse.json({ success: { ...MOCK_RESIDENT_DETAIL_INFO, contentList } })
    }),
  )
}

describe('MyPage', () => {
  beforeEach(() => {
    localStorage.clear()
    seedAptInfo()
  })

  it('프로필 카드에 이름·단지명·동호수를 보여준다', async () => {
    renderWithProviders({ ui: <MyPage /> })

    // 이름은 aptInfo(localStorage), 단지·동호수는 서버 응답에서 온다 — 출처가 섞여 있다
    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(await screen.findByText('아파트먼트 1단지')).toBeInTheDocument()
    expect(await screen.findByText('101')).toBeInTheDocument()
    expect(await screen.findByText('1001')).toBeInTheDocument()
  })

  it('구독한 콘텐츠에 해당하는 메뉴 그룹만 보여준다', async () => {
    mockContentList([{ name: '주차' }, { name: 'A-PASS' }, { name: '소통' }])
    renderWithProviders({ ui: <MyPage /> })

    expect(await screen.findByText('주차관리')).toBeInTheDocument()
    expect(screen.getByText('A-PASS')).toBeInTheDocument()
    expect(screen.getByText('소통공간 활동')).toBeInTheDocument()

    // 민원 미구독 → 민원공간 활동만 빠진다. 게시판 그룹 자체는 남는다
    expect(screen.queryByText('민원공간 활동')).not.toBeInTheDocument()
    expect(screen.getByText('게시판 미노출 사용자 관리')).toBeInTheDocument()
  })

  it('주차·출입·게시판을 모두 미구독하면 해당 그룹이 사라진다', async () => {
    mockContentList([])
    renderWithProviders({ ui: <MyPage /> })

    // 항상 보이는 그룹으로 렌더 완료를 확인한 뒤 없는 것을 검사한다
    expect(await screen.findByText('알림 설정')).toBeInTheDocument()

    expect(screen.queryByText('주차관리')).not.toBeInTheDocument()
    expect(screen.queryByText('A-PASS')).not.toBeInTheDocument()
    expect(screen.queryByText('게시판 미노출 사용자 관리')).not.toBeInTheDocument()

    // 조건 없는 그룹은 그대로 있다
    expect(screen.getByText('관리사무소')).toBeInTheDocument()
    expect(screen.getByText('소방 자가 점검')).toBeInTheDocument()
    expect(screen.getByText('회원탈퇴')).toBeInTheDocument()
  })

  it('앱 버전을 알 수 없으므로 `버전 없음`을 보여준다', () => {
    // `localStorage['version']`을 아무도 쓰지 않아 서버 버전이 undefined다.
    // **현재는 이것이 정상 동작이다** (`mypage.md` P-Q2 · `deferred.md` D-44).
    renderWithProviders({ ui: <MyPage /> })

    expect(screen.getByText('버전 없음')).toBeInTheDocument()
  })
})
