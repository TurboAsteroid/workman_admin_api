let express = require('express')
let helper = require('../helpers/helper')
let axios = require('axios')
let router = express.Router()
let iconv = require('iconv-lite')
const dbMS = require('../helpers/dbMS')

router.get('/education/', async function (req, res, next) {
  let result = await dbMS.q(`SELECT TOP (@limit) TABN FROM TestUp.spline.OpCard where CARD = @card`, { 'limit': 1, 'card': req.query.card })
  let tabn = result[0].TABN
  try {
    let jsonResult = await axios.get('https://elem-pre.elem.ru/spline/api/education?tabn=' + tabn)
    res.json({
      status: 1,
      data: jsonResult.data || []
    })
  } catch (error) {
    console.log(error)
    res.json({
      status: 0,
      message: 'Не удалось получить информацию по обучению'
    })
  }
})

function kvitokHead (jsonResult, tabn) {
  return `
      <div>${jsonResult.data[0].company.name}</div>
      <div>Расчётный листок за ${jsonResult.month}.${jsonResult.year}</div>
      <div>Цех(отдел): ${jsonResult.data[0].department.name}</div>
      <div>Таб.N ${tabn}&nbsp;&nbsp;&nbsp;&nbsp;ФИО: ${jsonResult.data[0].employee.fullname}</div>
      <div>${jsonResult.data[0].rate.wage_slip_name}:${jsonResult.data[0].rate.value}&nbsp;&nbsp;&nbsp;&nbsp;${jsonResult.data[0].working_time_fund_plan.wage_slip_name}:${jsonResult.data[0].working_time_fund_plan.value}</div>
    `
}
function kvitokIncome (jsonResult) {
  let result = `<table style="FONT-SIZE:12pt" border="1" cellspacing="0" cellpadding="0" width="100%">
        <tbody>
            <tr align="center">
                <td colspan="4"><b>${jsonResult.data[0].accruals_per_month.name}</b></td>
            </tr>
            <tr align="center">
                <td>Вид</td>
                <td>Наименование</td>
                <td>Сумма</td>
                <td>Время<br>(часы,дни)</td>
            </tr>`

  for (let i in jsonResult.data[0].accruals_per_month.data) {
    if (!jsonResult.data[0].accruals_per_month.data[i][2].value) continue
    result += `<tr align="right">
                  <td>${jsonResult.data[0].accruals_per_month.data[i][0].value}</td>
                  <td>${jsonResult.data[0].accruals_per_month.data[i][1].value}</td>
                  <td>${jsonResult.data[0].accruals_per_month.data[i][2].value}</td>
                  <td>${jsonResult.data[0].accruals_per_month.data[i][3].value}</td>
               </tr>`
  }
  result += `<tr align="right">
                <td colspan="2" align="center"><b>${jsonResult.data[0].accruals_per_month.total_accrued.wage_slip_name}</b></td>
                <td colspan="2" align="center"><b></b>${jsonResult.data[0].accruals_per_month.total_accrued.value}</td></td>
             </tr>`

  if (jsonResult.data[0].other.length) {
    result += `<tr align="right">
                <td colspan="4" align="center"><b>Доходы в неденежн.форме,вычеты:</b></td>
             </tr>`
    for (let i in jsonResult.data[0].other) {
      result += `<tr align="right">
      <td>${jsonResult.data[0].other[i].сode}</td>
      <td>${jsonResult.data[0].other[i].name}</td>
      <td>${jsonResult.data[0].other[i].value}</td>
      <td></td>
    </tr>`
    }
  }
  result += `</tbody></table>`
  return result
}
function kvitokOutcome (jsonResult, showresult) {
  let result = `<table style="FONT-SIZE:12pt" border="1" cellspacing="0" cellpadding="0" width="100%">
        <tbody>
            <tr align="center">
                <td colspan="4"><b>${jsonResult.data[0].retentions_per_month.wage_slip_name}</b></td>
            </tr>
            <tr align="center">
                <td>Вид</td>
                <td>Наименование</td>
                <td>Сумма</td>
                <td>Время<br>(часы,дни)</td>
            </tr>`

  for (let i in jsonResult.data[0].retentions_per_month.data) {
    if (!jsonResult.data[0].accruals_per_month.data[i][2].value) continue
    result += `<tr align="right">
                  <td>${jsonResult.data[0].retentions_per_month.data[i][0].value}</td>
                  <td>${jsonResult.data[0].retentions_per_month.data[i][1].value}</td>
                  <td>${jsonResult.data[0].retentions_per_month.data[i][2].value}</td>
                  <td>${jsonResult.data[0].retentions_per_month.data[i][3].value}</td>
               </tr>`
  }

  result += `<tr align="right">
                  <td colspan="2" align="center"><b>${jsonResult.data[0].retentions_per_month.total_retentions.wage_slip_name}</b></td>
                  <td colspan="2" align="center"><b>${jsonResult.data[0].retentions_per_month.total_retentions.value}</b></td>
               </tr>`
  if (showresult) {
    result += `<tr align="right">
      <td colspan="4" align="center"><b>${jsonResult.data[0].payroll.wage_slip_name}: ${jsonResult.data[0].payroll.value}</b></td>
    </tr>`
  }
  result += `</tbody></table>`
  return result
}
function kvitokSum (jsonResult) {
  return `<table style="FONT-SIZE:12pt" border="1" cellspacing="0" cellpadding="0" width="100%">
        <tbody>
            <tr align="center">
               <td><b>${jsonResult.data[0].taxes[0][0].name}</b></td>
               <td><b>${jsonResult.data[0].taxes[0][1].name}</b></td>
            </tr>
            <tr align="right">
               <td>${jsonResult.data[0].taxes[0][0].value}</td>
               <td>${jsonResult.data[0].taxes[0][1].value}</td>
            </tr>
    </tbody></table>`
}
function kvitokinsurance (jsonResult) {
  return `<table style="FONT-SIZE:12pt" border="1" cellspacing="0" cellpadding="0" width="100%">
        <tbody>
            <tr align="center">
               <td colspan="4"><b>${jsonResult.data[0].insurance_premiums.wage_slip_name}</b></td>
            </tr>
            <tr align="right">
               <td>${jsonResult.data[0].insurance_premiums.data[0].name}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[1].name}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[2].name}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[3].name}</td>
            </tr>
            <tr align="right">
               <td>${jsonResult.data[0].insurance_premiums.data[0].value}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[1].value}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[2].value}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[3].value}</td>
            </tr>
    </tbody></table>`
}

