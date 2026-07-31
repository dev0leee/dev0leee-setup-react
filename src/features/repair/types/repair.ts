/** 하자보수 접수 상태 4종 */
export const REPAIR_STATE = {
  WAITING: 'WAITING',
  RECEIVED: 'RECEIVED',
  COMPLETED: 'COMPLETED',
  IMPOSSIBLE: 'IMPOSSIBLE',
} as const

/** 서버가 준 첨부 1개. 신규 첨부는 `File`이라 화면에서 둘을 섞어 다룬다 */
export interface RepairFile {
  fileUuid: string
  fileUrl: string
  fileName?: string
}

/**
 * 목록 1건 (RP1).
 *
 * ⚠️ **상태 필드가 목록은 `state`, 상세는 `repairState`다** — 서버 계약이라 그대로 쓴다
 * (`repair.md` RP-Q8).
 */
export interface RepairListItemData {
  repairUuid: string
  state?: string
  location?: string | null
  content?: string | null
  createdDate?: string
}

/** 상세 (RP3·RP4) */
export interface RepairDetailData {
  repairUuid?: string
  repairState?: string
  receiptNum?: string
  createdDate?: string
  location?: string | null
  emergencyPhone?: string | null
  content?: string | null
  requirement?: string | null
  visitDateTime?: string | null
  adminComment?: string | null
  fileList?: RepairFile[]
}

/** 상태별 접수 건수 (RP1). **키가 소문자다** — 화면이 상태값을 소문자로 바꿔 찾는다 */
export type RepairStatusCount = Record<string, number>
