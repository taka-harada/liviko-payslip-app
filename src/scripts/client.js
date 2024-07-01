const doGet = () => {
  const htmlOutput = HtmlService.createTemplateFromFile('src/login')
  htmlOutput.deployURL = ScriptApp.getService().getUrl()

  return htmlOutput.evaluate().setTitle("ログイン画面").addMetaTag('viewport', 'width=device-width, initial-scale=1')
}

const doPost = (e) => {
  const email = e.parameters.email.toString()
  const password = e.parameters.password.toString()
  const check = authCheck(email, password) // 一致していればtrue、不一致ならfalse

  if(check.authFlag === true) {
    template = HtmlService.createTemplateFromFile('src/index')
    template.email = email //emailをindex.htmlへ送る
    template.name = check.user //authCheckの返り値に入ってきたユーザー名を送る


    return template
      .evaluate()
      .setTitle('ホーム')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')

  } else {
    template = HtmlService.createTemplateFromFile('src/error')
    template.deployURL = ScriptApp.getService().getUrl()

    return template
      .evaluate()
      .setTitle('エラー')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
  }
}
