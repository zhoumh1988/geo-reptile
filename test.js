import {district} from './plugins/geo';
import fs from 'fs';
import path from 'path';

district('湖南省').then(res => {
    if (res.districts.length > 0) {
        const district = res.districts[0];
        console.log(district.name);
        const values = [district.center, district.polyline, district.adcode];
        const insertGEO = `INSERT INTO geojson_config (center, polygon, adcode) VALUES ("${values.join('","')}")`;
        fs.writeFile(path.join(__dirname, './request.log'), insertGEO, err => console.log(err));
    }
});