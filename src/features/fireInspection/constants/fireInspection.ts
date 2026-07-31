import {
  FIRE_INSPECTION_ANSWER,
  type InspectionCategory,
} from '@/features/fireInspection/types/fireInspection'
import type { RadioItem } from '@/shared/types/radio'

/**
 * 점검표 전문. 레거시 `constants/domain/fireInspection.js`(308줄) 이식.
 *
 * 🔴 **10개 카테고리 · 21개 항목이 전부 클라이언트에 하드코딩돼 있다.**
 * 서버는 `sectionId`·`groupId`·`questionId`·`answer`만 저장한다 —
 * **문항이 바뀌면 프론트를 재배포해야 한다.**
 *
 * ⚠️ **`sectionId`·`groupId`·`questionId`를 한 글자도 바꾸지 않는다.** 서버 enum이다.
 * 3번 카테고리의 `groupId`가 `PARKING_EXTINGUISHER`(주차장)인데 카테고리명은
 * `주거용 주방자동 소화장치`(주방)다 — **그래도 그대로 둔다.**
 *
 * 🔴 **같은 착오가 화면 문구에도 있다** — 3번 첫 항목의 `description`이 `주차장 소화장치`라고
 * 적혀 있다(툴팁은 주방이 맞다). 화면에 보이는 오탈자지만 등가 이관이라 고치지 않았다
 * (`fire-inspection.md` F-Q2).
 *
 * ⚠️ **`categoryNumber`는 `categoryId`와 항상 같다** — 레거시 중복 필드를 그대로 뒀다.
 * 화면 배지가 `categoryNumber`를 읽으므로 지우려면 마크업도 함께 고쳐야 한다.
 */
