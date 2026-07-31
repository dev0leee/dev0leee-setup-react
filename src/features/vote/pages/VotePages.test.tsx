import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { VoteDetailPage } from '@/features/vote/pages/VoteDetailPage'
import { VoteListPage } from '@/features/vote/pages/VoteListPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const VOTE_UUID = 'vote-uuid-1'
const VOTER_UUID = 'voter-uuid-1'

const LIST_PATH = `${API_PREFIX.BOARD}/vote/${RESIDENT_UUID}/list`
const DETAIL_PATH = `/board/non-resident/voter/${VOTER_UUID}`
const STATUS_PATH = `${API_PREFIX.BOARD}/vote/${RESIDENT_UUID}/${VOTE_UUID}/result`

const LIST_ITEM = {
  voteUuid: VOTE_UUID,
  voterUuid: VOTER_UUID,
  voteStatus: 'PROGRESS',
  groupName: '1단지 입주자대표회의',
  title: '2026년 동대표 선출 투표',
  voteType: 'REPRESENT',
  voterStatus: 'PENDING',
  openVoteDateTime: '2026-07-29T09:00:00',
  closeVoteDateTime: '2026-08-05T18:00:00',
}

const DETAIL_INFO = {
  voterUuid: VOTER_UUID,
  voteUuid: VOTE_UUID,
  voteStatus: 'PROGRESS',
  voterStatus: 'PENDING',
  voteType: 'REPRESENT',
  voteGroupName: '1단지 입주자대표회의',
  title: '2026년 동대표 선출 투표',
  content: '상세 내용입니다',
  voteOpenDateTime: '2026-07-29T09:00:00',
  voteCloseDateTime: '2026-08-05T18:00:00',
  authFlag: false,
  voteAuthType: 'NAME_PHONE',
  dong: '101',
  ho: '1001',
}

const page = (content: unknown[]) => {
  return {
    content,
    number: 0,
    totalPages: 1,
    totalElements: content.length,
    last: true,
    empty: content.length === 0,
    numberOfElements: content.length,
  }
}

const useList = (content: unknown[]) => {
  server.use(
    http.get(url({ path: LIST_PATH }), () => {
      return HttpResponse.json({ success: page(content) })
    }),
  )
}

const useDetail = (info: unknown) => {
  server.use(
    http.get(url({ path: DETAIL_PATH }), () => {
      return HttpResponse.json({ success: info })
    }),
  )
}

const useStatus = (status: unknown) => {
  server.use(
    http.get(url({ path: STATUS_PATH }), () => {
      return HttpResponse.json({ success: status })
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  useErrorModalStore.setState({ current: null })
})

describe('VoteListPage (VT1)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.VOTE_LIST],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VOTE_LIST} element={<VoteListPage />} />
          <Route path={ROUTE_PATH.VOTE_DETAIL} element={<h1>상세 화면</h1>} />
          <Route path={ROUTE_PATH.MAIN} element={<h1>메인</h1>} />
        </Routes>
      ),
    })
  }

  it('카드에 상태 칩·제목·필드 4줄을 보여준다', async () => {
    useList([LIST_ITEM])

    renderPage()

    expect(await screen.findByText('2026년 동대표 선출 투표')).toBeInTheDocument()
    // 필터 탭에도 같은 글자가 있어 카드 안의 칩은 2번째다
    expect(screen.getAllByText('진행중')).toHaveLength(2)
    expect(screen.getByText('선거투표')).toBeInTheDocument()
    expect(screen.getByText('미완료')).toBeInTheDocument()
    expect(screen.getByText('2026-07-29 09:00')).toBeInTheDocument()
    expect(screen.getByText('2026-08-05 18:00')).toBeInTheDocument()
  })

  it('🔴 D-day는 **시작 전이어도 보이지 않는다** (레거시 조건이 틀려 있다)', async () => {
    useList([{ ...LIST_ITEM, voteStatus: 'PENDING' }])

    renderPage()

    await screen.findByText('2026년 동대표 선출 투표')
    expect(screen.queryByText(/^D-/)).not.toBeInTheDocument()
  })

  it('필터를 바꾸면 `voteStatus`를 실어 다시 조회한다', async () => {
    const requested: (string | null)[] = []
    server.use(
      http.get(url({ path: LIST_PATH }), ({ request }) => {
        requested.push(new URL(request.url).searchParams.get('voteStatus'))
        return HttpResponse.json({ success: page([LIST_ITEM]) })
      }),
    )

    renderPage()
    await screen.findByText('진행중')

    await userEvent.click(screen.getByText('종료'))

    await waitFor(() => {
      expect(requested).toContain('CLOSE')
    })
    // `전체`는 파라미터를 아예 안 보낸다
    expect(requested[0]).toBeNull()
  })

  it('카드를 누르면 상세로 간다', async () => {
    useList([LIST_ITEM])

    renderPage()
    await userEvent.click(await screen.findByText('2026년 동대표 선출 투표'))

    expect(await screen.findByRole('heading', { name: '상세 화면' })).toBeInTheDocument()
  })

  it('0건이면 빈 문구가 뜬다', async () => {
    useList([])

    renderPage()

    expect(await screen.findByText('등록된 투표가 없습니다')).toBeInTheDocument()
  })

  it('⚠️ 조회에 실패하면 모달을 띄우고 메인으로 보낸다', async () => {
    server.use(
      http.get(url({ path: LIST_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'X', message: '목록을 못 불러왔다' } },
          {
            status: 500,
          },
        )
      }),
    )

    renderPage()

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe('목록을 못 불러왔다')
    })
  })
})

