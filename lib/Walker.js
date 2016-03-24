var fs = require("fs");
var EventEmitter = require('events');
var util = require('util');

module.exports = (function() {
    "use strict";
    
    var Walker = function(root, options) {
        options = options || {};
        this.root = root;
        this.slash = "\\";
        this._excludes = options.exclude || [];
        this._excludes = this._excludes.map(function(path) {
            return this.root + this.slash + path;
        }, this);
        
    };
    
    util.inherits(Walker, EventEmitter);
    
    Walker.prototype.walk = function() {
        this._walk(this.root);
        this.emit("done");
    };
    
    Walker.prototype._walk = function(dir) {        
        var files = fs.readdirSync(dir), 
            file, 
            stat,
            absPath, path;
        
        for (var i=0, n=files.length; i<n; i++) {
            file = files[i];
            absPath = dir + this.slash + file;
            stat = fs.statSync(absPath);
            path = absPath.slice(this.root.length);
            path = path.replace(this.slash, "");
            
            
            if ( stat.isFile() ) {
                this.emit("file", path, stat, absPath);
            }
            if ( stat.isDirectory() ) {
                if ( this._excludes.indexOf(absPath) == -1 ) {
                    this._walk(absPath);
                }
            }
        }
    };
    
    return Walker;
}());
