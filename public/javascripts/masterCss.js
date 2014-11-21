var clickBtn = null;
$('.file_list a').click(function() {
	clickBtn = this;
	$('#funcBox h3').html($(this).find('.own').html());
	$('#funcBox').modal('show');
	return false;
})


$('#funcBox .btn-primary').on('click', function() {
	var path = $(clickBtn).attr('path');
	
	var $btn = $(this).button('loading');

	$.getEx(svrUrl,'/master/compressCss', {file: path}, function(rtnData) {
		$btn.button('reset');
		if( rtnData.rtn == 0) {
			$('#funcBox').modal('hide');
			alert('压缩成功');
		}
	})
	return false;
})

$('#funcBox .btn-success:eq(0)').on('click', function() {
	var path = $(clickBtn).attr('path');
	
	var $btn = $(this).button('loading');

	$.getEx(svrUrl,'/master/updateCss', {file: $(clickBtn).find('.own').html(), version: getUrlPath()[1], path : path}, function(rtnData) {
		$btn.button('reset');
		if( rtnData.rtn == 0) {
			$('#funcBox').modal('hide');
			alert('更新成功');
		}
	})
	return false;
})

$('#funcBox .btn-success:eq(1)').on('click', function() {
	var path = $(clickBtn).attr('path');
	
	var $btn = $(this).button('loading');

	$.getEx(svrUrl,'/master/updateCss', {file: $(clickBtn).find('.own').html(), version: getUrlPath()[1], path : path, addVer: 1}, function(rtnData) {
		$btn.button('reset');
		if( rtnData.rtn == 0) {
			$('#funcBox').modal('hide');
			alert('更新成功');
		}
	})
	return false;
})