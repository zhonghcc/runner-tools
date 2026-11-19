const { BASE } = require('../../utils/api');

// 配速换算：选距离、填完赛时间，算出平均配速、时速和 400 米单圈用时
const DISTANCES = [
    { label: '5 公里', km: 5 },
    { label: '10 公里', km: 10 },
    { label: '半程马拉松', km: 21.0975 },
    { label: '全程马拉松', km: 42.195 },
];

function pad(n) {
    return n < 10 ? '0' + n : '' + n;
}

function formatPace(sec) {
    const r = Math.round(sec);
    return Math.floor(r / 60) + ':' + pad(r % 60);
}

Page({
    data: {
        distanceLabels: DISTANCES.map((d) => d.label),
        distanceIndex: 3,
        hours: '4',
        minutes: '0',
        seconds: '0',
        hasResult: false,
        pace: '',
        speed: '',
        lap: '',
        siteUrl: BASE,
    },

    onLoad() {
        this.calculate();
    },

    onDistanceChange(event) {
        this.setData({ distanceIndex: Number(event.detail.value) });
        this.calculate();
    },

    onInput(event) {
        const field = event.currentTarget.dataset.field;
        const value = event.detail.value.replace(/[^0-9]/g, '');
        this.setData({ [field]: value });
        this.calculate();
    },

    calculate() {
        const h = Number(this.data.hours || 0);
        const m = Number(this.data.minutes || 0);
        const s = Number(this.data.seconds || 0);
        const total = h * 3600 + m * 60 + s;
        if (!total || m > 59 || s > 59) {
            this.setData({ hasResult: false });
            return;
        }
        const km = DISTANCES[this.data.distanceIndex].km;
        const pace = total / km;
        this.setData({
            hasResult: true,
            pace: formatPace(pace),
            speed: (3600 / pace).toFixed(2),
            lap: (pace * 0.4).toFixed(1),
        });
    },

    copySite() {
        wx.setClipboardData({ data: this.data.siteUrl });
    },
});