export const INSPECTION_CATEGORIES: InspectionCategory[] = [
  {
    categoryId: 1,
    categoryNumber: 1,
    categoryName: '소화기',
    sectionId: 'FIRE_EQUIPMENT',
    groupId: 'EXTINGUISHER',
    items: [
      {
        itemId: 1,
        questionId: 'EXTINGUISHER_01',
        label: '손쉽게 사용할 수 있는 장소에 설치 여부',
        description: '소화기가 눈에 잘 보이고 쉽게 꺼낼 수 있는 위치에 있는지 확인합니다.',
      },
      {
        itemId: 2,
        questionId: 'EXTINGUISHER_02',
        label: '용기 변형·손상·부식 여부',
        description: '소화기 용기에 찌그러짐, 균열, 녹 등이 없는지 확인합니다.',
      },
      {
        itemId: 3,
        questionId: 'EXTINGUISHER_03',
        label: '안전핀 체결 여부',
        description: '소화기 안전핀이 제대로 꽂혀 있는지 확인합니다.',
      },
      {
        itemId: 4,
        questionId: 'EXTINGUISHER_04',
        label: '지시압력계 정상 여부',
        description: '압력게이지 바늘이 녹색 구간에 있는지 확인합니다.',
      },
      {
        itemId: 5,
        questionId: 'EXTINGUISHER_05',
        label: '수동식 분말소화기 내용연수(10년) 적정 여부',
        description: '소화기 제조일로부터 10년이 경과하지 않았는지 확인합니다.',
      },
    ],
  },
  {
    categoryId: 2,
    categoryNumber: 2,
    categoryName: '자동확산소화기',
    sectionId: 'FIRE_EQUIPMENT',
    groupId: 'AUTO_EXTINGUISHER',
    // ⚠️ **10개 카테고리 중 여기에만 `description`이 있다** → 헤더 도움말 아이콘도 여기만 뜬다
    description: '보일러가 설치된 장소의 천장',
    items: [
      {
        itemId: 6,
        questionId: 'AUTO_EXTINGUISHER_01',
        label: '설치상태 및 외형의 변형·손상·부식 여부',
        description: '자동확산소화기가 적절한 위치에 설치되어 있는지 확인합니다.',
      },
      {
        itemId: 7,
        questionId: 'AUTO_EXTINGUISHER_02',
        label: '지시압력계의 정상 여부',
        description: '압력게이지가 정상 범위에 있는지 확인합니다.',
      },
    ],
  },
  {
    categoryId: 3,
    categoryNumber: 3,
    categoryName: '주거용 주방자동 소화장치',
    sectionId: 'FIRE_EQUIPMENT',
    // 🔴 주방 카테고리인데 `PARKING`(주차장)이다. 서버 enum이라 그대로 둔다
    groupId: 'PARKING_EXTINGUISHER',
    items: [
      {
        itemId: 8,
        questionId: 'PARKING_EXTINGUISHER_01',
        label: '소화약제용기 지시압력계의 정상 여부',
        // 🔴 화면에 보이는 오탈자 — `주방`이어야 한다 (F-Q2)
        description: '주차장 소화장치의 압력게이지가 정상 범위에 있는지 확인합니다.',
        tooltipText: '가스레인지, 인덕션등이 설치된 장소의 천장 또는 싱크대 상단',
      },
      {
        itemId: 9,
        questionId: 'PARKING_EXTINGUISHER_02',
        label: '수신부의 전원표시등 정상 점등 여부',
        description: '수신부의 전원 표시등이 정상적으로 켜져 있는지 확인합니다.',
        tooltipText: '수신부는 가스레인지와 연결된 가스배관 또는 싱크대 상부의 하단',
      },
    ],
  },
  {
    categoryId: 4,
    categoryNumber: 4,
    categoryName: '스프링클러',
    sectionId: 'FIRE_EQUIPMENT',
    groupId: 'SPRINKLER',
    items: [
      {
        itemId: 10,
        questionId: 'SPRINKLER_01',
        label: '헤드 변형·손상·부식 유무',
        description: '스프링클러 헤드에 변형, 손상, 부식이 없는지 확인합니다.',
      },
    ],
  },
  {
    categoryId: 5,
    categoryNumber: 5,
    categoryName: '자동화재 탐지설비',
    sectionId: 'ALARM_EQUIPMENT',
    groupId: 'AUTO_FIRE_ALARM',
    items: [
      {
        itemId: 11,
        questionId: 'AUTO_FIRE_ALARM_01',
        label: '감지기 변형·손상·탈락 여부',
        description: '화재 감지기가 제자리에 있고 손상이 없는지 확인합니다.',
      },
    ],
  },
  {
    categoryId: 6,
    categoryNumber: 6,
    categoryName: '가스누설 경보기',
    sectionId: 'ALARM_EQUIPMENT',
    groupId: 'GAS_ALARM',
    items: [
      {
        itemId: 12,
        questionId: 'GAS_ALARM_01',
        label: '전원스위치 정상 점등 여부',
        description: '가스누설 경보기의 전원이 정상적으로 켜져 있는지 확인합니다.',
      },
    ],
  },
  {
    categoryId: 7,
    categoryNumber: 7,
    categoryName: '완강기',
    sectionId: 'EVACUATION_EQUIPMENT',
    groupId: 'DESCENDING_LIFE_LINE',
    items: [
      {
        itemId: 13,
        questionId: 'DESCENDING_LIFE_LINE_01',
        label: '피난기구 위치 적정성 여부',
        description: '완강기가 피난에 적합한 위치에 설치되어 있는지 확인합니다.',
      },
      {
        itemId: 14,
        questionId: 'DESCENDING_LIFE_LINE_02',
        label: '완강기 외형의 변형·손상·부식 여부',
        description: '완강기 본체에 변형이나 손상이 없는지 확인합니다.',
      },
      {
        itemId: 15,
        questionId: 'DESCENDING_LIFE_LINE_03',
        label: '설치 여부 및 장애물로 인한 피난 지장 여부',
        description: '완강기 주변에 피난을 방해하는 장애물이 없는지 확인합니다.',
      },
    ],
  },
  {
    categoryId: 8,
    categoryNumber: 8,
    categoryName: '피난구용 내림식 사다리',
    sectionId: 'EVACUATION_EQUIPMENT',
    groupId: 'EVACUATION_LADDER',
    items: [
      {
        itemId: 16,
        questionId: 'EVACUATION_LADDER_01',
        label: '피난구용 위치 표시 및 사용방법 표시 유무',
        description: '피난구 위치와 사용방법이 잘 표시되어 있는지 확인합니다.',
      },
      {
        itemId: 17,
        questionId: 'EVACUATION_LADDER_02',
        label: '설치 여부 및 장애물로 인한 피난 지장 여부',
        description: '내림식 사다리 주변에 장애물이 없는지 확인합니다.',
      },
    ],
  },
  {
    categoryId: 9,
    categoryNumber: 9,
    categoryName: '대피공간',
    sectionId: 'OTHER_EQUIPMENT',
    groupId: 'EVACUATION_SPACE',
    items: [
      {
        itemId: 18,
        questionId: 'EVACUATION_SPACE_01',
        label: '방화문(방화구획)의 적정 여부',
        description: '대피공간의 방화문이 제대로 작동하는지 확인합니다.',
      },
      {
        itemId: 19,
        questionId: 'EVACUATION_SPACE_02',
        label: '적치물(쌓아놓은 물건)로 인한 피난 장애 여부',
        description: '대피공간에 물건이 쌓여 있지 않은지 확인합니다.',
      },
    ],
  },
  {
    categoryId: 10,
    categoryNumber: 10,
    categoryName: '경량칸막이',
    sectionId: 'OTHER_EQUIPMENT',
    groupId: 'LIGHTWEIGHT_PARTITION',
    items: [
      {
        itemId: 20,
        questionId: 'LIGHTWEIGHT_PARTITION_01',
        label: '정보를 포함한 표지 부착 여부',
        description: '경량칸막이에 사용방법 안내 표지가 부착되어 있는지 확인합니다.',
      },
      {
        itemId: 21,
        questionId: 'LIGHTWEIGHT_PARTITION_02',
        label: '적치물(쌓아놓은 물건)로 인한 피난 장애 여부',
        description: '경량칸막이 앞에 물건이 쌓여 있지 않은지 확인합니다.',
      },
    ],
  },
]

