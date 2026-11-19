const { post, wxLogin } = require('../../utils/api');

// 网页登录确认页：只能通过网页上的小程序码进入，scene 里带着登录票据
Page({
    data: {
        // loading 加载中 / ready 待确认 / submitting 提交中 / done 已登录 / cancelled 已取消 / expired 已失效 / error 出错 / invalid 不是扫码进入
        viewState: 'loading',
        errorText: '',
    },

    onLoad(query) {
        const scene = query && query.scene ? decodeURIComponent(query.scene) : '';
        if (!/^[0-9a-f]{24}$/.test(scene)) {
            this.setData({ viewState: 'invalid' });
            return;
        }
        this.ticket = scene;
        this.markScanned();
    },

    markScanned() {
        this.setData({ viewState: 'loading' });
        post('/api/mp/login/scan', { ticket: this.ticket })
            .then((res) => {
                if (res.status === 'pending' || res.status === 'scanned') {
                    this.setData({ viewState: 'ready' });
                } else if (res.status === 'confirmed') {
                    this.setData({ viewState: 'done' });
                } else {
                    this.setData({ viewState: 'expired' });
                }
            })
            .catch((err) => {
                this.setData({ viewState: 'error', errorText: err.message });
            });
    },

    handleConfirm() {
        if (this.data.viewState !== 'ready') {
            return;
        }
        this.setData({ viewState: 'submitting' });
        wxLogin()
            .then((code) => post('/api/mp/login/confirm', { ticket: this.ticket, code: code }))
            .then((res) => {
                if (res.status === 'confirmed') {
                    this.setData({ viewState: 'done' });
                } else if (res.status === 'cancelled') {
                    this.setData({ viewState: 'cancelled' });
                } else {
                    this.setData({ viewState: 'expired' });
                }
            })
            .catch((err) => {
                this.setData({ viewState: 'error', errorText: err.message });
            });
    },

    handleCancel() {
        post('/api/mp/login/cancel', { ticket: this.ticket }).catch(() => {});
        this.setData({ viewState: 'cancelled' });
    },

    handleRetry() {
        this.markScanned();
    },

    goHome() {
        wx.redirectTo({ url: '/pages/index/index' });
    },
});
