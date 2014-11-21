var utils = require('./utils');
var fs = require('fs');
var path = require('path');
var masterDir = '../..';
var ver = '1.9.3';
var UglifyJS = require("uglify-js");

fs.readFile('//192.168.8.188/temp/test.txt','utf8',function(error,data){
	console.log(data);
})