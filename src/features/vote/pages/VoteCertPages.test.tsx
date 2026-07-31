import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { VoteCertNamePhonePage } from '@/features/vote/pages/VoteCertNamePhonePage'
import { VoteCertPassResponsePage } from '@/features/vote/pages/VoteCertPassResponsePage'
import { VoteCompletedPage } from '@/features/vote/pages/VoteCompletedPage'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { STORAGE_KEY } from '@/shared/constants/storage'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { useVoteCertStore } from '@/shared/stores/voteCertStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const VOTE_UUID = 'vote-uuid-1'
const VOTER_UUID = 'voter-uuid-1'

const PASS_PATH = `/board/non-resident/voter/${VOTER_UUID}/auth/pass`
const NAME_PHONE_PATH = `/board/non-resident/voter/${VOTER_UUID}/auth/name-phone`

/** KMC 왕복 뒤에도 남아 있어야 하는 값. 화면이 이걸로 voterUuid를 되찾는다 */
const seedCertInfo = (extra: Record<string, unknown> = {}) => {
  localStorage.setItem(
    STORAGE_KEY.VOTE_CERT_INFO,
    JSON.stringify({ voterUuid: VOTER_UUID, voteUuid: VOTE_UUID, ...extra }),
  )
  useVoteCertStore.setState({
    voteCertInfo: { voterUuid: VOTER_UUID, voteUuid: VOTE_UUID, ...extra },
  })
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  useErrorModalStore.setState({ current: null })
  useVoteCertStore.setState({ voteCertInfo: {} })
})

