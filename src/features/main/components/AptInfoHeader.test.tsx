import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AptInfoHeader } from '@/features/main/components/AptInfoHeader'
import { API_PREFIX } from '@/shared/constants/api'
import { NATIVE_HANDLER, TO_NATIVE } from '@/shared/constants/native'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const CURRENT_UUID = 'resident-uuid-1'
const OTHER_UUID = 'resident-uuid-2'

const APT_LIST = [
  {
    aptResidentUuid: CURRENT_UUID,
    aptUuid: 'apt-uuid-1',
    aptName: '아파트먼트 1단지',
    aptAddress: '서울시 강남구 1',
    dong: '101',
    ho: '1001',
    residentState: 'APPROVED',
  },
  {
    aptResidentUuid: OTHER_UUID,
    aptUuid: 'apt-uuid-2',
    aptName: '아파트먼트 2단지',
    aptAddress: '서울시 강남구 2',
    dong: '202',
    ho: '2002',
    residentState: 'APPROVED',
  },
  {
    aptResidentUuid: 'resident-uuid-3',
    aptUuid: 'apt-uuid-3',
    aptName: '아파트먼트 3단지',
    aptAddress: '서울시 강남구 3',
    dong: '303',
    ho: '3003',
    residentState: 'WAITING',
  },
]

const openDrawer = async () => {
  renderWithProviders({ ui: <AptInfoHeader /> })
  // 동호수 영역을 누르면 드로어가 열린다 (레거시와 같은 트리거)
  await waitFor(() => {
    expect(screen.getByAltText('토글 아이콘')).toBeInTheDocument()
  })
  await userEvent.click(screen.getByAltText('토글 아이콘'))
}

describe('AptInfoHeader', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    Reflect.deleteProperty(window, NATIVE_HANDLER)
    useAuthStore.setState({ aptInfo: { aptResidentUuid: CURRENT_UUID } })

    server.use(
      http.get(url({ path: `${API_PREFIX.APARTMANT}/apt-resident/apt` }), () => {
        return HttpResponse.json({ success: APT_LIST })
      }),
    )
  })

  it('단지명을 어절 단위로 끊어 렌더한다', async () => {
    // 어절마다 inline-block span이라 텍스트가 조각나 있다 — 조각 수로 확인한다
    renderWithProviders({ ui: <AptInfoHeader /> })

    const aptName = await screen.findByRole('heading', { level: 1 })
    expect(aptName.querySelectorAll('span')).toHaveLength(2)
    expect(aptName).toHaveTextContent('아파트먼트 1단지')
  })

  it('동호수가 없으면 0을 보여준다', async () => {
    server.use(
      http.get(url({ path: `${API_PREFIX.APARTMANT}/apt-resident/${CURRENT_UUID}` }), () => {
        return HttpResponse.json({ success: { aptName: '아파트먼트', contentList: [] } })
      }),
    )
    renderWithProviders({ ui: <AptInfoHeader /> })

    // `dong || 0` — 빈 문자열이 아니라 숫자 0이다
    await waitFor(() => {
      expect(screen.getAllByText('0')).toHaveLength(2)
    })
  })

  it('현재 단지만 선택 아이콘이 다르다', async () => {
    await openDrawer()

    expect(await screen.findByText(/아파트먼트 2단지/)).toBeInTheDocument()

    const selectedIcons = screen.getAllByAltText('선택 아이콘')
    expect(selectedIcons[0]).toHaveAttribute('src', '/assets/icons/CheckVerifiedSelect.svg')
    expect(selectedIcons[1]).toHaveAttribute('src', '/assets/icons/CheckVerified.svg')
  })

  it('미승인 단지는 승인대기중 배지로 나오고 선택 아이콘이 없다', async () => {
    await openDrawer()

    expect(await screen.findByText('승인대기중')).toBeInTheDocument()
    // 승인 2건만 선택 아이콘을 갖는다
    expect(screen.getAllByAltText('선택 아이콘')).toHaveLength(2)
  })

  it('미승인 단지를 누르면 드로어만 닫히고 아무 안내도 없다', async () => {
    // ⚠️ 레거시에 `승인되지 않은 단지입니다.` 모달 코드가 있지만 **뜨지 않는다** —
    // `closeModal()`이 먼저 실행돼 모달 상태를 가진 드로어가 언마운트된다 (D-216).
    // 전환도 일어나지 않는 것이 핵심이다.
    await openDrawer()

    await userEvent.click(await screen.findByText(/아파트먼트 3단지/))

    await waitFor(() => {
      expect(screen.queryByText('닫기')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('승인되지 않은 단지입니다.')).not.toBeInTheDocument()
    // 단지가 바뀌지 않았다
    expect(useAuthStore.getState().aptInfo.aptResidentUuid).toBe(CURRENT_UUID)
  })

  it('승인된 단지를 누르면 전환하고 새 단지 기준으로 네이티브에 발신한다', async () => {
    // ⚠️ 레거시는 무효화 후 스토어를 읽어 `contentList: []`를 보낼 수 있었다.
    // 이관본은 조회 응답에서 직접 읽으므로 A-PASS·로비폰이 정확히 실린다 (`main.md` §5).
    const postMessage = vi.fn()
    Object.assign(window, { [NATIVE_HANDLER]: { postMessage } })
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Android')

    server.use(
      http.get(url({ path: `${API_PREFIX.APARTMANT}/apt-resident/${OTHER_UUID}` }), () => {
        return HttpResponse.json({
          success: {
            aptName: '아파트먼트 2단지',
            contentList: [{ name: 'A-PASS' }, { name: ' 로비폰 ' }],
            apassUseFlag: true,
            apassOnOffFlag: false,
          },
        })
      }),
    )

    await openDrawer()
    await userEvent.click(await screen.findByText(/아파트먼트 2단지/))

    await waitFor(() => {
      expect(useAuthStore.getState().aptInfo.aptResidentUuid).toBe(OTHER_UUID)
    })

    const changedInfoBody = await waitFor(() => {
      const body = postMessage.mock.calls
        .map((call) => {
          return String(call[0])
        })
        .find((sent) => {
          return sent.includes(TO_NATIVE.SEND_CHANGED_RESIDENT_INFO)
        })
      expect(body).toBeDefined()
      return String(body)
    })

    expect((JSON.parse(changedInfoBody) as { data: unknown }).data).toEqual({
      aptResidentUuid: OTHER_UUID,
      hasAptApassService: true,
      hasResidentApassService: true,
      isDeviceApassActive: false,
      // `' 로비폰 '`의 공백을 trim으로 넘긴다
      hasAptLobbyPhoneService: true,
      hasResidentLobbyPhoneService: true,
    })
  })

  it('단지 목록 조회가 실패하면 안내 문구를 보여준다', async () => {
    server.use(
      http.get(url({ path: `${API_PREFIX.APARTMANT}/apt-resident/apt` }), () => {
        return HttpResponse.json({ error: { errorCode: 'X', message: 'x' } }, { status: 500 })
      }),
    )
    await openDrawer()

    expect(await screen.findByText(/단지 목록을 불러오지 못했습니다/)).toBeInTheDocument()
  })
})
