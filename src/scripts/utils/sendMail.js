/**
 * メール配信
 * @param {string} recipient 送信先メールアドレス
 * @param {*} blob PDFデータ
 * @param {boolean} successFlag 送信先メールアドレスがリストにあったかどうかの判定フラグ
 * @param {*} targetUserInfo ユーザー情報のオブジェクト
 */
const sendMail = (recipient, blob, successFlag, targetUserInfo) => {

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentJapanYear = getJapanEra(currentYear)

  if(successFlag) {
    // 「データ送付先情報」スプシに対象ユーザー情報があった場合、リスト内のアドレスにメールが送られる

    //メール内容
    //const recipient = "haradatakayuki7@gmail.com" // 宛先
    const subject = `${currentYear}年(${currentJapanYear})${now.getMonth() + 1}月${now.getDate()}日支給分 給与明細 が発行されました | 株式会社リビコー` //件名
    const body = `株式会社リビコー
${targetUserInfo.name}様

${currentYear}年(${currentJapanYear})${now.getMonth() + 1}月${now.getDate()}日支給分 給与明細 をお送りいたします。


添付ファイルよりご確認ください。
`
    const options = {
      cc: '', //ccアドレス
      bcc: 'haradatakayuki7@gmail.com', //bccアドレス
      attachments: blob
    }
    GmailApp.sendEmail(recipient, subject, body, options)

  } else {
    // 何かしらエラー発生時
    //メール内容
    //const recipient = "haradatakayuki7@gmail.com" // 宛先
    const subject = "給与明細送信エラーが発生しました | 株式会社リビコー" //件名
    const body = `
    ${targetUserInfo.name} 様の給与明細が送信できませんでした。

    - 原因として、取り込んだCSVデータからスプレッドシートに値をコピーする工程でエンコードに失敗してしまいユーザー名などの値が正常に取得できていない可能性があります

    ` //本文
    const options = {
      cc: '', //ccアドレス
      bcc: '', //bccアドレス
      attachments: blob
    }
    GmailApp.sendEmail(recipient, subject, body, options)

  }

}