describe('VoteCertPassResponsePage (VT5)', () => {
  const renderPage = ({ search = '?apiToken=token-1&certNum=cert-1' } = {}) => {
    return renderWithProviders({
      initialEntries: [`${ROUTE_PATH.VOTE_CERT_PASS_RESPONSE}${search}`],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VOTE_CERT_PASS_RESPONSE} element={<VoteCertPassResponsePage />} />
          <Route path={ROUTE_PATH.VOTE_FORM} element={<h1>참여 폼</h1>} />
          <Route path={ROUTE_PATH.VOTE_DETAIL} element={<h1>상세 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('쿼리스트링의 인증값을 그대로 보내고 참여 폼으로 간다', async () => {
    seedCertInfo()

    let body: Record<string, unknown> = {}
    server.use(
      http.patch(url({ path: PASS_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()

    expect(await screen.findByRole('heading', { name: '참여 폼' })).toBeInTheDocument()
    expect(body).toEqual({ apiToken: 'token-1', certNum: 'cert-1' })
  })

  it('인증 시도를 표시해 **뒤로 돌아와도 다시 요청하지 않는다**', async () => {
    seedCertInfo()

    server.use(
      http.patch(url({ path: PASS_PATH }), () => {
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await screen.findByRole('heading', { name: '참여 폼' })

    expect(useVoteCertStore.getState().voteCertInfo.isTriedVerification).toBe(true)
  })

  it('이미 인증을 시도했으면 **아무것도 렌더하지 않는다**', () => {
    seedCertInfo({ isTriedVerification: true })

    let requested = false
    server.use(
      http.patch(url({ path: PASS_PATH }), () => {
        requested = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { container } = renderPage()

    expect(container).toBeEmptyDOMElement()
    expect(requested).toBe(false)
  })

  it('인증에 실패하면 **서버 원문**을 띄운다', async () => {
    seedCertInfo()

    server.use(
      http.patch(url({ path: PASS_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'X', message: '인증에 실패했습니다' } },
          { status: 400 },
        )
      }),
    )

    renderPage()

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe('인증에 실패했습니다')
    })
  })

  it('⚠️ 쿼리스트링 없이 들어오면 접근 금지 모달이 뜬다', async () => {
    seedCertInfo()

    renderPage({ search: '' })

    expect(await screen.findByText('잘못된 접근입니다')).toBeInTheDocument()
  })
})

describe('VoteCertNamePhonePage (VT6)', () => {
  const renderPage = ({ auth = true } = {}) => {
    return renderWithProviders({
      initialEntries: [
        {
          pathname: ROUTE_PATH.VOTE_CERT_NAME_PHONE,
          state: auth ? { auth: true, dong: '101', ho: '1001' } : null,
        },
      ],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VOTE_CERT_NAME_PHONE} element={<VoteCertNamePhonePage />} />
          <Route path={ROUTE_PATH.VOTE_FORM} element={<h1>참여 폼</h1>} />
          <Route path={ROUTE_PATH.VOTE_LIST} element={<h1>목록 화면</h1>} />
          <Route path={ROUTE_PATH.VOTE_DETAIL} element={<h1>상세 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('동/호수가 채워진 채 **비활성**이다', () => {
    seedCertInfo()

    renderPage()

    expect(screen.getByDisplayValue('101')).toBeDisabled()
    expect(screen.getByDisplayValue('1001')).toBeDisabled()
  })

  it('이름 검증 에러는 뜬다', async () => {
    seedCertInfo()

    renderPage()
    await userEvent.type(screen.getByPlaceholderText('이름 입력'), '1')

    expect(await screen.findByText('2자 이상 입력해주세요')).toBeInTheDocument()
  })

  it('🔴 휴대폰 검증 에러는 **뜨지 않는다** (레거시가 없는 필드를 읽는다)', async () => {
    seedCertInfo()

    renderPage()
    await userEvent.type(screen.getByPlaceholderText('이름 입력'), '홍길동')
    await userEvent.type(screen.getByPlaceholderText('휴대폰 번호(- 없이 숫자만 입력)'), '123')

    // 이름 쪽 에러가 사라진 것으로 검증이 돌았음을 확인한다
    await waitFor(() => {
      expect(screen.queryByText('2자 이상 입력해주세요')).not.toBeInTheDocument()
    })
    // 그런데도 휴대폰 문구는 끝내 뜨지 않는다
    expect(screen.queryByText('휴대폰 번호 형식으로 - 없이 입력해주세요')).not.toBeInTheDocument()
  })

  it('인증에 성공하면 **하이픈을 떼고** 보내고 참여 폼으로 간다', async () => {
    seedCertInfo()

    let body: Record<string, unknown> = {}
    server.use(
      http.patch(url({ path: NAME_PHONE_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await userEvent.type(screen.getByPlaceholderText('이름 입력'), '홍길동')
    await userEvent.type(
      screen.getByPlaceholderText('휴대폰 번호(- 없이 숫자만 입력)'),
      '01012345678',
    )
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    expect(await screen.findByRole('heading', { name: '참여 폼' })).toBeInTheDocument()
    expect(body).toEqual({ name: '홍길동', phone: '01012345678' })
  })

  it('⚠️ `VOTER_MISS_MATCH`는 모달만 띄우고 **화면에 남는다**', async () => {
    seedCertInfo()

    server.use(
      http.patch(url({ path: NAME_PHONE_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'VOTER_MISS_MATCH', message: '투표자 정보가 일치하지 않습니다' } },
          { status: 400 },
        )
      }),
    )

    renderPage()
    await userEvent.type(screen.getByPlaceholderText('이름 입력'), '홍길동')
    await userEvent.type(
      screen.getByPlaceholderText('휴대폰 번호(- 없이 숫자만 입력)'),
      '01012345678',
    )
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe('투표자 정보가 일치하지 않습니다')
    })
    // 콜백이 없다 = 화면을 떠나지 않는다
    expect(useErrorModalStore.getState().current?.callback).toBeUndefined()
    expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument()
  })

  it('그 밖의 에러는 상세로 되돌아갈 콜백을 단다', async () => {
    seedCertInfo()

    server.use(
      http.patch(url({ path: NAME_PHONE_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'X', message: '서버 오류' } },
          { status: 500 },
        )
      }),
    )

    renderPage()
    await userEvent.type(screen.getByPlaceholderText('이름 입력'), '홍길동')
    await userEvent.type(
      screen.getByPlaceholderText('휴대폰 번호(- 없이 숫자만 입력)'),
      '01012345678',
    )
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe('서버 오류')
    })
    expect(useErrorModalStore.getState().current?.callback).toBeTypeOf('function')
  })

  it('⚠️ 직접 진입하면 접근 금지 모달이 뜨고 닫으면 **목록**으로 간다', async () => {
    seedCertInfo()

    renderPage({ auth: false })

    expect(screen.getByText('잘못된 접근입니다')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    expect(await screen.findByRole('heading', { name: '목록 화면' })).toBeInTheDocument()
  })
})

describe('VoteCompletedPage (VT4)', () => {
  const renderPage = ({ auth = true } = {}) => {
    return renderWithProviders({
      initialEntries: [
        { pathname: ROUTE_PATH.VOTE_COMPLETED, state: auth ? { auth: true } : null },
      ],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VOTE_COMPLETED} element={<VoteCompletedPage />} />
          <Route path={ROUTE_PATH.HOME} element={<h1>인트로</h1>} />
          <Route path={ROUTE_PATH.MAIN} element={<h1>메인</h1>} />
        </Routes>
      ),
    })
  }

  it('완료 문구를 보여준다', () => {
    renderPage()

    expect(screen.getByText('투표가 완료되었습니다.')).toBeInTheDocument()
    expect(screen.getByText('투표에 참여해주셔서 감사합니다.')).toBeInTheDocument()
  })

  it('⚠️ 회원의 `확인`은 `/main`이 아니라 **`/`로 간다**', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    expect(await screen.findByRole('heading', { name: '인트로' })).toBeInTheDocument()
  })

  it('비회원에게는 닫기·확인 버튼이 없다', () => {
    useAuthStore.setState({ aptInfo: {} })

    renderPage()

    expect(screen.queryByRole('button', { name: '확인' })).not.toBeInTheDocument()
    expect(screen.queryByAltText('닫기 아이콘')).not.toBeInTheDocument()
  })

  it('⚠️ 직접 진입하면 접근 금지 모달이 뜨고 닫으면 **메인**으로 간다', async () => {
    // 화면에도 `확인` 버튼이 있어 회원이면 둘이 겹친다 — 비회원으로 두고 모달만 남긴다
    useAuthStore.setState({ aptInfo: {} })

    renderPage({ auth: false })

    expect(screen.getByText('잘못된 접근입니다')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    expect(await screen.findByRole('heading', { name: '메인' })).toBeInTheDocument()
  })
})
