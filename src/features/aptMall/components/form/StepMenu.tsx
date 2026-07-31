import { useEffect } from 'react'

import { useAptMallOrderMenuList } from '@/features/aptMall/queries/useAptMall'
import { useAptMallFormStore } from '@/features/aptMall/stores/aptMallFormStore'
import { APT_MALL_ORDER_TYPE } from '@/features/aptMall/types/aptMall'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { cn } from '@/shared/utils/cn'

const formatPrice = (price: number | undefined) => {
  return `${Number(price).toLocaleString()}`
}

/**
 * 메뉴 선택 (AM6). 레거시 `AptMallFormOrderMenu.vue`(225줄) — 이 도메인에서 가장 큰 화면.
 *
 * ⚠️ **단가가 유형에 따라 진입 시 확정된다** — `VISIT`이면 `price`, `TAKEOUT`이면
 * `takeOutPrice`. 이후 계산은 확정된 값만 쓴다.
 *
 * ⚠️ **수량 규칙이 유형별로 완전히 다르다.**
 *
 * | 유형      | `다음` 조건                        | `+` 잠금            |
 * | --------- | ---------------------------------- | ------------------- |
 * | `VISIT`   | **필수 메뉴 수량 합 === 인원 수**  | 조건이 참일 때      |
 * | `TAKEOUT` | 전체 수량 합 > 0                   | **없음**(무제한)    |
 *
 * ⚠️ **같은 값이 `다음` 활성과 `+` 잠금을 겸한다** — `VISIT`에서 필수 수량이 인원 수에
 * 도달하면 **선택 메뉴의 `+`까지 잠긴다** (`apt-mall.md` AM-Q18). 그대로 옮겼다.
 *
 * ⚠️ **단가가 없는 메뉴는 그 유형에서 숨는다.**
 * ⚠️ **`이전`은 메뉴 초기화 플래그를 풀어** 다시 오면 수량이 0으로 돌아가게 한다
 * (날짜·시간·인원은 유지된다).
 */
export const StepMenu = ({
  aptMallUuid,
  onPrevStep,
  onNextStep,
}: {
  aptMallUuid: string | undefined
  onPrevStep: () => void
  onNextStep: () => void
}) => {
  const { aptMallOrderMenuList } = useAptMallOrderMenuList({ aptMallUuid })

  const setAptMallFormData = useAptMallFormStore((state) => {
    return state.setAptMallFormData
  })
  const setMenuInitialized = useAptMallFormStore((state) => {
    return state.setMenuInitialized
  })
  const menuInitialized = useAptMallFormStore((state) => {
    return state.menuInitialized
  })
  const { selectedType, personCount, menu, totalPrice } = useAptMallFormStore((state) => {
    return state.aptMallFormData
  })

  const isVisit = selectedType?.key === APT_MALL_ORDER_TYPE.VISIT

  useEffect(() => {
    if (menuInitialized || !aptMallOrderMenuList) return

    setAptMallFormData({
      menu: aptMallOrderMenuList.map((item) => {
        return {
          name: item.aptMallMenuName ?? '',
          uuid: item.aptMallMenuUuid,
          price: (isVisit ? item.price : item.takeOutPrice) ?? 0,
          orderMenuCountEqualsOrderPersonCountFlag: Boolean(
            item.orderMenuCountEqualsOrderPersonCountFlag,
          ),
          count: 0,
        }
      }),
    })
    setMenuInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aptMallOrderMenuList, menuInitialized])

  const essentialCount = (menu ?? [])
    .filter((item) => {
      return item.orderMenuCountEqualsOrderPersonCountFlag
    })
    .reduce((total, item) => {
      return total + item.count
    }, 0)

  const checkValidMenuCount = isVisit
    ? personCount === essentialCount
    : (menu ?? []).reduce((total, item) => {
        return total + item.count
      }, 0) > 0

  const findMenuCount = (uuid: string) => {
    return (
      menu?.find((item) => {
        return item.uuid === uuid
      })?.count ?? 0
    )
  }

  const changeCount = (uuid: string, delta: number) => {
    setAptMallFormData({
      menu: (menu ?? []).map((item) => {
        if (item.uuid !== uuid) return item
        if (delta < 0 && item.count <= 0) return item

        return { ...item, count: item.count + delta }
      }),
    })
  }

  return (
    <div className="space-y-[18px] px-5 py-6">
      {isVisit && (
        <div className="flex justify-between pretendard-18SemiBold">
          <h2>총 인원 수</h2>
          <span>{personCount}명</span>
        </div>
      )}

      <ul className="space-y-4">
        {(aptMallOrderMenuList ?? [])
          .filter((item) => {
            return isVisit ? item.price : item.takeOutPrice
          })
          .map((item) => {
            const count = findMenuCount(item.aptMallMenuUuid)

            return (
              <li
                key={item.aptMallMenuUuid}
                className="space-y-3 rounded-lg bg-defaults-secondary-background-secondary px-4 py-3"
              >
                <div className="flex justify-between pretendard-15SemiBold">
                  <div className="space-x-1">
                    <span>{item.aptMallMenuName}</span>
                    {isVisit && item.orderMenuCountEqualsOrderPersonCountFlag && (
                      <span>(필수)</span>
                    )}
                  </div>
                  <span>{formatPrice(isVisit ? item.price : item.takeOutPrice)}원</span>
                </div>

                <div className="flex items-center justify-end gap-1 pretendard-15Medium">
                  <button
                    type="button"
                    className={cn(
                      'h-8 w-8 rounded-lg border bg-base-b-white',
                      count <= 0
                        ? 'border-defaults-tertiary-border-tertiary'
                        : 'border-base-b-black',
                    )}
                    disabled={count <= 0}
                    onClick={() => {
                      changeCount(item.aptMallMenuUuid, -1)
                    }}
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-brand-default-text-brand">{count}</span>
                  <button
                    type="button"
                    className={cn(
                      'h-8 w-8 rounded-lg border bg-base-b-white',
                      isVisit && checkValidMenuCount
                        ? 'border-defaults-tertiary-border-tertiary'
                        : 'border-base-b-black',
                    )}
                    disabled={isVisit && checkValidMenuCount}
                    onClick={() => {
                      changeCount(item.aptMallMenuUuid, 1)
                    }}
                  >
                    +
                  </button>
                </div>
              </li>
            )
          })}
      </ul>

      <div className="h-[68px] py-3 text-center pretendard-18SemiBold">
        {totalPrice === 0 ? (
          <p>메뉴를 선택해주세요</p>
        ) : (
          <div className="flex flex-col justify-center gap-2">
            <span>
              총 <span className="text-brand-default-text-brand">{formatPrice(totalPrice)}</span> 원
            </span>
            {isVisit && !checkValidMenuCount && <p>(필수메뉴 중 인원수만큼 선택해주세요.)</p>}
          </div>
        )}
      </div>

      <div className="flex w-full items-center gap-3">
        <ButtonBase
          type="button"
          hasOutline
          roundType="rounded"
          color="defaults-secondary"
          onClick={() => {
            setMenuInitialized(false)
            onPrevStep()
          }}
        >
          이전
        </ButtonBase>
        <ButtonBase
          type="button"
          roundType="rounded"
          color="brand"
          disabled={!checkValidMenuCount}
          onClick={onNextStep}
        >
          다음
        </ButtonBase>
      </div>
    </div>
  )
}
