import fs from 'fs'
import path from 'path'

const judgeLevel = (code) => {
    if (String(code).endsWith('0000')) {
        return {
            id: code.substring(0, 2),
            pid: 0,
            level: 0,
            type: 'province',
            children: {}
        };
    } else if (String(code).endsWith('00')) {
        return {
            id: code.substring(0, 4),
            pid: code.substring(0, 2),
            level: 1,
            type: 'city',
            children: {}
        };
    } else {
        return {
            id: code,
            pid: code.substring(0, 4),
            pro: code.substring(0, 2),
            level: 2,
            type: 'county'
        };
    }
}

fs.readFile(path.join(__dirname, './config/xzqh.txt'), (err, buf) => {
    const xzqh = {};
    const areas = String(buf).split('\n');
    areas.forEach(it => {
        const arr = it.split(":");
        const child = judgeLevel(arr[0]);
        child.code = arr[0];
        child.name = arr[1];
        if (child.level === 0) {
            xzqh[child.id] = child
        } else if (child.level === 1) {
            const pro = xzqh[child.pid];
            pro.children[child.id] = child
        } else {
            const pro = xzqh[child.pro];
            if (!pro.children[child.pid]) {
                delete child.children;
                delete child.pro;
                pro.children[child.id] = child;
            } else {
                const city = pro.children[child.pid];
                city.children = city.children;
                delete child.children;
                delete child.pro;
                city.children[child.id] = child
            }
        }
    });

    fs.writeFile(path.join(__dirname, '../xzqh.json'), JSON.stringify(xzqh), err => process.exit());
});