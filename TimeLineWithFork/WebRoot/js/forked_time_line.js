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
      for(var i = 0;i < datas.length;i++){
    	
    	var data = datas[i];
    	if(!data.parent){
    	  var branche = [];//新分支
    	  branche.push(data);
    	  branches.push(branche);
    	  continue;
    	}
    	
    	//找各个分支的最后一个节点
    	var findBranch = false;
    	for(var branchIdx in branches){
    	  var branche = branches[branchIdx];
    	  var lastNode = branche[branche.length-1];
    	  
    	  if(!(data.parent instanceof Array) && lastNode.id === data.parent){
    		console.log('data.id:',data.id,'lastNode.id:',lastNode.id,'data.parent:',data.parent, (lastNode.id === data.parent));
    		branche.push(data);
    		findBranch = true;
    		break;
    	  }else if(data.parent instanceof Array){
    		//data.parent 有可能是个数组，如果是数组要标记好从哪几个分支汇聚过来的。
    		for(var j in data.parent){
    		  var parentId = data.parent[j];
    		  if(lastNode.id === parentId){
    			if(!findBranch){
    			  branche.push(data);
    			  findBranch = true; 
    			}else{
    			  //汇聚来的分支
    			  if(!data.colMeta){
    				data.colMeta = {fromBranchs:[]};
    			  }else if(!data.colMeta.fromBranchs){
    				data.colMeta.fromBranchs = [];
    			  }
    			  data.colMeta.fromBranchs.push(branchIdx);
    			  console.log('data.id:',data.id,'from witch branch:',branchIdx);
    			}
    		  }
    		}
    		
    	  }
    	}//of branches
    	
    	console.log('data.id:',data.id,'findBranch:',findBranch);
    	//找不到则创建一个新分支
    	if(!findBranch){
    	  var branche = [];//新分支
      	  branche.push(data);
      	  var brancheIdx = branches.length;
      	  branches.push(branche);
      	  //标记好这个分支是从哪里来的
      	  for(var k in branches){
      		var oldBranch =  branches[k];
      		for(var l in oldBranch){
      		  var oData = oldBranch[l];
      		  if(data.parent === oData.id){
      			if(!oData.colMeta){
      			  oData.colMeta = {toBranchs:[]};
      			}
      			if(!oData.colMeta.toBranchs){
      			  oData.colMeta.toBranchs = [];
      			}
      			oData.colMeta.toBranchs.push(brancheIdx);
      		  }
      		}
      	  }
      	  
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
    		var branchIdx = col[k];
    		//判断是否与当前列冲突
    		if(checkConflict(branches[branchIdx],currentBranch)){
    		  isConflict = true;
    		  console.log('branch index:',i,' crashed!');
    		  break;
    		}
    	  }
    	  console.log('branch index:',i,'isConflict:',isConflict);
    	  if(!isConflict){
    		col.push(i);
    		findCol = true;
    		break;
    	  }
    	}
    	//找不到不冲突的列则新建一个列
    	if(!findCol){
    	  var col=[i];
    	  cols.push(col);
    	}
      }
      
      console.log('cols.length:',cols.length);
      //给每一条数据打上标记（哪个分支哪个列）。
      for(var colIndex in cols){
    	var col = cols[colIndex];
    	for(var i in col){
    	  var branchIndex = col[i];
    	  var branche = branches[branchIndex];
    	  for(var dataIndex in branche){
    		var data = branche[dataIndex];
    		if(!data.colMeta){
    		  data.colMeta = {branchIndex:branchIndex,colIndex:colIndex};
        	}else{
        	  data.colMeta.branchIndex = branchIndex;
        	  data.colMeta.colIndex = colIndex;
        	}
    		console.log('in data:','dataId:' , data.id,'branchIndex:',data.colMeta.branchIndex,'colIndex:',data.colMeta.colIndex);
    	  }
    	}
      }
      
      //绘制
	  $(this).addClass('time_line');
	  var branchStatuses = ['drawing'];//用于保存各个分支的状态,第0个分支默认是正在绘制状态
	  for(var i in datas){
		var data = datas[i];
		console.log('in draw:','dataId:' , data.id,'branchIndex:',data.colMeta.branchIndex,'colIndex:',data.colMeta.colIndex);
		var $row = $('<div>').addClass('row');
		for(var colIndex = 0;colIndex<cols.length;colIndex++){
		  $col = $('<div>').addClass('col');
		  if(data.colMeta.colIndex == colIndex){
			var fromLeft = false;	
			var fromRight = false;
			var toLeft = false;	
			var toRight = false;	
			if(data.colMeta.toBranchs && data.colMeta.toBranchs.length>0){ 
			  for(var j in data.colMeta.toBranchs){
				var bIdx = data.colMeta.toBranchs[j];
				branchStatuses[bIdx] = 'toStart';
				console.log('bIdx:',bIdx,'data.colMeta.branchIndex:',data.colMeta.branchIndex);
				if(bIdx>data.colMeta.branchIndex){
				  toRight = true;
				}else if(bIdx<data.colMeta.branchIndex){
				  toLeft = true;
				}
			  }
			}
			if(data.colMeta.fromBranchs && data.colMeta.fromBranchs.length>0){ 
			  for(var j in data.colMeta.fromBranchs){
				var bIdx = data.colMeta.fromBranchs[j];
				console.log('bIdx:',bIdx,'data.colMeta.branchIndex:',data.colMeta.branchIndex);
				if(bIdx>data.colMeta.branchIndex){
				  fromRight = true;
				}else if(bIdx<data.colMeta.branchIndex){
				  fromLeft = true;
				}	
			  }
			}
			//判断end 从其他的分支判断
			if(branchStatuses[data.colMeta.branchIndex]==='drawing'){
				//要不要收尾看下一个节点的情况
		    	var nextData = datas[parseInt(i)+1];
//				if(data.id ==='5'){
//				  console.log('end,end,end, data.colMeta.branchIndex:',data.colMeta.branchIndex,'status:',branchStatuses[data.colMeta.branchIndex]);
//				  console.log('end,end,end, nextData.colMeta.fromBranchs:',nextData.colMeta.fromBranchs,'data.colMeta.branchIndex:',data.colMeta.branchIndex);
//			    }
		    	if(nextData && nextData.colMeta.fromBranchs && nextData.colMeta.fromBranchs.indexOf(data.colMeta.branchIndex)>=0){
		    	  branchStatuses[data.colMeta.branchIndex] = 'end';
		    	  if(nextData.colMeta.colIndex>data.colMeta.colIndex){
		    		toRight = true;
		    	  }else if(nextData.colMeta.colIndex<data.colMeta.colIndex){
		    		toLeft = true;
		    	  }
		    	}
			}
			
			//正式绘制小方格里的内容
			if(toLeft || fromLeft){
			  if(toLeft && fromLeft){
				var $wrap = $('<div class="v_wrap">'); 
				$wrap.append('<div class="oblique_from_right" >');
				$wrap.append('<div class="oblique_to_right" >');
				$col.append($wrap);
			  }
			  if(fromLeft){
				$col.append('<div class="oblique_from_left"></div>');
			  }
			  if(toLeft){
			    $col.append('<div class="oblique_to_left"></div>');
			  }
			}else if(toRight || fromRight ){
			  $col.append('<div class="empty"></div>');
			}
			//此处是中间的那条线加一个点
			if(branchStatuses[data.colMeta.branchIndex]==='start'){
			//汇聚而来
			  $col.append('<div class="v-line-half-down"><div class="dot"></div></div>');
			}else if(branchStatuses[data.colMeta.branchIndex]==='end'){
			  $col.append('<div class="v-line-half-up"><div class="dot"></div></div>');
			}else{
			  $col.append('<div class="v-line"><div class="dot"></div></div>');
			}
			
			if(toRight || fromRight ){
			  if(toLeft && fromLeft){
				var $wrap = $('<div class="v_wrap">'); 
				$wrap.append('<div class="oblique_from_left" >');
				$wrap.append('<div class="oblique_to_left" >');
				$col.append($wrap);
			  }
			  if(fromRight){
				$col.append('<div class="oblique_from_right"></div>');
			  }
			  if(toRight){
			    $col.append('<div class="oblique_to_right"></div>');
			  }
			}else if(toLeft || fromLeft){
			  $col.append('<div class="empty"></div>');
			}
			//改变状态
			if(branchStatuses[data.colMeta.branchIndex]==='start'){
			  branchStatuses[data.colMeta.branchIndex]='drawing';
			}else if(branchStatuses[data.colMeta.branchIndex]==='end'){
			  branchStatuses[data.colMeta.branchIndex]='empty';
			}
		  }/*of if colIndex equal  */
		  else{
			for(var k in cols[colIndex]){
		      var branchIdx = cols[colIndex][k];
		      if(branchStatuses[branchIdx]==='toStart'){
		    	branchStatuses[branchIdx]='start';
		      }else if(branchStatuses[branchIdx]==='toEnd'){
		    	branchStatuses[branchIdx]='end';
		      }else if(branchStatuses[branchIdx]==='start'){
		    	branchStatuses[branchIdx]='drawing';
		    	$col.append('<div class="oblique_from_left" ></div>');
		    	$col.append('<div class="v-line-half-down"></div>');
		    	$col.append('<div class="empty"></div>');
		      }else if(branchStatuses[branchIdx]==='end'){
		    	if(nextData.colMeta.colIndex<colIndex){
			      $col.append('<div class="oblique_to_left" ></div>');
				  $col.append('<div class="v-line-half-up"></div>');
				  $col.append('<div class="empty"></div>');
			    }else{
			      $col.append('<div class="empty"></div>');
				  $col.append('<div class="v-line-half-up"></div>');
				  $col.append('<div class="oblique_to_right" ></div>');
			    }
			    branchStatuses[branchIdx]='empty';
		      }else if(branchStatuses[branchIdx]==='drawing'){
				//要不要收尾看下一个节点的情况
			    var nextData = datas[parseInt(i)+1];
//			    if(data.id ==='5'){
//			      console.log('i:',i,'(i+1):',i+1,'datas.length:',datas.length,'nextData:',datas[i+1]);
//			      console.log('nextData.colMeta.fromBranchs:',nextData.colMeta.fromBranchs);
//			      console.log('branchIdx:',branchIdx);
//				}
			    if(nextData && nextData.colMeta.fromBranchs && nextData.colMeta.fromBranchs.indexOf(branchIdx)>=0){
			      //要收尾
			      if(nextData.colMeta.colIndex<colIndex){
			        $col.append('<div class="oblique_to_left" ></div>');
				    $col.append('<div class="v-line-half-up"></div>');
				    $col.append('<div class="empty"></div>');
			      }else{
			        $col.append('<div class="empty"></div>');
				    $col.append('<div class="v-line-half-up"></div>');
					$col.append('<div class="oblique_to_right" ></div>');
			      }
			      branchStatuses[branchIdx]='empty';
			    }else{
			      //不要收尾
			      $col.append('<div class="v-line"></div>');
			    }
			  }
			}
		  }
		  $row.append($col);
		}
		//$row.append('<div class="col">'+data.id+'</div>');
		$(this).append($row);
	  }
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
  var checkConflict = function(branch, another){
	console.log('branch:',JSON.stringify(branch));
	var oneStart = branch[0].timestamp;
	var oneEnd = branch[branch.length-1].timestamp;
	var anotherStart = another[0].timestamp;
	var anotherEnd = another[another.length-1].timestamp;
	console.log('oneStart:',oneStart);
	console.log('oneEnd:',oneEnd);
	console.log('anotherStart:',anotherStart);
	console.log('anotherEnd:',anotherEnd);
	if(anotherStart>=oneStart && anotherStart<=oneEnd ){
	  return true;
	}
	if(anotherEnd>=oneStart && anotherEnd<=oneEnd ){
	  return true;
	}
	if(oneStart>=anotherStart && oneStart<=anotherEnd ){
	  return true;
	}
	if(oneEnd>=anotherStart && oneEnd<=anotherEnd ){
	  return true;
	}
    return false;
  }
  
})(jQuery);