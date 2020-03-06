var t = window.TrelloPowerUp.iframe({
  appKey: "28acb4da97cf3fa100161cbb0315d04a",
  appName: "agile-list"
});

var Promise = window.TrelloPowerUp.Promise;

function getDate(card) {
  var id = card.id;
  var cd = new Date(1000 * parseInt(id.substring(0, 8), 16));
  return cd;
}

function getDateId(id) {
  var cd = new Date(1000 * parseInt(id.substring(0, 8), 16));
  return cd;
}

function finishedDate(card) {
  if (card.dueComplete) {
    return new Date(card.due);
  } else {
    return null;
  }
}

function getFinishedDates(cards) {
  return(cards.map(finishedDate));
}

function getDates(cards) {
  return(cards.map(getDate));
}

function apiCard(card, endpoint) {
  var url = "https://api.trello.com/1/cards/" + card.id + "/" + endpoint;
  var p = t.getRestApi()
  .getToken()
  .then(function(token) {
   return($.get(url, {key: t.restApi.appKey, token: token}));
  })
  return(p);
}

// let re = /ab+c/;
function apiCardActions(card, filter = "all") {
  var url = "https://api.trello.com/1/cards/" + card.id + "/actions";
  var p = t.getRestApi()
  .getToken()
  .then(function(token) {
   return($.get(url, {key: t.restApi.appKey, token: token, filter: filter}));
  });
  return(p);
}

function getChecklistEstimates(card) {
  let p = apiChecklistItems(card)
  .then(function(items) {
    let re = /^\[(\d+)\]/;
    let pointsItems = items.filter(a => a.name.match(re));
    let actions = {};
    pointsItems = pointsItems.map(function(i) {
      actions[i.id] = { date: i.date, 
                        estimate: Number(i.name.match(re)[1]),
                        finishedDate: null };
    })
    if(pointsItems.length == 0) { 
      return(Promise.resolve([]));
    } else {
      let ret = [];
      let p = apiCardActions(card, "updateCheckItemStateOnCard")
      .then(function(data) {  
        // want the latest action last. also I am not sure these are 
        // guaranteed to be in chronological order, so we will make sure
        data = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        data = data.filter(d => d.data.checkItem.name.match(re));
        // remove any checklist items that no longer exist
        data = data.filter(d => actions[d.data.checkItem.id])
        data.map(function(d) {
          let finishedDate = d.data.checkItem.state == "complete" ? new Date(d.date) : null;
          actions[d.data.checkItem.id].finishedDate = finishedDate;
        });
        // convert from name value pairs to array
        for(k in actions) {
          ret.push(actions[k]);
        }
        return(ret);
      })
      return(p)
    } 
  })
  return(p);
}
// get check list items which match [#]

function apiChecklistItems(card) {
  var url = "https://api.trello.com/1/cards/" + card.id + "/checklists";
  var p = t.getRestApi()
  .getToken()
  .then(function(token) {
   return($.get(url, {key: t.restApi.appKey, token: token, checkItem_fields: ["name", "state"]}));
  })
  .then(function(data) {
    var list = [];
    if(data.length) {
      list = data.map(function(d) {
        var items = d.checkItems;
        items <- items.map(function(i) {
          i.date = getDateId(i.id)
        })
        return(items);
      })
      list = list.reduce((a,b) => a.concat(b))
    }
    return(list)
  });
  return(p);
}

function isGreen(cards) {
   var res = cards.map(function(c) {
    var res = c.labels.map(l => l.color == "green");
    return res.indexOf(true) >= 0;
   })
   return(res);
}

function risingSum(a) {
  var total = 0;
  var rs = a.map(function(d) {
    total += Number(d) > 0 ? Number(d) : 0;
    return total;
  });
  return rs;
}

function runSum(a) {
  var total = 0;
  var rs = a.map(function(d) {
    total += Number(d);
    return total;
  });
  return rs;
}

function getEstimates(c) {
  var cards = c;
  var estimates=[];
  var p = Promise.map(cards, card =>
    t.get(card.id, "shared", "estimate", "0")
  )
  .then(function(data) {
    for(i in cards) {
      estimates.push({date: getDate(cards[i]),
                      estimate: data[i],
                      finishedDate: finishedDate(cards[i])})
    }
    let p = Promise.map(cards, card =>
      getChecklistEstimates(card)
    )
    return(p)
  })
  .then(function(data) {
    data <- data.reduce((a,b) => a.concat(b))
    data.map(d => estimates = estimates.concat(d))
    return(estimates)
  });
  return p; 
}

