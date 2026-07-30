import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { AptInfoPage } from '@/features/signup/pages/AptInfoPage'
import { useSignUpStore } from '@/features/signup/stores/signUpStore'
import { API_PREFIX } from '@/shared/constants/api'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const SIGN_UP_INFO = {
  apiToken: 'kmc-api-token',
  certNum: 'kmc-cert-num',
  name: '홍길동',
  nickName: '길동',
  password: 'abcd1234!',
  birthDay: '19900101',
  gender: 'M',
  nation: 'KR',
  marketingDataConsentFlag: true,
  receiveAdvertsConsentFlag: false,
}

const APT = { uuid: 'apt-uuid-1', name: '아파트먼트 1단지' }

const renderAptInfoPage = () => {
  return renderWithProviders({
    initialEntries: ['/signup/info/apt'],
    ui: (
      <Routes>
        <Route path="/" element={<h1>인트로</h1>} />
        <Route path="/signup/info/user" element={<h1>내 정보 입력</h1>} />
        <Route path="/signup/info/apt" element={<AptInfoPage />} />
        <Route path="/signup/completed" element={<h1>회원가입 완료</h1>} />
      </Routes>
    ),
  })
}

/** 아파트 검색 모달을 열고 단지를 고른다 */
const selectApt = async () => {
  // 아파트명 입력은 읽기 전용이고 클릭하면 검색 모달이 열린다
  await userEvent.click(screen.getByLabelText('아파트명'))

  // ⚠️ 검색창이 두 개다 — 아파트명(읽기 전용)과 모달 안의 검색창이 `InputSearch`의
  // 기본 placeholder(`검색`)를 공유한다. 레거시도 같아서 뒤에 온 모달 쪽을 고른다.
  const modalSearchInput = screen.getAllByPlaceholderText('검색').at(-1)
  if (!modalSearchInput) throw new Error('검색 모달이 열리지 않았다')

  await userEvent.type(modalSearchInput, '아파트먼트')
  await userEvent.keyboard('{Enter}')
  await userEvent.click(await screen.findByRole('button', { name: '선택' }))
}

const fillDongHo = async () => {
  await userEvent.type(screen.getByPlaceholderText('동 입력'), '101')
  await userEvent.type(screen.getByPlaceholderText('호수 입력'), '1001')
  await userEvent.click(screen.getByText('세대주'))
}

describe('AptInfoPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useSignUpStore.setState({ signUpInfo: SIGN_UP_INFO })
    server.use(
      http.get(url({ path: `${API_PREFIX.APARTMANT}/apt` }), () => {
        return HttpResponse.json({ success: [APT] })
      }),
    )
  })

  it('위저드 값이 없으면 접근 거부 모달을 띄우고 인트로로 보낸다', async () => {
    useSignUpStore.setState({ signUpInfo: {} })
    renderAptInfoPage()

    expect(await screen.findByText('잘못된 접근입니다')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(await screen.findByRole('heading', { name: '인트로' })).toBeInTheDocument()
  })

  it('호수에 소문자가 섞이면 대문자 안내를 보여준다', async () => {
    renderAptInfoPage()

    await userEvent.type(screen.getByPlaceholderText('호수 입력'), '101a')

    expect(await screen.findByText('호수는 대문자로만 입력해주세요')).toBeInTheDocument()
  })

  it('숫자만 넣은 호수는 통과한다', async () => {
    // `val === val.toUpperCase()`라 숫자는 항상 참이다 (레거시 검증식 그대로)
    renderAptInfoPage()

    await userEvent.type(screen.getByPlaceholderText('호수 입력'), '1001')

    await waitFor(() => {
      expect(screen.queryByText('호수는 대문자로만 입력해주세요')).not.toBeInTheDocument()
    })
  })

  it('검색 모달에서 고른 단지 이름이 아파트명에 채워진다', async () => {
    renderAptInfoPage()

    await selectApt()

    await waitFor(() => {
      expect(screen.getByLabelText('아파트명')).toHaveValue(APT.name)
    })
  })

  it('제출하면 위저드 값과 폼 값을 합쳐 14필드를 보낸다', async () => {
    let requestBody: Record<string, unknown> | null = null
    server.use(
      http.post(url({ path: `${API_PREFIX.APARTMANT}/sign-up` }), async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ success: { id: '010-1234-5678' } })
      }),
      http.get(url({ path: `${API_PREFIX.APARTMANT}/login/waiting-info` }), () => {
        return HttpResponse.json({ success: { uuid: 'waiting-uuid', contentList: [] } })
      }),
    )
    renderAptInfoPage()

    await selectApt()
    await fillDongHo()
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    await waitFor(() => {
      expect(requestBody).toEqual({
        ...SIGN_UP_INFO,
        aptUuid: APT.uuid,
        dong: '101',
        ho: '1001',
        // 라디오 문자열이 boolean으로 바뀐다
        householdHeadFlag: true,
      })
    })

    expect(await screen.findByRole('heading', { name: '회원가입 완료' })).toBeInTheDocument()
  })

  it('세대원을 고르면 householdHeadFlag가 false다', async () => {
    let requestBody: Record<string, unknown> | null = null
    server.use(
      http.post(url({ path: `${API_PREFIX.APARTMANT}/sign-up` }), async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ success: { id: 'signed-up-id' } })
      }),
      http.get(url({ path: `${API_PREFIX.APARTMANT}/login/waiting-info` }), () => {
        return HttpResponse.json({ success: {} })
      }),
    )
    renderAptInfoPage()

    await selectApt()
    await userEvent.type(screen.getByPlaceholderText('동 입력'), '101')
    await userEvent.type(screen.getByPlaceholderText('호수 입력'), '1001')
    await userEvent.click(screen.getByText('세대원'))
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    await waitFor(() => {
      expect(requestBody?.householdHeadFlag).toBe(false)
    })
  })

  it('뒤로가기는 확인 모달을 거쳐 내 정보 입력으로 돌아간다', async () => {
    // ⚠️ S3의 모달은 `/`로 가지만 이 화면은 앞 단계로 간다
    renderAptInfoPage()

    await userEvent.click(screen.getByRole('button', { name: '뒤로가기 아이콘' }))
    expect(await screen.findByText('작성 내용이 모두 지워집니다.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(await screen.findByRole('heading', { name: '내 정보 입력' })).toBeInTheDocument()
  })
})
