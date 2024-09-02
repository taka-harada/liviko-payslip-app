//「アップロードデータ」フォルダのID
const UPLOAD_FOLDER_ID = PropertiesService.getScriptProperties().getProperty("UPLOAD_FOLDER_ID")

// 「アップロードファイル管理リスト」スプシのID
const UPLOAD_MANAGEMENT_SSID = PropertiesService.getScriptProperties().getProperty("UPLOAD_MANAGEMENT_SSID")

// 「エクスポート」>「全データ」フォルダのID
const ALL_MEMBER_SS_FOLDER_ID = PropertiesService.getScriptProperties().getProperty("ALL_MEMBER_SS_FOLDER_ID")

// 「エクスポート」>「個別データ」>「スプレッドシート」フォルダのID
const PERSONAL_SS_FOLDER_ID = PropertiesService.getScriptProperties().getProperty("PERSONAL_SS_FOLDER_ID")

// 「PDF」フォルダのID
const DIST_PDF_FOLDER_ID = PropertiesService.getScriptProperties().getProperty("DIST_PDF_FOLDER_ID")

// 「PDF_パスワード付き」フォルダのID
const DIST_PROTECTED_PDF_FOLDER_ID = PropertiesService.getScriptProperties().getProperty("DIST_PROTECTED_PDF_FOLDER_ID")

// データ送付先情報スプシ
const RECIPIENT_INFO_SS_ID = PropertiesService.getScriptProperties().getProperty("RECIPIENT_INFO_SS_ID")

// 給与明細テンプレートファイルID
const PAY_SLIP_TEMPLATE_SSID = PropertiesService.getScriptProperties().getProperty("PAY_SLIP_TEMPLATE_SSID")

// PDF.co API KEY
const PDF_CO_API_KEY = PropertiesService.getScriptProperties().getProperty("PDF_CO_API_KEY")

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

// htmlからGASプロジェクト内に配置したファイルを呼び出す関数
const loadExternalFile = (filename) => {
  return HtmlService.createHtmlOutputFromFile(filename).getContent()
}

