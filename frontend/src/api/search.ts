/**
 * 搜索 API
 */
import request from '@/utils/request'
import type { GlobalSearchResponse, GlobalSearchParams } from '@/types/search'

/**
 * 全局搜索
 * @param params 搜索参数
 */
export function globalSearch(params: GlobalSearchParams): Promise<GlobalSearchResponse> {
  return request.get('/api/search/global', {
    params
  })
}
