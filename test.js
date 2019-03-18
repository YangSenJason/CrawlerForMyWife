//有些网页不是用UTF-8编码，superagent解析出来中文会乱码
//superagent-charset可以在解析时手动指定网页编码
const charset = require('superagent-charset');
const superagent = require('superagent');
require('superagent-proxy')(superagent);
const request = charset(superagent);
const cheerio = require('cheerio');
const fs = require('fs');

//設置代理，在host前面加上賬號密碼，如：xxxx:xxxx@
const proxy = `http://eproxy.sz.intech:3128`;

//设置省份代码与对应名称
const provinceCode = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10'
                    , 'a11', 'a12', 'a13', 'a14', 'a15', 'a16', 'a17', 'a18', 'a19', 'a20'
                    , 'a21', 'a22', 'a23', 'a24', 'a25', 'a26', 'a27', 'a28', 'a29', 'a30'
                    , 'a31', 'a33', 'a38'];
const provinceName = ['北京', '天津', '辽宁', '吉林', '黑龙江', '上海', '江苏', '浙江', '安徽', '福建'
                    , '山东', '湖北', '湖南', '广东', '重庆', '四川', '陕西', '甘肃', '河北', '山西'
                    , '内蒙古', '河南', '海南', '广西', '贵州', '云南', '西藏', '青海', '宁夏', '新疆'
                    , '江西', '香港', '澳门'];

//用于生成文件的根目录
const rootPath = './college';

//ES6语法，防止回调陷阱
async function init(){
    for(let j = 0; j < provinceCode.length; j++){
        var path = `${rootPath}/${provinceName[j]}.txt`;
        //若文件存在则删除文件
        await unlinkPath(path);
        //新建一个用于存放大学名称的数组
        let arr = [];
        //默认爬取各省份前5页的数据
        for(let i = 1; i <= 5;i++ ){
            const url = `http://college.gaokao.com/schlist/${provinceCode[j]}/p${i}`;

            //等待该页面所有名称都写入文件后在循环下一个页面
            await getName(url, j, arr);
        }
        console.log(arr.length);
    }
}
init();

//删除文件
function unlinkPath(path){
    return new Promise(function(resolve, reject){
        if(fs.existsSync(path)){
            fs.unlink(path, function(err){
                if(err) reject(err);
                else resolve();
            });
        }else{
            resolve();
        }
    });
}

function getName(url, provinceIdx, arr){
    return new Promise(function(resolve, reject){
        request.get(url).charset('gbk').proxy(proxy).end(function(err, res) {
            if (err) {
                console.log(err);
                return false;
            }
            let $ = cheerio.load(res.text);
            //找到定义列表
            let a = $("#wrapper .cont_l .scores_List dl");
            a.each(function(i,item){
                //定义列表中的项目，即大学名称
                let name = $(item).find("dt").find("strong").attr("title").trim();
                //定义列表中的项目描述，即985或211
                let special = $(item).find("dd").find("ul").find("li").eq(1).find("span");
                //定义列表中的项目描述，即高校性质
                let property = $(item).find("dd").find("ul").find("li").eq(4).text();
                special.each(function(j, obj){
                    name += "-" + $(obj).text().trim();
                });
                name += "-" + property.slice(5);
                //该网站大学名称重复太多，用于去重
                if(arr.join(",").indexOf(name) == -1){
                    arr.push(name);
                    console.log(name);
                    let path = `${rootPath}/${provinceName[provinceIdx]}.txt`;
                    let text = name;
                    //获取到第二个名称时开始换行
                    if(arr.length > 1) text = `\r\n${name}`;

                    //将文本内容或数据添加到文件
                    fs.appendFile(path, text, function(err){
                        if(err) console.log(err);
                    });
                }
            })
            resolve();
        });
    });
}
