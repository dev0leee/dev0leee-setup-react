import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { CommunityMyActivitiesPage } from '@/features/board/pages/MyActivitiesPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'

const POSTS_PATH = `${API_PREFIX.BOARD}/${RESIDENT_UUID}/community/my`
const COMMENTS_PATH = `${API_PREFIX.BOARD}/${RESIDENT_UUID}/community/my/comment`

const page = (title: string) => {
  return {
    success: {
      content: [
        {
          communityUuid: `uuid-${title}`,
          title,
          categoryName: '일반',
          createdDate: new Date().toISOString(),
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
        },
      ],
      number: 0,
      totalPages: 1,
      totalElements: 1,
      last: true,
      empty: false,
      numberOfElements: 1,
    },
  }
}

describe('MyActivitiesPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })

    server.use(
      http.get(url({ path: POSTS_PATH }), () => {
        return HttpResponse.json(page('내가 쓴 글'))
      }),
      http.get(url({ path: COMMENTS_PATH }), () => {
        return HttpResponse.json(page('댓글 단 글'))
      }),
    )
  })

  it('처음에는 `작성한 글` 탭이 열려 있다', async () => {
    renderWithProviders({ ui: <CommunityMyActivitiesPage /> })

    expect(await screen.findByText('내가 쓴 글')).toBeInTheDocument()
    expect(screen.queryByText('댓글 단 글')).not.toBeInTheDocument()
  })

  it('`댓글 쓴 글` 탭으로 바꾸면 다른 목록이 나온다', async () => {
    renderWithProviders({ ui: <CommunityMyActivitiesPage /> })

    await screen.findByText('내가 쓴 글')
    await userEvent.click(screen.getByText('댓글 쓴 글'))

    expect(await screen.findByText('댓글 단 글')).toBeInTheDocument()
    expect(screen.queryByText('내가 쓴 글')).not.toBeInTheDocument()
  })

  it('두 목록을 진입 시 함께 조회한다', async () => {
    // ⚠️ 탭은 하나만 보이지만 훅 두 개가 항상 실행돼 요청이 2건 나간다 — 레거시 동일
    const requested: string[] = []
    server.use(
      http.get(url({ path: POSTS_PATH }), () => {
        requested.push('posts')
        return HttpResponse.json(page('내가 쓴 글'))
      }),
      http.get(url({ path: COMMENTS_PATH }), () => {
        requested.push('comments')
        return HttpResponse.json(page('댓글 단 글'))
      }),
    )

    renderWithProviders({ ui: <CommunityMyActivitiesPage /> })
    await screen.findByText('내가 쓴 글')

    expect(requested).toContain('posts')
    expect(requested).toContain('comments')
  })
})
