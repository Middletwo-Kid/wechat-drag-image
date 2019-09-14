//app.js
App({
  onLaunch:function(){
    //获取设备信息
    this.getSystemInfo();
  },

  // 获得设备信息
  getSystemInfo: function () {
    let t = this;
    wx.getSystemInfo({
      success: function (res) {
        t.globalData.systemInfo = res
      },
      fail: function (err) {
        console.log(err)
      }
    });
  },

  globalData: {
    systemInfo: null, //客户端设备信息
  }
})