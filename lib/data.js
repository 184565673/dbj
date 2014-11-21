var utils = require('./utils');
var fs = require('fs');
var path = require('path');
var masterDir = '../..';
var ver = '1.9.3';
var UglifyJS = require("uglify-js");

var result = UglifyJS.minify([ './data.js' ]);