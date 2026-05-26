/**
 * Task Banner 认证服务
 * 支持：账号密码登录、Kooboo 登录（JWT + Cookie）
 */
import { User } from 'code/Models/User'
import { getUserById, getUserInfo, type UserInfo } from 'code/Services/user'

export const COOKIE_TOKEN_KEY = 'task_banner_auth_token'
const COOKIE_MAX_AGE_DAY_REMEMBER = 30
const COOKIE_MAX_AGE_DAY_DEFAULT = 1
const TOKEN_EXPIRE_MS_REMEMBER = 30 * 24 * 60 * 60 * 1000
const TOKEN_EXPIRE_MS_DEFAULT = 24 * 60 * 60 * 1000

export interface TokenPayload {
  userId: string
  name: string
  exp: number
}

function isEmail(account: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)
}

function isUserName(account: string): boolean {
  return /^[a-zA-Z0-9_]{2,20}$/.test(account)
}

function getAccountType(account: string): 'email' | 'username' | null {
  const trimmed = account.trim()
  if (isEmail(trimmed)) return 'email'
  if (isUserName(trimmed)) return 'username'
  return null
}

function findUserByAccount(account: string, accountType: 'email' | 'username') {
  if (accountType === 'email') {
    return User.findOne({ email: account.toLowerCase() } as any)
  }
  return User.findOne({ username: account })
}

function setTokenCookie(token: string, isRemember: boolean): void {
  const maxAgeDay = isRemember ? COOKIE_MAX_AGE_DAY_REMEMBER : COOKIE_MAX_AGE_DAY_DEFAULT
  k.response.setHeader('Authorization', `Bearer ${token}`)
  k.cookie.set(COOKIE_TOKEN_KEY, token, maxAgeDay)
}

function issueToken(row: any, isRemember: boolean) {
  const expiresIn = isRemember ? TOKEN_EXPIRE_MS_REMEMBER : TOKEN_EXPIRE_MS_DEFAULT
  const exp = Date.now() + expiresIn
  const token = k.security.jwt.encode({
    userId: row._id,
    name: row.displayName || row.username || row.email || '',
    exp
  })
  setTokenCookie(token, isRemember)
  return {
    token,
    userId: row._id,
    name: row.displayName || row.username || row.email || ''
  }
}

function getTokenFromRequest(): string | null {
  let token: string | undefined = k.request.headers.get?.('Authorization')
  if (token) {
    if (token.startsWith('Bearer ')) token = token.slice(7)
    return token
  }
  token = k.cookie.get?.(COOKIE_TOKEN_KEY)
  return token || null
}

function getTokenPayload(): TokenPayload | null {
  const token = getTokenFromRequest()
  if (!token) return null

  try {
    const decoded = k.security.jwt.decode(token)
    const payload = JSON.parse(decoded)?.value as TokenPayload | undefined
    if (!payload?.userId || !payload.exp) return null
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

/**
 * 密码 / 账号登录
 */
export function login(body: {
  account: string
  password?: string
  isRemember?: boolean
}) {
  const { account, password, isRemember = false } = body
  const accountTrim = account.trim()
  const accountType = getAccountType(accountTrim)

  if (!accountTrim) throw new Error('请输入账号')
  if (!accountType) throw new Error('请输入正确的用户名或邮箱')
  if (!password?.trim()) throw new Error('请输入密码')

  const user = findUserByAccount(accountTrim, accountType) as any
  if (!user || !user._id) throw new Error('账号或密码错误')

  const md5Password = k.security.md5(password.trim())
  if (!user.password || user.password !== md5Password) {
    throw new Error('账号或密码错误')
  }

  return issueToken(user, isRemember)
}

/**
 * 注册（用户名 + 邮箱 + 密码）
 */
export function register(body: {
  username: string
  email: string
  password: string
  displayName?: string
}) {
  const username = body.username?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()

  if (!username || !isUserName(username)) {
    throw new Error('请输入 2-20 位字母数字下划线组成的用户名')
  }
  if (!email || !isEmail(email)) {
    throw new Error('请输入正确的邮箱地址')
  }
  if (!password || password.length < 6) {
    throw new Error('密码长度至少 6 位')
  }
  if (password.length > 20) {
    throw new Error('密码长度不能超过 20 位')
  }

  if (User.findOne({ username } as any)) {
    throw new Error('用户名已存在')
  }
  if (User.findOne({ email } as any)) {
    throw new Error('邮箱已注册')
  }

  const id = User.create({
    username,
    email,
    password: k.security.md5(password.trim()),
    displayName: body.displayName?.trim() || username,
    avatar: '',
    isAdmin: false,
    koobooId: ''
  } as any)

  const row = User.findById(id) as any
  if (!row || !row._id) throw new Error('注册失败，请稍后重试')

  return issueToken(row, false)
}

/**
 * Kooboo 登录：查找或创建本地用户并签发 JWT
 */
export function koobooLogin() {
  if (!k.account.isLogin) {
    throw new Error('请先登录 Kooboo')
  }

  const koobooUser = k.account.user.current
  if (!koobooUser?.userName) {
    throw new Error('无法获取 Kooboo 用户信息')
  }

  const koobooId = koobooUser.userName
  let user = User.findOne({ koobooId } as any) as any

  if (!user?._id) {
    user = User.findOne({ username: koobooId } as any) as any
    if (user?._id && !user.koobooId) {
      User.updateById(user._id, { koobooId } as any)
      user = User.findById(user._id) as any
    }
  }

  if (!user?._id) {
    const email = (koobooUser.email && koobooUser.email.trim())
      ? koobooUser.email.trim().toLowerCase()
      : `${koobooId}@kooboo.local`

    const id = User.create({
      username: koobooId,
      email,
      password: k.security.md5(Date.now().toString() + Math.random().toString()),
      displayName: koobooUser.firstName || koobooUser.lastName || koobooId,
      avatar: '',
      isAdmin: koobooUser.isAdmin || false,
      koobooId
    } as any)
    user = User.findById(id) as any
  }

  if (!user?._id) {
    throw new Error('创建用户失败，请稍后重试')
  }

  return issueToken(user, false)
}

export function logout(): void {
  k.cookie.remove(COOKIE_TOKEN_KEY)
}

/**
 * 从 JWT 获取当前用户（不含 Kooboo fallback）
 */
export function getCurrentUser() {
  const payload = getTokenPayload()
  if (!payload) return null

  const user = User.findById(payload.userId, { exclude: ['password'] }) as any
  if (!user?._id) return null

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    displayName: user.displayName || user.username,
    avatar: user.avatar || '',
    isAdmin: user.isAdmin || false,
    koobooId: user.koobooId || ''
  }
}

/**
 * API 鉴权：优先 JWT，兼容 Kooboo 会话
 */
export function getCurrentAuthUser(): UserInfo | null {
  const payload = getTokenPayload()
  if (payload) {
    const user = getUserById(payload.userId)
    if (user) return user
  }

  if (k.account.isLogin) {
    try {
      const username = k.account.user.current.userName
      return getUserInfo(username)
    } catch {
      return null
    }
  }

  return null
}
