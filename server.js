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

// var PORT = 8000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

var uristring =
process.env.MONGOLAB_URI ||
process.env.MONGOHQ_URL ||
"mongodb://localhost/NytNews";

// The http server will listen to an appropriate port, or default to
// port 8000.
var theport = process.env.PORT || 8000;

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function (err, res) {
  if (err) {
  console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
  console.log ('Succeeded connected to: ' + uristring);
  }
});



// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.nytimes.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .find("h2 a, h1 a")
        .text();
      result.link = $(this)
        .find("h2 a, h1 a")
        .attr("href");
      result.paragraph = $(this)
        .find(".summary")
        .text();
        if (!result.title || !result.link || !result.paragraph) return;
        console.log("---------------------------------------")
        console.log(result.title);
      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
          res.send("Scrape Complete");
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({})
  .populate("comment")
  .then(function(dbArticle){
    res.json(dbArticle);
  })
  .catch(function(err){
    res.json(err)
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
 db.Article.findOne({ _id: req.params.id })
 .populate("comment")
 .then(function(dbArticle){
res.json(dbArticle)
.catch(function(err){
  res.json(err)
});
});
 

});

// Route for saving/updating an Article's associated Comment
app.post("/articles/:id", function(req, res) {

db.Comment.create(req.body)
.then(function(dbComment){
  return db.Article.findOneAndUpdate({_id: req.params.id}, { $push: { comment: dbComment._id}}, { new: true});
})
.then(function(dbArticle){
  res.json(dbArticle);
})
.catch(function(err){
  res.json(err)
})
  });

// Start the server
app.listen(theport, function() {
  console.log("App running on port " + theport + "!");
});