router.get('/getHTML/:route', async function (req, res, next) {
  let url
  let result = await dbMS.q(`SELECT TOP (@limit) TABN FROM TestUp.spline.OpCard where CARD = @card`, { 'limit': 1, 'card': req.query.card })
  let tabn = result[0].TABN
  if (req.params.route === 'kvitok') {
    let jsonResult = await axios.get('https://elem-pre.elem.ru/spline/api/salary?tabn=' + tabn)
    jsonResult = jsonResult.data
    let html = '<div class="kvitok">'
    html += kvitokHead(jsonResult, tabn) + '<br />'
    html += `<table border="0" cellspacing="0" cellpadding="0" width="100%" style="border: 1px solid;"><tr>
        <td valign="top">${kvitokIncome(jsonResult)}</td>
        <td valign="top">${kvitokOutcome(jsonResult)}</td>
    </tr><tr align="right">
      <td colspan="2" align="center" style="FONT-SIZE:12pt;border: 1px solid black;"><b>${jsonResult.data[0].payroll.wage_slip_name}: ${jsonResult.data[0].payroll.value}</b></td>
    </tr></table><br />`
    html += kvitokSum(jsonResult) + '<br />'
    html += kvitokinsurance(jsonResult)

    return res.send(html)
  } else if (req.params.route === 'siz') {
    url = `https://elem-pre.elem.ru/spline/TestSpOde`
    let jsonResult = await axios.post(url, {
      TABN: '110' + tabn,
      opr: 'SETSPOD'
    })

    let html = `
        <table class="tableBorder" border=1>
            <tr id="tbr_spnpol"><th id="WGBEZ">Наименование<br>спецсредств</th><th id="QUOM">Ед.<br>изм.</th><th id="QUOTA">Кол-во<br>на год</th><th id="AQUANT">Кол-во<br>на складе</th></tr>
            ${jsonResult.data.spnpol}
        </table><br /><table border=1 class="tableBorder" >
            <tr id="tbr_sppol"><th id="DESCRIPT">Наименование<br>спецсредств</th><th id="AUOM">Ед.<br>изм.</th><th id="AQUANT">Кол-<br>во</th><th id="AKTIV">Дата<br>получ.</th><th id="DEAKTIV">Дата<br>очередн.<br>получ.</th><th id="PERCENTWEAR">%<br>износ</th></tr>
            ${jsonResult.data.sppol}
        </table><style>.tableBorder {font-size: 10pt;width: 100%;border-collapse: collapse;}.tableBorder td, .tableBorder th{padding: 3px 5px;}</style>`

    return res.send(html)
  } else if (req.params.route === 'kvitokPrint') {
    let jsonResult = await axios.get('https://elem-pre.elem.ru/spline/api/salary?tabn=' + tabn)
    jsonResult = jsonResult.data
    let html = ''
    html += kvitokHead(jsonResult, tabn) + '<br />'
    html += kvitokIncome(jsonResult) + '<br />'
    html += kvitokOutcome(jsonResult, true) + '<br />'
    html += kvitokSum(jsonResult) + '<br />'
    html += kvitokinsurance(jsonResult)
    html += '</div>'

    return res.send(html)
  } else if (req.params.route === 'control') {
    url = `http://elem-prs.elem.ru:8080/servlet/SplineTabel2012t?TABN=${tabn}&PRD=1&GOD=${(new Date()).getFullYear()}&MES=${(new Date()).getMonth() + 1}`
  } else if (req.params.route === 'eda') {
    url = `http://elem-prs.elem.ru:8080/servlet/TestPit?TABN=${tabn}`
  } else if (req.params.route === 'vocation') {
    url = `http://elem-prs.elem.ru:8080/servlet/TestOtp?TABN=${tabn}&PRD=1`
  }
  try {
    // let htmlResult = await axios.get(url)
    return res.send(`
      <iframe width=1015 height=868 src="${url}" frameBorder="0" align="left" />
    `)
  } catch (error) {
    console.log(error)
    return res.send('Ошибка получения')
  }
})
module.exports = router
