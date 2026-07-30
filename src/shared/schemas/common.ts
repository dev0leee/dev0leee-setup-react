import { z } from 'zod'

import { PHONE_CUSTOM_REGEX } from '@/shared/constants/regex'

/**
 * 도메인을 모르는 필드 프리미티브만 여기 둔다.
 * 로그인·주문처럼 도메인을 아는 스키마는 그 feature의 schemas/가 조합해서 만든다
 * (01-folder-structure "공유는 스키마 통째가 아니라 필드 단위로").
 */

/** 하이픈 없는 국내 휴대폰 번호 */
export const phoneField = z.string().regex(PHONE_CUSTOM_REGEX, '올바른 휴대폰 번호를 입력하세요.')

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1).max(100),
})

export type Pagination = z.infer<typeof paginationSchema>
