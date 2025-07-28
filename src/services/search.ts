/**
 * 搜索服务
 * 将在后续任务中实现具体功能
 */

import type { NavigationCategory, SearchResult } from '@/types'

export class SearchService {
  // 搜索功能将在后续实现
  static search(query: string, data: NavigationCategory[]): SearchResult[] {
    console.log('搜索功能将在后续实现', query, data)
    return []
  }

  static highlightText(text: string, query: string): string {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
  }
}