import type { UseInfiniteQueryOptions } from '@tanstack/react-query'

import type { ApiError } from '@/shared/lib/apiErrors'
import type { AptInfo } from '@/shared/types/auth'

/**
 * Spring Pageable 응답. API 함수가 `data.success`까지 벗겨서 이 모양을 준다.
 *
 * 레거시는 `fetchFunction`이 AxiosResponse를 그대로 돌려주고 팩토리가
 * `page.data.success`를 파고들었다. 이관본은 API 함수가 껍데기를 벗기는
 * 타깃 컨벤션(03-api)을 따르되, **필드 이름과 다음-페이지 판정은 그대로**다.
 */
export interface PageResponse<TItem> {
  content: TItem[]
  /** 현재 페이지 번호 (0-based) */
  number: number
  totalPages: number
  totalElements: number
  /** 마지막 페이지인지 */
  last: boolean
  empty: boolean
  sort?: unknown
  numberOfElements: number
}

/** `select`가 화면에 넘기는 모양. 레거시 반환 구조 그대로 */
export interface InfiniteListData<TItem> {
  /** 전 페이지의 `content`를 평탄화한 것 */
  pages: TItem[]
  /** ⚠️ `pages[0].number`다. 이름은 복수형이지만 값은 첫 페이지 번호 하나다 */
  pageParams: number | undefined
  pageable: {
    totalPages: number | undefined
    totalElements: number | undefined
    empty: boolean | undefined
    sort: unknown
    numberOfElements: number | undefined
  }
}

export interface InfiniteListFetchParams {
  page: number
  size: number
  [key: string]: unknown
}

export interface UseInfiniteListOptions<TItem> {
  /** 캐시 키의 첫 요소. `resetCache()`가 이 값으로 접두사 매칭한다 */
  queryKey: string
  /** `aptInfo`에서 뽑아 캐시 키와 요청 파라미터에 함께 넣을 필드들 */
  defaultStoreKey: (keyof AptInfo)[]
  fetchFunction: (params: InfiniteListFetchParams) => Promise<PageResponse<TItem>>
  /** ⚠️ **값만** 캐시 키에 들어간다. 속성 순서가 캐시 키를 바꾼다 */
  additionalParams?: Record<string, unknown>
  additionalOptions?: Omit<
    Partial<
      UseInfiniteQueryOptions<
        PageResponse<TItem>,
        ApiError,
        InfiniteListData<TItem>,
        readonly unknown[],
        number
      >
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam' | 'select'
  >
}
