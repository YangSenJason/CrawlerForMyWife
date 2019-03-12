/**
 * wechaty中文文档 https://docs.chatie.io/v/zh
 */
const { Wechaty } = require('wechaty')
const Qrcode = require('qrcode-terminal')
const schedule = require('node-schedule')
const superagent = require('superagent')
// require('superagent-proxy')(superagent)
const cheerio = require('cheerio')

const bot = new Wechaty()
const proxy = `http://eproxy.sz.intech:3128`


function scan(qrcode){
    Qrcode.generate(qrcode)
    let ewm = ['https://api.qrserver.com/v1/create-qr-code/?data=',encodeURIComponent(qrcode),'&size=220x220&margin=20',].join('')
    console.log(ewm)
}
async function sendmes(){
    let str1 = await get_songs()
    let str2 = await get_weather()
    let str3 = await getOneData()
    let dt = getCurrentTime()
    let str = `${dt}<br/>${str2}<br/><br/>${str1}<br/><br/>${str3}<br/><br/>晚安 好梦~`
    console.log(str)
    let nickname = '星星'//设置要发送的收信人的微信昵称
    let contact = await bot.Contact.find({name:nickname})
    await contact.say(str)
}
// 获取ONE内容
function getCurrentTime(){
    var dtCur = new Date();
    var initDay = new Date("2017/1/19");
    var lastDay = Math.floor((dtCur - initDay) / 1000 / 60 / 60 / 24);
    var yearCur = dtCur.getFullYear();
    var monCur = dtCur.getMonth() + 1;
    var dayCur = dtCur.getDate();
    var hCur = dtCur.getHours();
    var mCur = dtCur.getMinutes();
    var sCur = dtCur.getSeconds();
    var timeCur = yearCur + "年" + (monCur < 10 ? "" + monCur : monCur) + "月"
            + (dayCur < 10 ? "" + dayCur : dayCur) + "日 " + (hCur < 10 ? "0" + hCur : hCur)
            + ":" + (mCur < 10 ? "0" + mCur : mCur) + ":" + (sCur < 10 ? "0" + sCur : sCur);
    var timeStr = `${timeCur}<br/>今天是我們結婚的第${lastDay}天`;
    return timeStr;
}
function getOneData(){
    return new Promise(function(resolve,reject){
        superagent.get("http://wufazhuce.com/").end(function(err, res) {
            if (err) {
                reject(err);
            }
            let $ = cheerio.load(res.text);
            let selectItem = $("#carousel-one .carousel-inner .item");
            let todayOne = selectItem[0];
            let todayOneData = {
              imgUrl: $(todayOne)
                .find(".fp-one-imagen")
                .attr("src"),
              type: $(todayOne)
                .find(".fp-one-imagen-footer")
                .text()
                .replace(/(^\s*)|(\s*$)/g, ""),
              text: $(todayOne)
                .find(".fp-one-cita")
                .text()
                .replace(/(^\s*)|(\s*$)/g, "")
            };
            resolve(todayOneData.text)
          });
    })
}
function get_songs(){
    return new Promise((resolve,reject) => {
        let page = Math.floor(Math.random()*5)+1
        superagent.get(`https://so.gushiwen.org/mingju/default.aspx?p=${page}&c=%E6%8A%92%E6%83%85&t=%E7%88%B1%E6%83%85`).end((err,pres)=>{
            let $ = cheerio.load(pres.text)
            let item_array = [].slice.apply($('.sons .cont'))
            let item_index = Math.floor(Math.random()*item_array.length)
            let songs = `${$(item_array).eq(item_index).find('a').eq(0).text()} —— ${$(item_array).eq(item_index).find('a').eq(1).text()}`
            // console.log(songs)
            resolve(songs)
        })
    })
}
function get_weather(){
    return new Promise((resolve,reject)=>{
        superagent.get(`https://tianqi.moji.com/weather/china/guangdong/shenzhen`).end((err,pres)=>{
            let $ = cheerio.load(pres.text)
            let weatherTip = "";
            $(".wea_tips").each(function(i, elem) {
                weatherTip = $(elem)
                  .find("em")
                  .text();
            });
            let tomorrow_item = $('.forecast .days').eq(1)
            let weather = $(tomorrow_item).find('li').eq(1).text().trim()
            let tem = $(tomorrow_item).find('li').eq(2).text().trim()
            let air = $(tomorrow_item).find('li').eq(4).text().trim()
            let weather_str = `${weatherTip}<br/><br/>明日天气：${weather}<br/>温度：${tem}<br/>空气质量:${air}`
            // console.log(weather_str)
            resolve(weather_str)
        })
    })
}

bot.on('scan',    (qrcode, status) => {scan(qrcode)})
bot.on('login',   user => { 
    console.log(`User ${user} logined`)
    var rule1     = new schedule.RecurrenceRule();  
    var times1    = [1,6,11,16,21,26,31,36,41,46,51,56];  
    rule1.minute  = times1;  
    schedule.scheduleJob(rule1, function(){
        sendmes()   
    });
})
bot.start()