/**
 * 特定の列のデータ取得関数（任意の列の従業員データを「取締役」「従業員」のいずれかのブロックで取得。従業員データの範囲はA列の社員コードの有無で判定）
 * @param {*} sheet ベースとなるシート
 * @param {string} positionName 「取締役」ブロックのメンバーデータor「従業員」ブロックのメンバーデータどちらを取得するか
 * @param {string} itemName データを取得したい項目名。項目名以下の列でA列の従業員コードがある行を開始点とし、従業員コードの値がない行までを終了点とします。
 * @returns
 */
const getSpecifiedColData = (sheet, positionName, itemName) => {
  // 役職名の入ってるセルを検索（役職名セルがない場合は項目名のあるセルを取得）
  const targetNameCell = sheet.createTextFinder(positionName).matchEntireCell(true).findNext() || sheet.createTextFinder('社員コード').matchEntireCell(true).findNext()
  const targetRowNum = targetNameCell.getRow()

  let startRow = targetRowNum + 1 // 役職名のあるセルの次の行を開始行候補に設定

  // 役職名のあるセル以下のA列（社員コード）の値で取得データ範囲を決めるので、行番号を判定するためにA列の値をすべて取得
  const col_A_values = sheet.getRange(startRow, 1, sheet.getMaxRows() - startRow + 1).getValues()

  // 役職名以下のA列で最初に値がある行を特定し、開始点にセット
  const firstValCol_A = col_A_values.findIndex(row => row[0] !== "")
  if(firstValCol_A === -1) return null
  startRow += firstValCol_A

  // セットした開始点から次に空欄セルが現れるまでの行数をカウント
  const endValCol_A = col_A_values.slice(firstValCol_A).findIndex(row => row[0] === "")

  // 取得したい列のタイトルを検索
  const targetCell = sheet.createTextFinder(itemName).matchEntireCell(true).findNext()
  if(!targetCell) return null
  const targetColNum = targetCell.getColumn()

  const specifiedColData = sheet.getRange(startRow, targetColNum, endValCol_A, 1).getValues().flat()

  return specifiedColData
}
