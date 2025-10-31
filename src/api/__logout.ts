//@k-url /__logout
k.account.logout();
k.cookie.clear();
k.response.redirect("/_Admin/login?permission=o&returnurl=/");