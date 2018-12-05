import path from 'path';
import fs from 'fs';
import {pool_connection, format} from './plugins/DB';
import {districtGD, getBounds} from './plugins/geo';
import {convert2Echarts} from './plugins/convert';

const xzqhJson = {};

/**
 * 插入数据库
 * @param {JSON} district
 * @param {JSON} district_geo
 * @param {Function} cb
 */
const insert = ({
    code,
    name,
    level,
    pid
}, cb) => {
    /* 插入行政区域常规数据 */
    let sql = `
INSERT INTO 
    district 
    (code, name, level, pid) VALUES (?,?,?,?) 
ON DUPLICATE KEY 
UPDATE name = ?, level = ?, pid = ?`;
    pool_connection(format(sql, [
        code,
        name,
        level,
        pid,
        name,
        level,
        pid
    ]), () => getGeoData(code, cb));
}

const insertGeo = ({
    code,
    center,
    bounds,
    polygon,
    geojson,
    geojson_echarts
}, cb) => {
    /* 插入geo数据 */
    const sql = `
    INSERT INTO 
        district_geo 
        (code, center, bounds, polygon, geojson, geojson_echarts) VALUES (?,?,?,?,?,?)
    ON DUPLICATE KEY 
    UPDATE center = ?, bounds = ?, polygon = ?, geojson = ?, geojson_echarts = ?`;
    pool_connection(format(sql, [
        code,
        center,
        bounds,
        polygon,
        geojson,
        geojson_echarts,
        center,
        bounds,
        polygon,
        geojson,
        geojson_echarts
    ]), () => cb());
}

const loop = (arr, cb, i = 0) => {
    if (i < arr.length) {
        let {code, level, pid, proid, name} = arr[i];
        pid = pid === 0
            ? pid
            : xzqhJson[pid]
                ? xzqhJson[pid].code
                : xzqhJson[proid].code
        insert({
            code,
            name,
            level,
            pid
        }, () => loop(arr, cb, ++i));
    } else {
        console.log(`执行了${i}条记录`);
        cb();
    }
}

const getGeoData = (code, cb) => {
    districtGD(code).then(res => {
        if (res.districts.length === 0) {
            console.log(`查询行政区域${code} : Not found`);
            cb();
        } else {
            const {center, polyline} = res.districts[0];
            const polygon = polyline
                .split("|")
                .map(p => p.split(';').map(it => it.split(',').map(lnglat => parseFloat(lnglat))));
            const geojson = {
                "type": "Feature",
                "properties": {
                    "name": code,
                    "childNum": polygon.length
                },
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": [polygon]
                }
            };
            const geojson_echarts = convert2Echarts({
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "name": code,
                            "childNum": polygon.length
                        },
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": [
                                polyline
                                    .split("|")
                                    .map(p => p.split(';').map(it => it.split(',').map(lnglat => parseFloat(lnglat))))
                            ]
                        }
                    }
                ],
                "UTF8Encoding": true
            }).features[0];
            insertGeo({
                code,
                center,
                bounds: getBounds(polyline)
                    .map(it => it.join(','))
                    .join(';'),
                polygon: polyline,
                geojson: JSON.stringify(geojson),
                geojson_echarts: JSON.stringify(geojson_echarts)
            }, cb)
        }
    });
}

const start = () => {
    fs.readFile(path.join(__dirname, './config/xzqhArr.json'), 'utf-8', (err, buffer) => {
        if (err) {
            console.error(err);
        } else {
            const xzqhArr = JSON.parse(String(buffer));
            console.log(`开始 总共${xzqhArr.length}条记录`);
            xzqhArr.forEach(it => xzqhJson[it.id] = it);
            loop(xzqhArr, () => process.exit());
        }
    })
}

start();