import { CardList } from '@/features/parking/components/CardList'
import { CAR_MANAGEMENT_TYPE, CARD_ITEM_FIELD } from '@/features/parking/constants/parking'
import { useCarManagementType } from '@/features/parking/hooks/useCarManagementType'
import { useWallPadContent } from '@/features/parking/hooks/useWallPadContent'
import { useAlwaysAllowCarList, useBookmarkCarList } from '@/features/parking/queries/useCarLists'
import type { CarListItem } from '@/features/parking/types/parking'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'
import { formatPhone } from '@/shared/utils/formatPhone'

type CarFieldKey =
  | (typeof CARD_ITEM_FIELD.bookmark)[number]['key']
  | (typeof CARD_ITEM_FIELD.alwaysAllow)[number]['key']

/**
 * 카드 필드 1개의 값.
 *
 * ⚠️ **`nickName`이 `formatHtmlText`를 거치는데 텍스트로 출력된다.** 별칭에 줄바꿈이
 * 있으면 **`<br/>`이 글자 그대로 보인다.** 레거시가 `v-dompurify-html`이 아니라 보간을
 * 쓴다 (`deferred.md` 「동작 의심」). 그대로 옮겼다.
 *
 * ⚠️ **`memo`는 줄바꿈·연속 공백을 눌러 한 줄로 만든다.** 카드 높이를 유지하려는
 * 의도된 처리다.
 */
