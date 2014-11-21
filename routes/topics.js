var express = require('express');
var router = express.Router();
var fs = require('fs');
var config = require('../config')
var _ = require('underscore');
var path = require('path');
var utils = require('../lib/utils');
var UglifyJS = require("uglify-js");
var CleanCSS = require('clean-css');

var topicsDir = path.resolve(config.topicsHtmlDir);

/* GET master page. */
router.get('/', function (req, res) {
	utils.readdir(config.topicsHtmlDir, function(file, stat) {
		return stat.isDirectory();
	}, function(error, files) {
		if(error) res.send('数据加载失败，请重试');
		res.render('topics', {topics: files});
	})
});

router.get('/create', function(req,res){
	var ver = req.query.version;
	var ftpPath = config['topic_'+ver];
	utils.rmdir('../deploy/'+ver, function() {
		fs.mkdirSync(config.topicsHtmlDir+ver);
		fs.mkdirSync(config.topicsImgDir+ver);
		fs.mkdirSync(config.topicsJsDir+ver);
		utils.copydir(ftpPath, '../deploy/'+ver, function() {
	
			//处理图片
			utils.readdir('../deploy/'+ver, function(file, stat) {
				return stat.isDirectory() && /(img|image)\.*$/.test(path.basename(file))
			},function(error, files) {
				_.each(files, function(f) {
					utils.copydir('../deploy/'+ver + '/' +f, config.topicsImgDir + ver +'/' + path.basename(f), function() {
						console.log('img done')
					})
				})
			});

			//处理静态文件
			utils.fileWalk('../deploy/'+ver, function(file) {
				if (path.extname(file) == '.css') {
					console.log(file)
					utils.replaceContent(file, /\.\./gmi, 'http://img.vip.kankan.kanimg.com/topics/'+ver, function() {})
				}
			},function() {
				utils.readdir('../deploy/'+ver, function(file, stat) {
					return stat.isDirectory() && /(js|css|style)\.*$/.test(path.basename(file))
				},function(error, files) {
					_.each(files, function(f) {
						utils.copydir('../deploy/'+ver + '/' +f, config.topicsJsDir + ver +'/' + path.basename(f), function() {
							console.log('css and js done')
						})
					})
				});
			});
		
			//处理html
			var htmlCode = fs.readFileSync('../deploy/'+ver+'/index.html','utf8');
			htmlCode = htmlCode.replace(/<footer[\s]+[^>]+>([^<>]+)<\/footer>/gi,'<!--#include file="/topics/footer.html"-->');
			htmlCode = htmlCode.replace(/<body>/gi,'<body>\n<!--#include file="/topics/miniHeaderNav.html"-->');
		    htmlCode = htmlCode.replace(/<\/body>/gi,'<div style="display:none">\n\
			    <script type="text/javascript">\n\
			      var _bdhmProtocol = (("https:" == document.location.protocol) ? "https://" : "http://");\n\
			      document.write(unescape("%3Cscript src=\'" + _bdhmProtocol + "hm.baidu.com/h.js%3Faaefde657959841081501ceac6f9c1df\' type=\'text/javascript\'%3E%3C/script%3E"));\n\
			    </script>\n\
			  </div>\n\
			  <script src="<!--#echo var="staticBaseUrl"-->common/js/jquery-1.7.1.min.js?updateVer=<!--#echo var="updateVer"-->"></script>\n\
			  <script src="<!--#echo var="staticBaseUrl"-->common/js/common_web_topics.js?updateVer=<!--#echo var="updateVer"-->"></script>\n\
			  <script src="<!--#echo var="staticBaseUrl"-->common/js/base.js?updateVer=<!--#echo var="updateVer"-->"></script>\n\
			  <script src="<!--#echo var="staticBaseUrl"-->common/js/'+ver+'.js?updateVer=1.0"></script>\n\
			  <script src="<!--#echo var="staticBaseUrl"-->common/js/fx_click.js?updateVer=<!--#echo var="updateVer"-->"></script>\n\
			</body>');
		    htmlCode = htmlCode.replace('</head>','<!--#include file="/topics/header_v2.html"-->\n\
				<link rel="stylesheet" href="<!--#echo var="staticBaseUrl"-->'+ver+'/css/'+/\/(.+)\.css/.exec(htmlCode)[1]+'.css?v=1" />\n\
				<script type="text/javascript">var actId = \''+ver+'\';</script>\n\
				</head>');
		  	fs.writeFileSync('../deploy/'+ver+'/index.html',htmlCode);
		  	utils.readdir('../deploy/'+ver, function(file, stat) {
				return !stat.isDirectory() && path.extname(file) == '.html'
			},function(error, files) {
				_.each(files, function(f) {
					utils.copydir('../deploy/'+ver + '/' +f, config.topicsHtmlDir + ver +'/' + path.basename(f), function() {
						console.log('html done')
					})
				})
			});

			res.jsonp({rtn: 0});
		})	
	})	
})
 
router.get('/del', function(req,res){
	var ver = req.query.version;
	utils.rmdir(config.topicsHtmlDir + '/' + ver, function(error) {
		if (error) {
			res.jsonp({rtn:500, msg: error.toString()});
		} else {
			utils.rmdir(config.topicsJsDir + '/' + ver, function(error) {
				if (error) {
					res.jsonp({rtn:500, msg: error.toString()});
				} else {
					utils.rmdir(config.topicsImgDir + '/' + ver, function(error) {
						if (error) {
							res.jsonp({rtn:500, msg: error.toString()});
						} else {
							res.jsonp({rtn : 0});
						}	
					})
				}	
			})
		}	
	})
})

