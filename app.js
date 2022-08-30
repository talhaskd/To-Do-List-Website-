//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { render } = require("ejs");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://admin-talha:talha123@cluster0.se2silg.mongodb.net/todolistDB");

// ----- Schemas
const itemSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemSchema]
};


// ----- Models

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your Todo List"
})

const item2 = new Item({
  name: "Hit the + button to add new item"
})

const item3 = new Item({
  name: "<-- Hit the checkbox to delete item"
})

const defaultItems = [item1, item2, item3];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


app.get("/", function (req, res) {
  Item.find(function (err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Items added successfully!");
          }
        })
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    }
  })
});

app.get("/:listName", function (req, res) {
  let customListName = _.capitalize(req.params.listName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // New List
        console.log("List not present, creating new list..");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);

      } else {
        // List already present
        console.log("List already present, redirecting to it...");
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items } );
      }
    }
  })


});

app.post("/", function (req, res) {
  const newItem = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: newItem
  })

  if(listName === "Today"){
    item.save();
    res.redirect("/");    
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndDelete(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Checked item removed successfully!");
      }
    })
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items:{_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    })
  }


  
})



app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
