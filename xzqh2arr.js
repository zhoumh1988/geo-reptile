import fs from 'fs'
import path from 'path'

const judgeLevel = (it) => {
    const arr = it.split(":");
    const code = arr[0];
    const name = arr[1];
    if (String(code).endsWith('0000')) {
        return {
            id: code.substring(0, 2),
            pid: 0,
            level: 0,
            code,
            name,
            type: 'province'
        };
    } else if (String(code).endsWith('00')) {
        return {
            id: code.substring(0, 4),
            pid: code.substring(0, 2),
            level: 1,
            code,
            name,
            type: 'city'
        };
    } else {
        return {
            id: code,
            pid: code.substring(0, 4),
            proid: code.substring(0, 2),
            level: 2,
            code,
            name,
            type: 'county'
        };
    }
}


const recursion = (data, dataArray) => {
    dataArray.forEach(it => {
        const childrenArray = [];
        data.forEach(sub => {
            if (sub.pid === it.id) {
                childrenArray.push(sub);
            }
        });
        it.children = childrenArray;
        if (childrenArray.length > 0) {
            recursion(data, childrenArray);
        }
    });
    return dataArray;
}

const arr2tree = (data) => {
    const dataArray = [];
    data.forEach(it => {
        if (it.level === 0) {
            dataArray.push(it);
        }
    });
    return recursion(data, dataArray);
}


fs.readFile(path.join(__dirname, './config/xzqh.txt'), (err, buf) => {
    const xzqhArr = [];
    const areas = String(buf).split('\n');
    areas.forEach(it => {
        const child = judgeLevel(it);
        xzqhArr.push(child);
    });
    Promise.all([new Promise((resolve, reject) => {
        fs.writeFile(path.join(__dirname, '../xzqhArr.json'), JSON.stringify(xzqhArr), err => resolve());
    }), new Promise((resolve, reject) => {
        const xzqhTree = arr2tree(xzqhArr);
        fs.writeFile(path.join(__dirname, '../xzqhTree.json'), JSON.stringify(xzqhTree), err => resolve());
    })]).then(() => {
        process.exit();
    })
});