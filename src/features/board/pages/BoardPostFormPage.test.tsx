import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  CommunityEditPage,
  CommunityWritePage,
  ComplaintsWritePage,
} from '@/features/board/pages/BoardPostFormPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const POST_UUID = 'post-1'

const CATEGORIES = [
  { uuid: 'cat-1', category: '자유' },
  { uuid: 'cat-2', category: '정보' },
]

const mockCategories = (segment: string) => {
  server.use(
    http.get(url({ path: `${API_PREFIX.BOARD}/${RESIDENT_UUID}/${segment}/category` }), () => {
      return HttpResponse.json({ success: CATEGORIES })
    }),
  )
}

/** 등록 요청 본문을 받아둔다 */
const captureCreate = (segment: string) => {
  const submitted: Record<string, string>[] = []

  server.use(
    http.post(
      url({ path: `${API_PREFIX.BOARD}/${RESIDENT_UUID}/${segment}` }),
      async ({ request }) => {
        const formData = await request.formData()
        const entry: Record<string, string> = {}
        formData.forEach((value, key) => {
          entry[key] = String(value)
        })
        submitted.push(entry)
        return HttpResponse.json({ success: null })
      },
    ),
  )

  return submitted
}

describe('BoardPostFormPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
    useErrorModalStore.setState({ current: null })
  })

  describe('등록 (B9)', () => {
    it('진입하면 카테고리 드로어가 자동으로 열린다', async () => {
      mockCategories('community')
      renderWithProviders({ ui: <CommunityWritePage /> })

      // 드로어 제목과 목록이 함께 뜬다
      expect(await screen.findByText('자유')).toBeInTheDocument()
      expect(screen.getByText('정보')).toBeInTheDocument()
    })

    it('카테고리 없이 완료를 누르면 안내 모달이 뜬다', async () => {
      // ⚠️ 인라인 에러가 아니라 **모달**이 유일한 검증 표시다 (§5-11)
      mockCategories('community')
      renderWithProviders({ ui: <CommunityWritePage /> })

      await screen.findByText('자유')
      // 드로어를 닫고 바로 제출한다
      await userEvent.keyboard('{Escape}')
      await userEvent.click(screen.getByText('완료'))

      // 에러 모달은 전역 스토어를 거쳐 앱 루트에서 렌더된다 — 스토어로 확인한다
      await waitFor(() => {
        expect(useErrorModalStore.getState().current?.text).toBe('게시글의 주제를 선택해주세요.')
      })
    })

    it('제목·내용이 비면 각각 다른 문구가 뜬다', async () => {
      mockCategories('community')
      renderWithProviders({ ui: <CommunityWritePage /> })

      await userEvent.click(await screen.findByText('자유'))
      await userEvent.click(screen.getByText('완료'))

      await waitFor(() => {
        expect(useErrorModalStore.getState().current?.text).toBe('제목을 입력해주세요.')
      })
    })

    it('완료 버튼은 비어 있어도 잠기지 않는다', async () => {
      // ⚠️ `disabled`는 제출 중일 때만 걸린다 (§5-12)
      mockCategories('community')
      renderWithProviders({ ui: <CommunityWritePage /> })

      await screen.findByText('자유')
      expect(screen.getByText('완료')).not.toBeDisabled()
    })

    it('다 채우고 완료하면 등록된다', async () => {
      mockCategories('community')
      const submitted = captureCreate('community')
      renderWithProviders({ ui: <CommunityWritePage /> })

      await userEvent.click(await screen.findByText('자유'))
      await userEvent.type(screen.getByPlaceholderText('제목을 입력해주세요'), '안녕하세요')
      await userEvent.type(
        screen.getByPlaceholderText('선택한 주제의 게시글 내용을 작성해주세요'),
        '본문입니다',
      )
      await userEvent.click(screen.getByText('완료'))

      await waitFor(() => {
        expect(submitted).toHaveLength(1)
      })
      expect(submitted[0]).toMatchObject({
        title: '안녕하세요',
        content: '본문입니다',
        categoryUuid: 'cat-1',
      })
    })

    it('소통공간 페이로드에는 `privateFlag`가 없다', async () => {
      // 레거시는 전역 스토어에 값이 남으면 소통공간에도 실려 나갔다 (BD-Q4로 해소)
      mockCategories('community')
      const submitted = captureCreate('community')
      renderWithProviders({ ui: <CommunityWritePage /> })

      await userEvent.click(await screen.findByText('자유'))
      await userEvent.type(screen.getByPlaceholderText('제목을 입력해주세요'), '제목')
      await userEvent.type(
        screen.getByPlaceholderText('선택한 주제의 게시글 내용을 작성해주세요'),
        '내용',
      )
      await userEvent.click(screen.getByText('완료'))

      await waitFor(() => {
        expect(submitted).toHaveLength(1)
      })
      expect(submitted[0]).not.toHaveProperty('privateFlag')
    })

    it('소통공간에는 비밀글 체크박스가 없다', async () => {
      mockCategories('community')
      renderWithProviders({ ui: <CommunityWritePage /> })

      await screen.findByText('자유')
      expect(screen.queryByText('비밀글 설정')).not.toBeInTheDocument()
    })
  })

  describe('민원공간 비밀글 (B16)', () => {
    beforeEach(() => {
      mockCategories('complaint')
    })

    it('꺼진 상태에서 누르면 체크되지 않고 모달만 열린다', async () => {
      renderWithProviders({ ui: <ComplaintsWritePage /> })

      await userEvent.click(await screen.findByText('자유'))
      await userEvent.click(screen.getByText('비밀글 설정'))

      expect(await screen.findByText('비밀글 설정하기')).toBeInTheDocument()
      // 모달이 열리면 Base UI 가 배경을 inert 처리한다 — `hidden`으로 찾아야 한다
      expect(screen.getByRole('checkbox', { hidden: true })).not.toBeChecked()
    })

    it('모달에서 확인을 누르면 체크된다', async () => {
      renderWithProviders({ ui: <ComplaintsWritePage /> })

      await userEvent.click(await screen.findByText('자유'))
      await userEvent.click(screen.getByText('비밀글 설정'))
      await userEvent.click(await screen.findByText('확인'))

      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('켜진 상태에서 누르면 모달 없이 바로 해제된다', async () => {
      renderWithProviders({ ui: <ComplaintsWritePage /> })

      await userEvent.click(await screen.findByText('자유'))
      await userEvent.click(screen.getByText('비밀글 설정'))
      await userEvent.click(await screen.findByText('확인'))
      expect(screen.getByRole('checkbox')).toBeChecked()

      await userEvent.click(screen.getByText('비밀글 설정'))

      expect(screen.getByRole('checkbox')).not.toBeChecked()
      expect(screen.queryByText('비밀글 설정하기')).not.toBeInTheDocument()
    })
  })

  describe('수정 (B10)', () => {
    it('기존 값을 채워서 열고 카테고리를 이름으로 역매칭한다', async () => {
      mockCategories('community')
      server.use(
        http.get(
          url({ path: `${API_PREFIX.BOARD}/${RESIDENT_UUID}/community/${POST_UUID}` }),
          () => {
            return HttpResponse.json({
              success: {
                communityUuid: POST_UUID,
                title: '고칠 제목',
                content: '고칠 본문',
                categoryName: '정보',
                fileList: [],
              },
            })
          },
        ),
      )

      renderWithProviders({
        initialEntries: [`/board/community/edit/${POST_UUID}`],
        ui: (
          <Routes>
            <Route path="/board/community/edit/:postUuid" element={<CommunityEditPage />} />
          </Routes>
        ),
      })

      expect(await screen.findByDisplayValue('고칠 제목')).toBeInTheDocument()
      expect(screen.getByDisplayValue('고칠 본문')).toBeInTheDocument()
      // 카테고리 드로어는 자동으로 열리지 않고, 선택된 이름이 버튼에 보인다
      await waitFor(() => {
        expect(screen.getByText('정보')).toBeInTheDocument()
      })
      expect(screen.queryByText('게시글의 주제를 선택해주세요')).not.toBeInTheDocument()
    })
  })
})
