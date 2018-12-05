export const judgeLevel = (it) => {
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
            level: 2,
            code,
            name,
            type: 'county'
        };
    }
}

export default {
    judgeLevel
}