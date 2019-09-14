// pages/index.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    images:[],
    imageWitdh:0,
    x:0,  // movable-view的坐标
    y:0,
    areaHeight:0,  // movable-area的高度
    hidden: true, // movable-view是否隐藏
    currentImg:'', // movable-view的图片地址
    currentIndex:0, // 要改变顺序的图片的下标
    pointsArr:[], // 每张图片的坐标
    flag:true, // 是否是长按
    scrollTop:0, // 滚动条距离顶部的距离
  },

  // 计算图片宽度
  _handleComputedImage:function(e){
    const windowWidth = app.globalData.systemInfo.windowWidth;
    const width = windowWidth - 16;
    const imageWitdh = (width - 16) / 3;
    this.setData({
      imageWitdh
    })
  },

  // 选择图片
  handleChooseImage: function (e) {
    let length = this.data.images.length;
    if (length == 9) {
      wx.showToast({
        title: "亲，最多只能选择九张图哦~",
        icon: "none",
        duration: 2000
      })
      return false;
    }
    var that = this;
    wx.chooseImage({
      count: 9 - this.data.images.length,
      sizeType: ['compressed'], //可选择原图或压缩后的图片
      sourceType: ['album', 'camera'], //可选择性开放访问相册、相机
      success: res => {
        let images = that.data.images;
        for (let i = 0; i < res.tempFilePaths.length;i++){
          images.push(res.tempFilePaths[i]);
        }
        that.setData({
          images
        },function(){
          //上传完之后更新面积
          that._handleComputedArea();
        });
        
      },
      fail: err => console.log(err)
    })
  },

  // 预览图片
  handlePreview:function(e){
    let index = e.target.dataset.index;
    let images = this.data.images;
    wx.previewImage({
      current: images[index], //当前预览的图片
      urls: images, //所有要预览的图片数组
    })
  },

  // 删除图片
  handleDelete:function(e){
    let index = e.target.dataset.index;
    let images = this.data.images;
    images.splice(index, 1);
    this.setData({
      images
    },function(){
      this._handleComputedArea();
    });
  },

  // 计算movable-area的高度
  _handleComputedArea:function(e){
    let that = this;
    wx.createSelectorQuery().selectAll('.image-choose-container').boundingClientRect(function (rect) {
      that.setData({
        areaHeight: rect[0].height
      })
    }).exec()
  },

  // 计算每张图片的坐标
  _handleComputedPoints(e){
    let that = this;
    var query = wx.createSelectorQuery();
    var nodesRef = query.selectAll(".image-item");
    nodesRef.fields({
      dataset: true,
      rect: true
    }, (result) => {
      that.setData({
        pointsArr: result
      })
    }).exec()
  },

  // 长按图片
  handleLongTap:function(e){
    // 计算每张图片的坐标
    this._handleComputedPoints();
    this.setData({
      currentImg: e.currentTarget.dataset.url,
      currentIndex: e.currentTarget.dataset.index,
      hidden: false,
      flag: true,
      x: e.currentTarget.offsetLeft,
      y: e.currentTarget.offsetTop
    })
  },

  // 移动的过程中
  handleTouchMove:function(e){
    let x = e.touches[0].pageX;
    let y = e.touches[0].pageY;
   // 首先先获得当前image-choose-container距离顶部的距离
    let that = this;
    wx.createSelectorQuery().selectAll('.image-choose-container').boundingClientRect(function (rect) {
      let top = rect[0].top;
      y = y - that.data.scrollTop - top;
      that.setData({
        // x: x - that.data.imageWitdh / 2 > 0 ? x - that.data.imageWitdh / 2:0,
        // y: y - that.data.imageWitdh / 2 > 0 ? y - that.data.imageWitdh / 2:0,
        x: x,
        y: y,
      })

    }).exec()
  },

  // 移动结束的时候
  handleTouchEnd:function(e){
    if (!this.data.flag) {
      // 非长按情况下
      return;
    }
    let  x = e.changedTouches[0].pageX;
    let y = e.changedTouches[0].pageY - this.data.scrollTop;
    const pointsArr = this.data.pointsArr;
    let data = this.data.images;
    for (var j = 0; j < pointsArr.length; j++) {
      const item = pointsArr[j];
      if (x > item.left && x < item.right && y > item.top && y < item.bottom) {
        const endIndex = item.dataset.index;
        const beginIndex = this.data.currentIndex;
        //临时保存移动的目标数据
        let temp = data[beginIndex];
        //将移动目标的下标值替换为被移动目标的下标值
        data[beginIndex] = data[endIndex];
        //将被移动目标的下标值替换为beginIndex
        data[endIndex] = temp;
      }
    }
    this.setData({
      images: data,
      hidden: true,
      flag: false,
      currentImg: ''
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 计算图片
    this._handleComputedImage();
  },

  // 监听滚动
  onPageScroll:function(e){
    this.data.scrollTop = e.scrollTop;
  }

})