var filewalker = require("filewalker");
var fs = require("fs");

module.exports = (function() {
    "use strict";
    
    var Finder = function() {
        
    };
    
    Finder.prototype.search = function(text, callback) {
        var lowerText = text.toLowerCase();
        
        var result = [];
    
        filewalker(atom.project.getDirectories()[0].getPath())
            .on("file", function(path, stats, absPath) {
                if ( !/.css$/.test(path) ) {
                    return;
                }
    
                var fileResult = {
                    file: path,
                    result: []
                };
                var content = fs.readFileSync(absPath).toString(),
                    lines = content.split(/[\r]/g),
                    line;
    
                for (var i=0, n=lines.length; i<n; i++) {
                    line = lines[i];
    
                    if ( line.toLowerCase().indexOf(lowerText) != -1 ) {
                        fileResult.result.push({
                            line: line,
                            index: i
                        });
                    }
                }
                
                if ( fileResult.result.length ) {
                    result.push( fileResult );
                }
            })
            .on("done", function() {
                console.log("done");
                callback(result);
            }.bind(this))
            .walk();
    };
    

    return Finder;
}());
