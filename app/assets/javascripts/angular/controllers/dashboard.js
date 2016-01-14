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

    var apiCall = function() {
      $http.get('/api/dashboard_data').
      success(function(data, status, headers, config) {
        var result = data['result'];
        $scope.terror = result['global_terror']['total'];
        $scope.activity = result['global_terror']['activity'];
        $scope.paused = result['timer']['paused'];
        $scope.countries = result['countries'];
        $scope.controlMessage = result['timer']['control_message'];
        $scope.round = result['timer']['round'];
        $scope.rioters = result['global_terror']['rioters'];
        if (result['alien_comms'] == true) {
          $("body").addClass("alien");
          $("p").addClass("alien");
          $("td").addClass("alien");
        } else {
          $("body").removeClass("alien");
          $("p").removeClass("alien");
          $("td").removeClass("alien");
        }
        if (result['vatican_alien_comms'] == true) {
          $('.Vatican').addClass('alien');

        } else {
          $(".Vatican").removeClass("alien");
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

    $scope.getStatus();

    $interval(function(){
      $scope.updateNews();
    }, 8000);

    $interval(function() {
      $scope.getStatus();
    }, 3000);
  }
]);

// for use with range(), above.
dashboardApp.filter('filterCount', function() {
  return function(input) {
    console.log('filtering... ');
    console.log(input);
    return input.filter(function(v) { console.log('filter for ' + v.toString()); return v < 9; });
  };
});
