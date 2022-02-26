/*
 * @Author: your name
 * @Date: 2021-11-03 15:19:00
 * @LastEditTime: 2022-02-26 23:44:17
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \安全帽检测\pages\list\list.js
 */
import request from '../../utils/request.js';
const app = getApp()
var pageSize = 10
var pageNum = 1
var searchPagenum = 1
var selectPagenum = 1
var keyword
Page({
    /**
     * 页面的初始数据
     */
    data: {
        navheight: '', //动态计算导航栏的高度
        topstatus: '', //导航栏的上边距
        selectIndex: 0, //所选中部门的索引
        manageButton: "管理", //管理按钮
        isShow: false,
        isPasslogo: false, //通过图标
        array: ['全部状态', '未审核', '已通过', '已驳回'],
        isalldetel: false,
        newlist: [],
        list: [],
        allSelectStatus: "circle",
        scrollHeight: 0, // scroll-view高度
        startX: 0, // 开始X坐标
        startY: 0, // 开始Y坐标
        currentfreshMode: 'all',
    },
    //监听页面触底，然后发送请求
    onReachBottom: function() {
        console.log("已经最底下了")
            // 1.弹窗加载中
            //2.发送请求渲染
            //3.当点击管理的时候，则不会请求列表
        if (this.data.manageButton == "管理") {
            wx.showToast({
                title: '加载中',
                icon: 'loading',
                duration: 500
            })
            this.requestListFresh()
        }
    },
    // 手指触摸动作开始
    touchStart: function(e) {
        let that = this;
        //开始触摸时 重置所有删除
        that.data.list.forEach(function(v, i) {
                if (v.isTouchMove) v.isTouchMove = false; // 只操作为true的
            })
            // 记录手指触摸开始坐标
        that.setData({
            startX: e.changedTouches[0].clientX, // 开始X坐标
            startY: e.changedTouches[0].clientY, // 开始Y坐标
            list: that.data.list
        })
    },

    // 手指触摸后移动
    touchMove: function(e) {
        let that = this,
            index = e.currentTarget.dataset.index, // 当前下标
            startX = that.data.startX, // 开始X坐标
            startY = that.data.startY, // 开始Y坐标
            touchMoveX = e.changedTouches[0].clientX, // 滑动变化坐标
            touchMoveY = e.changedTouches[0].clientY, // 滑动变化坐标
            // 获取滑动角度
            angle = that.angle({ X: startX, Y: startY }, { X: touchMoveX, Y: touchMoveY });　　　　　 // 判断滑动角度
        that.data.list.forEach(function(v, i) {
                v.isTouchMove = false
                    // 滑动超过30度角 return
                if (Math.abs(angle) > 30) return;
                if (i == index) {
                    // 右滑
                    if (touchMoveX > startX)
                        v.isTouchMove = false
                        // 左滑
                    else
                        v.isTouchMove = true
                }
            })
            // 更新数据
        that.setData({
            list: that.data.list
        })
    },

    // 计算滑动角度
    angle: function(start, end) {
        let that = this,
            _X = end.X - start.X,
            _Y = end.Y - start.Y;
        // 返回角度 /Math.atan()返回数字的反正切值
        return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
    },

    // 删除
    delList: function(e) {
        let that = this,
            index = e.currentTarget.dataset.index; // 当前下标　
        // 切割当前下标元素，更新数据
        that.data.list.splice(index, 1);
        that.setData({
            list: that.data.list
        })
        if (this.data.list.length == 0) {
            this.setData({
                isalldetel: true,
            })
        }
        console.log(this.data.list)
        wx.showToast({
            title: '已删除',
            icon: 'success',
            duration: 1500
        })
        console.log("删除")
        console.log(e.currentTarget.dataset.id)
        let id = JSON.stringify(e.currentTarget.dataset.id) //获取选中的id
        let data = {
                "id": id
            }
            //删除用户的接口
        request.deleteFaceInfo(data).then(res => {
            console.log(res)
        }).catch(err => {
            console.log(err)
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        console.log('options', options)
        if (options.pagenum) {
            pageNum = options.pagenum
        }
        let navheight = app.globalData.realheight
        let navtop = app.globalData.topstatus
        this.setData({
                navheight: navheight,
                topstatus: navtop
            })
            //获取用户列表
        request.getFaceList(pageSize, pageNum).then(res => {
            console.log(res)
            let newlist = res.data.data.list
                //操作数组
            let returnlist = this.oprationArr(newlist) //操作json数据
            this.setData({
                list: returnlist
            })
            wx.setStorageSync('faceManageList', this.data.list)
        }).catch(err => {
            console.log(err)
        })
        let that = this;
        // 动态获取屏幕高度
        that.setData({
            scrollHeight: wx.getSystemInfoSync().screenHeight
        })
    },
    //修改部门
    bindPickerChange: function(e) {
        console.log(e)
        console.log("修改状态")
        this.setData({
            selectIndex: e.detail.value
        })
        let flag = this.data.selectIndex - 1
        if (this.data.selectIndex == 0) {
            selectPagenum = 1;
            pageNum = 1 //还原初始页面
                // currentfreshMode = "all"
            this.setData({
                currentfreshMode: 'all'
            })
            request.getFaceList(pageSize, pageNum).then(res => {
                let newlist = res.data.data.list
                    //操作数组
                let returnlist = this.oprationArr(newlist) //更换渲染数组
                this.setData({
                    list: returnlist
                })
                console.log("list", this.data.list)
            }).catch(err => {
                console.log(err)
            })
        } else {
            selectPagenum = 1;
            pageNum = 1 //还原初始页面
            this.setData({
                currentfreshMode: 'select'
            })
            let data = {
                "pagenum": selectPagenum,
                "pagesize": pageSize,
                "flag": flag
            }
            request.selectflagfacelist(data).then(res => {
                console.log(res)
                let newlist = res.data.data.list
                    //操作数组
                let returnlist = this.oprationArr(newlist)
                this.setData({
                    list: returnlist
                })
                console.log(this.data.list)
            }).catch(err => {
                console.log(err)
            })
        }
    },
    //管理按钮
    clickManageButton: function(e) {
        if (this.data.manageButton == "管理") {
            this.setData({
                manageButton: "完成",
                IsShow: true
            })
        } else if (this.data.manageButton == "完成") {
            this.setData({
                manageButton: "管理",
                allSelectStatus: "circle",
                IsShow: false
            })
            for (var i = 0; i < this.data.list.length; i++) {
                this.setData({
                    ['list[' + i + '].selectStatus']: "circle"
                })
            }
        }
    },
    //单个选中
    singleSelect: function(e) {
        console.log(e.target.dataset.index)
        var status = this.data.list[e.target.dataset.index].selectStatus
        if (status == "circle") {
            this.setData({
                ['list[' + e.target.dataset.index + '].selectStatus']: "success" //给对象数组赋值
            })
        } else if (status == "success") {
            this.setData({
                ['list[' + e.target.dataset.index + '].selectStatus']: "circle" //给对象数组赋值
            })
        }
        //每点击一个去循环数组，判断是否全选，如果有一个没选，则circle，跳出循环
        for (var i = 0; i < this.data.list.length; i++) {
            if (this.data.list[i].selectStatus == "circle") {
                this.setData({
                    allSelectStatus: "circle"
                })
                break
            }
            if (i == this.data.list.length - 1) {
                this.setData({
                    allSelectStatus: "success"
                })
            }
        }
    },
    clickAllSelect: function(e) {
        console.log(this.data.allSelectStatus)
        if (this.data.allSelectStatus == "circle") {
            for (var i = 0; i < this.data.list.length; i++) {
                this.setData({
                    ['list[' + i + '].selectStatus']: "success"
                })
            }
            this.setData({
                allSelectStatus: "success"
            })
        } else if (this.data.allSelectStatus == "success") {
            for (var i = 0; i < this.data.list.length; i++) {
                this.setData({
                    ['list[' + i + '].selectStatus']: "circle"
                })
            }
            this.setData({
                allSelectStatus: "circle"
            })
        }
    },
    //点击删除，还没接接口
    clickDelete: function(e) {
        //1.拿到删除的id数组
        //2.循环请求接口删除数据
        var that = this
        var shouldDelete = [] //储存需要删除的index和id
        for (var i = 0; i < this.data.list.length; i++) {
            if (this.data.list[i].selectStatus == "success") {
                let id = this.data.list[i].id
                let newArray = {
                    index: i,
                    id: id
                }
                shouldDelete.push(newArray)
            }
        }
        console.log('shouldDelete', shouldDelete) //拿到所有要删除的id
        for (var j = shouldDelete.length - 1; j >= 0; j--) {
            var id = shouldDelete[j].id
            var index = shouldDelete[j].index
            let data = {
                id: id
            }
            request.deleteFaceInfo(data).then(res => {
                if (res.data.code == 20000) {
                    that.data.list.splice(index, 1) //根据index删除
                    that.setData({
                        list: that.data.list
                    })
                    wx.showToast({
                        title: '已删除',
                        icon: 'success',
                        duration: 1500
                    })
                }
            })
        }
        this.setData({
                allSelectStatus: "circle"
            })
            //控制背景图片
        if (this.data.list.length == 0) {
            this.setData({
                isalldetel: true,
                IsShow: false
            })
        }
    },
    //搜索接口
    confirmSearch(e) {
        var keyword = e.detail.value
        this.setData({
            currentfreshMode: 'search'
        })
        console.log("点击了回车", e.detail)
        request.faceSearch(keyword, pageSize, pageNum).then(res => {
            if (res.data.code == 20000) {
                if (res.data.data.list.length == 0) {
                    console.log("无该人信息")
                    wx.showToast({
                        title: "无该人信息",
                        icon: "error",
                        duration: 1500
                    })
                    console.log("requestList", this.data.requestList)
                } else {
                    console.log("res", res.data.data.list)
                    console.log(this.oprationArr(res.data.data.list))
                }
            } else {
                console.log("无该人信息")
                wx.showToast({
                    title: "无该人信息",
                    icon: "error",
                    duration: 1500
                })
            }
        }).catch(err => {
            console.log(err)
        })
    },
    //跳转页面
    ToNavigtorBack() {
        wx.navigateTo({
            url: '/pages/index/index',
        })
    },
    //跳转详情页
    ToNavigtorDetail(e) {
        console.log(e.currentTarget.dataset.id)
        var id = e.currentTarget.dataset.id
        wx.navigateTo({
            url: '/pages/faceManageDetail/faceManageDetail?id=' + id,
        })
    },
    //点击通过,还没有接接口
    //获取每个按钮的index，然后根据index操作对应的对象
    clickpassButton(e) {
        console.log(e.currentTarget.dataset.index)
        var i = e.currentTarget.dataset.index
        var id = e.currentTarget.dataset.id
            //发送通过请求
        let flag = 1 //确定审核通过状态
        request.judgeFacePhoto(id, flag).then(res => {
            console.log(res)
            if (res.data.code == 20000) {
                wx.showToast({
                    title: '已通过',
                    icon: 'success',
                    duration: 1500
                })
                this.setData({
                    ["list[" + i + '].status']: "已通过",
                    ["list[" + i + '].isPasslogo']: true
                })
            }
        })
    },
    //点击驳回,还没有接接口
    clickUnpassButton(e) {
        console.log(e.currentTarget.dataset.index)
        var i = e.currentTarget.dataset.index
        var id = e.currentTarget.dataset.id
        let flag = 2 //确定审核不通过状态
            //发送驳回请求
        request.judgeFacePhoto(id, flag).then(res => {
            console.log(res)
            if (res.data.code == 20000) {
                wx.showToast({
                    title: '已驳回',
                    icon: 'error',
                    duration: 1500
                })
                this.setData({
                    ["list[" + i + '].status']: "已驳回",
                    ["list[" + i + '].isPasslogo']: false
                })
            }
        })
    },
    //util
    //列表更新请求
    requestListFresh() {
        //发起列表请求
        let department = this.data.selectIndex
        let currentfreshMode = this.data.currentfreshMode
            //发起列表请求
        if (currentfreshMode == "all") {
            //无筛选条件
            pageNum++;
            request.getFaceList(pageSize, pageNum).then(res => {
                let newlist = res.data.data.list
                    //操作数组
                let freshList = this.oprationArr(newlist) //更新的数组
                var realList = this.data.requestList //目前渲染的数组
                if (res.data.data.list.length !== 0) {
                    freshList.forEach((value, index) => {
                        realList.push(value) //将更新数组追加到目前数组上
                    })
                    this.setData({
                            list: realList
                        }) //把数组赋值
                    console.log(this.data.list)
                    wx.showToast({
                        title: "列表已更新",
                        icon: "success",
                        duration: 1000
                    })
                    wx.setStorageSync('faceManageList', this.data.list) //本地存储违规列表
                    console.log("list", this.data.list)
                }
            }).catch(err => {
                console.log(err)
            })
        } else if (currentfreshMode == "search") {
            //搜索模式
            debugger;
            searchPagenum++; //搜索页面数
            console.log(searchPagenum)
            request.getVioSearchInfo(keyword, pageSize, searchPagenum).then(res => {
                if (res.data.code == 20000) {
                    console.log("res", res.data.data.list)
                        //该数组长度等于0，说明没有数据，就没有此人
                    if (res.data.data.list.length == 0) {
                        wx.showToast({
                            title: "无数据",
                            icon: "error",
                            duration: 1000
                        })
                    } else {
                        let newlist = res.data.data.list
                            //操作数组
                        let freshList = this.oprationArr(newlist)
                        var realList = this.data.list
                        freshList.forEach((value, index) => {
                            realList.push(value)
                        })
                        this.setData({
                            list: realList
                        })
                        wx.setStorageSync('faceManageList', this.data.list)
                        console.log("list", this.data.list)
                    }
                } else {
                    console.log("无数据")
                    wx.showToast({
                        title: "无数据",
                        icon: "error",
                        duration: 1500
                    })
                }
            }).catch(err => {
                console.log(err)
            })
        } else if (currentfreshMode == "select") {
            debugger
            selectPagenum++; //挑选页码数
            let data = {
                "pagenum": selectPagenum,
                "pagesize": pageSize,
                "did": department
            }
            request.getVioSelectInfo(data).then(res => {
                console.log(res)
                let newlist = res.data.data.list
                    //操作数组
                let freshList = this.oprationArr(newlist)
                var realList = this.data.list
                freshList.forEach((value, index) => {
                    realList.push(value)
                })
                this.setData({
                    list: realList
                })
                wx.setStorageSync('faceManageList', this.data.list)
                console.log("list", this.data.list)
            }).catch(err => {
                console.log(err)
            })
        }
    },
    //对列表数组json
    oprationArr(list) {
        var newList = []
        var commonImgUrl = "https://dachuang.bitaxes.com" //图片url拼接
        console.log("请求成功", list)
        list.forEach((value, index) => {
            let newPrase = {
                id: "0001",
                name: "吕樵润 ",
                department: "工程技术部",
                jobNumber: "20125022041",
                time: "2021-11-17",
                telephone: "13027920034",
                status: "待审批",
                selectStatus: "circle",
                isPasslogo: false, //通过图标
                imgUrl: "https://z3.ax1x.com/2021/11/18/IoPEZV.jpg"
            }
            newPrase.id = value.id
            newPrase.name = value.name
            newPrase.department = this.returnDepartment(value.groupId)
            newPrase.jobNumber = value.workId
            newPrase.status = this.returnStatus(value.falg)
            newPrase.isPasslogo = this.returnflaglogo(value.falg)
            newPrase.time = this.spliceTime(value.createTime)
            newPrase.telephone = value.telphone
                // newPrase.imgUrl = commonImgUrl + value.imgUrl //需要重新拼接
            newList.push(newPrase)
        })
        console.log(newList)
        return newList
    },
    //对time字符串进行切割
    spliceTime(time) {
        var str = time.split("T")
        return str[0]
    },
    //根据int转化部门
    returnDepartment(data) {
        let department = ""
        switch (data) {
            case "1":
                department = "工程技术部";
                break;
            case "2":
                department = "安全质量部";
                break;
            case "3":
                department = "物资设备部";
                break;
            case "4":
                department = "经济管理部";
                break;
            case "5":
                department = "财务部";
                break;
            case "6":
                department = "综合办公室";
                break;
            default:
                department = "null"
                break;
        }
        return department
    },
    //根据falg转化状态
    returnStatus(falg) {
        console.log(falg)
        let status
        switch (falg) {
            case 0:
                status = "待审核"
                break;
            case 1:
                status = "已通过"
                break;
            case 2:
                status = "已驳回"
                break;
            default:
                status = "待审核"
                break;
        }
        return status
    },
    //根据falg转化logo
    returnflaglogo(falg) {
        let islogo
        switch (falg) {
            case 0:
                islogo = false
                break;
            case 1:
                islogo = true
                break;
            case 2:
                islogo = false
                break;
            default:
                islogo = false
                break;
        }
        return islogo
    }
})