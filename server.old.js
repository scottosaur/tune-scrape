var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));

// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/tunescrape", {
useMongoClient: true
});

// Routes

// A GET route for scraping the target website (music.avclub)
app.get("/scrape", function(req, res) {
  // Axios request to fetch page body data
  axios.get("http://music.avclub.com/").then(function(response) {
  // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
  
  // Now, we grab every h2 within an article tag, and do the following:
    $("article").each(function(i, element) {
    // Save an empty result object
      var result = {};   
    
    // Finds the desired elements from page and saves to result object
      result.title = $(this)
      .find(".headline")
      .text();
      result.link = $(this)
      .find(".headline")
      .children("a")
      .attr("href");
      result.excerpt = $(this)
      .find(".excerpt p")
      .text();
      
      //only add image if present
      var imageURL = $(this)
      .find("picture source")
      .attr("data-srcset");
      
      if(imageURL){
        result.image = imageURL;
      }
    
      // Check if article in DB, save if not
      db.Article
      .find({title: result.title})
      .then(function(dbResult){
        // console.log(dbResult)
        if(dbResult.length < 1){
          console.log(result.title, "\nArticle Not Found, adding to DB");
          db.Article.create(result)
          .then(function(dbArticle) {
            res.end();
          })
          .catch(function(err) {
            console.error(err);
            res.end();
          });
        }
        else{
          console.log(result.title, "\nArticle already in DB");
          res.end();
        }  
      });  
    });
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article
  .find({})
  .then(function(dbArticle) {
    // If all Articles are successfully found, send them back to the client
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurs, send the error back to the client
    res.json(err);
  });
  
});

// Route for grabbing a specific Article by id, populate it with its note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
  
  db.Article
  
  // .find( {_id: req.params.id })
  .findById(req.params.id)
  
  .populate("note")
  
  .then(function(dbArticle) {
    
    // If all Articles are successfully found, send them back to the client
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurs, send the error back to the client
    res.json(err);
  });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  
  var newNote = req.body;
  
  console.log(newNote);
  
  db.Note
  .create(newNote)
  .then(function(dbNote){
    
    db.Article
    .findById(req.params.id)
    .update({note: dbNote.id})
    .then(function(dbArticle){
      res.json(dbArticle)
    })
    
    res.json(dbNote);
  })
  
  .catch(function(err) {
    // If an error occurred, send it to the client
    res.json(err);
  });
  
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});