import path from 'path';
import fs from 'fs';
import {pool_connection, format} from './plugins/DB';
import {districtGD} from './plugins/geo';
import {convert2Echarts} from './plugins/convert'

const getGeoData = (geoname, configId, cb) => {
    districtGD(geoname).then(res => {
        if (res.districts.length > 0) {
            const district = res.districts[0];
            let geoJSON = district
                .polyline
                .split("|")
                .map(p => [
                    p
                        .split(';')
                        .map(it => it.split(',').map(lnglat => parseFloat(lnglat)))
                ]);
            geoJSON = convert2Echarts({
                "type": "FeatureCollection",
                "features": [
                    {

                        "type": "Feature",
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": [...geoJSON]
                        },
                        "properties": {
                            "name": encodeURIComponent(geoname),
                            "childNum": geoJSON.length
                        }
                    }
                ],
                "UTF8Encoding": true
            });
            const values = [
                configId,
                configId,
                district.center,
                district.polyline,
                district.adcode,
                JSON.stringify(geoJSON.features[0])
            ];
            const sql = `INSERT INTO geojson_config (id, config_id, center, polygon, adcode, geojson) VALUES (?,?,?,?,?,?)`;
            pool_connection(format(sql, values), res => {
                console.log(`查询行政区域${geoname}: Success`);
                cb();
            });
        } else {
            console.log(`查询行政区域${geoname}: Not found`);
            cb();
        }
    });
}

const loop = (i, configs) => {
    if (i < configs.length) {
        const values = configs[i].split('|');
        if (values[1] !== '3') {
            const name = values[0].replace('地区', '市');
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
    console.log('开始');
    fs.readFile(path.join(__dirname, './config/province_city_config.txt'), 'utf-8', (err, buffer) => {
        if (err) {
            console.error(err);
        } else {
            const configs = buffer.split("\n");
            loop(0, configs);
        }
    });
}

start();