// html側でファイルアップロードボタン押下時に実行される関数
const uploadFile = (formObj) => {
  try {
    const { file } = formObj
    // GoogleDriveの所定フォルダにアップロード
    const fileUrl = uploadFileToGoogleDrive(file)

    const name = file.getName()
    const type = file.getContentType()
    const time = new Date().toLocaleString()
    const values = [ name, type, time, fileUrl ]
    //指定のスプシに記録
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
  const uploadFolder = DriveApp.getFolderById(UPLOAD_FOLDER_ID)
  const uploadFile = uploadFolder.createFile(file)
  return uploadFile.getUrl()
}

// アップロードしたファイルのデータをスプレッドシートに追加
const addUploadFileInfoToSs = ( values ) => {
  // アップロードしたファイル情報を追記するスプレッドシート（「アップロードファイル管理リスト」）
  const sheet = SpreadsheetApp.openById(UPLOAD_MANAGEMENT_SSID).getSheetByName('シート1')
  sheet.appendRow(values)
}

// html側で「ファイル一覧を取得」押下時に実行される関数
// 「アップロードデータ」フォルダのファイル一覧を取得
const getFilesFromUploadsFolder = () => {
  Logger.log("getFilesFromUploadsFolderがコール")
  //フォルダ内のファイルを一括取得
  const files = DriveApp.getFolderById(UPLOAD_FOLDER_ID).getFiles() //「アップロードデータ」フォルダ内の全ファイルを取得
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

// html側で選択したファイルのIDを元にPDF生成を実行する
const convertSpreadSheetToPdf = (uploadedFileId) => {

  // ユーザーごとのスプシを生成して、[{ name: string, date: string, SsId: string  }] を返す
  const personalPaySlipSsDataArr = createPersonalSsFromCsv(uploadedFileId)

  // パスワード付与したPDFを格納するフォルダを「PDF_パスワード付き」フォルダ内に新規作成
  const distProtectedPdfFolder = DriveApp.getFolderById(DIST_PROTECTED_PDF_FOLDER_ID)　// 「PDF_パスワード付き」フォルダ
  const now = new Date()
  const date = formatDate(now)
  const distFolder = distProtectedPdfFolder.createFolder(date)
  const distFolderId = distFolder.getId()

  // ユーザーの数だけループ処理でPDFを生成
  Object.keys(personalPaySlipSsDataArr).forEach(key => {
    // 配列から個別データを定義
    const personalPaySlipSsId = personalPaySlipSsDataArr[key].SsId
    const personalPaySlipSs = SpreadsheetApp.openById(personalPaySlipSsId) //個別の給与明細スプシ
    const personalPaySlipSheet = personalPaySlipSs.getSheetByName('シート1')
    const personalPaySlipSheetId = personalPaySlipSs.getSheetByName('シート1').getSheetId() //対象のシートIDを取得
    const personalPaySlipSsName = personalPaySlipSsDataArr[key].name //氏名を定義
    const documentDate = personalPaySlipSsDataArr[key].date //日付を定義

    // PDF化の前にflushしてスプシの内容を更新
    SpreadsheetApp.flush()

    // メール送信先情報を定義
    const recipientInfoSs = SpreadsheetApp.openById(RECIPIENT_INFO_SS_ID)
    const recipientInfoSheet = recipientInfoSs.getActiveSheet()
    const recipientInfoArr = recipientInfoSheet.getRange(2, 2, recipientInfoSheet.getLastRow(), recipientInfoSheet.getLastColumn()).getValues()
    // 配列->オブジェクト
    const recipientInfo = recipientInfoArr.map(item => ({
      name: item[0],
      mail: item[1],
      password: item[2]
    }))
    // 「データ送付先情報」スプシの中から対象ユーザーの情報を、給与明細スプシ生成の時に返却された氏名と比較して特定
    const targetUserInfo = recipientInfo.find(info => info.name === personalPaySlipSsName)

    // PDF化
    try {
      // 範囲を指定してPDF化用のURLを生成
      const requestUrl = getPdfUrl(personalPaySlipSsId, personalPaySlipSheetId, 'A1', 'AB42', 'A4', true)
      const token = ScriptApp.getOAuthToken()
      const response = UrlFetchApp.fetch(requestUrl, { headers: {'Authorization': 'Bearer ' + token }})

      // responseからblobオブジェクトを作成
      const blob = response.getBlob()
      const fileName = personalPaySlipSsName + '_給与明細_' + documentDate + '.pdf'
      blob.setName(fileName.replace(/\s+/g, '')) //間のスペースなども正規表現で削除

      // 生成したPDFを格納するフォルダ
      const distPdfFolderId = DIST_PDF_FOLDER_ID

      // パスワードなしPDF
      const generatedPdfFile = DriveApp.getFolderById(distPdfFolderId).createFile(blob)

      // ファイルを渡して、PDF.coからPre-signed URLとファイル名を取得
      const resObj = getPdfCoObj(generatedPdfFile)

      // PDFにパスワードを設定
      const oResp = addPasswordToPdf(resObj.url, resObj.fileName, targetUserInfo, distFolderId)
      const protectedPdfBlob = oResp.generatedFile.getBlob()

      // MEMO: ここで名前とメールアドレスを記載したスプシを呼び出して名前とマッチしたテーブルのメールアドレスを取り出してsendMailする
      if(!targetUserInfo) {
        // 該当するユーザーの送信先情報が登録されていなければ管理者へ送信
        sendMail('haradatakayuki7+admin@gmail.com', protectedPdfBlob)
      } else {
        sendMail(`${targetUserInfo.mail}`, protectedPdfBlob)
      }

      //Browser.msgBox(`PDFを出力しました`)
    } catch(e) {
      //Browser.msgBox(`PDF出力に失敗しました\\n${e.message}`)
      console.error(`PDF出力に失敗しました\\n${e.message}`)
    }
  })

}

// CSVからユーザーごとのデータを抽出して個別スプシを作成する
const createPersonalSsFromCsv = (fileId) => {
//const createPersonalSsFromCsv = () => {

  // 個別の給与明細用のスプレッドシート格納フォルダ「個別データ/スプレッドシート」に移動
  const personalPaySlipFolder = DriveApp.getFolderById(PERSONAL_SS_FOLDER_ID)

  // 新規作成したスプシを配置するので、現在時刻を取得してフォルダを生成しておく。ループで生成したデータを入れていく
  const now = new Date()
  const date = formatDate(now)
  const dateFolder = personalPaySlipFolder.createFolder(date)

  // CSVの内容をスプシにコピーし、返却されたIDを取得
  const baseSsId = copyDataToSs(fileId)
  //const baseSsId = "15BBZJsT3QX2gtRykO8QnBmTT0M37NZMbIGFwOAK85IA"
  //const baseSsId = "13lAnCfVzSTpKhcqnhjH-b36MJkub9djLvfJsef1CTS0" //定額減税あり

  // 元データとなるスプシを開く
  const baseSs = SpreadsheetApp.openById(baseSsId)
  const baseSheet = baseSs.getActiveSheet()

  // スプシから日付情報を取得
  const documentDate = baseSheet.getRange('C1').getValue().replace(/作成\s*$/, '').trim()

  // 項目名取得
  // とりあえず'社員コード'がある行を項目名の基準行にセットし、ジャンルごとに分けて取得
  let itemCellRowNum
  const itemCell = baseSheet.createTextFinder('社員コード').matchEntireCell(true).findNext()
  if (itemCell) {
    itemCellRowNum = itemCell.getRow()
  } else {
    Logger.log("対象のセルが見つかりませんでした")
  }
  //const itemCellRowNum = baseSheet.createTextFinder('社員コード' | '行項目名').matchEntireCell(true).findNext().getRow()
  const amountPaidTitle = baseSheet.getRange(`C${itemCellRowNum}:U${itemCellRowNum}`).getValues()
  const deductionTitle_A = baseSheet.getRange(`AF${itemCellRowNum}:AI${itemCellRowNum}`).getValues()
  const deductionTitle_B = baseSheet.getRange(`AJ${itemCellRowNum}:AM${itemCellRowNum}`).getValues()
  const deductionTitle_C = baseSheet.getRange(`AN${itemCellRowNum}:AQ${itemCellRowNum}`).getValues()
  const fixedTaxReductionTitleText = ["(減税前税額)", "(定額減税額)", "(減税設定額)"]
  const deductionTitle_D = [
    fixedTaxReductionTitleText.map(text => {
      const cell = baseSheet.createTextFinder(text).matchEntireCell(true).findNext()
      return cell ? cell.getValue() : null //セルが見つからない場合はnullを返す
    })
  ]
  const otherTitle = baseSheet.getRange(`AT${itemCellRowNum}:AU${itemCellRowNum}`).getValues()
  const transferPaymentTitle = baseSheet.getRange(`BA${itemCellRowNum}:BC${itemCellRowNum}`).getValues() // 「振込支給の内訳」

  // ここから実際の値を取得
  let userDataArr = []

  // 「取締役」ブロックのデータを取得して配列に格納
  const boardMemberData = {
    // CSVから「支給」ブロックのデータを全員分抽出してセット
    paymentBlock: getMemberData(baseSheet, '取締役', 1, 21 ),
    // CSVから「控除」ブロックのデータを全員分抽出してセット
    deductionBlock: getMemberData(baseSheet, '取締役', 30, 14),
    // CSVから定額減税関連データを全員分抽出してセット
    fixedTaxReduction: getSpecifiedColData(baseSheet, '取締役', '(減税前税額)')
     ? getSpecifiedColData(baseSheet, '取締役', '(減税前税額)').map((item, index) => [
         item,
         getSpecifiedColData(baseSheet, '取締役', '(定額減税額)')[index],
         getSpecifiedColData(baseSheet, '取締役', '(減税設定額)')[index]
       ])
     : [],
    // CSVから「その他」ブロックのデータを全員分抽出してセット
    otherBlock: getMemberData(baseSheet, '取締役', 46, 2),
    // CSVから合計の値をセット
    total: getSpecifiedColData(baseSheet, '取締役', '支給合計')
      ? getSpecifiedColData(baseSheet, '取締役', '支給合計').map((item, index) => [
          item,
          getSpecifiedColData(baseSheet, '取締役', '控除合計')[index],
          getSpecifiedColData(baseSheet, '取締役', 'その他合計')[index],
          getSpecifiedColData(baseSheet, '取締役', '差引支給合計')[index]
        ])
      : []
  }

  // ループさせて各人ごとにオブジェクトを作成（mapの戻り値を利用しないのでforEach）
  boardMemberData.paymentBlock.forEach((payment, index) => {
    const userData = {
      paymentBlock: {
        code: payment[0],
        name: payment[1].trim(),
        baseSalary: payment[2],
        dig: payment[3],
        executiveSalary: payment[4],
        fosterFamily: payment[5],
        housingAllowance: payment[6],
        annuity: payment[7],
        healthInsurance: payment[8],
        total: payment[9],
        taxableCommutingExpenses: payment[10],
        nonTaxableCommutingExpenses: payment[11],
        interimAdjustment: payment[12],
        otherBenefit_A: payment[13],
        otherBenefit_B: payment[14],
        otherBenefit_C: payment[15],
        partTimeSalary: payment[16],
        totalExpensiveSalary: payment[17],
        totalPay: payment[18],
        totalTaxPayment: payment[19],
        totalNonTaxPayment: payment[20],
        totalExpenditure: payment[21]
      },
      deductionBlock_A: {
        // allowance: boardMemberData.deductionBlock[index][0],
        // inkindAllowance: boardMemberData.deductionBlock[index][1],
        healthInsurance: boardMemberData.deductionBlock[index][2], //健康保険料
        nursingCareInsurance: boardMemberData.deductionBlock[index][3], //介護保険料
        welfareAnnuityInsurance: boardMemberData.deductionBlock[index][4], //厚生年金保険
        unemploymentInsurance: boardMemberData.deductionBlock[index][5], //雇用保険料
      },
      deductionBlock_B: {
        socialInsurance: boardMemberData.deductionBlock[index][6], //社会保険料計
        subtotal_deductionSocialInsurance: boardMemberData.deductionBlock[index][7], //社保控除後計
        incomeTax: boardMemberData.deductionBlock[index][8], //所得税
        inhabitantsTax: boardMemberData.deductionBlock[index][9], //住民税
      },
      deductionBlock_C: {
        otherDeduction_A: boardMemberData.deductionBlock[index][10], //他控除１
        otherDeduction_B: boardMemberData.deductionBlock[index][11], //他控除２
        otherDeduction_C: boardMemberData.deductionBlock[index][12], //他控除３
        cellPhoneCallBurden: boardMemberData.deductionBlock[index][13], //携帯通話負担
      },
      // MEMO: 定額減税は項目がない人もいるためない場合はnullをセット（boardMemberData.fixedTaxReductionが空だったらこれ自体skipでもいいかも）
      deductionBlock_D: {
        taxBeforeDeduction: boardMemberData.fixedTaxReduction.length > 0 ? boardMemberData.fixedTaxReduction[index][0]: null, //(減税前税額)
        fixedTaxReduction: boardMemberData.fixedTaxReduction.length > 0 ? boardMemberData.fixedTaxReduction[index][1]: null, //(定額減税額)
        taxReductionAmount: boardMemberData.fixedTaxReduction.length > 0 ? boardMemberData.fixedTaxReduction[index][2]: null //(減税設定額)
      },
      otherBlock: {
        yearEndTaxRefund: boardMemberData.otherBlock[index][0], //年末調整還付
        yearEndTaxCollection: boardMemberData.otherBlock[index][1], //年末調整徴収
        // otherTotal: boardMemberData.otherBlock[index][2],
      },
      total: {
        totalPayment: boardMemberData.total[index][0], //支給合計
        totalDeduction: boardMemberData.total[index][1], //控除合計
        otherTotal: boardMemberData.total[index][2], //その他合計
        balanceOfPayment: boardMemberData.total[index][3] //差引支給合計
      }
    }
    userDataArr.push(userData)
  })

  // MEMO:API叩きまくると制限かかるので開発時はコメントアウトしとく
  //「従業員」ブロックのデータを取得して配列に格納
  const employeeData = {
    // CSVから「支給」ブロックのデータを全員分抽出してセット
    paymentBlock: getMemberData(baseSheet, '従業員', 1, 21),
    // CSVから「控除」ブロックのデータを全員分抽出してセット
    deductionBlock: getMemberData(baseSheet, '従業員', 30, 14),
    // CSVから定額減税関連データを全員分抽出してセット
    fixedTaxReduction: getSpecifiedColData(baseSheet, '従業員', '(減税前税額)')
      ? getSpecifiedColData(baseSheet, '従業員', '(減税前税額)').map((item, index) => [
        item,
        getSpecifiedColData(baseSheet, '従業員', '(定額減税額)')[index],
        getSpecifiedColData(baseSheet, '従業員', '(減税設定額)')[index]
      ])
      : [],
    // CSVから「その他」ブロックのデータを全員分抽出してセット
    otherBlock: getMemberData(baseSheet, '従業員', 46, 2),
    total: getSpecifiedColData(baseSheet, '従業員', '支給合計').map((item, index) => [
      item,
      getSpecifiedColData(baseSheet, '従業員', '控除合計')[index],
      getSpecifiedColData(baseSheet, '従業員', 'その他合計')[index],
      getSpecifiedColData(baseSheet, '従業員', '差引支給合計')[index]
    ])
  }

  // ループさせて各人ごとにオブジェクトを作成（mapの戻り値を利用しないのでforEach）
  employeeData.paymentBlock.forEach((payment, index) => {
    const userData = {
      paymentBlock: {
        code: payment[0],
        name: payment[1].trim(),
        baseSalary: payment[2],
        dig: payment[3],
        executiveSalary: payment[4],
        fosterFamily: payment[5],
        housingAllowance: payment[6],
        annuity: payment[7],
        healthInsurance: payment[8],
        total: payment[9],
        taxableCommutingExpenses: payment[10],
        nonTaxableCommutingExpenses: payment[11],
        interimAdjustment: payment[12],
        otherBenefit_A: payment[13],
        otherBenefit_B: payment[14],
        otherBenefit_C: payment[15],
        partTimeSalary: payment[16],
        totalExpensiveSalary: payment[17],
        totalPay: payment[18],
        totalTaxPayment: payment[19],
        totalNonTaxPayment: payment[20],
      },
      deductionBlock_A: {
        // allowance: boardMemberData.deductionBlock[index][0],
        // inkindAllowance: boardMemberData.deductionBlock[index][1],
        healthInsurance: employeeData.deductionBlock[index][2],
        nursingCareInsurance: employeeData.deductionBlock[index][3],
        welfareAnnuityInsurance: employeeData.deductionBlock[index][4],
        unemploymentInsurance: employeeData.deductionBlock[index][5],
      },
      deductionBlock_B: {
        socialInsurance: employeeData.deductionBlock[index][6],
        subtotal_deductionSocialInsurance: employeeData.deductionBlock[index][7],
        incomeTax: employeeData.deductionBlock[index][8],
        inhabitantsTax: employeeData.deductionBlock[index][9],
      },
      deductionBlock_C: {
        otherDeduction_A: employeeData.deductionBlock[index][10],
        otherDeduction_B: employeeData.deductionBlock[index][11],
        otherDeduction_C: employeeData.deductionBlock[index][12],
        cellPhoneCallBurden: employeeData.deductionBlock[index][13],
      },
      deductionBlock_D: {
        taxBeforeDeduction: employeeData.fixedTaxReduction.length > 0 ? employeeData.fixedTaxReduction[index][0] : null, //(減税前税額)
        fixedTaxReduction: employeeData.fixedTaxReduction.length > 0 ? employeeData.fixedTaxReduction[index][1] : null, //(定額減税額)
        taxReductionAmount: employeeData.fixedTaxReduction.length > 0 ? employeeData.fixedTaxReduction[index][2] : null //(減税設定額)
      },
      otherBlock: {
        yearEndTaxRefund: employeeData.otherBlock[index][0],
        yearEndTaxCollection: employeeData.otherBlock[index][1],
        //otherTotal: employeeData.otherBlock[index][2],
      },
      total: {
        totalPayment: employeeData.total[index][0], //支給合計
        totalDeduction: employeeData.total[index][1], //控除合計
        otherTotal: employeeData.total[index][2], //その他合計
        balanceOfPayment: employeeData.total[index][3] //差引支給合計
      }
    }
    userDataArr.push(userData)
  })

  // 個別データを振り分けるための新しいスプシを作成
  // 全データの配列をループさせてユーザー分のシートを作成
  let userSsIdArr = []
  userDataArr.map(data => {
    // 給与明細のテンプレートファイルから個別データ用のスプシを生成
    const personalPaySlipSs = DriveApp.getFileById(PAY_SLIP_TEMPLATE_SSID).makeCopy(data.paymentBlock.name) // スプシのファイル名をユーザー名にする

    //ループを回す前に生成した現在時刻名のフォルダに格納していく
    dateFolder.addFile(personalPaySlipSs)

    // 個別のスプシにデータを挿入
    const activeSs = SpreadsheetApp.open(personalPaySlipSs)
    const newSheet = activeSs.getSheets()[0]
    newSheet.getRange(6, 4, 1, 1).setValue(data.paymentBlock.name) //氏名挿入

    // amountPaidTitle, deductionTitle, otherTitleを縦に転置して個別スプシにデータを挿入
    const transposedAmountPaidTitle = amountPaidTitle[0].map((_, index) => [amountPaidTitle.map(row => row[index])])
    const transposedDeductionTitle_A = deductionTitle_A[0].map((_, index) => [deductionTitle_A.map(row => row[index])])
    const transposedDeductionTitle_B = deductionTitle_B[0].map((_, index) => [deductionTitle_B.map(row => row[index])])
    const transposedDeductionTitle_C = deductionTitle_C[0].map((_, index) => [deductionTitle_C.map(row => row[index])])
    const transposedDeductionTitle_D = deductionTitle_D[0].map((_, index) => [deductionTitle_D.map(row => row[index])])
    const transposedOtherTitle = otherTitle[0].map((_, index) => [otherTitle.map(row => row[index])])

    // 給与明細テンプレにユーザーごとのデータを挿入するため「支給」ブロックのデータを配列にする（「社員コード」「氏名」は除く）
    const userPaymentDataArr = Object.values(data.paymentBlock).slice(2)
    // 「控除」ブロックのデータを配列にする
    const userDeductionDataArr_A = Object.values(data.deductionBlock_A)
    const userDeductionDataArr_B = Object.values(data.deductionBlock_B)
    const userDeductionDataArr_C = Object.values(data.deductionBlock_C)
    const userDeductionDataArr_D = Object.values(data.deductionBlock_D)
    // 「その他」ブロックのデータを配列にする
    const userOtherDataArr = Object.values(data.otherBlock)

    // 給与明細フォーマットに「支給」ブロックの内容を挿入
    newSheet.getRange(9, 2, transposedAmountPaidTitle.length, transposedAmountPaidTitle[0].length).setValues(transposedAmountPaidTitle)
    const insertTransposeAmountPaidDataRange = newSheet.getRange(9, 6, userPaymentDataArr.length, 1).setValues(userPaymentDataArr.map(value => [value]))
    insertTransposeAmountPaidDataRange.setNumberFormat("#,##0")

    // 給与明細フォーマットに「控除」ブロックの内容を挿入
    newSheet.getRange(9, 11, transposedDeductionTitle_A.length, transposedDeductionTitle_A[0].length).setValues(transposedDeductionTitle_A)
    const insertTransposeDeductionDataRange_A = newSheet.getRange(9, 15, userDeductionDataArr_A.length, 1).setValues(userDeductionDataArr_A.map(value => [value]))
    insertTransposeDeductionDataRange_A.setNumberFormat("#,##0")

    newSheet.getRange(14, 11, transposedDeductionTitle_B.length, transposedDeductionTitle_B[0].length).setValues(transposedDeductionTitle_B)
    const insertTransposeDeductionDataRange_B = newSheet.getRange(14, 15, userDeductionDataArr_B.length, 1).setValues(userDeductionDataArr_A.map(value => [value]))
    insertTransposeDeductionDataRange_B.setNumberFormat("#,##0")

    newSheet.getRange(19, 11, transposedDeductionTitle_C.length, transposedDeductionTitle_C[0].length).setValues(transposedDeductionTitle_C)
    const insertTransposeDeductionDataRange_C = newSheet.getRange(19, 15, userDeductionDataArr_C.length, 1).setValues(userDeductionDataArr_C.map(value => [value]))
    insertTransposeDeductionDataRange_C.setNumberFormat("#,##0")

    newSheet.getRange(24, 11, transposedDeductionTitle_D.length, transposedDeductionTitle_D[0].length).setValues(transposedDeductionTitle_D)
    const insertTransposeDeductionDataRange_D = newSheet.getRange(24, 15, userDeductionDataArr_D.length, 1).setValues(userDeductionDataArr_D.map(value => [value]))
    insertTransposeDeductionDataRange_D.setNumberFormat("#,##0")

    // 給与明細フォーマットに「その他」ブロックの内容を挿入
    newSheet.getRange(9, 20, transposedOtherTitle.length, transposedOtherTitle[0].length).setValues(transposedOtherTitle)
    const insertTransposeOtherDataRange = newSheet.getRange(9, 24, userOtherDataArr.length, 1).setValues(userOtherDataArr.map(value => [value]))
    insertTransposeOtherDataRange.setNumberFormat("#,##0")

    // 各ブロックの合計を挿入
    newSheet.getRange('F36').setValue(data.total.totalPayment) //支給合計
    newSheet.getRange('O36').setValue(data.total.totalDeduction) //控除合計
    newSheet.getRange('X19').setValue(data.total.otherTotal) //その他合計
    newSheet.getRange('X36').setValue(data.total.balanceOfPayment) //差引支給額

    // 値を挿入した範囲のフォントサイズを一括で調整
    newSheet.getRange(8, 2, 29, 26).setFontSize(8)

    // 書き込んだデータが反映されるまでのタイムラグをなくすために各ユーザーの処理が終わるごとにflushする
    SpreadsheetApp.flush()

    userSsIdArr.push({
      name: data.paymentBlock.name,
      date: documentDate,
      SsId: personalPaySlipSs.getId()
    })
  })
  return userSsIdArr
}

// CSVデータの内容をスプシに取り込み、生成したスプシのIDを返す
const copyDataToSs = (fileId) => {
  // 選択されたIDのCSVをGoogleドライブから取得
  const csvFile = DriveApp.getFileById(fileId)

  // CSVから値を取得
  let csvContent = csvFile.getBlob().getDataAsString('UTF-8')
  // '社員コード'という文字が含まれていない or 文字化けしている場合は Shift_JIS で再取得
  if(!csvContent.includes('社員コード') || csvContent.includes('�')) {
    csvContent = csvFile.getBlob().getDataAsString('Shift_JIS')
  }
  const csvData = Utilities.parseCsv(csvContent)

  // 新規スプシを作成
  const newSpreadSheet = SpreadsheetApp.create('給与全データ')
  const newSpreadSheetFile = DriveApp.getFileById(newSpreadSheet.getId())

  // 「/エクスポート/全データ」フォルダに格納
  const distAllDataFolder = DriveApp.getFolderById(ALL_MEMBER_SS_FOLDER_ID)

  // 現在時刻を取得してフォルダを生成して、新規作成したスプシを配置
  const now = new Date()
  const date = formatDate(now)
  const dateFolder = distAllDataFolder.createFolder(date)
  dateFolder.addFile(newSpreadSheetFile)

  // 新しいスプシにデータを挿入する
  const startRow = 1 //挿入を開始する行
  const startColumn = 1 //挿入を開始する列
  const numRows = csvData.length //行数
  const numColumns = csvData[0].length //列数

  // CSVの値を新規スプシのシートに挿入
  const newSheet = newSpreadSheet.getActiveSheet()
  const range = newSheet.getRange(startRow, startColumn, numRows, numColumns)
  range.setValues(csvData)

  return newSpreadSheet.getId()
}


// PDF.coにファイルをリクエストして、urlとfileNameを取得
const getPdfCoObj = (file) => {

  // PDF.coからPreSignedUrlをjsonで取得
  const resJson = useGetPreSignedUrl(file.getName())
  console.log("respPresignedUrlからレスポンスきた？",resJson)

  if(!resJson.error){
    console.log("エラーなくレスポンスが返ってきた")
    const fileBlob = file.getBlob()
    // URLとblobデータ
    if(usePutFileToPdfCo(resJson.presignedUrl, fileBlob)) {
      // Add Url
      return { url: resJson.url, fileName: file.getName() }
    }
  }
}

// PDF.co から Pre-signed URLを取得する
const useGetPreSignedUrl = (fileName) => {
  const options = {
    'method': 'GET',
    'contentType': 'application/json',
    'headers': {
      "x-api-key": PDF_CO_API_KEY
    }
  }

  const endpoint = `https://api.pdf.co/v1/file/upload/get-presigned-url?name=${fileName}`
  const res = UrlFetchApp.fetch(endpoint, options)

  const content = res.getContentText()
  const json = JSON.parse(content)

  return json
}

// PDF.coへファイルをPUTする
const usePutFileToPdfCo = (presignedUrl, fileContent) => {
  const options = {
    'method' : 'PUT',
    'contentType': 'application/octet-stream',
    'headers': {
      "x-api-key": PDF_CO_API_KEY
    },
    'payload' : fileContent
  }
  const pdfCoResponse = UrlFetchApp.fetch(presignedUrl, options)

  if(pdfCoResponse.getResponseCode() === 200) {
    return true
  } else {
    return false
  }
}

// PDFにパスワードを設定
const addPasswordToPdf = (pdfUrl, pdfFileName, userInfo, folderId) => {

  // Output File Name
  let outputFileName = `${pdfFileName.replace('.pdf','')}_protected.pdf`

  // Prepare Payload
  const data = {
    "url": pdfUrl,
    "ownerPassword": userInfo ? `${userInfo.password}` : 'master',
    "userPassword": userInfo ? `${userInfo.password}` : 'master',
    "EncryptionAlgorithm": "AES_128bit",
    "AllowPrintDocument": false,
    "AllowFillForms": false,
    "AllowModifyDocument": false,
    "AllowContentExtraction": false,
    "AllowModifyAnnotations": false,
    "PrintQuality": "LowResolution",
    "encrypt": false,
    "async": false,
    "name": `${outputFileName}`
    //"name": 'output-protected.pdf'
  }
  const createdJson = JSON.stringify(data)

  // Prepare Request Options
  const options = {
    'method' : 'post',
    'contentType': 'application/json',
    'headers': {
      "x-api-key": PDF_CO_API_KEY
    },
    'payload': JSON.stringify(data)
  }

  // Get Response
  try {
    const pdfCoResponse = UrlFetchApp.fetch('https://api.pdf.co/v1/pdf/security/add', options)

    const pdfCoRespContent = pdfCoResponse.getContentText()
    const pdfCoRespJson = JSON.parse(pdfCoRespContent)

    if(!pdfCoRespJson.error) {
      console.log("パスワード化がエラーなく完了")
      const fileContent = UrlFetchApp.fetch(pdfCoRespJson.url).getBlob()

      // 生成したPDFを格納するフォルダ
      // ここはmapで回す前に生成したフォルダに格納した方がよさげ
      //const distFolderId = '1DS5XCJd1zhlo30X3Tv9NAuSx386OOCk7'
      console.log("パスワードをつけたPDFの保存先", folderId)
      const protectedPDF = DriveApp.getFolderById(folderId).createFile(fileContent.setName(outputFileName))

      return {
        message: `Added Password to ${pdfFileName} and Saved as ${outputFileName}`,
        generatedFile: protectedPDF,
        fileId: protectedPDF.getId()
      }

      //DriveApp.getFolderById(distFolderId).createFile(fileContent)
      //folder.createFile(fileContent)
      //return `Added Password to ${pdfFileName} and Saved as ${outputFileName}`
    } else {
      console.log("パスワード化失敗")
      return {
        message: `Error Protecting ${pdfFileName}`,
        generatedFile: undefined
      }

    }

  } catch(e) {
    console.log("APIエラー", e)
  }

}
