const sendMail = (recipient, blob) => {

  //メール内容
  //const recipient = "haradatakayuki7@gmail.com" // 宛先
  const subject = "給与明細テスト" //件名
  const body = "本文ああああああああ" //本文
  const options = {
    cc: '', //ccアドレス
    bcc: '', //bccアドレス
    attachments: blob
  }
  GmailApp.sendEmail(recipient, subject, body, options)

}
