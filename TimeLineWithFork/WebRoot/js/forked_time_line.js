(function($){
  $.fn.extend({
    forkedTimeLine:function(opts){
      var datas = [];
      if (opts instanceof Array){
    	datas = opts.slice();//数组克隆
      }
      //检查 timestamp 不能为空 , id 不能为空
      for(var i in datas){
    	var data = datas[i];
    	if(!data.timestamp){
    	  throw new Error('The collumn timestamp can not be null.');
    	}
    	if(!data.id){
      	  throw new Error('The collumn id can not be null.');
      	}
      }
      //检查重复
      if(isIdRepeat(datas)){
    	throw new Error('The collumn id can not be repeated.');
      }
      
      //按timestamp 排序
      datas.sort(function(a,b){return a.timestamp.localeCompare(b.timestamp)});
      
      
      //先整理出各个分支
      var branches = [];
      //凡是两个结点指向同一个父节点就算新的分支
      for(var i in datas){
    	  
    	var data = datas[i];
    	if(!data.parent){
    	  var branche = [];//新分支
    	  branche.push(data);
    	  branches.push(branche);
    	  continue;
    	}
    	
    	//找各个分支的最后一个节点
    	var findBranch = false;
    	for(var i in branches){
    	  var branche = branches[i];
    	  var lastNode = branche[branche.length-1];
    	  if(lastNode.id === data.parent){
    		branche.push(data);
    		findBranch = true;
    		break;
    	  }
    	}
    	//找不到则创建一个新分支
    	if(findBranch){
    	  var branche = [];//新分支
      	  branche.push(data);
      	  branches.push(branche);
    	}
    	
      }
      
      //再给分支分配列
      var cols = [];
      for(var i in branches){
    	var currentBranch = branches[i];
    	//从cols里找不冲突的列
    	var findCol = false;
    	for(var j in cols){
    	  var col = cols[j];
    	  var isConflict = false;
    	  for(var k in col){
    		var branch = col[k];
    		//判断是否与当前列冲突
    		if(checkConflict(branch,currentBranch)){
    		  isConflict = true;
    		  break;
    		}
    	  }
    	  if(!isConflict){
    		col.push(currentBranch);
    		findCol = true;
    		break;
    	  }
    	}
    	//找不到不冲突的列则新建一个列
    	if(!findCol){
    	  var col=[currentBranch];
    	  cols.push(col);
    	}
      }
      
      //给每一条数据打上标记（哪个分支哪个列）。
      
      //绘制
	  $(this).addClass('time_line');
    }
  });
  
  /**
   * 判断主键是否重复
   */
  var isIdRepeat = function(datas){
	if(!datas){
	  return false;
	}
	if(datas.length<=1){
	  return false;
	}
	for(var i=1;i<datas.length;i++){
	  var data = datas[i];
	  for(var j=0;j<i;j++){
		var other = datas[j];
		if(data.id == other.id){
		  return true;
		}
	  }
	}
	return false;
  } 
  
  /**
   * 检测冲突
   */
  var checkConflict = function(branche, another){
	var oneStart = branche[0].timestamp;
	var oneEnd = branche[branche.length-1].timestamp;
	var anotherStart = another[0].timestamp;
	var anotherEnd = another[another.length-1].timestamp;
	if(anotherStart>=oneStart && anotherStart<=oneEnd ){
	  return true;
	}
	if(anotherEnd>=oneStart && anotherEnd<=oneEnd ){
	  return true;
	}
	return false;
  }
  
})(jQuery);