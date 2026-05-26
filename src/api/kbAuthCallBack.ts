// @k-url /__kbAuthCallback

import { koobooLogin } from 'code/Services/auth'

k.api.get(() => {
  const loginType = k.request.get('type')

  if (!k.account.isLogin) {
    k.response.redirect('/#/login')
    return
  }

  if (loginType === 'koobooLogin') {
    try {
      koobooLogin()
      k.cookie.set('kooboo_result', 'login_success', 1)
      k.response.redirect('/__kbAuthResult?type=login')
    } catch (e) {
      k.cookie.set('kooboo_error', (e as Error)?.message || '登录失败', 1)
      k.response.redirect('/__kbAuthResult?type=login')
    }
    return
  }

  k.response.redirect('/#/')
})