/**
 * 항목별 이미지. **21개 전부 정의돼 있다.**
 *
 * ⚠️ **빈 배열(`5`·`15`·`17`)은 "이미지 없음"이라는 명시적 표현**이다 — `undefined`(매핑 누락)와
 * 구분된다. 누락이 0개라 폴백 경로는 실제로 도달하지 않는다.
 *
 * ⚠️ **`14`(완강기 외형)만 3장**이라 좌우 화살표 슬라이더가 뜬다. 나머지는 1장 또는 0장이다.
 *
 * 🔴 **경로에 한글이 들어 있다.** Vite dev·S3+CloudFront에서 동작하고 있어 파일을 그대로
 * 옮겼다. 경로 인코딩에 민감한 배포 환경으로 바뀌면 깨진다 (`fire-inspection.md` F-Q3).
 */
export const FIRE_INSPECTION_ITEM_IMAGES: Record<number, string[]> = {
  1: ['/assets/images/자가점검표/소화기/fire-extinguisher-1.svg'],
  2: ['/assets/images/자가점검표/소화기/fire-extinguisher-2.svg'],
  3: ['/assets/images/자가점검표/소화기/fire-extinguisher-3.svg'],
  4: ['/assets/images/자가점검표/소화기/fire-extinguisher-4.svg'],
  5: [],
  6: ['/assets/images/자가점검표/자동확산소화기/automatic-fire-extinguisher-1.svg'],
  7: ['/assets/images/자가점검표/자동확산소화기/automatic-fire-extinguisher-2.svg'],
  8: ['/assets/images/자가점검표/주거용주방자동소화장치/automatic-fire-suppressor-1.svg'],
  9: ['/assets/images/자가점검표/주거용주방자동소화장치/automatic-fire-suppressor-2.svg'],
  10: ['/assets/images/자가점검표/스프링클러/sprinkler-1.svg'],
  11: ['/assets/images/자가점검표/자동화재탐지설비/automatic-fire-detection-equipment-1.svg'],
  12: ['/assets/images/자가점검표/가스누설경보기/gas-leak-detector-1.svg'],
  13: ['/assets/images/자가점검표/완강기/descending-stage-1.svg'],
  14: [
    '/assets/images/자가점검표/완강기/descending-stage-2.svg',
    '/assets/images/자가점검표/완강기/descending-stage-2-1.svg',
    '/assets/images/자가점검표/완강기/descending-stage-2-2.svg',
  ],
  15: [],
  16: ['/assets/images/자가점검표/피난구용내림식사다리/drop-down-ladder-for-evacuation-1.svg'],
  17: [],
  18: ['/assets/images/자가점검표/대피공간/refuge-space-1.svg'],
  19: ['/assets/images/자가점검표/대피공간/refuge-space-2.svg'],
  20: ['/assets/images/자가점검표/경량칸막이/lightweight-partition-1.svg'],
  21: ['/assets/images/자가점검표/경량칸막이/lightweight-partition-2.svg'],
}

