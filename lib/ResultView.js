var EventEmitter = require('events');
var util = require('util');

module.exports = (function() {
    "use strict";

    function ResultView() {
        EventEmitter.call(this);
        this._hiddenPath = {};
        this.element = document.createElement("div");
        this.element.style.overflow = "scroll";
        this.element.style.paddingBottom = "40px";
        
        this.initInput();
        this.initBox();
    }
    
    util.inherits(ResultView, EventEmitter);
    
    ResultView.prototype.initInput = function() {
        this.input = document.createElement("input");
        // без этого класса, управлять инпутом с помощью стрелок нельзя
        this.input.className = "native-key-bindings";
        this.input.style.width = "100%";
        this.input.style.background = "transparent";
        this.input.style.fontSize = "20px";
        this.input.style.border = "1px solid #444";
        this.input.style.marginBottom = "20px";
        this.input.style.borderRadius = "4px";
        this.input.style.padding = "6px 12px";
        this.input.onkeyup = this.onKeyup.bind(this);
        
        this.element.appendChild(this.input);
    };
    
    ResultView.prototype.onKeyup = function(e) {
        var text = (this.input.value + "").trim();
        if ( text ) {
            this.emit("search", text);
        }
    };
    
    ResultView.prototype.initBox = function() {
        this.box = document.createElement("div");
        this.box.onclick = this.onClickBox.bind(this);
        this.element.appendChild(this.box);
    };
    
    ResultView.prototype.onClickBox = function(e) {
        var target = e.target,
            tagName = target.tagName.toLowerCase(),
            line, path;
        
        if ( tagName == "strong" ) {
            target = target.parentNode;
        }
        
        // клик по заголовку туглит содерижмое файла
        if ( tagName == "h1" ) {
            path = target.parentNode.getAttribute("data-path");
            if ( path ) {
                this.togglePath(path);
            }
            return;
        }
        
        line = target.getAttribute("data-line");
        if ( !line ) {
            return;
        }
        path = target.parentNode.getAttribute("data-path");
        if ( !path ) {
            return;
        }
        
        this.emit("open", path, line);
    };
    
    ResultView.prototype.begin = function(text) {
        this.input.value = text;
        this.input.select();
        this.input.focus();    
    };
    
    ResultView.prototype._result2html = function(result) {
        return result.map(function(elem) {
            var file = elem.file;
            var html = "<div style='margin-bottom: 20px;' data-path='"+ elem.file +"'>";
            html += "<h1>"+ file +" ("+ elem.selectors.length +")</h1>";
            html += elem.selectors.map(function(elem) {
                var text = elem.text;
                if ( text.length > 100 ) {
                    text = text + "...";
                }
                
                return "<div data-line='"+ elem.line +"' style='cursor:pointer;"+(
                    this._hiddenPath[file] ? "display:none;" : " "
                )+"'><strong style='display:block;'>line: "+ 
                    (elem.line+1) +
                "</strong>"+ text.replace(/\n/g, "<br/>") +
                "</div>";
            }.bind(this)).join("");
            html += "</div>";

            return html;
        }.bind(this)).join("");
    };
    
    ResultView.prototype.show = function(result) {
        var html = "<div><h1>Files("+ result.length +"): </h1></div>" + this._result2html( result.slice(0, 50) );
        this.box.innerHTML = html;

        var windSize = atom.getSize();
        this.element.style.height = "auto";
        if ( this.element.offsetHeight > windSize.height - 50 ) {
            this.element.style.height = windSize.height - 50 + "px";
        }
    };
    
    ResultView.prototype.togglePath = function(path) {
        this._hiddenPath[path] = !this._hiddenPath[path];
        
        var divs = this.box.querySelectorAll("[data-path]"), div;
        for (var j=0, m=divs.length; j<m; j++) {
            div = divs[j];
            if ( div.getAttribute("data-path") != path ) {
                continue;
            }
            
            var elems = div.querySelectorAll("[data-line]");
            for (var i=0, n=elems.length; i<n; i++) {
                elems[i].style.display = this._hiddenPath[path] ? "none" : "block";
            }
        }
            
    };
    
    return ResultView;
})();
