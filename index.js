const mongoose = require("mongoose");
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  username: String,
});
const User = mongoose.model("User", userSchema);

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  const { username } = req.body;
  try {
    const userObj = new User({ username });
    await userObj.save();
    res.json({ username: userObj.username, _id: userObj._id });
  } catch (err) {
    console.error(err);
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}).select("_id username");
    res.json(users);
  } catch (err) {
    console.error(err);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404);
    }

    const exerciseObj = new Exercise({
      userId: user._id,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    });

    const exercise = await exerciseObj.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    });
  } catch (err) {
    console.error(err);
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404);
    }

    const dateObj = {};
    if (from) dateObj["$gte"] = new Date(from);
    if (to) dateObj["$lte"] = new Date(to);

    const filter = {
      userId: userId,
    };

    if (from || to) {
      filter.date = dateObj;
    }

    const limitValue = limit ? parseInt(limit) : 100;

    const exercises = await Exercise.find(filter).limit(limitValue);

    const log = exercises.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    }));

    const response = {
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: log,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
