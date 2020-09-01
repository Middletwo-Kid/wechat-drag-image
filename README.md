> 前阵子有个需求是实现图片拖拽排序的问题，那会刚接触微信小程序，捣鼓了很多久，也查了很多资料，不过还是很多混乱的地方，最后实现了，所以在此记录一下，希望能帮到其他人，如果有写的不对，或者可以改进的地方，可以告诉我一声，谢谢大家。

## 效果图

![](https://user-gold-cdn.xitu.io/2019/9/14/16d2f4ea8cb5375f?w=288&h=508&f=gif&s=887438)
(在真机上的效果就不演示了，是差不多的)

## 实现思路
### 布局
在这里运用到了微信小程序的`moveable-area`和`moveable-view`两个标签。

`moveable-area`是可拖拽的区域，需要设置其宽高。由于图片的大小我是根据屏幕来动态设置的，所以`moveable-area`的宽度是固定的100%，高度由上传的图片总高度决定，所以一开始的时候，我设置了最小高度。

`moveable-view`的宽高跟图片一致，也是动态设置，初始状态是隐藏的，当图片被长按时才会显示。当长按要排序的图片的时候，记录它的url，并赋值给`moveable-view`的image。
```
 <movable-area class="movable-area" style="min-height:{{imageWitdh}}px;height:{{areaHeight}}px">
      <!--图片上传-->
      <view class="image-choose-container">
        <view class="image-item" style="width:{{imageWitdh}}px;height:{{imageWitdh}}px" wx:for="{{images}}" wx:for-item="url" wx:key="url" data-url="{{url}}" data-index="{{index}}" >
            <image src="{{url}}" mode="aspectFill"></image>
            <view class="close">X</view>
        </view>
          <!--图片上传按钮-->
          <view class="add-button" style="width:{{imageWitdh}}px;height:{{imageWitdh}}px" wx:if="{{images.length >= 0 &&images.length < 9}}">+</view>
          <!--确保flex布局justify-content：space-between最后一行左对齐-->
          <view style="width:{{imageWitdh}}px" class="image-item image-item-temp" wx:if="{{images.length%3==1}}"></view>
      </view>
      
      <movable-view class="movable-view" style="width:{{imageWitdh}}px;height:{{imageWitdh}}px" hidden="{{hidden}}" x="{{x}}" y="{{y}}"  direction="all" damping="{{5000}}" friction="{{1}}">
        <image src="{{currentImg}}" wx:if="{{currentImg.length>0}}"></image>
      </movable-view>
    </movable-area>
```
页面初始化时计算宽高的js
```
// 计算图片宽度
_handleComputedImage:function(e){
    const windowWidth = app.globalData.systemInfo.windowWidth;
    const width = windowWidth - 16;
    const imageWitdh = (width - 16) / 3;
    this.setData({
      imageWitdh
    })
},
```
### 上传图片
在上传图片之后，我们需要改变`moveable-area`的高度
```
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
```
更新面积的计算如下,它的高度由`.image-choose-container`的view决定：
```
// 计算movable-area的高度
  _handleComputedArea:function(e){
    let that = this;
    wx.createSelectorQuery().selectAll('.image-choose-container').boundingClientRect(function (rect) {
      that.setData({
        areaHeight: rect[0].height
      })
    }).exec()
  },
```
p.s. 当删除图片的时候，我们也需要重新计算`moveable-area`的高度。

### 长按图片
图片可以拖拽排序的触发机制是长按。
- 在长按的时候，我们需要计算每张图片的坐标（这里的坐标不是固定的，当你的页面可以拖动的时候，坐标值是会发生改变）并保存；
- 记录当前图片在图片数组中的下标、url;
- 显示`moveable-view`，并设置其x、y值，将url赋值给其下的子元素。
```
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
```

```
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
```
此时，长按图片，`moveable-view`（带有边框）将会出现在该图片之上。

![](https://user-gold-cdn.xitu.io/2019/9/14/16d2f6c26e8da3a0?w=288&h=508&f=gif&s=61103)

### 移动图片
监听`moveable-view`的catchtouchmove事件，（不使用bindhtouchmove的原因是因为在图片移动的过程中，如果页面是可滑动的，会导致页面页跟着滑动），记录当前手指在页面上的位置e.touches[0].pageX和e.touches[0].pageY。
为了保证手指在移动的过程中，图片能跟着手指一起移动，则`moveable-view`的x距离是手指的e.touches[0].pageX，而y距离则是e.touches[0].pageX - 滚动条的移动距离-image-choose-container这个元素距离顶部的距离。

![](https://user-gold-cdn.xitu.io/2019/9/14/16d2fcd94dc065a9?w=595&h=525&f=png&s=205548)

为了保证在移动图片的过程中，图片始终能在手指的中间，还将x,y分别减去图片的宽度。（对比两图，鼠标与`moveable-view`的位置）

![](https://user-gold-cdn.xitu.io/2019/9/14/16d2fd63fa5d38fd?w=288&h=508&f=gif&s=117777)

![](https://user-gold-cdn.xitu.io/2019/9/14/16d2fd6767fc1f68?w=288&h=508&f=gif&s=94772)

```
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
        x: x - that.data.imageWitdh / 2 > 0 ? x - that.data.imageWitdh / 2:0,
        y: y - that.data.imageWitdh / 2 > 0 ? y - that.data.imageWitdh / 2:0,
      })

    }).exec()
  },
```

```
// 监听滚动
  onPageScroll:function(e){
    this.data.scrollTop = e.scrollTop;
  }
```

### 停止拖拽时
监听`moveable-view`的bindtouchend事件，计算出当前的x,y值，对比每个图片的下标，得出它移动到哪个位置，更新数组，完毕。
```
// 移动结束的时候
  handleTouchEnd:function(e){
    if (!this.data.flag) {
      // 非长按情况下
      return;
    }
    let  x = e.changedTouches[0].pageX;
    let y = e.changedTouches[0].pageY - this.data.scrollTop;
    // 每张图片的地址
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
```
最后附上demo地址：
https://github.com/Middletwo-Kid/wechat-drag-image <br/>
