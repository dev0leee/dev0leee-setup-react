import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 메인 메뉴 스와이퍼 항목. 레거시 `constants/domain/common.js`의 `MAIN_SWIPER_MENU_LIST` 이식.
 *
 * `contentName`이 있으면 **단지가 그 서비스를 구독할 때만** 나오고, 없으면 고정 메뉴다.
 *
 * ⚠️ **`contentName`을 `APT_CONTENT_NAME`으로 바꾸지 않았다.** 이 목록의 문자열이
 * 그 상수와 어긋나 있기 때문이다:
 *  - 전자투표·설문조사가 쓰는 이름은 **`'투표'`**인데 `APT_CONTENT_NAME.VOTE`는
 *    **`'전자투표'`**다. 다만 그 상수로 게이팅하는 곳이 **없어서**(레거시
 *    `hasAptVoteContent`가 미사용) 실제로 동작하는 판정은 여기 `'투표'` 하나뿐이다
 *    (`main.md` M-Q3 확정). 상수로 통일하면 **투표 메뉴가 사라진다**
 *  - `'커뮤니티V2'`·`'하자보수'`·`'아파트몰'`·`'소방 자가 점검'`은 `APT_CONTENT_NAME`에 아예 없다
 *
 * 상수로 통일하면 노출 조건이 바뀐다. **등가 이관을 위해 레거시 리터럴을 그대로 둔다.**
 */
export const MAIN_SWIPER_MENU_LIST = [
  {
    contentName: '주차',
    menuName: '주차관리',
    iconName: 'icon-main-parking',
    menuUrl: ROUTE_PATH.PARKING,
  },
  {
    contentName: '커뮤니티',
    menuName: '커뮤니티',
    iconName: 'icon-main-community',
    menuUrl: '',
  },
  {
    contentName: '커뮤니티V2',
    menuName: '커뮤니티V2',
    iconName: 'icon-main-community',
    menuUrl: '',
  },
  {
    contentName: '소통',
    menuName: '소통공간',
    iconName: 'icon-main-board-community',
    menuUrl: ROUTE_PATH.BOARD_COMMUNITY,
  },
  {
    contentName: '민원',
    menuName: '민원공간',
    iconName: 'icon-main-board-complaints',
    menuUrl: ROUTE_PATH.BOARD_COMPLAINTS,
  },
  {
    contentName: '하자보수',
    menuName: '하자보수',
    iconName: 'icon-main-repair',
    menuUrl: ROUTE_PATH.REPAIR_LIST,
  },
  {
    contentName: '이사예약',
    menuName: '이사예약',
    iconName: 'icon-main-moving',
    menuUrl: ROUTE_PATH.MOVING_HOUSE_LIST,
  },
  {
    contentName: '투표',
    menuName: '전자투표',
    iconName: 'icon-main-vote',
    menuUrl: ROUTE_PATH.VOTE_LIST,
  },
  {
    contentName: '아파트몰',
    menuName: '조식예약',
    iconName: 'icon-main-aptmall',
    menuUrl: ROUTE_PATH.APT_MALL_MY_ORDER,
  },
  {
    menuName: '관리사무소',
    iconName: 'icon-main-office',
    menuUrl: ROUTE_PATH.MYPAGE_APT_INFO,
  },
  {
    contentName: '투표',
    menuName: '설문조사',
    iconName: 'icon-main-survey',
    menuUrl: ROUTE_PATH.SURVEY_LIST,
  },
  {
    contentName: '쇼핑몰',
    menuName: '쇼핑몰',
    iconName: 'icon-main-shopping',
    menuUrl: '',
  },
  {
    contentName: '로비폰',
    menuName: '공동 현관',
    iconName: 'icon-main-lobby',
    menuUrl: ROUTE_PATH.VISIT_LOBBY_PHONE,
  },
  {
    contentName: '소방 자가 점검',
    menuName: '소방자가점검',
    iconName: 'icon-main-fire-inspection',
    menuUrl: ROUTE_PATH.FIRE_INSPECTION,
    isNew: true,
  },
] as const

/**
 * 구독과 무관하게 항상 나오는 메뉴. **조건부 메뉴 뒤에 붙는다.**
 *
 * ⚠️ 레거시는 `['관리사무소', '공지사항']`인데 **`'공지사항'`은 목록에 없는 이름**이라
 * 아무것도 매칭되지 않는다. 죽은 항목이라 옮기지 않았다 (`deferred.md` D-38).
 */
export const FIXED_SWIPER_MENU_NAMES: string[] = ['관리사무소']

/** 슬라이드 한 장에 들어가는 메뉴 수 */
export const ITEMS_PER_SLIDE = 8

/**
 * 라우터가 아니라 **자기만의 분기**로 처리하는 메뉴. `menuUrl`이 비어 있는 것들이다.
 * 외부 사이트로 나가거나(커뮤니티 2종) 동의 여부를 먼저 확인한다(쇼핑몰).
 */
export const EXTERNAL_MENU_NAME = {
  COMMUNITY_V2: '커뮤니티V2',
  COMMUNITY: '커뮤니티',
  SHOPPING: '쇼핑몰',
} as const
