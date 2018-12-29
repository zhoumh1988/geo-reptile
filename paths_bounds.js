import fs from 'fs';
import path from 'path';
import {
    bounds
} from './plugins/geo'

const rewrite = ({
    filepath
}) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, buf) => {
            try {
                if(String(buf).length === 0) {
                    console.log(filepath);
                    resolve(0);
                } else {
                    const json = JSON.parse(String(buf));
                    if(!Array.isArray(json)) {
                        resolve(1);
                    } else {
                        let path = [];
                        json.forEach(it => {
                            path = path.concat(it.bounds);
                        });
                        const area = {
                            bounds: bounds(path),
                            areas: json
                        }
                        fs.writeFile(filepath, JSON.stringify(area), () => {
                            resolve(1);
                        });
                    }
                }
            } catch (e) {
                console.log(e);
                console.log(String(buf).length)
                console.log(filepath);
                process.exit();
            }
        });
    });
}

fs.readdir(path.join(__dirname, '../paths'), (err, dirs) => {
    const promises = [];
    dirs.forEach(proid => {
        const file_list = fs.readdirSync(path.join(__dirname, '../paths/' + proid));
        file_list.forEach(file => {
            promises.push(rewrite({
                filepath: path.join(__dirname, '../paths', '/', proid, '/', file)
            }))
        });
    });
    Promise.all(promises).then(() => {
        process.exit();
    })
});