//「アップロードデータ」フォルダのID
const uploadsFolderId = '1CXwJtzuY5hsXXkGGXKOFtUswTpheME2a'

const getAppUrl = () => {
  return ScriptApp.getService().getUrl()
}

const doGet = (e) => {
  // const htmlOutput = HtmlService.createTemplateFromFile('src/login')
  // htmlOutput.currentPage = e.parameter.page || 'login'
  // htmlOutput.deployURL = ScriptApp.getService().getUrl()

  // return htmlOutput.evaluate().setTitle("ログイン画面").addMetaTag('viewport', 'width=device-width, initial-scale=1')

  let template
  const page = e.parameter.page ? e.parameter.page : 'login'

  switch(page) {
    case 'index':
      template = HtmlService.createTemplateFromFile('src/index')
      break
    case 'upload':
      template = HtmlService.createTemplateFromFile('src/upload')
      break
    case 'convert':
      template = HtmlService.createTemplateFromFile('src/convert')
      break
    default:
      template = HtmlService.createTemplateFromFile('src/login')
      const cache = CacheService.getScriptCache()
      cache.removeAll(['userEmail', 'userName'])
      break
  }
  const cache = CacheService.getScriptCache()
  const email = cache.get('userEmail')
  const name = cache.get('userName')
  template.email = email
  template.name = name
  template.currentPage = page
  template.deployURL = ScriptApp.getService().getUrl()

  return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).setTitle(page).addMetaTag('viewport', 'width=device-width, initial-scale=1')
}

const doPost = (e) => {
  const email = e.parameters.email.toString()
  const password = e.parameters.password.toString()
  const check = authCheck(email, password) // 一致していればtrue、不一致ならfalse

  if(check.authFlag === true) {
    template = HtmlService.createTemplateFromFile('src/index')
    template.email = email //emailをindex.htmlへ送る
    template.name = check.user //authCheckの返り値に入ってきたユーザー名を送る
    template.currentPage = 'index' //現在のページ情報をセット
    template.deployURL = ScriptApp.getService().getUrl()

    // セッションストレージにユーザー情報を保存
    // template.sessionScript = `
    //   <script>
    //     sessionStorage.setItem('email', '${email}')
    //     sessionStorage.setItem('name', '${check.user}')
    //   </script>
    // `

    // ユーザー情報をキャッシュにつめる
    const cache = CacheService.getScriptCache()
    cache.put('userEmail', email, 21600)
    cache.put('userName', check.user, 21600)

    return template
      .evaluate()
      .setTitle('ホーム')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')

  } else {
    template = HtmlService.createTemplateFromFile('src/error')
    template.deployURL = ScriptApp.getService().getUrl()
    template.currentPage = 'error'

    return template
      .evaluate()
      .setTitle('エラー')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
  }
}

// html側でファイルアップロードボタン押下時に実行される関数
const uploadFile = (formObj) => {
  try {
    const { file } = formObj
    const fileUrl = uploadFileToGoogleDrive(file)

    const name = file.getName()
    const type = file.getContentType()
    const time = new Date().toLocaleString()
    const values = [ name, type, time, fileUrl ]
    addUploadFileInfoToSs(values)

    return fileUrl

  } catch(e) {
    console.log("アップロードエラーが発生しました", e)
    throw e
  }
}

// ファイルをGoogleDriveの「アップロードデータ」フォルダにアップロード、完了後アップロードファイルのURLを返す
const uploadFileToGoogleDrive = ( file ) => {
  console.log("html側でGoogleDriveへのファイルアップロードが実行された", file)
  const uploadFolder = DriveApp.getFolderById(uploadsFolderId)
  const uploadFile = uploadFolder.createFile(file)
  return uploadFile.getUrl()
}

// アップロードしたファイルのデータをスプレッドシートに追加
const addUploadFileInfoToSs = ( values ) => {
  // アップロードしたファイル情報を追記するスプレッドシート（「アップロードファイル管理リスト」）
  const sheet = SpreadsheetApp.openById('1y-WwACb0Dq0rWQ1S2m_hMMZ7H6ExLb-y1D6Szz0oo7Y').getSheetByName('シート1')
  sheet.appendRow(values)
}

// html側で「ファイル一覧を取得」押下時に実行される関数
// 「アップロードデータ」フォルダのファイル一覧を取得
const getFilesFromUploadsFolder = () => {
  Logger.log("getFilesFromUploadsFolderがコール")
  //フォルダ内のファイルを一括取得
  const files = DriveApp.getFolderById(uploadsFolderId).getFiles() //「アップロードデータ」フォルダ内の全ファイルを取得
  let fileArr = []
  while(files.hasNext()) {
    const file = files.next()
    fileArr.push({
      name: file.getName(),
      version: file.getDescription(),
      url: file.getUrl()
    })
  }
  return fileArr

}
