(function($){
  $.fn.extend({
    forkedTimeLine:function(opts){
      var datas = [];
      if (opts instanceof Array){
    	datas = opts.slice();//数组克隆
      }
      //检查 timestamp 不能为空
      for(var i in datas){
    	  var data = datas[i];
    	  if(!data.timestamp){
    		throw new Error('The collumn timestamp can not be null.');
    	  }
      }
      //按timestamp 排序
      datas.sort(function(a,b){return a.timestamp.localeCompare(b.timestamp)});
      
      
      //先整理出各个分支
      var branches = [];
      //凡是两个结点指向同一个父节点就算新的分支
      for(var i in datas){
    	var data = datas[i];
    	if(i==0){
    	  var branche = [];//新分支
    	  branche.push(data);
    	  branches.push(branche);
    	  continue;
    	}
    	//找各个分支的最后一个节点
    	for()
    	
      }
      
      //再给分支分配列
      
      //然后绘制出这些列
	  $(this).addClass('time_line');
    }
  });
})(jQuery);