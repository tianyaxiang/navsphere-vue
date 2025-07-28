/**
 * GitHub OAuth 认证和 API 服务
 */

import { Octokit } from '@octokit/rest'
import type { GitHubUser, GitHubRepository, GitHubFile, GitHubCommit } from '@/types'
import { STORAGE_KEYS, API_ENDPOINTS, GITHUB_OAUTH_CONFIG } from '@/types/constants'

export class GitHubAuthService {
  private static readonly STORAGE_KEY = STORAGE_KEYS.ACCESS_TOKEN
  private static readonly USER_INFO_KEY = STORAGE_KEYS.USER_INFO

  /**
   * 开始 GitHub OAuth 登录流程
   */
  static async login(): Promise<void> {
    const state = this.generateState()
    localStorage.setItem('oauth_state', state)

    const params = new URLSearchParams({
      client_id: GITHUB_OAUTH_CONFIG.CLIENT_ID,
      redirect_uri: GITHUB_OAUTH_CONFIG.REDIRECT_URI,
      scope: GITHUB_OAUTH_CONFIG.SCOPE,
      state,
    })

    const authUrl = `${API_ENDPOINTS.GITHUB_OAUTH}/authorize?${params.toString()}`
    window.location.href = authUrl
  }

  /**
   * 处理 OAuth 回调
   */
  static async handleCallback(code: string, state: string): Promise<GitHubUser> {
    // 验证 state 参数
    const storedState = localStorage.getItem('oauth_state')
    if (state !== storedState) {
      throw new Error('Invalid state parameter')
    }
    localStorage.removeItem('oauth_state')

    // 交换访问令牌
    const tokenResponse = await fetch(API_ENDPOINTS.GITHUB_TOKEN, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_OAUTH_CONFIG.CLIENT_ID,
        client_secret: import.meta.env.VITE_GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_OAUTH_CONFIG.REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error)
    }

    const accessToken = tokenData.access_token
    this.setAccessToken(accessToken)

    // 获取用户信息
    const userInfo = await this.getUserInfo()
    this.setUserInfo(userInfo)

    return userInfo
  }

  /**
   * 登出
   */
  static async logout(): Promise<void> {
    this.clearAccessToken()
    this.clearUserInfo()
  }

  /**
   * 获取访问令牌
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY)
  }

  /**
   * 设置访问令牌
   */
  static setAccessToken(token: string): void {
    localStorage.setItem(this.STORAGE_KEY, token)
  }

  /**
   * 清除访问令牌
   */
  static clearAccessToken(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(): Promise<GitHubUser> {
    const token = this.getAccessToken()
    if (!token) {
      throw new Error('No access token available')
    }

    const octokit = new Octokit({ auth: token })
    
    try {
      const { data } = await octokit.rest.users.getAuthenticated()
      return data as GitHubUser
    } catch (error) {
      console.error('Failed to get user info:', error)
      throw new Error('Failed to get user information')
    }
  }

  /**
   * 设置用户信息到本地存储
   */
  static setUserInfo(userInfo: GitHubUser): void {
    const userInfoWithTimestamp = {
      ...userInfo,
      _cached_at: Date.now(),
    }
    localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfoWithTimestamp))
  }

  /**
   * 从本地存储获取用户信息
   */
  static getCachedUserInfo(): GitHubUser | null {
    const userInfoStr = localStorage.getItem(this.USER_INFO_KEY)
    if (!userInfoStr) return null
    
    try {
      const cached = JSON.parse(userInfoStr)
      
      // 检查缓存是否过期（24小时）
      const cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours
      if (cached._cached_at && Date.now() - cached._cached_at > cacheExpiry) {
        this.clearUserInfo()
        return null
      }
      
      // 移除缓存时间戳字段
      const { _cached_at, ...userInfo } = cached
      return userInfo as GitHubUser
    } catch {
      return null
    }
  }

  /**
   * 清除用户信息
   */
  static clearUserInfo(): void {
    localStorage.removeItem(this.USER_INFO_KEY)
  }

  /**
   * 检查认证状态
   */
  static async checkAuthStatus(): Promise<boolean> {
    const token = this.getAccessToken()
    if (!token) return false

    try {
      await this.getUserInfo()
      return true
    } catch {
      // Token 可能已过期，清除本地数据
      this.clearAccessToken()
      this.clearUserInfo()
      return false
    }
  }

  /**
   * 刷新用户信息
   */
  static async refreshUserInfo(): Promise<GitHubUser> {
    const userInfo = await this.getUserInfo()
    this.setUserInfo(userInfo)
    return userInfo
  }

  /**
   * 设置登录状态持久化
   */
  static setPersistentLogin(remember: boolean = true): void {
    localStorage.setItem('remember_login', remember.toString())
  }

  /**
   * 获取登录状态持久化设置
   */
  static getPersistentLogin(): boolean {
    return localStorage.getItem('remember_login') === 'true'
  }

  /**
   * 设置最后登录时间
   */
  static setLastLoginTime(): void {
    localStorage.setItem('last_login_time', Date.now().toString())
  }

  /**
   * 获取最后登录时间
   */
  static getLastLoginTime(): number | null {
    const time = localStorage.getItem('last_login_time')
    return time ? parseInt(time, 10) : null
  }

  /**
   * 检查登录是否过期
   */
  static isLoginExpired(): boolean {
    const lastLogin = this.getLastLoginTime()
    if (!lastLogin) return true

    // 如果设置了持久化登录，延长过期时间到30天
    const expiryTime = this.getPersistentLogin() 
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : 24 * 60 * 60 * 1000 // 24 hours

    return Date.now() - lastLogin > expiryTime
  }

  /**
   * 清除所有认证相关数据
   */
  static clearAllAuthData(): void {
    this.clearAccessToken()
    this.clearUserInfo()
    localStorage.removeItem('remember_login')
    localStorage.removeItem('last_login_time')
    localStorage.removeItem('oauth_state')
  }

  /**
   * 生成随机 state 参数
   */
  private static generateState(): string {
    const array = new Uint32Array(4)
    crypto.getRandomValues(array)
    return Array.from(array, dec => dec.toString(16)).join('')
  }
}

