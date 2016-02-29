var express = require('express');
var request = require('request');
var https = require('https');
var cfenv = require('cfenv');



// create a new express ser ver
var app = express();
var http = require('http')
var server = http.Server(app);
var io = require('socket.io')(server);
server.listen(process.env.PORT || 3000)


// Handlebars initialization
var handlebars = require('express-handlebars').create( { defaultLayout: 'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();


// Default route
app.get('/', function(req, res) {
  res.render('home');
});

io.on('connection', function (socket) {
  console.log('User connected!');

  socket.on('weatherSearch', function(query) {
    var url = 'https://autocomplete.wunderground.com/aq?query=' + query;
    var searchOutput = getWeatherQuery(url, function(results) {
      var searchOutput = handleResults(results);
      io.emit('weatherSearch', searchOutput)
    })

  socket.on('weatherClick', function(query) {
    var url = 'http://api.wunderground.com/api/30fd7a559cd49cb5/conditions' + query + '.json'

    var weatherOutput = getWeather(url, function(results) {
      var weatherOutput = handleWeather(results);
      var location = weatherOutput[0]
      var temp = weatherOutput[1]
      var weatherIcon = weatherOutput[2]
      var weatherAlt = weatherOutput[3]

      io.emit('weatherClick', location, weatherIcon, weatherAlt, temp)
    })
  })


  })
})

function weatherGuess(url, callback) {

}

function handleResults(results) {
  var output = '<ul class="search-results__list">'

  for( var i = 0; i < results.length; i++) {
    output += '<li><a href="" data-attr="' +
                results[i].l +
                '" class="search__result">' +
                results[i].name +
                '</a></li>'
  }
  output += '</ul>'
  return output
}

function getWeatherQuery(url, callback) {
    var options = {
        url: url,
        method : 'GET'
    };
    var res = '';
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res = JSON.parse(body).RESULTS;
        }
        else {
            res = 'Not Found';
        }
        callback(res);
    });
}

function getWeather(url, callback) {
  var options = {
      url: url,
      method : 'GET'
  };
  var res = '';
  request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          res = JSON.parse(body).current_observation;
      }
      else {
          res = 'Not Found';
      }
      callback(res);
  });
}

function handleWeather(results) {
  var location = results.display_location.full
  var temp = results.temp_f;
  var weatherIcon = results.icon_url;
  var weatherAlt = results.icon;
  var arr = [];
  arr.push(location, temp, weatherIcon, weatherAlt);
  return arr;
}



module.exports = app
