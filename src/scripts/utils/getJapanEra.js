/**
 * 西暦から令和を計算する関数
 * @param {*} year 西暦
 * @returns
 */
const getJapanEra = (year) => {
  const reiwaStart = 2019 //令和元年は2019年
  const reiwaYear = year - reiwaStart + 1

  // 令和1年目は"令和元年"とする
  return reiwaYear === 1 ? '令和元年' : `令和${('0' + reiwaYear).slice(-2)}年`; // 2桁表示
}
