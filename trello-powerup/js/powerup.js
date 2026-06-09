/* powerup.js — Board Exporter Power-Up connector */

var t = TrelloPowerUp.iframe();

TrelloPowerUp.initialize({
  'board-buttons': function(t, opts) {
    return [{
      text: '📤 Export Board',
      icon: {
        dark:  'https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USER/YOUR_REPO_NAME@main/icons/export-dark.svg',
        light: 'https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USER/YOUR_REPO_NAME@main/icons/export-light.svg'
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
  appKey:   'YOUR_TRELLO_APP_KEY'  // fill in after registering on trello.com/power-ups/admin
});
