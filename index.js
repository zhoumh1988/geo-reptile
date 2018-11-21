import path from 'path';
import fs from 'fs';
import {pool_connection, format} from './plugins/DB';
import {district} from './plugins/geo';
import {convert2Echarts} from './plugins/convert'

let finished = 0;
const getGeoData = (geoname, configId, cb) => {
    district(geoname).then(district => {
        if (district === null) {
            console.log(`查询行政区域${geoname}: Not found`);
            cb();
        } else {
            const polygon = district
                .geometry
                .coordinates[0][0]
                .map(it => it.join(','))
                .join(';');
            // const geoJSON = convert2Echarts({"type": "FeatureCollection", "features":
            // [district], "UTF8Encoding": true}).features[0];
            const geoJSON = district;
            geoJSON.properties.name = encodeURIComponent(geoJSON.properties.name);
            delete geoJSON.properties['省代码'];
            const values = [
                polygon, JSON.stringify(geoJSON),
                parseInt(configId, 10)
            ];
            const insertGEO = `UPDATE geojson_config SET polygon = ?, geojson = ? WHERE id = ?`;

            pool_connection(format(insertGEO, values), res => {
                // console.log(`插入行政区域${geoname}: Success`);
                cb();
            });
        }
    });
}

const loop = (i, configs) => {
    if (i < configs.length) {
        const values = configs[i].split('|');
        if (values[1] === '1') {
            const name = values[0];
            // 非国外和地理划分
            getGeoData(name, values[2], () => loop(++i, configs));
        } else {
            loop(++i, configs);
        }
    } else {
        console.log('结束');
        process.exit();
    }
};

const start = () => {
    fs.readFile(path.join(__dirname, './config/province_city_config.txt'), 'utf-8', (err, buffer) => {
        if (err) {
            console.error(err);
        } else {
            const configs = buffer.split("\n");
            // loop(0, configs);
            configs.forEach(it => {
                const values = it.split('|');
                const Abbr = values[1] === '2'
                    ? values[0]
                        .replace('省', '')
                        .replace('市', '')
                        .replace('地区', '市')
                    : values[0];
                values.push(values[2]);
                values.push(Abbr);
                const insert = `INSERT INTO province_city_config (Name, Type, Id, Superior, Brand, Value, Abbr) VALUES ("${values.join('","')}")`;
                pool_connection(insert, res => {
                    finished++;
                    if (res.insertId <= 0) {
                        console.log(`${finished}:insert
            fail ${it}: ${res}`);
                    }
                    if (finished === configs.length) {
                        console.log('录入结束，开始抓取geo信息');
                        finished = 0;
                        process.exit();
                        // loop(0, configs);
                    }
                });
            });
        }
    })
}
console.log('开始');
start();