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

function getEstimates(cards) {
  var p = Promise.map(cards, card =>
    t.get(card.id, "shared", "estimate", "0")
  );
  return p; 
}

function toTrace(data, name, color, width) {
  data.sort((a, b) => a.date.getTime() - b.date.getTime());
  var rs = runSum(data.map(d => d.estimate));
  var dates = data.map(d => d.date);
  if(!name) {
    name = "trace"
  }

  // make sure data includes today
  rs.push(rs[rs.length - 1]);
  dates.push(new Date(Date.now()).getTime());

  var trace = {
    type: "scatter",
    x: data.map(d => d.date),
    y: rs,
    mode: "lines",
    name: name,
    line: {
      color: color | "black",
      width: width | 1
    }
  }
  return(trace);
}


t.render(function() {
  var estimates;
  var list;

  t.list("cards")
    .then(function(data) {
      list = data;
      return(getEstimates(list.cards));
    })
    .then(function(data) {
      estimates = data;
      var dates = getDates(list.cards);
      var finDates = getFinishedDates(list.cards);
      var green = isGreen(list.cards)
      var newWork = [];
      var completedWork = [];
      var closed = 0;
      var total = 0;
      var open = 0;

      for (var i in dates) {
        newWork.push({
          estimate: Number(estimates[i]),
          date: dates[i],
          done: green[i]
        });
      }

      for (var i in finDates) {
        if (finDates[i]) {
          completedWork.push({ estimate: estimates[i], date: finDates[i], done: true });
          closed += Number(estimates[i]);
        }
      }

      var chart = document.getElementById("burndown_chart");
      var trace1 = toTrace(newWork, "New", "rgb(219, 64, 82)", 3);
      var trace2 = toTrace(completedWork, "Completed", "rgb(55, 128, 191)", 3)
      console.log(trace1)
      var start = trace1.x[0].getTime()
      var end = new Date(Date.now() + 14).getTime();

      Plotly.newPlot(
        chart,
        [trace1, trace2],
        { 
          margin: { t: 20 }, 
          xaxis: {
            range: [start, end]
          }
        },
        { 
          displayModeBar: true 
        }
      );

      total = trace1.y[trace1.y.length - 1]
      open = total - closed;
      $("#total").html(total);
      $("#open").html(open);
      $("#closed").html(closed);
    });
});

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
