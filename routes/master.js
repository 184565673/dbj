var express = require('express');
var router = express.Router();
var fs = require('fs');
var config = require('../config')
var _ = require('underscore');
var path = require('path');
var utils = require('../lib/utils');
var UglifyJS = require("uglify-js");
var CleanCSS = require('clean-css');

var masterDir = path.resolve(config.masterDir);

/* GET master page. */
router.get('/', function (req, res) {
	utils.readdir(masterDir, function(file, stat) {
		return stat.isDirectory() && /^[\d\.]+$/.test(file);
	}, function(error, files) {
		if(error) res.send('数据加载失败，请重试');
		res.render('master', {masters: files});
	})
});

router.get('/create', function(req,res){
	var ver = req.query.version;
	var oldVer = req.query.oldVersion;
	utils.copydir(masterDir + '/' + oldVer, masterDir + '/' + ver, new RegExp('(^\.svn|db)$'), function() {
		utils.renamedir(masterDir + '/' + ver, oldVer.split('.').join('_'), ver.split('.').join('_'), function() {
			utils.replaceContent(masterDir+'/'+ver, new RegExp('('+oldVer.split('.').join('\\.')+'|'+oldVer.split('.').join('_')+')', 'gmi') , function (match) {
				return match.indexOf('.') != -1? ver : ver.split('.').join('_');
			}, function() {
				res.jsonp({ rtn: 0 });
			})
		})

	})
	
})
 
router.get('/del', function(req,res){
	var ver = req.query.version;
	utils.rmdir(masterDir + '/' + ver, function(error) {
		if (error) {
			res.jsonp({rtn:500, msg: error.toString()});
		} else {
			res.jsonp({rtn : 0});
		}	
	})
})

router.get('/deploy', function(req,res){
	var ver = req.query.version;
	utils.rmdir('../deploy/' + ver, function() {
		utils.copydir(masterDir + '/' + ver, '../deploy/' + ver, function() {
			utils.fileWalk('../deploy/' + ver, function(file) {
				if (path.extname(file) == '.js') {
					var result = UglifyJS.minify([ file ]);
					fs.writeFileSync(file, result.code, 'utf8');
				} else if (path.extname(file) == '.css') {
					var source = fs.readFileSync(file,'utf8');
					var minimized = new CleanCSS().minify(source);
					fs.writeFileSync(file, minimized, 'utf8');
				}
			}, function() {
				utils.zipFolder('../deploy/' + ver + '/kankan.com','../deploy/html.zip',function(){
					
				})
				utils.zipFolder('../deploy/' + ver + '/kanimg.com','../deploy/img.zip',function(){
					
				})
				utils.zipFolder('../deploy/' + ver + '/xunlei.com','../deploy/js.zip',function(){
					
				})
				res.jsonp({rtn : 0});
			})
		})
	})	
})

router.get('/compressCss', function(req, res) {
	var file = req.query.file;
	var dest = '../deploy/' + path.basename(file, '.css') + '.css';
	utils.copydir(file, dest, function() {
		var source = fs.readFileSync(dest, 'utf8');
		var minimized = new CleanCSS().minify(source);
		fs.writeFileSync(dest, minimized, 'utf8');
		res.jsonp({rtn:0});
	})
})

router.get('/compressJs', function(req, res) {
	var file = req.query.file;
	var dest = '../deploy/' + path.basename(file, '.js') + '.js';
	utils.copydir(file, dest, function() {
		var result = UglifyJS.minify([ dest ]);
		fs.writeFileSync(dest, result.code, 'utf8');
		res.jsonp({rtn:0});
	})
})

router.get('/updateCss', function(req, res){
	var file = req.query.file;
	var ver = req.query.version;
	var file_path = req.query.path;
	var addVer = req.query.addVer;
	var ftpPath = config['css_' + ver.split('.').join('_')];
	utils.fileWalk(ftpPath, function(f) {
		if (path.extname(f) == '.css' && (path.basename(f, '.css') == path.basename(file, '.css')) ) {
			var prevContent = fs.readFileSync(file_path,'utf8');
			prevContent = /(\.png|\.jpg)(\?v=(\d+))?/.exec(prevContent);
			if (addVer) {
				prevContent && (prevContent = parseInt(prevContent[3]) + 1) || (prevContent = 1);
			} else {
				prevContent && (prevContent = prevContent[3]) || (prevContent = 0);
			}
			
			var nowContent = fs.readFileSync(f,'utf8').replace(/\.\./gm, 'http://img.vip.kankan.kanimg.com/'+ver.split('.').join('_'));
			prevContent && (nowContent = nowContent.replace(/\.(jpg|png)(\?v=[?:\.\d]*)?/gmi,'.$1?v='+prevContent));
			fs.writeFileSync(file_path,nowContent,'utf8');
		}
	}, function() {
		res.jsonp({rtn:0});
	})
})

router.get(/([\d\.]+)(\/)?$/, function(req, res) {
	res.render('masterVer',{ver : req.params[0]});
});

router.get(/([\d\.]+)\/css?$/, function(req, res) {
	var ver = req.params[0];
	var cssFiles = [];
	utils.fileWalk(masterDir + '/' + ver + '/xunlei.com', function(file) {
		if (path.extname(file) == '.css') {
			cssFiles.push({basename:path.basename(file,'.css'), path : file});
		}
	}, function() {
		res.render('masterCss',{cssFiles:cssFiles});
	})
});

router.get(/([\d\.]+)\/js?$/, function(req, res) {
	var ver = req.params[0];
	var jsFiles = [];
	utils.fileWalk(masterDir + '/' + ver + '/xunlei.com', function(file) {
		if (path.extname(file) == '.js') {
			jsFiles.push({basename:path.basename(file,'.js'), path : file});
		}
	}, function() {
		res.render('masterJs',{jsFiles:jsFiles});
	})
});



module.exports = router;
	