/** 매핑이 없을 때의 폴백. F1 헤더 히어로와 같은 이미지다 (도달하지 않는 경로) */
export const FIRE_INSPECTION_FALLBACK_IMAGE = '/assets/images/자가점검표/fire-inspection.svg'

/**
 * 항목 라디오 2종.
 *
 * ⚠️ **`불량`이 먼저다.** 통상 긍정을 앞에 두는데 반대다 — 순서를 바꾸지 않는다.
 * ⚠️ **`NOT_APPLICABLE`은 여기 없다.** 카테고리 단위 `해당없음` 체크박스로만 설정된다.
 */
export const FIRE_INSPECTION_RADIO_OPTIONS: RadioItem[] = [
  { key: FIRE_INSPECTION_ANSWER.DEFECTIVE, label: '불량' },
  { key: FIRE_INSPECTION_ANSWER.NORMAL, label: '정상' },
]

/**
 * 제출 실패 문구. **서버 `message`를 프론트 문구로 덮어쓴다** — 표에 없는 코드만 원문을 쓴다.
 * 마침표까지 레거시 원문 그대로다.
 */
export const FIRE_INSPECTION_ERROR_MESSAGE: Record<string, string> = {
  NOT_IN_INSPECTION_PERIOD: '점검 기간이 아닙니다.',
  ALREADY_SUBMITTED: '이미 제출된 점검입니다.',
  APT_RESIDENT_NOT_FOUND: '입주민 정보를 찾을 수 없습니다.',
  HOUSEHOLD_FIRE_INSPECTION_NOT_FOUND: '세대 점검 정보를 찾을 수 없습니다.',
}

export const FIRE_INSPECTION_MESSAGE = {
  headerTitle: '아파트먼트에서',
  headerTitleSecond: '소방시설을 자가점검 할 수 있어요.',
  headerDescription:
    '미점검 세대에는 과태료가 부과됩니다. 우리집 안전을 위해 세대 내 소방시설 자가점검을 실시해주세요.',
  historyTitle: '우리 집 점검 내역',
  historyEmpty: '점검 내역이 없습니다.',
  processTitle: '자가점검표 작성',
  progressTitle: '자가점검표를 체크하여 완료해주세요.',
  notApplicable: '해당없음',
  next: '다음',
  submit: '완료',
  signatureTitle: '입주민 확인 서명',
  signatureGuideFirst: '작성한 자가점검 내용이 관리자에게 제출되며',
  signatureGuideSecond: '점검내용은 2년 동안 유효합니다.',
  signaturePlaceholder: '여기에 서명해주세요.',
  signatureReset: '다시 작성',
  completeTitle: '점검이 완료되었습니다',
  completeDescriptionFirst: '소방 자가 점검이 성공적으로 제출되었습니다.',
  completeDescriptionSecond: '점검 내역에서 결과를 확인할 수 있습니다.',
  goHome: '홈으로 돌아가기',
  detailTitleFallback: '점검 상세',
  tooltipLabel: '어디에 있나요?',
} as const

/** 서명 캔버스. `#1F2937`은 레거시 JS 하드코딩 hex다 (`neutral-b-gray-800` 계열) */
export const SIGNATURE_CANVAS = {
  strokeStyle: '#1F2937',
  lineWidth: 2,
  fileName: 'signature.png',
} as const