router.get('/deploy', function(req,res){
	var ver = req.query.version;
	utils.rmdir('../deploy/' + ver, function() {
		fs.mkdirSync('../deploy/'+ver);
		fs.mkdirSync('../deploy/'+ ver + '/html');
		fs.mkdirSync('../deploy/'+ ver + '/img');
		fs.mkdirSync('../deploy/'+ ver + '/static');

		utils.copydir(config.topicsHtmlDir + '/' + ver, '../deploy/' + ver + '/html/' + ver, function() {
			utils.zipFolder('../deploy/' + ver + '/html','../deploy/'+ver+'/html.zip',function(){})
		})
		utils.copydir(config.topicsImgDir + '/' + ver, '../deploy/' + ver + '/img/' + ver, function() {
			utils.zipFolder('../deploy/' + ver + '/img','../deploy/'+ver+'/img.zip',function(){})
		})
		utils.copydir(config.topicsJsDir + '/' + ver, '../deploy/' + ver + '/static/' + ver, function() {
			utils.fileWalk('../deploy/' + ver + '/static', function(file) {
				if (path.extname(file) == '.js') {
					var result = UglifyJS.minify([ file ]);
					fs.writeFileSync(file, result.code, 'utf8');
				} else if (path.extname(file) == '.css') {
					var source = fs.readFileSync(file,'utf8');
					var minimized = new CleanCSS().minify(source);
					fs.writeFileSync(file, minimized, 'utf8');
				}
			}, function() {
				utils.zipFolder('../deploy/' + ver + '/static','../deploy/'+ver+'/static.zip',function(){})
			})
		})
		
		res.jsonp({rtn: 0});
	})	
})

router.get('/compressCss', function(req, res) {
	var file = req.query.file;
	var dest = '../deploy/' + path.basename(file, '.css') + '.css';
	utils.rmdir(dest, function() {
		utils.copydir(file, dest, function() {
			var source = fs.readFileSync(dest, 'utf8');
			var minimized = new CleanCSS().minify(source);
			fs.writeFileSync(dest, minimized, 'utf8');
			res.jsonp({rtn:0});
		})
	})
	
})

router.get('/compressJs', function(req, res) {
	var file = req.query.file;
	var dest = '../deploy/' + path.basename(file, '.js') + '.js';
	utils.rmdir(dest,function() {
		utils.copydir(file, dest, function() {
			var result = UglifyJS.minify([ dest ]);
			fs.writeFileSync(dest, result.code, 'utf8');
			res.jsonp({rtn:0});
		})
	})
})

router.get('/updateCss', function(req, res){
	var file = req.query.file;
	var ver = req.query.version;
	var file_path = req.query.path;
	var addVer = req.query.addVer;
	var ftpPath = config['topic_'+ver];
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

router.get('/updateImg', function(req, res){
	var file = req.query.file;
	var ver = req.query.version;
	var file_path = req.query.path;
	var ftpPath = config['topic_'+ver];
	utils.fileWalk(ftpPath, function(f) {
		if (path.basename(f, path.extname(f)) == path.basename(file, path.extname(f))) {
			utils.copydir(f, file_path, function() {

			})
		}
	}, function() {
		res.jsonp({rtn:0});
	})
})

router.get('/updateAllImg', function(req, res){
	var ver = req.query.version;
	var ftpPath = config['topic_'+ver];
	utils.readdir(ftpPath, function(file ,stat) {
		return stat.isDirectory() && /(img|image).*/.test(path.basename(file));
	}, function(error,files) {
		_.each(files, function(file) {
			utils.rmdir(config.topicsImgDir+ver+'/'+file, function() {
				utils.copydir(ftpPath + '/' + file, config.topicsImgDir+ver+'/'+path.basename(file), /\.db$/, function(){

				});
			})
		})
		
		res.jsonp({rtn: 0});
	})
})

router.get(/^\/([^\/]+)$/, function(req, res) {
	res.render('topicsVer',{ver : req.params[0]});
});

router.get(/([a-z0-9A-Z_]+?)\/css$/, function(req, res) {
	var ver = req.params[0];
	var cssFiles = [];
	utils.fileWalk(config.topicsJsDir + ver , function(file) {
		if (path.extname(file) == '.css') {
			cssFiles.push({basename:path.basename(file,'.css'), path : file});
		}
	}, function() {
		res.render('topicsCss',{cssFiles:cssFiles});
	})
});

router.get(/([a-z0-9A-Z_]+?)\/js$/, function(req, res) {
	var ver = req.params[0];
	var jsFiles = [];
	utils.fileWalk(config.topicsJsDir + '/' + ver , function(file) {
		if (path.extname(file) == '.js') {
			jsFiles.push({basename:path.basename(file,'.js'), path : file});
		}
	}, function() {
		res.render('topicsJs',{jsFiles:jsFiles});
	})
});

router.get(/([a-z0-9A-Z_]+?)\/img$/, function(req, res) {
	var ver = req.params[0];
	var imgFiles = [];
	utils.fileWalk(config.topicsImgDir + '/' + ver, function(file) {
		if(path.extname(file) == '.png' || path.extname(file) == '.jpg' || path.extname(file) == '.gif')
		imgFiles.push({basename:path.basename(file), path : file});
	}, function() {
		res.render('topicsImg',{imgFiles:imgFiles});
	})
});



module.exports = router;
	