import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useInfiniteList } from '@/shared/hooks/useInfiniteList'
import { useAuthStore } from '@/shared/stores/authStore'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 무한 목록 18종이 이 팩토리를 공유한다. 페이지 크기·다음 페이지 판정·
 * 캐시 키 조립 방식이 보존 필수 항목이다 (`tech-mapping.md` §13 항목 11).
 */

interface Row {
  id: string
}

const page = ({
  content,
  number,
  totalPages,
  last,
}: {
  content: Row[]
  number: number
  totalPages: number
  last: boolean
}): PageResponse<Row> => {
  return {
    content,
    number,
    totalPages,
    totalElements: totalPages * 10,
    last,
    empty: content.length === 0,
    numberOfElements: content.length,
  }
}

const renderList = ({
  fetchFunction,
  additionalParams,
}: {
  fetchFunction: (params: InfiniteListFetchParams) => Promise<PageResponse<Row>>
  additionalParams?: Record<string, unknown>
}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  return renderHook(
    () => {
      return useInfiniteList<Row>({
        queryKey: 'noticeList',
        defaultStoreKey: ['aptResidentUuid'],
        fetchFunction,
        additionalParams,
      })
    },
    { wrapper },
  )
}

describe('useInfiniteList', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: 'resident-1' } })
  })

  it('첫 페이지를 page 0 · size 10으로 요청하고 aptInfo 값을 함께 보낸다', async () => {
    const fetchFunction = vi
      .fn()
      .mockResolvedValue(page({ content: [{ id: 'a' }], number: 0, totalPages: 1, last: true }))

    const { result } = renderList({ fetchFunction })

    await waitFor(() => {
      expect(result.current.isListLoading).toBe(false)
    })

    // 페이지 크기 10은 보존 항목이다.
    expect(fetchFunction).toHaveBeenCalledWith({
      aptResidentUuid: 'resident-1',
      page: 0,
      size: 10,
    })
  })

  it('content를 평탄화하고 pageable은 첫 페이지에서 뽑는다', async () => {
    const fetchFunction = vi
      .fn()
      .mockResolvedValue(
        page({ content: [{ id: 'a' }, { id: 'b' }], number: 0, totalPages: 3, last: false }),
      )

    const { result } = renderList({ fetchFunction })

    await waitFor(() => {
      expect(result.current.list?.pages).toEqual([{ id: 'a' }, { id: 'b' }])
    })

    expect(result.current.list?.pageable).toEqual({
      totalPages: 3,
      totalElements: 30,
      empty: false,
      sort: undefined,
      numberOfElements: 2,
    })
    // 이름은 복수형이지만 값은 첫 페이지 번호 하나다.
    expect(result.current.list?.pageParams).toBe(0)
  })

  it('last가 true면 다음 페이지가 없다', async () => {
    const fetchFunction = vi
      .fn()
      .mockResolvedValue(page({ content: [{ id: 'a' }], number: 0, totalPages: 1, last: true }))

    const { result } = renderList({ fetchFunction })

    await waitFor(() => {
      expect(result.current.isListLoading).toBe(false)
    })
    expect(result.current.hasListNextPage).toBe(false)
  })

  it('last가 false여도 받은 페이지 수가 총 페이지 수에 닿으면 멈춘다', async () => {
    // 서버가 last를 잘못 주는 경우를 두 번째 조건이 막는다.
    const fetchFunction = vi
      .fn()
      .mockResolvedValue(page({ content: [{ id: 'a' }], number: 0, totalPages: 1, last: false }))

    const { result } = renderList({ fetchFunction })

    await waitFor(() => {
      expect(result.current.isListLoading).toBe(false)
    })
    expect(result.current.hasListNextPage).toBe(false)
  })

  it('다음 페이지는 number + 1로 요청한다', async () => {
    const fetchFunction = vi
      .fn()
      .mockResolvedValueOnce(
        page({ content: [{ id: 'a' }], number: 0, totalPages: 2, last: false }),
      )
      .mockResolvedValueOnce(page({ content: [{ id: 'b' }], number: 1, totalPages: 2, last: true }))

    const { result } = renderList({ fetchFunction })

    await waitFor(() => {
      expect(result.current.hasListNextPage).toBe(true)
    })

    await result.current.fetchListNextPage()

    await waitFor(() => {
      expect(result.current.list?.pages).toEqual([{ id: 'a' }, { id: 'b' }])
    })
    expect(fetchFunction).toHaveBeenLastCalledWith({
      aptResidentUuid: 'resident-1',
      page: 1,
      size: 10,
    })
  })

  it('additionalParams는 요청에 병합된다', async () => {
    const fetchFunction = vi
      .fn()
      .mockResolvedValue(page({ content: [], number: 0, totalPages: 0, last: true }))

    const { result } = renderList({ fetchFunction, additionalParams: { keyword: '공지' } })

    await waitFor(() => {
      expect(result.current.isListLoading).toBe(false)
    })

    expect(fetchFunction).toHaveBeenCalledWith({
      aptResidentUuid: 'resident-1',
      page: 0,
      size: 10,
      keyword: '공지',
    })
  })
})