function toTrace(data, name, color, width) {
  data.sort((a, b) => a.date.getTime() - b.date.getTime());
  var rs = runSum(data.map(d => d.estimate));
  var dates = data.map(d => d.date);
  if(!name) {
    name = "trace"
  }
  // make sure data includes today, and starts from zero points
  rs.push(rs[rs.length - 1]);
  rs = [0].concat(rs);
  dates.push(new Date(Date.now()));
  dates = [dates[0] - 24 * 60 * 60 * 1000].concat(dates)

  var trace = {
    x: dates,
    y: rs,
    mode: "lines+markers",
    name: name,
    line: {
      color: color | "black",
      width: width | 2
    }
  }
  return(trace);
}


t.render(function() {
  var estimates;
  var list;
  return t.list("cards")
    .then(function(data) {
      list = data;
      return(getEstimates(list.cards));
    })
    .then(function(data) {
      estimates = data;
      var dates = estimates.map(e => e.date);
      var finDates = estimates.map(e => e.finishedDate);
      var green = isGreen(list.cards)
      var newWork = [];
      var completedWork = [];
      var closed = 0;
      var total = 0;
      var open = 0;

      for (var i in dates) {
        newWork.push({
          estimate: Number(estimates[i].estimate),
          date: dates[i],
          done: green[i]
        });
      }
      for (var i in finDates) {
        if (finDates[i]) {
          completedWork.push({ estimate: estimates[i].estimate, date: finDates[i], done: true });
          closed += Number(estimates[i].estimate);
        }
      }

      var trace1 = toTrace(newWork, "New", "rgb(219, 64, 82)", 3);
      var trace2 = toTrace(completedWork, "Completed", "rgb(55, 128, 191)", 3)
      plotChart(trace1, trace2);
  
      total = trace1.y[trace1.y.length - 1]
      open = total - closed;
      $("#total").html(total);
      $("#open").html(open);
      $("#closed").html(closed);
    });
});

var plotChart = function(t1, t2) {
  var chart = document.getElementById("burndown_chart");
  var xmin = Math.min(...t1.x);
  var xmax = Math.max(...t1.x);
  var ymin = 0;
  var ymax = Math.max(...t1.y);

  // intialize y values to zero so we can animate.
  // because, animation. Some gymnastics are required
  // to avoid problems related to references and promises.
  let y1_orig = [...t1.y];
  let y1 = y1_orig.map(a => 0)
  let y2_orig = [...t2.y];
  let y2 = y2_orig.map(a => 0)
  x1 = t1.x;
  x2 = t2.x

  Plotly.newPlot(
    chart,
    //data
    [
     {x: x1, y: y1, mode: "markers", name: t1.name, line: t1.line}, 
     {x: x2, y: y2, mode: "markers", name: t2.name, line: t2.line}
    ], 
    //layout
    { 
      margin: { t: 20 }, 
      xaxis: {
        'tickfont': {
          'family': 'Open Sans, sans-serif',
          'size': 18,
          'color': 'lightgrey'
        },
        range: [xmin, xmax + (2 * 24 * 60 * 60 * 1000)],
        'tickformat': '%m/%d',
        'tickangle': 45
      },
      yaxis: {
        'title': '<b>Story Points</b>',
        'tickfont': {
          'family': 'Open Sans, sans-serif',
          'size': 18,
          'color': 'lightgrey'
        },
        range: [ymin, ymax * 1.2],
        'titlefont': {
          'family': 'Open Sans, sans-serif',
          'size': 18,
          'color': 'lightgrey'
        }
      }
    },
    //options
    { 
      displayModeBar: true 
    }
  ).then(function() {
    Plotly.animate(chart, {
        data: [{y: y1_orig, x: x1, mode: "markers"},
               {y: y2_orig, x: x2, mode: "markers"}],
        traces: [0,1],
        layout: {}
      }, {
        transition: [
          {duration: 1000, easing: 'elastic-in'}
      ],
        frame: {
          duration: 1000
        }
      });
  })
  .then(function() {
    Plotly.animate(chart, {
        data: [{mode: t1.mode}, {mode: t2.mode}],
        traces: [0,1],
        layout: {}
      }, {
        transition: [
          {duration: 500, easing: 'elastic-in-out'}
      ],
        frame: {
          duration: 500
        }
      });
  })
}

// t.render(function() {
//   t.list("cards")
//   .then(function(c) {
//     console.log(c.cards)
//     return(t.get("5e5d25d399cb5755be316f86", "shared", "estimate", "not set"));
//   })
//   .then(function(data){
//     console.log(data);
//     t.sizeTo('#estimate').done();
//   });
// });
