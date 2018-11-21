import mysql from 'mysql';
import config from '../config';
export const pool = mysql.createPool(config.mysql);
export const format = mysql.format;

/**
 * 连接池拿连接查询
 * @param {String} sql 执行的sql语句
 * @param {Function} cb 回调函数
 */
export const pool_connection = (sql, cb) => {
    pool.getConnection((conn_err, connection) => {
        if (conn_err) {
            console.error(`${sql}\n${conn_err}`);
            process.exit();
        } else {
            connection
                .query(sql, function (error, res, fields) {
                    try {
                        if (error) {
                            console.error(`${sql}\n${error}`);
                            process.exit();
                            typeof cb == 'function' && cb(false);
                        } else {
                            typeof cb == 'function' && cb(res
                                ? res
                                : {}, ...arguments);
                        }
                    } catch (e) {
                        console.error(e.message);
                    } finally {
                        connection.release();
                    }
                });
        }
    });
};

process.on('SIGINT', () => {
    console.log('Received SIGINT. Press Control-D to exit.');
    pool.end(function (err) {
        // all connections in the pool have ended
        if (err) {
            console.error(err);
        }
        console.log('已关闭所有数据库连接')
    });
});

export default {
    pool_connection,
    format,
    pool
};