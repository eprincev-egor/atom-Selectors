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

    Walker.prototype._checkIgnoreFile = function(dir, fileName) {
        if ( !fs.existsSync(dir + this.slash + fileName) ) {
            return;
        }

        var ignore = fs.readFileSync(dir + this.slash + fileName).toString(),
            ignoreLine,
            i, n;

        ignore = ignore.split(/[\n\r]+/g);
        for (i=0, n=ignore.length; i<n; i++) {
            ignoreLine = ignore[i];

            ignoreLine = ignoreLine.replace(/\/\*$/, "");
            ignoreLine = ignoreLine.replace(/\/$/, "");
            ignoreLine = ignoreLine.trim();
            if ( !ignoreLine ) {
                continue;
            }
            this._excludes.push(dir + this.slash + ignoreLine);
        }
    };

    Walker.prototype._walk = function(dir) {
        var files = fs.readdirSync(dir),
            file,
            stat,
            absPath, path,
            i, n;

        this._checkIgnoreFile(dir, ".gitignore");
        this._checkIgnoreFile(dir, ".selectors-ignore");

        for (i=0, n=files.length; i<n; i++) {
            file = files[i];
            absPath = dir + this.slash + file;
            try {
                stat = fs.statSync(absPath);
            } catch(e) {
                console.error(e);
                continue;
            }
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
