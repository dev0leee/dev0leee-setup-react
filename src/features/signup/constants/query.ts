/** 아파트 검색 쿼리 키. 문자열은 레거시 그대로다 (`query-keys.md`) */
export const APT_LIST_QUERY_KEY = ['aptList'] as const

export const aptListQueryKey = ({ keyword }: { keyword: string }) => {
  return [...APT_LIST_QUERY_KEY, keyword] as const
}
