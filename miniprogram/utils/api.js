// 后端接口。域名需要在小程序后台「开发管理 → 服务器域名 → request 合法域名」里配置
const BASE = 'https://run.zhonghcc.com';

function post(path, data) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: BASE + path,
            method: 'POST',
            data: data,
            header: { 'Content-Type': 'application/json' },
            timeout: 10000,
            success(res) {
                const body = res.data || {};
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(body);
                } else {
                    reject(new Error(body.error || ('请求失败（' + res.statusCode + '）')));
                }
            },
            fail() {
                reject(new Error('网络不太顺畅，请稍后再试'));
            },
        });
    });
}

function wxLogin() {
    return new Promise((resolve, reject) => {
        wx.login({
            success(res) {
                if (res.code) {
                    resolve(res.code);
                } else {
                    reject(new Error('微信登录失败，请重试'));
                }
            },
            fail() {
                reject(new Error('微信登录失败，请重试'));
            },
        });
    });
}

module.exports = { post, wxLogin, BASE };
