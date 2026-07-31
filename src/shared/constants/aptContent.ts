/**
 * 단지가 구독한 서비스 이름. `contentList`로 화면·메뉴 노출을 게이팅한다.
 *
 * ⚠️ **비교 전에 `trim()`을 해야 한다.** 서버 값에 공백이 섞여 오는 것을
 * 레거시가 `.trim()`으로 방어하고 있다 (`native-protocol.md` §N10).
 * 판정은 `hasAptContent`를 쓴다 — 직접 `some()`을 쓰면 trim을 빠뜨린다.
 *
 * 레거시 `useGetResidentDetailInfo.js`의 `CONTENT_TYPES` + `useWallPadContent.js`의
 * 월패드 이름 3종을 합친 것이다. **서버가 주는 문자열이므로 바꾸지 않는다.**
 */
export const APT_CONTENT_NAME = {
  MANAGEMENT_FEE: '관리비',
  PARKING: '주차',
  COMMUNITY: '커뮤니티',
  APASS: 'A-PASS',
  VISITOR_PASS: '방문증',
  LOBBY_PHONE: '로비폰',
  FACE_RECOG: '안면인식',
  BOARD_COMMUNITY: '소통',
  BOARD_COMPLAINTS: '민원',
  APAY_QR: 'A-PAY-QR',
  APAY_PAYMENT: 'A-PAY-결제금액',
  MOVING_HOUSE: '이사예약',
  VOTE: '전자투표',
  SHOPPING: '쇼핑몰',
  /** 주차 메뉴에서 `항상허용 차량`을 감추고 방문예약 타일을 키운다 (`parking.md` PK1) */
  MILEAGE_LIMIT: '마일리지 한도 제한',
  /** 월패드 — 샘물 연동 */
  WALL_PAD: '차량세대통보',
  /** 월패드 — 외부 업체 연동 */
  WALL_PAD_EXTERNAL: '외부월패드',
  /** 월패드 — 외부 업체 연동(정기차량만) */
  WALL_PAD_EXTERNAL_REGULAR: '외부월패드(정기차량)',
} as const

export type AptContentName = (typeof APT_CONTENT_NAME)[keyof typeof APT_CONTENT_NAME]
