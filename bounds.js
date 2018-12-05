import {
    pool_connection,
    format
} from './plugins/DB';
import fs from 'fs';
import path from 'path';

const sqls = [];

const loop = (i, idArr) => {
    if (i < idArr.length) {
        const id = idArr[i].id;
        pool_connection(format(`SELECT polygon, geojson, p.Name AS name FROM geojson_config AS c LEFT JOIN province_city_config AS p ON c.id = p.Id WHERE c.id = ?`, [id]), res => {
            try {
                const polygon = String(res[0].polygon);
                let bounds = {
                    westNorth: [0, 0], // 左上角
                    eastSouth: [0, 0] // 右下角
                };
                polygon.split("|").map(p => p.split(';').map((it, idx) => {
                    if (idx == 0) {
                        const lnglat = it.split(',').map(it => parseFloat(it));
                        bounds.westNorth = lnglat
                        bounds.eastSouth = lnglat
                    } else {
                        const [lng, lat] = it.split(',').map(it => parseFloat(it));
                        if (lng < bounds.westNorth[0]) bounds.westNorth[0] = lng;
                        if (lng > bounds.eastSouth[0]) bounds.eastSouth[0] = lng;

                        if (lat > bounds.westNorth[1]) bounds.westNorth[1] = lat;
                        if (lat < bounds.eastSouth[1]) bounds.eastSouth[1] = lat;
                    }
                }));
                bounds = bounds.westNorth.join(',') + ';' + bounds.eastSouth.join(',');
                sqls.push(format(`UPDATE geojson_config SET bounds = ? WHERE id = ?;`, [bounds, id]));
                loop(++i, idArr);
            } catch (e) {
                console.error("id:", id, e);
                process.exit();
            }
        });
    } else {
        console.log('转换结束');
        sqls.unshift('SET FOREIGN_KEY_CHECKS = 0;');
        sqls.push('COMMIT;');
        sqls.push('SET FOREIGN_KEY_CHECKS = 1;');
        fs.writeFile(path.join(__dirname, '../update_bounds.sql'), sqls.join('\n'), () => {
            console.log('读写结束');
            process.exit();
        });
    }
}

const start = () => {
    pool_connection(`SELECT id FROM geojson_config`, res => {
        loop(0, res)
    });
}

start();