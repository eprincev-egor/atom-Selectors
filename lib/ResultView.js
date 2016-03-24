var EventEmitter = require('events');
var util = require('util');

module.exports = (function() {
    "use strict";

    function ResultView() {
        EventEmitter.call(this);
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
            tagName = target.tagName.toLowerCase();
        
        if ( tagName == "strong" ) {
            target = target.parentNode;
        }
        
        var line = target.getAttribute("data-line");
        if ( !line ) {
            return;
        }
        var path = target.parentNode.getAttribute("data-path");
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
    
    ResultView.prototype.show = function(result) {
        result = result.map(function(elem) {
            var html = "<div style='margin-bottom: 20px;' data-path='"+ elem.file +"'>";
            html += "<h1>"+ elem.file +" ("+ elem.selectors.length +")</h1>";
            html += elem.selectors.map(function(elem) {
                return "<div data-line='"+ elem.line +"' style='cursor:pointer;'><strong style='display:block;'>line: "+ 
                    (elem.line+1) +
                "</strong>"+ elem.text.replace(/\r/g, "<br/>") +
                "</div>";
            }).join("");
            html += "</div>";

            return html;
        });
        this.box.innerHTML = result.join("");

        var windSize = atom.getSize();
        this.element.style.height = "auto";
        if ( this.element.offsetHeight > windSize.height - 50 ) {
            this.element.style.height = windSize.height - 50 + "px";
        }
    };
    
    return ResultView;
})();
