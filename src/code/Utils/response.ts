/**
 * 统一 API 响应格式工具类
 *
 * 响应格式：
 * {
 *   code: number,    // 状态码：200 成功，400+ 错误
 *   message: string, // 响应消息
 *   data: any        // 响应数据，成功时返回数据，失败时返回 null
 * }
 */

/**
 * 成功响应
 * @param data 返回的数据（可以是对象、数组等任何类型）
 * @param message 成功消息，默认 'Success'
 *
 * @example
 * // 单个对象
 * return success({ id: 1, name: 'John' })
 *
 * // 列表数据（带分页信息）
 * return success({
 *   items: [...],
 *   total: 100,
 *   page: 1,
 *   pageSize: 20
 * })
 */
export function success<T = any>(data: T, message: string = 'Success') {
  k.response.json({
    code: 200,
    message,
    data
  })
  return k.api.ok()
}

/**
 * 错误响应
 * @param message 错误消息
 * @param code HTTP 状态码，默认 400
 * @param error 错误对象（可选），用于记录日志
 *
 * @example
 * // 400 参数错误
 * return error('Invalid parameters', 400)
 *
 * // 401 未授权
 * return error('Unauthorized', 401)
 *
 * // 403 禁止访问
 * return error('Forbidden', 403)
 *
 * // 404 未找到
 * return error('Not found', 404)
 *
 * // 500 服务器错误（自动记录日志）
 * return error('Internal server error', 500, err)
 */
export function error(message: string, code: number = 400, err?: any) {
  // 记录错误日志（仅 500 级别错误）
  if (code >= 500 && err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    k.logger.error('ServerError', errorMessage)
  }

  k.response.json({
    code,
    message,
    data: null
  })
  return k.api.httpCode(code)
}
