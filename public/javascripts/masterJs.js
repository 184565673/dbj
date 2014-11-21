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

	$.getEx(svrUrl,'/master/compressJs', {file: path}, function(rtnData) {
		$btn.button('reset');
		if( rtnData.rtn == 0) {
			$('#funcBox').modal('hide');
			alert('压缩成功');
		}
	})
	return false;
})
