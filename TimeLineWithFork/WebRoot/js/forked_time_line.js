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
    			  //这个分支真正的结束时间是:
    			  branche.endTime = data.timestamp;
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
      			//这个分支真正的开始时间是：
      			branche.startTime = oData.timestamp
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
    	  for(var dataIndex = 0 ; dataIndex < branche.length;dataIndex++){
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
      draw(this,datas,cols);
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
	var oneStart = branch.startTime;
	var oneEnd = branch.endTime;
	var anotherStart = another.startTime;
	var anotherEnd = another.endTime;
	//应该从这个分支划分出来那时开始。
	console.log('oneStart:',oneStart);
	console.log('oneEnd:',oneEnd);
	console.log('anotherStart:',anotherStart);
	console.log('anotherEnd:',anotherEnd);
	if(anotherStart==undefined && anotherEnd==undefined){
	  return true;
	}else if(oneStart==undefined && oneEnd==undefined){
	  return true;
	}else if(anotherStart==undefined ){
	  if(oneStart==undefined)
	    return true;
	  else if(oneStart<=anotherEnd)
		return true;
	  else
	    return false;
	}else if (anotherEnd==undefined){
	  if(oneEnd==undefined)
	    return true;
	  else if(oneEnd>=anotherStart)
		return true;
	  else
		return false;
	}else if(oneStart == undefined){
	  if(anotherStart==undefined)
		return true;
	  else if(anotherStart>=oneEnd)
		return true;
	  else
		return false;
	}else if(oneEnd == undefined){
	  if(anotherEnd==undefined)
		return true;
	  else if(anotherEnd<=oneStart)
		return true;
	  else
		return false;
	}
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
  
  var draw = function(that,datas,cols){
	$(that).addClass('time_line');
	var branchStatuses = ['drawing'];//用于保存各个分支的状态,第0个分支默认是正在绘制状态
	
	for(var i in datas){
	  var data = datas[i];
	  console.log('in draw:','dataId:' , data.id,'branchIndex:',data.colMeta.branchIndex,'colIndex:',data.colMeta.colIndex);
	  var branchCrossLine = [];
	  //先扫描各个列，做些数据准备
	  for(var colIndex = 0;colIndex<cols.length;colIndex++){
		//分叉出去了
	    if(data.colMeta.toBranchs && data.colMeta.toBranchs.length>0){ 
	      for(var j in data.colMeta.toBranchs){
	    	var bIdx = data.colMeta.toBranchs[j];
			branchStatuses[bIdx] = 'start';
			//需要找到bIdx所在的列。
			var cIdx = getColIndxByBranch(bIdx,cols);
			if(cIdx>data.colMeta.colIndex){
			  //从右边分裂出来，到本分支
			  for (var k= data.colMeta.colIndex;k<=cIdx;k++ ){
				//横线差几格
				if(!branchCrossLine[k]){
				  branchCrossLine[k]={};
				}
				if(k==cIdx){
				  branchCrossLine[k].fromLeft = true;
				}else if(k==data.colMeta.colIndex){
				  branchCrossLine[k].hLineRight = true;
				}else{
				  branchCrossLine[k].hLineLeft = true;
				  branchCrossLine[k].hLineRight = true;
				}
			  }
			}else if(cIdx>data.colMeta.colIndex){
			  for (var k= data.colMeta.colIndex;k<cIdx;k-- ){
				//横线差几格
				if(!branchCrossLine[k]){
				  branchCrossLine[k]={};
				}
				if(k==cIdx){
				  branchCrossLine[k].fromRight = true;
				}else if(k==data.colMeta.colIndex){
				  branchCrossLine[k].hLineLeft = true;
				}else{
				  branchCrossLine[k].hLineLeft = true;
				  branchCrossLine[k].hLineRight = true;
				}
			  }
			}
	      }
		}
	    
	    //汇聚来的
	    if(data.colMeta.fromBranchs && data.colMeta.fromBranchs.length>0){ 
		  for(var j in data.colMeta.fromBranchs){
			var bIdx = data.colMeta.fromBranchs[j];
			//branchStatuses[bIdx] = 'end';
			var cIdx = getColIndxByBranch(bIdx,cols);
			console.log('cIdx:',cIdx,'data.colMeta.branchIndex:',data.colMeta.colIndex);
			if(cIdx>data.colMeta.colIndex){
			  for (var k= data.colMeta.colIndex;k<cIdx;k++ ){
			    if(!branchCrossLine[k]){
				  branchCrossLine[k]={};
				}
				if(k==cIdx){
				  //branchCrossLine[k].hLineLeft = true;
				  branchCrossLine[k].toLeft = true;
				}else if(k==data.colMeta.colIndex){
				  branchCrossLine[k].hLineRight = true;
				}else{
				  branchCrossLine[k].hLineLeft = true;
				  branchCrossLine[k].hLineRight = true;
				}
			  }
			}else if(cIdx<data.colMeta.colIndex){
			  for (var k= data.colMeta.colIndex;k<cIdx;k-- ){
				if(!branchCrossLine[k]){
				  branchCrossLine[k]={};
				}
				if(k==cIdx){
				  //branchCrossLine[k].hLineRight = true;
			      branchCrossLine[k].toRight = true;
				}else if(k==data.colMeta.colIndex){
				  branchCrossLine[k].hLineLeft = true;
				}else{
				  branchCrossLine[k].hLineLeft = true;
				  branchCrossLine[k].hLineRight = true;
				}
			  }
			}
		  }
	    }
	    
	    //判断start 和 end 从其他的分支判断
	    for(var idx = 0; idx < cols[colIndex].length; idx++){
	      var bIdx = cols[colIndex][idx];
		  if(branchStatuses[bIdx]==='drawing'){
		    //要不要收尾看下一个节点的情况
		    var nextData = datas[parseInt(i)+1];
		    /*
			if(data.id ==='5'){
				console.log('end,end,end, bIdx:',bIdx,'status:',branchStatuses[bIdx]);
				console.log('end,end,end, bIdx:',bIdx,'data.colMeta.branchIndex:',bIdx);
			  }
			  */
		    if(nextData && nextData.colMeta.fromBranchs && nextData.colMeta.fromBranchs.indexOf(bIdx)>=0){
		      branchStatuses[bIdx] = 'toEnd';
//		      if(!branchCrossLine[bIdx]){
//			    branchCrossLine[bIdx]={};
//			  }
//		      if(nextData.colMeta.colIndex>colIndex){
//		        branchCrossLine[bIdx].toRight = true;
//		      }else if(nextData.colMeta.colIndex<colIndex){
//		        branchCrossLine[bIdx].toLeft = true;
//		      }
		    }
		  }else if(branchStatuses[bIdx]==='end'){
			//从哪里分裂出来的
			//var preData = datas[parseInt(i)-1];
			if(!branchCrossLine[bIdx]){
			  branchCrossLine[bIdx]={};
			}
			if(data.colMeta.colIndex < colIndex){
			  branchCrossLine[bIdx].toLeft = true;
			}else if(data.colMeta.colIndex > colIndex){
			  branchCrossLine[bIdx].toRight = true;
			}
		  }
	    }
	  }//of colIndex
	  
	  //正式绘制
	  var $row = $('<div>').addClass('row');
	  for(var colIndex = 0;colIndex<cols.length;colIndex++){
		$col = $('<div>').addClass('col');
		console.log('branchStatuses[colIndex]:',branchStatuses[colIndex],'row:',i,'colIndex:',colIndex);
        if(branchStatuses[colIndex]!=='start'&&branchStatuses[colIndex]!=='end'
        	&&branchStatuses[colIndex]!=='toEnd'&&branchStatuses[colIndex]!=='drawing'&&!branchCrossLine[colIndex]){
          changeBranchStatus(colIndex,branchStatuses,cols);
          $row.append($col);
          continue;
		}
		var fromLeft = branchCrossLine[colIndex]?.fromLeft;	
		var fromRight = branchCrossLine[colIndex]?.fromRight;
		var toLeft = branchCrossLine[colIndex]?.toLeft;	
		var toRight = branchCrossLine[colIndex]?.toRight;	
		var hLineLeft = branchCrossLine[colIndex]?.hLineLeft;
		var hLineRight = branchCrossLine[colIndex]?.hLineRight;
		
		  //正式绘制小方格里的内容
		  if(toLeft || fromLeft || hLineLeft){
		    if(fromLeft && !toLeft && !hLineLeft){
			  $col.append('<div class="oblique_from_left margin_top"></div>');
		    }else if(toLeft && !fromLeft && !hLineLeft){
		      $col.append('<div class="oblique_to_left"></div>');
			}else if(!fromLeft && !toLeft && hLineLeft){
			  $col.append('<div class="h-line-half margin_top"></div>');
			}else{
			  //三者必有其二
			  var topMargined = false;
			  var $wrap = $('<div class="v_wrap">');
			  if(fromLeft){
				topMargined = true;
			    $wrap.append('<div class="oblique_from_left" >');
			  }
			  if(hLineLeft){
				if(!topMargined){
				  $wrap.append('<div class="h-line-half margin_top" >');
				  topMargined = true;
				}else{
				  $wrap.append('<div class="h-line-half" >');
				}
			  }
			  if(toLeft){
				if(!topMargined){
				  $wrap.append('<div class="oblique_to_left margin_top" >');
				  topMargined = true;
				}else{
				  $wrap.append('<div class="oblique_to_left" >');
				}
			  }
			  $col.append($wrap);
			}
		  }else if(toRight || fromRight || hLineRight){
			//三者皆无且右边三者有其一
			$col.append('<div class="empty"></div>');
		  }
		  //此处是中间的那条线加一个点
		  var $vLine = {};
		  if(branchStatuses[colIndex]==='start'){
			//汇聚而来
			$vLine = $('<div style="display: inline-block"></div>');
		  }else if(branchStatuses[colIndex]==='end'){
			$vLine = $('<div style="display: inline-block"></div>');
		  }else if(branchStatuses[colIndex]==='drawing' || branchStatuses[colIndex]==='toEnd' ){
		    $vLine = $('<div class="v-line"></div>');
		  }else{
			$vLine = $('<div class="center_point"></div>');
		  }
		  if(data.colMeta.colIndex == colIndex){
			$vLine.append('<div class="dot"></div>');
		  }
		  $col.append($vLine);
			
		  if(toRight || fromRight || hLineRight ){
		    if(fromRight && !toRight && !hLineRight){
			  $col.append('<div class="oblique_from_right"></div>');
		    }else if(toRight && !fromRight && !hLineRight ){
		      $col.append('<div class="oblique_to_right"></div>');
		    }else if(!fromRight && !toRight && hLineRight){
			  $col.append('<div class="h-line-half"></div>');
			}else{
			  //三者必有其二
			  var topMargined = false;
			  var $wrap = $('<div class="v_wrap">');
			  if(fromRight){
				topMargined = true;
			    $wrap.append('<div class="oblique_from_right" >');
			  }
			  if(hLineRight){
				if(!topMargined){
				  $wrap.append('<div class="h-line-half margin_top" >');
				  topMargined = true;
				}else{
				  $wrap.append('<div class="h-line-half" >');	
				}
			    
			  }
			  if(toRight){
				if(!topMargined){
				  $wrap.append('<div class="oblique_to_right margin_top" >');
				  topMargined = true;
				}else{
				  $wrap.append('<div class="oblique_to_right" >');
				}
				
			  }
			  $col.append($wrap);
			}
		  }else if(toLeft || fromLeft || hLineLeft){
			//三者全无，且
		    $col.append('<div class="empty"></div>');
		  }
		  
		/*
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
//			  if(data.id ==='5'){
//			    console.log('i:',i,'(i+1):',i+1,'datas.length:',datas.length,'nextData:',datas[i+1]);
//			    console.log('nextData.colMeta.fromBranchs:',nextData.colMeta.fromBranchs);
//			    console.log('branchIdx:',branchIdx);
//			}
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
		*/
		$row.append($col);
		//改变状态
		changeBranchStatus(colIndex,branchStatuses,cols);
	  }// of colIndex
	  
	  //绘制完毕开始填写日期和文字
	  $row.append('<div class="col text">'+data.timestamp+'</div>');
	  $row.append('<div class="col text">'+data.text+'</div>');
	  $(that).append($row);
	}//of row
  }
  
  /**
   * 改变状态
   */
  var changeBranchStatus = function(colIndex,branchStatuses,cols){
	for(var k in cols[colIndex]){
	  branchIdx = cols[colIndex][k];
	  if(branchStatuses[branchIdx]==='toStart'){
		branchStatuses[branchIdx]='start';
	  }else if(branchStatuses[branchIdx]==='toEnd'){
		branchStatuses[branchIdx]='end';
	  }else if(branchStatuses[branchIdx]==='start'){
	    branchStatuses[branchIdx]='drawing';
	  }else if(branchStatuses[branchIdx]==='end'){
		branchStatuses[branchIdx]='empty';
	  }
	}  
  }
  
  /**
   * 查某分支是在哪一列中的
   */
  var getColIndxByBranch = function (bIdx,cols){
	for(var i in cols){
	  if(cols[i].indexOf(String(bIdx))>=0){
		return i;
	  }
	}
	return -1;
  }
  
})(jQuery);