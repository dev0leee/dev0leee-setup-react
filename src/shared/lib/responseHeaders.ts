import type { AxiosResponse } from 'axios'

/**
 * 응답 헤더에서 문자열 값을 안전하게 꺼낸다.
 *
 * 이 앱은 토큰을 **응답 헤더**로 받으므로(`authorization`, `refresh-token`)
 * 헤더 읽기가 인증 경로의 필수 단계다. axios의 헤더 타입은 인덱스 시그니처가
 * 느슨해 그냥 읽으면 타입이 뭉개지므로 여기서 한 번 좁힌다.
 */
export const readHeader = ({
  headers,
  key,
}: {
  headers: AxiosResponse['headers']
  key: string
}): string | null => {
  const value: unknown = headers[key]
  return typeof value === 'string' ? value : null
}
