//jshint esversion:6
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const { name } = require("ejs");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose
  .connect("mongodb://0.0.0.0:27017/itemsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.log(err);
  });
const itemsSchema = new mongoose.Schema({
  name: "string",
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome! to your to-do-list",
});
const item2 = new Item({
  name: "Hit the + Button to add an item",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item",
});
const defaultItems = [item1, item2, item3];
const listSchema = new mongoose.Schema({
  name: "string",
  items: [itemsSchema],
});
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find()
    .then(function (items) {
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Documents inserted");
            res.redirect("/");
          })
          .catch(function (error) {
            console.error(error);
          });
      } else res.render("list", { listTitle: "Today", newListItems: items });
    })
    .catch(function (error) {
      console.error(error);
    });
});
app.post("/delete", function (req, res) {
  const delItem = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(delItem).then(function (err) {
      if (!err) {
        res.redirect("/");
        console.log("successfully! deleted the item");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: delItem } } }
    ).then(function (err) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(function (foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }).then(function (foundList) {
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
