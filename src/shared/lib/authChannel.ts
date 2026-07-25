import { CHANNEL_NAME } from '@/shared/constants/channel'
import { setAccessToken } from '@/shared/lib/tokenStore'
import type { AuthMessage } from '@/shared/types/auth'

let channel: BroadcastChannel | null = null

const getChannel = (): BroadcastChannel | null => {
  if (typeof BroadcastChannel === 'undefined') return null
  channel ??= new BroadcastChannel(CHANNEL_NAME)
  return channel
}

/**
 * 탭 간 인증 상태 동기화.
 *
 * Access Token은 탭마다 별도 메모리이고 Refresh Token 쿠키는 탭끼리 공유된다.
 * RTR(Refresh Token Rotation) 환경에서 두 탭이 각자 refresh를 시도하면
 * 한쪽이 폐기된 RT를 쓰게 되어 서버가 재사용 공격으로 판정하고 세션을 통째로 날린다.
 * 갱신된 토큰을 즉시 전파해서 그 상황을 막는다.
 */
export const initAuthChannel = ({ onLogout }: { onLogout: () => void }): (() => void) => {
  const activeChannel = getChannel()
  if (!activeChannel) {
    return () => {}
  }

  const handler = (event: MessageEvent<AuthMessage>) => {
    if (event.data.type === 'token') {
      setAccessToken({ token: event.data.token })
      return
    }
    setAccessToken({ token: null })
    onLogout()
  }

  activeChannel.addEventListener('message', handler)
  return () => {
    activeChannel.removeEventListener('message', handler)
  }
}

export const broadcastToken = ({ token }: { token: string }): void => {
  getChannel()?.postMessage({ type: 'token', token } satisfies AuthMessage)
}

export const broadcastLogout = (): void => {
  getChannel()?.postMessage({ type: 'logout' } satisfies AuthMessage)
}
