import { z } from 'zod'

/**
 * 도메인을 모르는 원시 검증만 여기 둔다.
 * 로그인·주문처럼 도메인을 아는 스키마는 그 feature의 schemas/가 소유한다.
 */

/** 하이픈 없는 국내 휴대폰 번호 */
export const phoneSchema = z
  .string()
  .regex(/^01[016789]\d{7,8}$/, '올바른 휴대폰 번호를 입력하세요.')

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1).max(100),
})

export type Pagination = z.infer<typeof paginationSchema>
