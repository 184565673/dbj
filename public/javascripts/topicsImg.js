var clickBtn = null;
$('.file_list a').click(function() {
	clickBtn = this;
	$('#funcBox h3').html($(this).find('.own').html());
	$('#funcBox').modal('show');
	return false;
})


$('#funcBox .btn-success:eq(0)').on('click', function() {
	var path = $(clickBtn).attr('path');
	
	var $btn = $(this).button('loading');

	$.getEx(svrUrl,'/topics/updateImg', {file: $(clickBtn).find('.own').html(), version: getUrlPath()[1], path : path}, function(rtnData) {
		$btn.button('reset');
		if( rtnData.rtn == 0) {
			$('#funcBox').modal('hide');
			alert('更新成功');
		}
	})
	return false;
})

$('#updateBtn').on('click', function() {
	var path = $(clickBtn).attr('path');
	
	var $btn = $(this).button('loading');

	$.getEx(svrUrl,'/topics/updateAllImg', {version: getUrlPath()[1]}, function(rtnData) {
		$btn.button('reset');
		if( rtnData.rtn == 0) {
			alert('更新成功');
			location.reload();
		}
	})
	return false;
})

