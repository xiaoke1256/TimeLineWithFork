[![License](https://img.shields.io/badge/license-anti996-green.svg)](https://github.com/wanlinus/Anti996-License/blob/master/LICENSE)
[![License](https://img.shields.io/badge/license-Apache-green.svg)](https://github.com/xiaoke1256/TimeLineWithFork/blob/main/LICENSE)

# TimeLineWithFork

一个带分叉的时间线组件。
实现了一个jQuery版本的。

效果如下：
![图片](./TimeLineWithFork/doc/time_line.png?raw=true)

## 用法
第一步：引入jQuery和forked_time_line的相关组件：
```
<script type="text/javascript">
    <link rel="stylesheet" type="text/css" href="css/time_line.css">
    <script src="js/jquery-3.6.0.js" type="text/javascript"></script>
    <script src="js/forked_time_line.js" type="text/javascript"></script>
</script>
```
第二步：创建一个div
```
    <div id="time_line1"></div>
```
第三步：准备数据，并调用forkedTimeLine组件：
```
    <script type="text/javascript">
    $(function(){
      var datas1 = [{id:'1',timestamp:'1',text:'版本1',parent:null},
    		{id:'2',timestamp:'2',text:'版本2',parent:'1'},
    		{id:'3',timestamp:'3',text:'版本3',parent:'1'},
    		{id:'4',timestamp:'4',text:'版本4',parent:'3'},
    		{id:'5',timestamp:'5',text:'版本5',parent:'2'},
    		{id:'6',timestamp:'6',text:'版本6',parent:['4','5']},
    		{id:'7',timestamp:'7',text:'版本7',parent:'6'}];
    	$('#time_line1').forkedTimeLine(datas1);
    });
    </script>
```
