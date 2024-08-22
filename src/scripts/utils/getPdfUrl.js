//PDFにする範囲を指定してURLを生成する
const getPdfUrl = (ssId, sheetId, startRange, endRange, size, portrait) => {
  const url = 'https://docs.google.com/spreadsheets/d/' + ssId + '/export?'

  // PDF出力のオプションを設定
  const options = 'exportFormat=pdf&format=pdf'
    + '&gid=' + sheetId       //PDFにするシートの「シートID」
    + '&portrait=' + portrait //用紙の向き true(縦) or false(横)
    + '&size=' + size         //印刷サイズ
    + "&fitw=true"            //ページ幅を用紙にフィットさせるか true(フィットさせる) / false(原寸大)
    + '&range=' + startRange + '%3A' + endRange   //セル範囲を指定 %3A はコロン(:)を表す
    + '&top_margin=0.50'      //上の余白
    + '&right_margin=0.50'    //右の余白
    + '&bottom_margin=0.50'   //下の余白
    + '&left_margin=0.50'     //左の余白
    + '&gridlines=false'      //グリッドラインの表示有無
    + '&sheetnames=false'     //シート名の表示有無
    + '&printtitle=false'     //スプレッドシート名の表示有無
    + '&pagenum=UNDEFINED'    //ページ番号をどこに入れるか
    + '&scale=4'              //1= 標準100%, 2= 幅に合わせるcopyDataToNewSpreadsheet, 3= 高さに合わせる,  4= ページに合わせる
    + '&horizontal_alignment=CENTER'//水平方向の位置
    + '&vertical_alignment=CENTER'//垂直方向の位置
    + '&fzr=false'            //固定行の表示有無
    + '&fzc=false'            //固定列の表示有無

  const requestUrl = url + options
  return requestUrl
}
