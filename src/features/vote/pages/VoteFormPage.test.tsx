import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { VoteFormPage } from '@/features/vote/pages/VoteFormPage'
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

const FORM_PATH = `/board/non-resident/voter/${VOTER_UUID}/select`

const SINGLE_QUESTION = {
  uuid: 'q1',
  content: '동대표로 적합한 후보는?',
  questionType: 'SINGLE_CHOICE',
  questionOptionList: [
    { uuid: 'o1', content: '홍길동', fileList: [] },
    { uuid: 'o2', content: '김철수', fileList: [] },
  ],
}

const MULTIPLE_QUESTION = {
  uuid: 'q2',
  content: '필요한 시설은?',
  questionType: 'MULTIPLE_CHOICE',
  minChoice: 2,
  maxChoice: 3,
  questionOptionList: [
    { uuid: 'm1', content: '헬스장', fileList: [] },
    { uuid: 'm2', content: '독서실', fileList: [] },
    { uuid: 'm3', content: '카페', fileList: [] },
    { uuid: 'm4', content: '수영장', fileList: [] },
  ],
}

const useForm = (data: unknown) => {
  server.use(
    http.get(url({ path: FORM_PATH }), () => {
      return HttpResponse.json({ success: data })
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  useErrorModalStore.setState({ current: null })
  useVoteCertStore.setState({ voteCertInfo: { voterUuid: VOTER_UUID, voteUuid: VOTE_UUID } })
  localStorage.setItem(
    STORAGE_KEY.VOTE_CERT_INFO,
    JSON.stringify({ voterUuid: VOTER_UUID, voteUuid: VOTE_UUID }),
  )
})

const renderPage = ({ auth = true } = {}) => {
  return renderWithProviders({
    initialEntries: [{ pathname: `/vote/form/${VOTER_UUID}`, state: auth ? { auth: true } : null }],
    ui: (
      <Routes>
        <Route path={ROUTE_PATH.VOTE_FORM} element={<VoteFormPage />} />
        <Route path={ROUTE_PATH.VOTE_COMPLETED} element={<h1>완료 화면</h1>} />
        <Route path={ROUTE_PATH.VOTE_DETAIL} element={<h1>상세 화면</h1>} />
        <Route path={ROUTE_PATH.MAIN} element={<h1>메인</h1>} />
      </Routes>
    ),
  })
}

describe('VoteFormPage (VT3)', () => {
  it('단일 선택은 라디오, 복수 선택은 체크박스로 그린다', async () => {
    useForm({ voteType: 'REPRESENT', questionList: [SINGLE_QUESTION, MULTIPLE_QUESTION] })

    renderPage()

    expect(await screen.findByText('동대표로 적합한 후보는?')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
  })

  it('질문 유형별 안내 문구가 다르다', async () => {
    useForm({ voteType: 'REPRESENT', questionList: [SINGLE_QUESTION, MULTIPLE_QUESTION] })

    renderPage()

    expect(await screen.findByText('1개 선택 가능')).toBeInTheDocument()
    expect(screen.getByText('최소 2개/최대 3개')).toBeInTheDocument()
    expect(screen.getByText('(복수응답)')).toBeInTheDocument()
  })

  it('⚠️ 찬반투표는 **질문 유형과 무관하게** 같은 안내를 쓴다', async () => {
    useForm({ voteType: 'AGAINST', questionList: [SINGLE_QUESTION] })

    renderPage()

    expect(await screen.findByText('찬성/반대 의견 투표를 해주세요.')).toBeInTheDocument()
    expect(screen.queryByText('1개 선택 가능')).not.toBeInTheDocument()
  })

  it('미선택으로 제출하면 `옵션을 선택해주세요`가 뜨고 서명 모달이 안 열린다', async () => {
    useForm({ voteType: 'REPRESENT', questionList: [SINGLE_QUESTION] })

    renderPage()
    await screen.findByText('동대표로 적합한 후보는?')
    await userEvent.click(screen.getByRole('button', { name: '서명하고 투표제출' }))

    expect(await screen.findByText('옵션을 선택해주세요')).toBeInTheDocument()
    expect(screen.queryByText('서명하기')).not.toBeInTheDocument()
  })

  it('복수 선택의 최소 개수를 못 채우면 막힌다', async () => {
    useForm({ voteType: 'NORMAL', questionList: [MULTIPLE_QUESTION] })

    renderPage()
    await screen.findByText('필요한 시설은?')
    await userEvent.click(screen.getAllByRole('checkbox')[0] as HTMLElement)
    await userEvent.click(screen.getByRole('button', { name: '서명하고 투표제출' }))

    expect(await screen.findByText('최소 2개를 선택해주세요')).toBeInTheDocument()
  })

  it('복수 선택의 최대 개수를 넘기면 막힌다', async () => {
    useForm({ voteType: 'NORMAL', questionList: [MULTIPLE_QUESTION] })

    renderPage()
    await screen.findByText('필요한 시설은?')

    const checkboxes = screen.getAllByRole('checkbox')
    for (const checkbox of checkboxes) {
      await userEvent.click(checkbox)
    }
    await userEvent.click(screen.getByRole('button', { name: '서명하고 투표제출' }))

    expect(await screen.findByText('최대 3개까지만 선택 가능합니다')).toBeInTheDocument()
  })

  it('선택하면 라디오가 하나만 켜진다 (단일 선택)', async () => {
    useForm({ voteType: 'REPRESENT', questionList: [SINGLE_QUESTION] })

    renderPage()
    await screen.findByText('동대표로 적합한 후보는?')

    const radios = screen.getAllByRole('radio')
    await userEvent.click(radios[0] as HTMLElement)
    expect(radios[0]).toBeChecked()

    await userEvent.click(radios[1] as HTMLElement)
    expect(radios[0]).not.toBeChecked()
    expect(radios[1]).toBeChecked()
  })

  it('모두 고르면 서명 모달이 열린다', async () => {
    useForm({ voteType: 'REPRESENT', questionList: [SINGLE_QUESTION] })

    renderPage()
    await screen.findByText('동대표로 적합한 후보는?')
    await userEvent.click(screen.getAllByRole('radio')[0] as HTMLElement)
    await userEvent.click(screen.getByRole('button', { name: '서명하고 투표제출' }))

    expect(await screen.findByText('서명하기')).toBeInTheDocument()
  })

  it('첨부가 있는 선택지에만 `자세히 보기`가 있다', async () => {
    useForm({
      voteType: 'REPRESENT',
      questionList: [
        {
          ...SINGLE_QUESTION,
          questionOptionList: [
            {
              uuid: 'o1',
              content: '홍길동',
              fileList: [{ fileUuid: 'f1', fileUrl: '/a.png', fileName: '공약' }],
            },
            { uuid: 'o2', content: '김철수', fileList: [] },
          ],
        },
      ],
    })

    renderPage()

    expect(await screen.findByText('자세히 보기')).toBeInTheDocument()
    expect(screen.getAllByText('자세히 보기')).toHaveLength(1)
  })

  it('⚠️ `자세히 보기`를 눌러도 **선택이 바뀌지 않는다**', async () => {
    useForm({
      voteType: 'REPRESENT',
      questionList: [
        {
          ...SINGLE_QUESTION,
          questionOptionList: [
            {
              uuid: 'o1',
              content: '홍길동',
              fileList: [{ fileUuid: 'f1', fileUrl: '/a.png', fileName: '공약' }],
            },
          ],
        },
      ],
    })

    renderPage()
    await userEvent.click(await screen.findByText('자세히 보기'))

    // 드로어가 배경을 `aria-hidden`으로 덮어 role 쿼리가 닿지 않는다 — DOM으로 본다
    expect(document.querySelector('input[type="radio"]')).not.toBeChecked()
  })

  it('⚠️ 조회에 실패하면 모달을 띄우고 상세로 되돌린다', async () => {
    server.use(
      http.get(url({ path: FORM_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'X', message: '폼을 불러오지 못했다' } },
          {
            status: 500,
          },
        )
      }),
    )

    renderPage()

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe('폼을 불러오지 못했다')
    })
    expect(useErrorModalStore.getState().current?.callback).toBeTypeOf('function')
  })

  it('⚠️ 직접 진입하면 접근 금지 모달이 뜨고 닫으면 메인으로 간다', async () => {
    useForm({ voteType: 'REPRESENT', questionList: [SINGLE_QUESTION] })

    renderPage({ auth: false })

    expect(screen.getByText('잘못된 접근입니다')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    expect(await screen.findByRole('heading', { name: '메인' })).toBeInTheDocument()
  })

  it('⚠️ 서명 전에는 `서명 완료`가 비활성이다', async () => {
    useForm({ voteType: 'REPRESENT', questionList: [SINGLE_QUESTION] })

    renderPage()
    await screen.findByText('동대표로 적합한 후보는?')
    await userEvent.click(screen.getAllByRole('radio')[0] as HTMLElement)
    await userEvent.click(screen.getByRole('button', { name: '서명하고 투표제출' }))
    await screen.findByText('서명하기')

    // 서명 캔버스는 **터치 이벤트만** 받아 jsdom에서 그릴 수 없다.
    // 제출 페이로드 검증은 API 함수 단위 테스트가 맡는다 (`postVoteForm.test.ts`).
    expect(screen.getByRole('button', { name: '서명 완료' })).toBeDisabled()
  })
})
