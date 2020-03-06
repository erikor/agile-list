var BLACK_GEAR = 'https://cdn.glitch.com/887f85df-ab2b-4f40-adbd-d398dbe3db47%2Fefficiency.png?v=1583345922635'

function showIframe(t) {
  return t.popup({
    title: 'Authorize to continue',
    url: './authorize.html'
  });
}

function showMenu(t) {
  return t.popup({
    title: 'Do something cool',
    items: [
      // …
    ]
  });
}

TrelloPowerUp.initialize({
  'card-buttons': function(t, options) {
    return [{
      icon: BLACK_GEAR,
      text: 'Story Points',
      callback: function(t) {
        return t.popup({
          title: "Estimation",
          url: 'estimate.html',
        });
      }
    }];
  },
  'card-badges': function(t, options) {
    var estimate = 0;
    return t.get('card', 'shared', 'estimate')
    .then(function(est) {
      estimate = est;
      return(t.card('name'));
    })  
    .then(function(card) {
      if(card.name == "Notes & Minutes" || card.name == "Manuscript Components" ) {
        return null;
      }
      var color = "light-gray";
      if(estimate > 0) color = "green";
      if(estimate > 10) color = "yellow";
      if(estimate > 40) color = "orange";
      return [{
        icon: BLACK_GEAR,
        text: estimate || '0',
        color: color,
      }];
    });
  },
  'list-actions': function (t) {
    return t.getRestApi()
    .isAuthorized()
    .then(function(isAuthorized) {
      if (isAuthorized) {
        return [{
          text: "Burn Up Chart",
          callback: function (t) {
            t.modal({
              title: "It's burning up in here...",
              url: "burndown.html",
              height: 500
            });
          }
        }];
      } else {
        return [{
          text: 'Burn Up Chart',
          callback: getAuth
        }];
      }
    });
   },
},{
  appKey: '28acb4da97cf3fa100161cbb0315d04a',
  appName: 'agile-list'
});

function getAuth(t) {
  return t.popup({
    title: 'Authorize to continue',
    url: './authorize.html'
  })
}
