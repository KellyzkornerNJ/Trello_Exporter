/* powerup.js — Board Exporter Power-Up connector */

var t = TrelloPowerUp.iframe();

TrelloPowerUp.initialize({
  'board-buttons': function(t, opts) {
    return [{
      text: '📤 Export Board',
      icon: {
        dark:  'https://cdn.jsdelivr.net/gh/KellyzkornerNJ/Trello_Exporter@main/icons/export-dark.svg',
        light: 'https://cdn.jsdelivr.net/gh/KellyzkornerNJ/Trello_Exporter@main/icons/export-light.svg'
      },
      callback: function(t) {
        return t.popup({
          title: 'Export Board',
          url:   './popup.html',
          height: 320
        });
      }
    }];
  }
}, {
  appName:  'Board Exporter',
  appKey:   '876deed3f7022ebdfb807a2a2c089225' 
});