const renderFieldValue = ({ card, key }: { card: CarListItem; key: CarFieldKey }) => {
  const value = card[key]
  if (value === undefined) return '-'

  if (key === 'phone') return formatPhone({ phone: value ?? undefined })

  if (key === 'nickName') return formatHtmlText({ text: value ?? undefined })

  if (key === 'memo') {
    return formatHtmlText({ text: value ?? undefined })
      .replaceAll(/<br\s*\/?>/g, ' ')
      .replaceAll(/[\r\n\t]+/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim()
  }

  return value
}

/**
 * 즐겨찾기·항상허용 차량 카드 목록. 레거시 `CarManagementList.vue`(188 LOC) 이식.
 *
 * **세 가지 자리에서 쓰인다** — PK3 목록, PK4 목록, 그리고 `즐겨찾기 차량 불러오기`
 * 드로어(PK6·PK12·PK13). `isDrawer`면 **경로와 무관하게 즐겨찾기 목록**을 보여준다.
 *
 * 🔴 **어떤 필드를 보여줄지는 `carManagementType`(경로)이 정하는데, 어떤 목록을
 * 보여줄지는 `isBookmarkList`(경로 **또는** 드로어)가 정한다.** 두 기준이 어긋나서
 * **PK6의 불러오기 드로어는 즐겨찾기 차량을 항상허용 필드(`연락처`·`메모`)로 그린다** —
 * 즐겨찾기에는 메모가 없으니 전부 `-`다. 방문예약(PK12·PK13)에서 열면 경로에
 * `alwaysAllow`가 없어 정상적으로 `별칭`·`연락처`가 나온다. **같은 드로어가 화면마다
 * 다르게 보인다.** 등가 이관이라 그대로 옮겼다 (`deferred.md`).
 *
 * 🔴 **두 훅을 항상 호출한다.** `enabled`가 fetch만 막을 뿐 각 훅의 캐시 초기화는
 * 그대로 실행된다 — PK3에 들어가면 항상허용 캐시가, 드로어를 열어도 항상허용 캐시가
 * 날아간다 (`useResetListCacheOnMount` 주석).
 *
 * ⚠️ 레거시는 `enabled`에 `.value`를 벗겨 넣어 setup 시점 값으로 굳는다. React는
 * 리렌더마다 다시 계산되므로 **더 정확해진다** — 경로가 바뀌면 컴포넌트도 새로 만들어져
 * 실제 동작 차이는 없다.
 *
 * ⚠️ 레거시의 `.more-icon` 클래스는 **어디에도 정의가 없다.** 옮기지 않았다.
 */
export const CarManagementList = ({
  isDrawer = false,
  onSelectCard,
}: {
  isDrawer?: boolean
  onSelectCard: (card: CarListItem) => void
}) => {
  const { carManagementType } = useCarManagementType()
  const { hasWallPadUI } = useWallPadContent()

  const isAlwaysAllowPath = carManagementType.key === CAR_MANAGEMENT_TYPE.ALWAYS_ALLOW.key
  const isBookmarkList = !isAlwaysAllowPath || isDrawer

  const {
    bookmarkCarList,
    isBookmarkCarListLoading,
    isBookmarkCarListError,
    hasBookmarkCarListNextPage,
    fetchBookmarkCarListNextPage,
  } = useBookmarkCarList({ enabled: isBookmarkList })

  const {
    alwaysAllowCarList,
    isAlwaysAllowCarListLoading,
    isAlwaysAllowCarListError,
    hasAlwaysAllowCarListNextPage,
    fetchAlwaysAllowCarListNextPage,
  } = useAlwaysAllowCarList({ enabled: !isDrawer && isAlwaysAllowPath })

  const pageList: CarListItem[] = isBookmarkList
    ? (bookmarkCarList?.pages ?? [])
    : (alwaysAllowCarList?.pages ?? [])
  const isLoading = isBookmarkList ? isBookmarkCarListLoading : isAlwaysAllowCarListLoading
  const isError = isBookmarkList ? isBookmarkCarListError : isAlwaysAllowCarListError
  const hasNextPage = isBookmarkList ? hasBookmarkCarListNextPage : hasAlwaysAllowCarListNextPage
  const fetchNextPage = isBookmarkList
    ? fetchBookmarkCarListNextPage
    : fetchAlwaysAllowCarListNextPage

  // 문구는 목록 기준, 필드는 경로 기준이다 (위 주석)
  const listLabel = isBookmarkList
    ? CAR_MANAGEMENT_TYPE.BOOKMARK.label
    : CAR_MANAGEMENT_TYPE.ALWAYS_ALLOW.label
  const fieldList = CARD_ITEM_FIELD[carManagementType.key]

  return (
    <CardList
      list={pageList}
      isLoading={isLoading}
      isError={isError}
      errorMessage={`${listLabel} 차량 목록을 불러올 수 없습니다`}
      emptyMessage={`${listLabel} 차량이 없습니다`}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
    >
      {pageList.map((card) => {
        return (
          <li
            key={card.uuid}
            className="border-deep-glue-20 flex flex-col gap-3 self-stretch rounded-xl border bg-base-b-white p-3 shadow-md"
          >
            <button
              type="button"
              className="flex flex-col gap-3"
              onClick={() => {
                onSelectCard(card)
              }}
            >
              <div className="flex w-full items-center justify-between gap-1 border-b border-b-defaults-tertiary-border-tertiary pb-3">
                <div className="flex items-center gap-1 pretendard-18SemiBold text-defaults-primary-text-primary">
                  <div>
                    {hasWallPadUI && isAlwaysAllowPath && card.notificationFlag && (
                      <ChipBase color="blue" variant="fill" className="pb-2">
                        월패드 알림
                      </ChipBase>
                    )}
                    <span>{card.carNum}</span>
                  </div>
                  {isBookmarkList && <img src="/assets/icons/Star.svg" alt="별 아이콘" />}
                </div>
                {!isDrawer && <img src="/assets/icons/MoreVertical.svg" alt="더보기 아이콘" />}
              </div>

              <ul className="flex w-full flex-col items-start gap-2.5">
                {fieldList.map((item) => {
                  return (
                    <li key={item.key} className="flex w-full items-start justify-between gap-2">
                      <span className="pretendard-14SemiBold whitespace-nowrap text-defaults-tertiary-text-tertiary">
                        {item.label}
                      </span>
                      <span className="text-left pretendard-14Regular text-defaults-secondary-text-secondary">
                        {renderFieldValue({ card, key: item.key }) || '-'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </button>
          </li>
        )
      })}
      {/* 목록 끝 여백. 고정된 `+ 등록하기` 버튼에 마지막 카드가 가리지 않게 한다 */}
      <div className="pt-8" />
    </CardList>
  )
}
