const mongoose = require("mongoose");
const schema = mongoose.Schema;
const objectId = schema.ObjectId

const User = new schema({
  email: {type: String, unique: true},
  username: {type: String, unique: true},
  password: String,
  name: String
})

const Todos = new schema({
  userId: objectId,
  description: String,
  status: Boolean
})

const UserModel = mongoose.model("users", User);
const TodoModel = mongoose.model("todos", Todos);

module.exports = {
  UserModel,
  TodoModel
}