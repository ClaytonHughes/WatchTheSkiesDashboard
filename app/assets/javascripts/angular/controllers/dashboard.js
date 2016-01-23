const start_color = { h:100, s:50, v:60 }
const end_color = { h:0, s:100, v:130 }

function rgb_from_hsv(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = Math.min(1,h.s/100), v = Math.min(1,h.v/100), h = Math.min(h.h/360);
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    obj = {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
    return obj;
}

function css_rgb(r,g,b) {
  if (arguments.length === 1) {
    b = r.b;
    g = r.g;
    r = r.r;
  }
  return ['rgb(',r,',',g,',',b,')'].join('');
}

function lerp(a, b, alpha) {
  return (1-alpha)*a + (alpha)*b;
}

function hsv_lerp(a,b,alpha) {
  return {
    h: lerp(a.h, b.h, alpha),
    s: lerp(a.s, b.s, alpha),
    v: lerp(a.s, b.s, alpha)
  }
}

var dashboardApp = angular.module('dashboardApp', ['dashboardController']);

var dashboardController = angular.module('dashboardController', ['timer', 'angular-svg-round-progress']);

dashboardController.controller('DashboardCtrl', ['$rootScope', '$scope', '$http', '$interval',
  function($rootScope, $scope, $http, $interval) {
    $scope.nextRound = new moment();
    $scope.news = [];

    var clockCall = function() {
      $http.get('/api/clock').
      success(function(data, status, headers, config) {
        if(status !== '200' && data['status'] !== 200) {
          console.error("Got bad Status from /api/clock: " + status + " (" + data['status'] + ")" + "\n" + data['message']);
          return;
        }

        var result = data['result'];
        $scope.minutes = result['timer']['minutes'];
        $scope.seconds = result['timer']['seconds'];
      });
    };

    var apiCall = function() {
      $http.get('/api/dashboard_data').
      success(function(data, status, headers, config) {

        if(status !== '200' && data['status'] !== 200) {
          console.error("Got bad Status from /api/dashboard_data: " + status + " (" + data['status'] + ")" + "\n" + data['message']);
          return;
        }

        var result = data['result'];
        $scope.terror = result['global_terror']['total'];
        $scope.activity = result['global_terror']['activity'];
        $scope.paused = result['timer']['paused'];
        $scope.countries = result['countries'];
        $scope.controlMessage = result['control_message'];
        $scope.round = result['timer']['round'];
        $scope.rioters = result['global_terror']['rioters'];
        $scope.minutes = result['timer']['minutes'];
        $scope.seconds = result['timer']['seconds'];
        $scope.alliances = result['alliances'];
        $scope.economy = result['economy'];
        console.log($scope.economy);

        if (result['alien_comms'] == true) {
          $("body").addClass("alien");
          $("p").addClass("alien");
          $("td").addClass("alien");
        } else {
          $("body").removeClass("alien");
          $("p").removeClass("alien");
          $("td").removeClass("alien");
        }
        if (result['news'].length > 0){
          var newDate = (new Date(result['news'][0]['created_at']));
          if (($scope.news.length == 0) || newDate.getTime() > $scope.lastUpdatedNews.getTime()) {
            $scope.lastUpdatedNews = newDate;
            $scope.news = result['news'];
          }
        } else {
          if ($scope.news.length == 0) {
            $scope.news = result['news'];
          }
        }
        var nextRound = moment(result['timer']['next_round']);
        if ($scope.nextRound.valueOf() != nextRound.valueOf()) {
          $scope.nextRound = moment(nextRound);
          $scope.roundDuration = $scope.nextRound.diff(moment(), 'seconds');
          $scope.$broadcast('timer-set-countdown',  $scope.roundDuration);
          $scope.$broadcast('timer-start');
          $scope.$broadcast('timer-set-end-time',  $scope.roundDuration);
        }
      });
    }

    $scope.getStatus = function() {
      apiCall();
    };

    $scope.updateNews = function() {
      news_items = $('.news-container')
      news_items.first().hide('slow',function(){
          detach = news_items.first().detach()
          detach.insertAfter(news_items.last()).fadeIn('slow');
      });
    };

    $scope.updateClock = function() {
      clockCall();
    };

    $scope.range = function(count) {
      range = []
      for (var i=0; i<count; ++i) {
        range.push(i);
      }
      return range;
    };

    $scope.colorFromTerror = function(value) {
      alpha = value / 250;
      h_color = hsv_lerp(start_color, end_color, alpha);
      r_color = rgb_from_hsv(h_color);
      return { "background-color": css_rgb(r_color) };
    };

    $scope.colorFromAlliance = function(a, b) {
      var debug = false
      if (a == 'CN' && b == 'BR') { 
        debug = true;
      }
      nations = [a,b].sort()
      key = nations[0]+nations[1]
      if (debug) {
        console.log(key);
        console.log($scope.alliances);
      }
      var color = undefined;
      if ($scope.alliances !== undefined && key in $scope.alliances) {
        stance = $scope.alliances[key];
        if (stance === 'WAR') {
          color = 'red';
        } else {
          color = 'lime';
        }
      }

      if (color !== undefined) {
        return { "background-color": color };
      } else {
        return {};
      }
    };


    $scope.stock_display = function(nation_code, data) {
      NATIONS = {'BR': 'BRAZIL',
                 'CN': 'CHINA',
                 'DE': 'GERMANY',
                 'FR': 'FRANCE',
                 'IN': 'INDIA',
                 'JP': 'JAPAN',
                 'RU': 'RUSSIA',
                 'UK': 'UNITED KINGDOM',
                 'US': 'UNITED STATES'}
      var nation = NATIONS[nation_code];
      var cur_val = ' (' + data["current"] + ') '
      var arrows = ''

      UP = "▲";
      DOWN = "▼";
      NOCHANGE = "━";

      console.log(data);
      change = data["change"];
      if (change == 0) {
        arrows = NOCHANGE;
      } else {
        while (change < 0) {
          change += 1;
          arrows += DOWN;
        }
        while (0 < change) {
          change -= 1;
          arrows += UP;
        }
      }

      // not convinced I want to reveal cur_val:
      cur_val = ' ';
      return nation + cur_val + arrows;
    }

    $scope.getStatus();

    $interval(function(){
      $scope.updateNews();
    }, 8000);

    $interval(function() {
      $scope.getStatus();
    }, 3000);

    // TODO: Cancel when paused?
    $interval(function() {
      $scope.updateClock();
    }, 240);
 
  }
]);

// for use with range(), above.
dashboardApp.filter('filterCount', function() {
  return function(input) {
    return input.filter(function(v) { return v < 9; });
  };
});

// this should be built in, wtf
dashboardApp.filter('fixedLen', function() {
  return function (n, len) {
    var num = parseInt(n, 10);
    len = parseInt(len, 10);
    if (isNaN(num) || isNaN(len)) {
        return n;
    }
    num = ''+num;
    while (num.length < len) {
        num = '0'+num;
    }
    return num;
  };
});
