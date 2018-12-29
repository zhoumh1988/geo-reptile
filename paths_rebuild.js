import fs from 'fs';
import path from 'path';

const rewrite = ({
    proid,
    cyid,
    filepath
}) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, buf) => {
            const json = JSON.parse(String(buf));
            json.map(it => {
                it.proid = proid;
                it.cyid = cyid;
                return it;
            });
            fs.writeFile(filepath, JSON.stringify(json), () => {
                resolve(1);
            })
        });
    });
}

fs.readdir(path.join(__dirname, '../paths'), (err, dirs) => {
    const promises = [];
    dirs.forEach(proid => {
        const file_list = fs.readdirSync(path.join(__dirname, '../paths/' + proid));
        file_list.forEach(file => {
            const cyid = file.split('.')[0];
            promises.push(rewrite({
                proid,
                cyid,
                filepath: path.join(__dirname, '../paths', '/', proid, '/', file)
            }))
        });
    });
    Promise.all(promises).then(() => {
        process.exit();
    })
});