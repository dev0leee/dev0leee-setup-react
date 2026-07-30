/** 서버가 주는 첨부파일 한 건. `fileUrl`은 S3 접두사가 없는 상대 경로다 */
export interface AttachedFile {
  fileUuid?: string
  fileUrl: string
  /** URL 인코딩 + HTML 엔티티가 섞여 온다. `decodeUrl`을 거쳐 표시한다 */
  fileName: string
}