export class GitHubApiService {
  private octokit: Octokit
  private owner: string
  private repo: string
  private branch: string

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token })
    this.owner = import.meta.env.VITE_GITHUB_OWNER
    this.repo = import.meta.env.VITE_GITHUB_REPO
    this.branch = import.meta.env.VITE_GITHUB_BRANCH || 'main'
  }

  /**
   * 获取仓库信息
   */
  async getRepository(): Promise<GitHubRepository> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      })
      return data as GitHubRepository
    } catch (error) {
      console.error('Failed to get repository:', error)
      throw new Error('Failed to get repository information')
    }
  }

  /**
   * 获取文件内容
   */
  async getFileContent(path: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      })

      if (Array.isArray(data) || data.type !== 'file') {
        throw new Error('Path is not a file')
      }

      if (!data.content) {
        throw new Error('File content is empty')
      }

      // 解码 base64 内容
      return atob(data.content.replace(/\n/g, ''))
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`File not found: ${path}`)
      }
      console.error('Failed to get file content:', error)
      throw new Error(`Failed to get file content: ${path}`)
    }
  }

  /**
   * 获取文件信息
   */
  async getFile(path: string): Promise<GitHubFile> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      })

      if (Array.isArray(data)) {
        throw new Error('Path is a directory, not a file')
      }

      return data as GitHubFile
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`File not found: ${path}`)
      }
      console.error('Failed to get file:', error)
      throw new Error(`Failed to get file: ${path}`)
    }
  }

  /**
   * 创建文件
   */
  async createFile(path: string, content: string, message: string): Promise<GitHubCommit> {
    try {
      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: btoa(content), // 编码为 base64
        branch: this.branch,
      })

      return data.commit as GitHubCommit
    } catch (error) {
      console.error('Failed to create file:', error)
      throw new Error(`Failed to create file: ${path}`)
    }
  }

  /**
   * 更新文件
   */
  async updateFile(path: string, content: string, message: string): Promise<GitHubCommit> {
    try {
      // 先获取文件的 SHA
      const fileInfo = await this.getFile(path)

      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: btoa(content), // 编码为 base64
        sha: fileInfo.sha,
        branch: this.branch,
      })

      return data.commit as GitHubCommit
    } catch (error) {
      console.error('Failed to update file:', error)
      throw new Error(`Failed to update file: ${path}`)
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(path: string, message: string): Promise<GitHubCommit> {
    try {
      // 先获取文件的 SHA
      const fileInfo = await this.getFile(path)

      const { data } = await this.octokit.rest.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        sha: fileInfo.sha,
        branch: this.branch,
      })

      return data.commit as GitHubCommit
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw new Error(`Failed to delete file: ${path}`)
    }
  }

  /**
   * 列出目录文件
   */
  async listFiles(path = ''): Promise<GitHubFile[]> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      })

      if (!Array.isArray(data)) {
        return [data as GitHubFile]
      }

      return data as GitHubFile[]
    } catch (error) {
      console.error('Failed to list files:', error)
      throw new Error(`Failed to list files in: ${path}`)
    }
  }

  /**
   * 获取提交历史
   */
  async getCommits(path?: string, limit = 10): Promise<GitHubCommit[]> {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner: this.owner,
        repo: this.repo,
        path,
        per_page: limit,
        sha: this.branch,
      })

      return data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || '',
          email: commit.commit.author?.email || '',
          date: commit.commit.author?.date || '',
        },
        committer: {
          name: commit.commit.committer?.name || '',
          email: commit.commit.committer?.email || '',
          date: commit.commit.committer?.date || '',
        },
      }))
    } catch (error) {
      console.error('Failed to get commits:', error)
      throw new Error('Failed to get commit history')
    }
  }

  /**
   * 获取单个提交信息
   */
  async getCommit(sha: string): Promise<GitHubCommit> {
    try {
      const { data } = await this.octokit.rest.repos.getCommit({
        owner: this.owner,
        repo: this.repo,
        ref: sha,
      })

      return {
        sha: data.sha,
        message: data.commit.message,
        author: {
          name: data.commit.author?.name || '',
          email: data.commit.author?.email || '',
          date: data.commit.author?.date || '',
        },
        committer: {
          name: data.commit.committer?.name || '',
          email: data.commit.committer?.email || '',
          date: data.commit.committer?.date || '',
        },
      }
    } catch (error) {
      console.error('Failed to get commit:', error)
      throw new Error(`Failed to get commit: ${sha}`)
    }
  }
}

// 便捷的工厂函数
export function createGitHubApiService(): GitHubApiService | null {
  const token = GitHubAuthService.getAccessToken()
  if (!token) return null
  
  return new GitHubApiService(token)
}