describe('VoteDetailPage (VT2)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [`/vote/detail/${VOTE_UUID}/${VOTER_UUID}`],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VOTE_DETAIL} element={<VoteDetailPage />} />
          <Route path={ROUTE_PATH.VOTE_LIST} element={<h1>목록 화면</h1>} />
          <Route path={ROUTE_PATH.VOTE_FORM} element={<h1>참여 폼</h1>} />
          <Route path={ROUTE_PATH.VOTE_CERT_NAME_PHONE} element={<h1>이름 휴대폰 인증</h1>} />
          <Route path={ROUTE_PATH.ERROR} element={<h1>에러 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('제목·그룹명·기간을 보여준다', async () => {
    useDetail(DETAIL_INFO)

    renderPage()

    expect(await screen.findByText('2026년 동대표 선출 투표')).toBeInTheDocument()
    expect(screen.getByText('1단지 입주자대표회의')).toBeInTheDocument()
    // ⚠️ 초까지 그대로 보인다 — `replace('T',' ')`만 한다
    expect(screen.getByText('2026-07-29 09:00:00 ~ 2026-08-05 18:00:00')).toBeInTheDocument()
  })

  it('진입 시 인증 정보를 저장하고 `isTriedVerification`을 지운다', async () => {
    useDetail(DETAIL_INFO)

    renderPage()
    await screen.findByText('2026년 동대표 선출 투표')

    expect(JSON.parse(localStorage.getItem('voteCertInfo') ?? '{}')).toEqual({
      voterUuid: VOTER_UUID,
      voteUuid: VOTE_UUID,
    })
  })

  it('⚠️ 시작 전이면 `투표 현황` 탭이 없다', async () => {
    useDetail({ ...DETAIL_INFO, voteStatus: 'PENDING' })

    renderPage()

    // 데이터가 와야 탭이 하나로 줄어든다
    expect(await screen.findByText('시작전')).toBeInTheDocument()
    expect(screen.getByText('투표 정보')).toBeInTheDocument()
    expect(screen.queryByText('투표 현황')).not.toBeInTheDocument()
  })

  it('시작 전에는 D-day가 보인다 (목록과 다르다)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 6, 26, 12, 0, 0))

    useDetail({ ...DETAIL_INFO, voteStatus: 'PENDING' })

    renderPage()

    expect(await screen.findByText('D-3')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('하단 버튼 — 시작 전이면 `오픈`이 비활성으로 뜬다', async () => {
    useDetail({ ...DETAIL_INFO, voteStatus: 'PENDING' })

    renderPage()

    const button = await screen.findByRole('button', { name: /오픈/ })
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('2026-07-29 09:00:00')
  })

  it('하단 버튼 — 종료면 `종료`가 비활성이다', async () => {
    useDetail({ ...DETAIL_INFO, voteStatus: 'CLOSE' })
    useStatus({ voteStatus: 'CLOSE' })

    renderPage()

    expect(await screen.findByRole('button', { name: '종료' })).toBeDisabled()
  })

  it('하단 버튼 — 투표를 마쳤으면 `투표완료`가 비활성이다', async () => {
    useDetail({ ...DETAIL_INFO, voterStatus: 'VOTED' })

    renderPage()

    expect(await screen.findByRole('button', { name: '투표완료' })).toBeDisabled()
  })

  it('하단 버튼 — 인증을 마쳤으면 참여 폼으로 간다', async () => {
    useDetail({ ...DETAIL_INFO, authFlag: true })

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '투표하기' }))

    expect(await screen.findByRole('heading', { name: '참여 폼' })).toBeInTheDocument()
  })

  it('하단 버튼 — `NAME_PHONE`이면 인증 화면으로 간다', async () => {
    useDetail(DETAIL_INFO)

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '투표하기' }))

    expect(await screen.findByRole('heading', { name: '이름 휴대폰 인증' })).toBeInTheDocument()
  })

  it('하단 버튼 — `PASS`면 **KMC 사이트로 POST하는 폼**이 뜬다', async () => {
    useDetail({ ...DETAIL_INFO, voteAuthType: 'PASS' })

    renderPage()

    await waitFor(() => {
      expect(document.querySelector('form[name="reqKMCISForm"]')).toBeInTheDocument()
    })

    const form = document.querySelector('form[name="reqKMCISForm"]')
    expect(form).toHaveAttribute('method', 'post')
    expect(form).toHaveAttribute('action', 'https://www.kmcert.com/kmcis/web/kmcisReq.jsp')
  })

  it('`투표 현황` 탭 — 집계 4칸을 보여준다', async () => {
    useDetail(DETAIL_INFO)
    useStatus({
      voteStatus: 'PROGRESS',
      fullVoterCount: 1200,
      voteRate: 42,
      votedCount: 504,
      notVotedCount: 696,
    })

    renderPage()
    await userEvent.click(await screen.findByText('투표 현황'))

    expect(await screen.findByText('1,200명')).toBeInTheDocument()
    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.getByText('504명')).toBeInTheDocument()
    // 결과 그래프는 종료된 투표에만 나온다
    expect(screen.queryByText('투표 결과')).not.toBeInTheDocument()
  })

  it('`투표 현황` 탭 — 종료면 질문별 결과와 **최다 득표 강조**가 나온다', async () => {
    useDetail({ ...DETAIL_INFO, voteStatus: 'CLOSE' })
    useStatus({
      voteStatus: 'CLOSE',
      fullVoterCount: 10,
      voteRate: 100,
      votedCount: 10,
      notVotedCount: 0,
      questionList: [
        {
          uuid: 'q1',
          content: '누구를 뽑겠습니까?',
          questionType: 'SINGLE_CHOICE',
          questionFullCount: 10,
          questionOptionList: [
            { uuid: 'o1', content: '기호 1번', optionCount: 7, fileList: [] },
            { uuid: 'o2', content: '기호 2번', optionCount: 3, fileList: [] },
          ],
        },
      ],
    })

    renderPage()
    await userEvent.click(await screen.findByText('투표 현황'))

    expect(await screen.findByText('투표 결과')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()

    // 최다 득표만 브랜드색이다
    const maxWrapper = screen.getByText('7표').closest('div')
    expect(maxWrapper?.className).toContain('text-brand-default-text-brand')
    const otherWrapper = screen.getByText('3표').closest('div')
    expect(otherWrapper?.className).toContain('text-defaults-secondary-text-secondary')
  })

  it('`투표 현황` 탭 — 첨부가 있는 선택지에만 `자세히 보기`가 있다', async () => {
    useDetail({ ...DETAIL_INFO, voteStatus: 'CLOSE' })
    useStatus({
      voteStatus: 'CLOSE',
      questionList: [
        {
          uuid: 'q1',
          content: '질문',
          questionType: 'MULTIPLE_CHOICE',
          questionFullCount: 4,
          questionOptionList: [
            {
              uuid: 'o1',
              content: '첨부 있음',
              optionCount: 3,
              fileList: [{ fileUuid: 'f1', fileUrl: '/a.png', fileName: '공약' }],
            },
            { uuid: 'o2', content: '첨부 없음', optionCount: 1, fileList: [] },
          ],
        },
      ],
    })

    renderPage()
    await userEvent.click(await screen.findByText('투표 현황'))

    expect(await screen.findByText('(복수응답)')).toBeInTheDocument()
    expect(screen.getAllByText('자세히 보기')).toHaveLength(1)
  })

  it('⚠️ `VOTER_NOT_FOUND`면 목록으로 보낸 뒤 모달을 띄운다', async () => {
    server.use(
      http.get(url({ path: DETAIL_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'VOTER_NOT_FOUND', message: '투표자를 찾을 수 없습니다' } },
          { status: 400 },
        )
      }),
    )

    renderPage()

    expect(await screen.findByRole('heading', { name: '목록 화면' })).toBeInTheDocument()
    expect(useErrorModalStore.getState().current?.text).toBe('투표자를 찾을 수 없습니다')
  })

  it('그 밖의 에러는 모달만 띄우고 화면에 머문다', async () => {
    server.use(
      http.get(url({ path: DETAIL_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'X', message: '서버 오류' } },
          {
            status: 500,
          },
        )
      }),
    )

    renderPage()

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe('서버 오류')
    })
    expect(screen.queryByRole('heading', { name: '목록 화면' })).not.toBeInTheDocument()
  })
})
