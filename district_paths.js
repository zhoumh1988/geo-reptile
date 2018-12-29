import fs from 'fs'
import path from 'path'
import {
    districtGD,
    getBounds
} from './plugins/geo';
import {
    pool_connection,
    format
} from './plugins/DB';

let sum = 0;
let proid = 0;
let cyid = 0

/**
 * 根据城市名称获取城市Id
 * @param {String} areaName 
 */
const getAreaId = (areaName) => {
    return new Promise((resolve) => {
        const query = `SELECT Id FROM province_city_config WHERE Name = ?`;
        pool_connection(format(query, [areaName]), res => {
            if (res.length === 0) console.log(areaName);
            resolve(res[0] ? res[0].Id : null);
        })
    })
}

/**
 * 从高德获取围栏信息
 * @param {JSONObject} area 
 */
const getGeoData = ({
    code,
    name
}) => {
    return new Promise((resolve, reject) => {
        districtGD(code).then(res => {
            if (res.districts.length === 0) {
                console.log(`查询行政区域${name} ${code}: Not found`);
                resolve({});
            } else {
                const district = res.districts[0];
                resolve({
                    name: name,
                    code: code,
                    proid,
                    cyid,
                    bounds: getBounds(district.polyline),
                    paths: district.polyline.split("|")
                        .map(p => p.split(';').map(it => it.split(',').map(lnglat => parseFloat(lnglat))))
                });
            }
        });
    })
}

const loopCity = (children, features, finish, i = 0) => {
    if (i < children.length) {
        const child = children[i];
        // loopCity(children, features, finish, ++i);
        sum++;
        getGeoData(child).then(res => {
            features.push(res);
            setTimeout(() => {
                loopCity(children, features, finish, ++i);
            }, 50);
        });
    } else {
        finish(features);
    }
}

const loopProChildren = (children, proDir, finish, i = 0) => {
    if (i < children.length) {
        const city = children[i];
        getAreaId(city.name).then(cityId => {
            if (!cityId) {
                loopProChildren(children, proDir, finish, ++i);
            } else {
                cyid = cityId;
                loopCity(city.children, [], features => {
                    console.log(`${city.name} finished`);
                    fs.writeFile(path.join(proDir, `./${cityId}.json`), JSON.stringify(features), () => {
                        loopProChildren(children, proDir, finish, ++i);
                    });
                })
            }
        });
    } else {
        finish();
    }
}

const loopPro = (pros, i = 0) => {
    if (i < pros.length) {
        const pro = pros[i];
        getAreaId(pro.name).then(proId => {
            const proDir = path.join(__dirname, `../paths/${proId}`);
            if (!fs.existsSync(proDir)) {
                fs.mkdirSync(proDir);
            }
            if (pro.children === 0) {
                loopPro(pros, ++i);
            } else {
                proid = proId;
                loopProChildren(pro.children, proDir, () => {
                    loopPro(pros, ++i);
                });
            }
        });
    } else {
        console.log(sum);
        process.exit();
    }
}

fs.readFile(path.join(__dirname, './xzqhTree.json'), (err, buf) => {
    if (err) {
        console.error(err);
        process.exit();
    }
    const xzqhTree = JSON.parse(String(buf));
    loopPro(xzqhTree);
    // process.exit();
});