const express = require("express");
const {UserModel, TodoModel} = require("./db");
const bcrypt = require("bcrypt");
const app = express();
const port = 3000;
const { z } = require("zod");
const { mongoose } = require("mongoose");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "User"
const cors = require("cors");
mongoose.connect("mongodb+srv://lomashchoudhary9812:9808268065@cluster0.7nv44.mongodb.net/full-stack-todo-app-project")
app.use(express.json());
app.use(cors());

//sign up end-point
app.post("/signup", async function (req, res) {
  const requiredBody = z.object({
    email: z.string().min(3, "please enter the email").max(100, "please enter a valid email").email(),
    username: z.string().min(3, "please enter a username").max(100, "username is too long"),
    password: z.string()
    .min(8, "Password must be of minimum length of 8 characters")
    .regex(/[A-Z]/, "Password must contain atleast one uppercase character")
    .regex(/[a-z]/, "Password must contain atleast one lower case characters")
    .regex(/[0-9]/, "Password must contain atleast one numeric character")
    .regex(/[\W_]/, "Password must contain atleast one special character")
  })

  const parsedBody = requiredBody.safeParse(req.body);

  if(parsedBody.error){
    res.json({
      error: parsedBody.error.errors
    })
    return
  } 
  const email = req.body.email;
  const name = req.body.name;
  const username = req.body.username;
  const plainTextPassword = req.body.password;

  const hashedPassword = await bcrypt.hash(plainTextPassword, 5)

 try{
    await UserModel.create({
      email: email,
      name: name,
      username: username,
      password: hashedPassword 
    })
  }
  catch(err){
    res.json({
      error: "user with this username or email already exists"
    })
    return;
  }

  res.json({  
    message: "user signed up on the app successfully"
  })
})


//signin end-point
app.post("/signin", async function (req, res) {
  const email = req.body.email;
  const name = req.body.name;
  const username = req.body.username;
  const password = req.body.password;

  const user = await UserModel.findOne({
    email,
    username
  })

  if(!user){
    res.json({
      message: "user does not exists with this email or username"
    })
  }

  const comparedPassword = await bcrypt.compare(password, user.password);

  if(comparedPassword){
    const token = jwt.sign({
      id: user._id.toString()
    }, JWT_SECRET)
    res.json({
      token: token
    })
    return;
  }
  else{
    res.json({
      message: "password does not match"
    })
    return;
  }

})

//auth middleware
function auth(req, res, next) {
  const token = req.headers.token
  const decodedUser = jwt.verify(token, JWT_SECRET)

  if(decodedUser){
    req.userId = decodedUser.id;
    next();
  }
  else{
    res.json({
      message: "unauthorized"
    })
  }
}

//get all the todos for the particular user
app.get("/showMyTodos", auth, async function (req, res) {
  const userId = req.userId;
  const todos = await TodoModel.find({
    userId
  })

  if(todos.length > 0){
    res.json({
      todos: todos
    })
  }
  else{
    res.json({
      message: "todos does not exists for this user"
    })
  }
})


//add a new todo for the particular user
app.post("/createNewTodo", auth, async function (req, res) {
  const description = req.body.description;
  let status = req.body.password;
  const userId = req.userId;          

  if(!description){
    res.json({
      message: "please provide the description of the todo to be added"
    })
    return;
  }

  if(!status){
    status = false
  }

  await TodoModel.create({
    userId: userId,
    description: description,
    status: status
  })

  res.json({
    message: "todo added for the particular user"
  })

})

//update a particular todo by giving the number of the todo to be updated
app.put("/updateTodo/:todoNumber", auth, async function (req, res) {
  const todoToBeUpdatedNumber = parseInt(req.params.todoNumber) - 1;
  const description = req.body.description;
  const status = req.body.status
  const userId = req.userId;
  try{
    const todos = await TodoModel.find({
      userId
    })

    const toBeupdatedTodo = todos[todoToBeUpdatedNumber];
    await TodoModel.findOneAndUpdate(
      toBeupdatedTodo._id,
      {
        description: description,
        status: status
      },
      {
        new: true,
        runValidators: true
      }
    )
    res.json({
      message: "todo of the number provided for the given user updated"
    })
  }
  catch(err){
    res.json({
      message: "todo you are trying to update does not exists"
    })
    return;
  }
})

//delete a todo by giving the particular number of the todo
app.delete("/deleteATodo/:todoNumber", auth, async function (req, res) {
  const todoToBeDeletedNumber = parseInt(req.params.todoNumber) - 1;
  const userId = req.userId;
  try{
    const Todos = await TodoModel.find({
      userId
    })
    const todoToBeDeleted = Todos[todoToBeDeletedNumber];
    await TodoModel.findOneAndDelete(
      todoToBeDeleted._id
    )
    res.json({
      message: "todo deleted for the given number"
    })
  }
  catch(err){
    res.json({
      message: "todo does not exists which is requested to be deleted"
    })
  }
})

app.listen(port, () => {
  console.log("app is listening on port", port);
})