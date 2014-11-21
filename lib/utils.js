var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var archiver = require('archiver');


var copydir = exports.copydir = function (src , dest, filter, callback) {
    src = path.normalize(src);
    dest = path.normalize(dest);

    if (fs.existsSync(src)) {

        var stat = fs.statSync(src),
            filterPass = false;
        arguments.length == 3 && (callback = filter) && (filter = null);

        if (filter instanceof RegExp) {
            !filter.test(src) && (filterPass = true)
        } else if (typeof filter == 'function') {
            !filter(src) && (filterPass = true)
        } else {
            filterPass = true;
        }
        if (filterPass) {
            if (stat.isDirectory()) {
                fs.mkdirSync(dest);
                readdir(src, function(error, files) {
                    if(error) {
                        callback(error);
                    }
                    if (files.length) {
                        var i = 0;
                         _.each(files, function(f) {
                            copydir(src + '/' + f, dest + '/' + f, filter, function() {
                                i++;
                                if (i == files.length) {
                                    callback();
                                }
                            });
                        });
                    } else {
                        callback();
                    }
                   
                })
            } else {
                var readStream = fs.createReadStream(src);
                var writeStream = fs.createWriteStream(dest);
                writeStream.on('close', function() {
                    callback();
                })
                readStream.pipe(writeStream);
            }
        }else{
            callback();  
        }

    } else {
        callback(new Error('找不到目录:' + src));
    }
};

var renamedir = exports.renamedir = function(cwd, from, to, callback) {
    cwd = path.normalize(cwd);
    if (fs.existsSync(cwd)) {
        readdir(cwd, function(error, files) {
            if(error) {
                callback(error);
            }
            if (files.length) {
                var i = 0;
                _.each(files, function(f) {
                    var match = false;
                    if (from instanceof RegExp) {
                        from.test(f) && (match = true)
                    }else  {
                        from == f && (match = true)
                    }

                    if (match) {
                        fs.renameSync(cwd + '/' + f, cwd + '/' + to);
                    }
                    
                    if (fs.statSync(cwd + '/' + (match?to:f) ).isDirectory()) {
                        renamedir(cwd + '/' + (match?to:f), from, to, function() {
                            i++;
                            if (i == files.length) {
                              callback();
                            }
                        })
                    } else {
                        i++;
                        if (i == files.length) {
                          callback();
                        }
                    } 
                });

            } else {
                callback();
            } 
        })
    } else {
        callback(new Error('找不到目录' + cwd));
    }
};

var replaceContent = exports.replaceContent = function (cwd, from, to, callback) {
    cwd = path.normalize(cwd);
    if (fs.existsSync(cwd)) {
        if (fs.statSync(cwd).isDirectory()) {
            readdir(cwd, function(file, stat){
                return path.extname(file) == '.html' || path.extname(file) == '.js' || path.extname(file) == '.css' || stat.isDirectory(); 
            }, function(error, files) {
                if(error) {
                    callback(error);
                }
                if (files.length) {
                    var i = 0;
                     _.each(files, function(f) {
                        replaceContent(cwd + '/' + f, from, to, function() {
                            i++;
                            if (i == files.length) {
                                callback();
                            }
                        });
                    });
                } else {
                    callback();
                }
               
            })
        } else {
            fs.readFile(cwd,'utf8', function(error, data) {
                if (error) return callback(error);
                data = data.replace(from,to);
                fs.writeFile(cwd, data, 'utf8', function(error) {
                    if (error) return callback(error);
                    callback();
                })
            });   
        }
    } else {
        callback(new Error('找不到文件和目录' + cwd));
    }
};

var readdir = exports.readdir = function (dir, filterExec, callback) {
    if (fs.existsSync(dir)) {
        fs.readdir(dir, function(err, files){
            if (err) throw err;

            var i = 0,
                retValue = [],
                needFilter = true;

            !callback && (callback = filterExec) && (needFilter = false);
            if(!files.length) {
                callback(null, files);
                return;
            }
            _.each(files, function (file) {
                var absoluteFile = path.normalize(dir + '/' + file);
                fs.stat(absoluteFile, function(err, stat) {
                    if (err) callback(err);

                    ((!needFilter) || filterExec(file, stat)) && retValue.push(file);
                    i++;
                    if (i == files.length) {
                        callback(null,retValue);
                    }
                })
            })
        })
    }else {
        callback(new Error('找不到目录:' + dir))
    }
};

var rmdir = exports.rmdir = function(cwd, callback) {
    cwd = path.normalize(cwd);
    if (fs.existsSync(cwd)) {
        if (fs.statSync(cwd).isDirectory()) {
            readdir(cwd, function (error, files) {
                if (!files.length) {
                    fs.rmdir(cwd, function() {
                        callback();
                    });
                    return;
                }
                var i = 0;
                _.each(files, function(f) {
                    rmdir(cwd + '/' + f, function() {
                        i++;
                        if (i == files.length) {
                            fs.rmdir(cwd, function() {
                                callback();
                            }); 
                        }
                    })
                })
            })
        } else {
            fs.unlink(cwd, function(error) {
                if(error) callback(error);
                else callback();
            })
        }
    } else {
         callback();
    }
};

var fileWalk = exports.fileWalk = function(cwd, walkFunc, callback) {
    cwd = path.normalize(cwd);
    if (fs.existsSync(cwd)) {
        walkFunc(cwd);
        if (fs.statSync(cwd).isDirectory()) {
            readdir(cwd, function (error, files) {
                if (!files.length) {
                    walkFunc(cwd);
                    callback()
                    return;
                }
                var i = 0;
                _.each(files, function(f) {
                    fileWalk(cwd + '/' + f, walkFunc, function() {
                        i++;
                        if (i == files.length) {
                            callback();
                        }
                    })
                })
            })
        } else {
            callback();
        }
    } else {
        callback(new Error('找不到目录或文件:' + cwd))
    }
};

var zipFolder = exports.zipFolder = function (srcFolder, zipFilePath, callback) {
    var output = fs.createWriteStream(zipFilePath);
    var zipArchive = archiver('zip');

    output.on('close', function() {
        callback();
    });

    zipArchive.pipe(output);

    zipArchive.bulk([
        { cwd: srcFolder, src: ['**/*'], expand: true }
    ]);

    zipArchive.finalize(function(err, bytes) {
        if(err) {
            callback(err);
        }
    });
}

var escapeReg = exports.escapeReg = function(source) {
  return String(source).replace(new RegExp("([.*+?^=!:\x24{}()|[\\]\/\\\\])", "g"), '\\\x241');
};