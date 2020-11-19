// server.js
// where your node app starts

// init project
const express = require("express");
var bodyParser = require("body-parser");

var app = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var handlebars = require("express-handlebars");
app.engine("handlebars", handlebars({ defaultLayout: "home" }));
app.set("view engine", "handlebars");

var mysql = require("mysql");
app.get("/", function(req, res) {
  var con = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DBNAME,
    port: "3306",
    multipleStatements: true  
  });

  con.connect(() => {
    console.log(`Successfully connected to mysql`);
    // res.send(`Connect To Mysql`);
    con.query("SELECT * FROM enthusiasticpanther_songs", (err, songs) => {
      console.log('query seemed to work...');
      let totalNumSongs = songs.length;
      // console.log(totalNumSongs);

      // We're going to get a full set of data for each song and then store it in this array
      let allSongData = [];

      // Iterate through each song
      songs.forEach(song => {
        // Begin making our object that contains the full set of data about this song
        let songData = {
          standard_duration: song.standard_duration,
          name: song.name,
          id: song.id,
        };
        


        con.query(
          // `SELECT count(id) as totalperformances FROM enthusiasticpanther_songperformances where songid = ${song.id}`,
          `SELECT
            (SELECT count(id) FROM enthusiasticpanther_songperformances where songid = ${song.id}) AS totalperformances,
            (SELECT avg(quality) FROM enthusiasticpanther_songperformances where songid = ${song.id}) AS averagequality,
            (SELECT max(id) FROM enthusiasticpanther_shows) AS latestconcert,
            (SELECT max(showid) FROM enthusiasticpanther_songperformances where songid = ${song.id}) AS latestperformance`,
          (err, subQuery) => {
            // Store this data on our object that we're building up
            
            songData.totalperformances = subQuery[0].totalperformances,
            songData.averagequality = subQuery[0].averagequality,
            songData.latestconcert = subQuery[0].latestconcert,
            songData.latestperformance = subQuery[0].latestperformance
        
            
            // console.log("fuck!");
            // console.log(subQuery[0].totalperformances);

            // Calculate gap
            let latestconcert = parseInt(songData.latestconcert);
            let latestperformance = parseInt(songData.latestperformance);
            
            console.log(latestconcert);
            console.log(latestperformance);
            
            
            songData.gap = (latestconcert - latestperformance);

            // Add this song's data to the array
            allSongData.push(songData);

            // Cool so now this song has finished processing - but have we finished processing EVERY SONG?
            if (allSongData.length === totalNumSongs) {
              // We're done processing all our data so now we can finally render our view
              
              
             // console.log(allSongData);
              
              res.render("home", {
                songData: allSongData
              });
            }
          }
        );
      });
    });
  });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
