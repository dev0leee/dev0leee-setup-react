import { MyPageMenuGroupItem } from '@/features/mypage/components/MyPageMenuGroupItem'
import { MENU_GROUP_TITLE } from '@/features/mypage/constants/mypage'
import type { MyPageMenuGroup } from '@/features/mypage/types/mypage'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'

/**
 * 마이페이지 메뉴 목록. 레거시 `MyPageMenuList.vue` 이식.
 *
 * 그룹 7개를 구독 콘텐츠로 걸러 그린다. **2단 필터**다:
 *  1. 그룹의 `isActive`
 *  2. 그룹 안 항목의 `isActive` (`undefined`면 통과)
 *
 * ⚠️ **`소방 자가 점검`이 조건 없이 보인다.** 메인 화면 스와이퍼에서는
 * `contentName`으로 게이팅되는데 여기엔 조건이 없다 — 비대칭이지만 레거시 그대로다
 * (`mypage.md` P-Q1, 사용자 확인 대기).
 *
 * ⚠️ 레거시 `filterGroupList`는 항목이 0개인 그룹에 `null`을 넣고 걸러내지 않아
 * `v-for`에 `null`이 들어갈 수 있었다 (`deferred.md` D-43). 여기서는 빈 그룹을
 * 걸러낸다 — `게시판` 그룹의 첫 항목이 무조건 통과하므로 **실제로 발생하지 않던**
 * 경로이고, 렌더 결과가 같다.
 *
 * 아직 이관되지 않은 도메인의 경로는 문자열 그대로 뒀다. 해당 도메인이 오면
 * `ROUTE_PATH`에 상수가 생기고 여기를 바꾼다 — 지금 상수를 만들면 라우트 정의가
 * 없는 상수가 생겨 실제 경로와 어긋나도 알 수 없다.
 */
export const MyPageMenuList = () => {
  const {
    hasAptParkingContent,
    hasAptApassContent,
    hasAptBoardCommunityContent,
    hasAptBoardComplaintsContent,
  } = useResidentDetailInfo()

  const menuGroups: MyPageMenuGroup[] = [
    {
      title: MENU_GROUP_TITLE.PARKING,
      menuItems: [
        { name: '주차관리', url: '/parking' },
        { name: '잔여 주차 마일리지', url: '/parking/mileage/history' },
        { name: '정기권 등록 차량', url: '/parking/regular-car' },
      ],
      isActive: hasAptParkingContent,
    },
    {
      title: MENU_GROUP_TITLE.ACCESS,
      menuItems: [{ name: 'A-PASS', url: '/apass' }],
      isActive: hasAptApassContent,
    },
    {
      title: MENU_GROUP_TITLE.BOARD,
      menuItems: [
        // 미노출 사용자 관리는 소통·민원 어느 쪽을 구독해도 보인다
        { name: '게시판 미노출 사용자 관리', url: '/board/setting/userBlock' },
        {
          name: '소통공간 활동',
          url: '/board/community/activities',
          isActive: hasAptBoardCommunityContent,
        },
        {
          name: '민원공간 활동',
          url: '/board/complaints/activities',
          isActive: hasAptBoardComplaintsContent,
        },
      ],
      isActive: hasAptBoardCommunityContent || hasAptBoardComplaintsContent,
    },
    {
      title: MENU_GROUP_TITLE.ALARM,
      menuItems: [{ name: '알림 설정', url: ROUTE_PATH.MYPAGE_ALARM_SETTING }],
      isActive: true,
    },
    {
      title: MENU_GROUP_TITLE.APT_LIFE,
      menuItems: [
        { name: '관리사무소', url: ROUTE_PATH.MYPAGE_APT_INFO },
        { name: '공지사항', url: '/board/notice' },
        { name: '소방 자가 점검', url: '/fire-inspection' },
      ],
      isActive: true,
    },
    {
      title: MENU_GROUP_TITLE.APTMANT_NOTICE,
      menuItems: [{ name: '아파트먼트 공지사항', url: '/board/global-notice' }],
      isActive: true,
    },
    {
      title: MENU_GROUP_TITLE.ETC,
      menuItems: [
        { name: '약관 및 정책', url: ROUTE_PATH.MYPAGE_TERMS_OF_USE },
        { name: '글자 크기 설정', url: ROUTE_PATH.MYPAGE_FONT_SIZE_SETTING },
        { name: '로그아웃', url: ROUTE_PATH.LOGOUT },
        { name: '회원탈퇴', url: ROUTE_PATH.MYPAGE_ACCOUNT_DELETION },
      ],
      isActive: true,
    },
  ]

  const visibleGroups = menuGroups
    .filter((group) => {
      return group.isActive
    })
    .map((group) => {
      return {
        ...group,
        menuItems: group.menuItems.filter((menu) => {
          return menu.isActive === undefined || menu.isActive
        }),
      }
    })
    .filter((group) => {
      return group.menuItems.length > 0
    })

  return (
    <ul className="w-full space-y-2">
      {visibleGroups.map((group) => {
        return <MyPageMenuGroupItem key={group.title} title={group.title} menus={group.menuItems} />
      })}
    </ul>
  )
}
