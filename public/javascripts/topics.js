//创建主体版本
$('#createBtn').on('click', function () {
	$('#createBox').modal('show');
	return false;
})

$('#createBox input').tooltip();
$('#createBox .btn-primary').on('click', function() {
	var version = $('#createBox input').val();
	if(version.length == 0 ) {
		$('#createBox input').tooltip('show');
		return false;
	}
	var vers = _.map($('.file_list .own'), function(item) {
		return item.innerHTML;
	})

	if(_.contains(vers, version)) {
		alert('活动已存在');
		return false;
	}
	var $btn = $(this).button('loading');
	$.getEx(svrUrl,'/topics/create', {version: version}, function(rtnData) {
		$btn.button('reset')
		if( rtnData.rtn ==0) {
			$('.file_list ul').append('<li>\
						<a href="#">\
							<img src="/images/folder.png"/>\
							<h3 class="own">'+version+'</h3>\
						</a>\
					</li>');
			$('#createBox').modal('hide');
			alert('创建成功')
		}
	})
	return false;
})

//删除活动
$('#delBtn').on('click', function () {
	$('#delBox').modal('show');
	return false;
})

$('#delBox input').tooltip();

$('#delBox .btn-danger').on('click', function() {
	var version = $('#delBox input').val();
	if(version.length == 0 ) {
		$('#delBox input').tooltip('show');
		return false;
	}
	var vers = _.map($('.file_list .own'), function(item) {
		return item.innerHTML;
	})

	if(!_.contains(vers, version)) {
		alert('活动不存在，请重新输入');
		return false;
	}
	var $btn = $(this).button('loading');

	$.getEx(svrUrl,'/topics/del', {version: version}, function(rtnData) {
		$btn.button('reset');
		if( rtnData.rtn == 0) {
			$('.file_list li').each(function(index, elem) {
				if($(elem).find('.own').html() == version) {
					$(elem).remove();
				}
			})
			$('#delBox').modal('hide');
			alert('删除成功')
		}
	})
	return false;
})

//打包主体版本
$('#deployBtn').on('click', function () {
	$('#deployBox').modal('show');
	return false;
})

$('#deployBox input').tooltip();

$('#deployBox .btn-info').on('click', function() {
	var version = $('#deployBox input').val();
	if(version.length == 0 ) {
		$('#deployBox input').tooltip('show');
		return false;
	}
	var vers = _.map($('.file_list .own'), function(item) {
		return item.innerHTML;
	})

	if(!_.contains(vers, version)) {
		alert('活动不存在，请重新输入');
		return false;
	}
	var $btn = $(this).button('loading');

	$.getEx(svrUrl,'/topics/deploy', {version: version}, function(rtnData) {
		$btn.button('reset');
		if( rtnData.rtn == 0) {
			$('#deployBox').modal('hide');
			alert('打包成功');
		}
	})
	return false;
})

$('.file_list a').click(function() {
	var ver = $(this).find('.own').html();
	
})