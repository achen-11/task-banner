export interface UserInfo {
  _id: string
  username: string
  email: string
  displayName: string
  avatar: string
  isAdmin: boolean
  koobooId?: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  myTasksDefaultStatuses?: Array<'todo' | 'in_progress' | 'review' | 'completed'>
}

export interface LoginRequest {
  account: string
  password: string
  isRemember?: boolean
}

export interface LoginResponse {
  token: string
  userId: string
  name: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  displayName?: string
}

export interface UpdateProfileRequest {
  displayName?: string
  email?: string
  preferences?: UserPreferences
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}
