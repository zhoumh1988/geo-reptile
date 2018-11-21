import {KEY} from '../config';
import request from 'request';
const BASEURL = `https://restapi.amap.com/v3/config/district?${ [
    `key=${KEY}`, // 服务Key
    "subdistrict=0", // 子级行政区 0：不返回下级行政区；1：返回下一级行政区；2：返回下两级行政区；3：返回下三级行政区；
    "extensions=all", // 返回结果控制 base:不返回行政区边界坐标点；all:只返回当前查询district的边界值，不返回子节点的边界值
    "output=json", //返回数据格式类型 可选值：JSON，XML
].join('&')}`;
export const districtGD = (keywords) => {
    return new Promise((resolve, reject) => {
        const url = `${BASEURL}&keywords=` + encodeURIComponent(keywords);
        request.get(url, {}, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                const res = JSON.parse(body);
                if (res.status === '1') {
                    resolve(res);
                } else {
                    reject(res);
                }
            }
        })
    }).catch(err => {
        console.error(err);
    });
}

const shi = require('./shi.json');
const features = shi.features;

export const district = (keywords) => {
    return new Promise((resolve, reject) => {
        features.forEach(area => {
            if (keywords.indexOf(area.properties.name) !== -1) {
                resolve(area);
            }
        });
        resolve(null);
    }).catch(err => {
        console.error(err);
    })
}

export default {
    district
}