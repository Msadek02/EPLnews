var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  // `title` is of type String
  name: {
    type: String,
    required: true
  },
  // body is a string that's required
  body: {
    type: String,
    required: true
  }
});

var Comment = mongoose.model("Comment", CommentSchema);

// Export the Note model
module.exports = Comment ;
