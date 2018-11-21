import {pool_connection, format} from './plugins/DB';

const loop = (i, idArr) => {
    if (i < idArr.length) {
        const id = idArr[i].id;
        pool_connection(format(`SELECT polygon, geojson, p.Name AS name FROM geojson_config AS c LEFT JOIN province_city_config AS p ON c.id = p.Id WHERE c.id = ?`, [id]), res => {
            try {
                const polygon = String(res[0].polygon);
                const geojson = {
                    "type": "Feature",
                    "properties": {
                        "name": encodeURIComponent(String(res[0].name))
                    },
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            polygon
                                .split("|")
                                .map(p => p.split(';').map(it => it.split(',').map(lnglat => parseFloat(lnglat))))
                        ]
                    }
                };
                pool_connection(format(`UPDATE geojson_config SET geojson = ? WHERE id = ?`, [
                    JSON.stringify(geojson),
                    id
                ]), () => {
                    loop(++i, idArr);
                });
            } catch (e) {
                console.error("id:", id, e);
                process.exit();
            }
        });
    } else {
        console.log('转换结束');
        process.exit();
    }
}

const start = () => {
    pool_connection(`SELECT id FROM geojson_config`, res => {
        loop(0, res)
    });
}

start();