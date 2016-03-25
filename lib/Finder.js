var fs = require("fs");
var Walker = require("./Walker");

module.exports = (function() {
    "use strict";
    
    var Finder = function() {
        
    };
    
    Finder.prototype.createMap = function(callback) {
        this.map = [];
        
        new Walker(atom.project.getDirectories()[0].getPath(), {
            exclude: ["node_modules", ".git"]
        })
        .on("file", function(path, stats, absPath) {
            if ( !/.css$/.test(path) || /.min.css$/.test(path) ) {
                return;
            }
            
            var content = fs.readFileSync(absPath).toString(),
                lines = content.split(/\n/g),
                selectors = this.lines2selectors(lines);
            
            this.map.push({
                file: path,
                absPath: absPath,
                content: content,
                lines: lines,
                selectors: selectors
            });
            
        }.bind(this))
        .on("done", function() {
            console.log("done map");
            callback();
        }.bind(this))
        .walk();
    };
    
    Finder.prototype.search = function(text) {
        var textParts = this.splitSelector2parts(text),
            parts,
            result = [],
            content,
            lines,
            selectors, 
            fileResult;
        
        for (var j=0, m=this.map.length; j<m; j++) {
            selectors = this.map[j].selectors;
            
            fileResult = {
                file: this.map[j].file,
                selectors: []
            };
            
            for (var i=0, n=selectors.length; i<n; i++) {
                if ( this.checkParts(selectors[i].parts, textParts) ) {
                    fileResult.selectors.push(selectors[i]);
                }
            }
            
            if ( fileResult.selectors.length ) {
                result.push( fileResult );
            }
        }
        
        return result;
    };
    
    Finder.prototype.splitSelector2parts = function(selector) {
        selector = selector.toLowerCase().replace(/([\#\.])/g, " $1");
        return selector.replace(/\s+/, " ").trim().split(/[\s\,]+/g);
    };
    
    Finder.prototype.checkParts = function(a, b) {
        for (var i=0, n=a.length; i<n; i++) {
            for (var j=0, m=b.length; j<m; j++) {
                if ( this.checkPart(a[i], b[j]) ) {
                    return true;
                }
            }
        }
        return false;
    };
    
    Finder.prototype.checkPart = function(a, b) {
        return a.indexOf(b) === 0;
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
                text: text,
                parts: this.splitSelector2parts(text)
            });
        }.bind(this);
        
        var comment = false, 
            opened = 0,
            line, symb,
            findStart = false,
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
                
                if ( findStart && /[^\s\}]/.test(symb) ) {
                    findStart = false;
                    startPos = {line: i, col: j};
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
                        findStart = true;
                    }
                }
            }
        }
        
        return selectors;
    };
    
    return Finder;
}());
