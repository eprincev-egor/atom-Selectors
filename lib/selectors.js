var CompositeDisposable = require("atom").CompositeDisposable;
var Finder = require("./Finder");
var ResultView = require("./ResultView");

var Selectors = {
    modalPanel: null,
    subscriptions: null,
    finder: null,
    resultView: null,

    activate: function(state) {
        this.initResults();
        this.finder = new Finder();
        
        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();

        this.subscriptions.add(atom.commands.add("atom-workspace", {
            'selectors:toggle': function() {
                return this.toggle();
            }.bind(this)
        }));
        
        // закрытие на esc
        document.addEventListener("keyup", function(e) {
            if ( e.keyCode == 27 && this.modalPanel.isVisible() ) {
                this.modalPanel.hide();
            }
        }.bind(this));
    },
    
    initResults: function() {
        this.resultView = new ResultView();
        
        this.resultView.on("search", function(text) {
            var result = this.finder.search(text);
            this.resultView.show(result);
        }.bind(this));
        
        this.modalPanel = atom.workspace.addModalPanel({
            item: this.resultView.element,
            visible: false
        });
        
        this.resultView.on("open", function(path, line) {
            this.modalPanel.hide();
            atom.workspace.open(path)
                .then(function(editor) {
                    var cursor = editor.cursors[0];
                    if ( cursor ) {
                        cursor.setScreenPosition([+line, 0], {autoscroll: true});
                        cursor.skipLeadingWhitespace();
                    }
                });
        }.bind(this));
    },

    deactivate: function() {
        this.modalPanel.destroy();
        this.subscriptions.dispose();
    },

    serialize: function() {

    },

    toggle: function() {
        if ( this.modalPanel.isVisible() ) {
            this.modalPanel.hide();
        } else {
            var editor = atom.workspace.getActiveTextEditor();
            if ( !editor ) {
                return;
            }

            var text = editor.getSelectedText();
            
            this.modalPanel.show();
            this.resultView.begin(text);
            this.finder.createMap(function() {
                var result = this.finder.search(text);
                this.resultView.show(result);
            }.bind(this));
            
        }
    }
};

module.exports = Selectors;
