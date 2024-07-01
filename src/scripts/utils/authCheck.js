const authCheck = (email, password) => {
  // スクリプトプロパティ経由でログインユーザー情報のスプシIDを取得
  const LOGIN_USER_INFO_SSID = PropertiesService.getScriptProperties().getProperty("LOGIN_USER_INFO_SSID")
  // ログインユーザーの情報を記載したスプレッドシートを取得
  const loginUserInfoSs = SpreadsheetApp.openById(LOGIN_USER_INFO_SSID)
  const sheet = loginUserInfoSs.getSheetByName('シート1')
  const allowedEmail = sheet.getRange(2, 3, sheet.getLastRow(), 1).getValues()
  const allowedPassword = sheet.getRange(2, 4, sheet.getLastRow(), 1).getValues()
  const allowedName = sheet.getRange(2, 2, sheet.getLastRow(), 1).getValues()

  let authFlag = false
  let user = null
  for(let i in allowedEmail) {
    if (allowedEmail[i] == email && allowedPassword[i] == password) {
      authFlag = true
      user = allowedName[i]
      break;
    }
  }
  return { authFlag: authFlag, user: user}
}
