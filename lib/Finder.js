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
                    selectors: []
                };
                var content = fs.readFileSync(absPath).toString(),
                    lines = content.split(/[\r]/g),
                    selectors = this.lines2selectors(lines);
                
                fileResult.selectors = [];
                for (var i=0, n=selectors.length; i<n; i++) {
                    if ( this.checkSelector(selectors[i], lowerText) ) {
                        fileResult.selectors.push(selectors[i]);
                    }
                }
                
                if ( fileResult.selectors.length ) {
                    result.push( fileResult );
                }
            }.bind(this))
            .on("done", function() {
                console.log("done");
                callback(result);
            }.bind(this))
            .walk();
    };
    
    Finder.prototype.lines2selectors = function(lines) {
        var selectors = [];
        
        var add = function(start, end) {
            var subLines = lines.slice(start.line, end.line+1);
            var subLine;
            
            if ( !subLines.length ) {
                return;
            }
            
            subLine = subLines[0];
            subLine = subLine.slice(start.col);
            subLine = subLine.replace(/^(\s*\})+/, "");
            subLines[0] = subLine;
            
            subLine = subLines[subLines.length - 1];
            subLine = subLine.slice(0, end.col);
            subLines[subLines.length - 1] = subLine;
            
            var text = subLines.join("\r");
            // удалаяем начальные фигурные скобуи
            text = text.replace(/^(\s*\})+/, "");
            // удаляем пустые строки
            text = text.replace(/^\s*$/mg, "");
            // удаляем комменатрии
            text = text.replace(/\/\*(\s|.)*?\*\//g, "");
            text = text.trim();
            
            // пустые селекторы нас не устраивают
            if ( !text ) {
                return;
            }
            
            // отсекаем font-face и прочее
            if ( text[0] == "@" ) {
                return;
            }
            
            selectors.push({
                line: start.line,
                col: start.col,
                text: text
            });
        };
        
        var comment = false, 
            opened = 0,
            line, symb,
            startPos = {line: 0, col: 0};
        
        for (var i=0, n=lines.length; i<n; i++) {
            line = lines[i];
            
            for (var j=0, m=line.length; j<m; j++) {
                symb = line[j];
                
                if ( symb == "\/" && line[j+1] == "*" ) {
                    comment = true;
                    j++;
                    continue;
                }
                
                if ( symb == "*" && line[j + 1] == "\/" ) {
                    comment = false;
                    j++;
                    continue;
                }
                
                if ( comment ) {
                    continue;
                }
                
                if ( symb == "{" ) {
                    if ( opened === 0 ) {
                        add(startPos, {line: i, col: j});
                    }
                    opened++;
                }
                
                if ( symb == "}" ) {
                    opened--;
                    if ( opened === 0 ) {
                        startPos = {line: i, col: j};
                    }
                }
            }
        }
        
        return selectors;
    };
    
    Finder.prototype.checkSelector = function(selector, subSelector) {
        if ( !subSelector ) {
            return true;
        }
        
        selector = selector.text;
        var selectors = selector.split(/[,\s+]/g);
        for (var i=0, n=selectors.length; i<n; i++) {
            selector = selectors[i];
            if ( selector.indexOf(subSelector) != -1 ) {
                return true;
            }
        }
        
        return false;
    };
    
    return Finder;
}());
