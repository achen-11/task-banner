//@k-url /__logout__

import { logout } from 'code/Services/auth'
k.api.get(()=>{
    if (k.account.isLogin) {
      k.account.user.logout()
    }
    logout()
    k.response.redirect('/')
})
