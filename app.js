const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBServer();

const getFormatedResult = (eachTodo) => {
  return {
    id: eachTodo.id,
    todo: eachTodo.todo,
    priority: eachTodo.priority,
    status: eachTodo.status,
    category: eachTodo.category,
    dueDate: eachTodo.due_date,
  };
};

const checkPoint = (req, res, next) => {
  const { status, priority, category } = req.query;
  const statusCheck = ["TO DO", "IN PROGRESS", "DONE"];
  const priorityCheck = ["HIGH", "MEDIUM", "LOW"];
  const categoryCheck = ["WORK", "HOME", "LEARNING"];
  // Checking For Status & Priority
  if (status !== undefined && priority !== undefined) {
    // Status Check
    if (statusCheck.includes(status)) {
      // Status - Priority Check
      if (priorityCheck.includes(priority)) {
        next();
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }
    } else {
      res.status(400);
      res.send("Invalid Todo Status");
    }
  } else if (status !== undefined && category !== undefined) {
    if (statusCheck.includes(status)) {
      if (categoryCheck.includes(category)) {
        next();
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
    } else {
      res.status(400);
      res.send("Invalid Todo Status");
    }
  } else if (category !== undefined && priority !== undefined) {
    if (categoryCheck.includes(category)) {
      if (priorityCheck.includes(priority)) {
        next();
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }
    } else {
      res.status(400);
      res.send("Invalid Todo Catgeory");
    }
  } else if (status !== undefined) {
    if (statusCheck.includes(status)) {
      next();
    } else {
      res.status(400);
      res.send("Invalid Todo Status");
    }
  } else if (category !== undefined) {
    if (categoryCheck.includes(category)) {
      next();
    } else {
      res.status(400);
      res.send("Invalid Todo Category");
    }
  } else if (priority !== undefined) {
    if (priorityCheck.includes(priority)) {
      next();
    } else {
      res.status(400);
      res.send("Invalid Todo Priority");
    }
  }
};

// API - 1 GET TODOS
app.get("/todos/", checkPoint, async (req, res) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = req.query;
  const getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND todo = '${search_q}' AND category = '${category}' AND priority = '${priority}'`;
  const getTodos = await db.all(getTodosQuery);
  res.send(getTodos.map((eachTodo) => getFormatedResult(eachTodo)));
});

//API - 2 GET EACH TODO
app.get("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const getEachTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const getEachTodo = await db.get(getEachTodoQuery);
  res.send({
    id: getEachTodo.id,
    todo: getEachTodo.todo,
    priority: getEachTodo.priority,
    status: getEachTodo.status,
    category: getEachTodo.category,
    dueDate: getEachTodo.due_date,
  });
});

//API - 3 SPECIFIC DUE DATE
app.get("/agenda/", async (req, res) => {
  const { date } = req.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const requestQuery = `SELECT * FROM todo WHERE due_date = '${newDate}'`;
    const resResult = await db.all(requestQuery);
    res.send(resResult.map((eachTodo) => getFormatedResult(eachTodo)));
  } else {
    res.status(400);
    res.send("Invalid Due Date");
  }
});

// API - 4 CREATE TODO
app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status, category, dueDate } = req.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createTodoQuery = `INSERT INTO todo(id,todo,category,priority,status,due_date)
    VALUES(
        ${id},
        '${todo}',
        '${category}',
        '${priority}',
        '${status}',
        '${postNewDueDate}'
    )`;
          const resResult = await db.run(createTodoQuery);
          console.log(resResult);
          res.send("Todo Successfully Added");
        } else {
          res.status(400);
          res.send("Invalid Due Date");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
    } else {
      res.status(400);
      res.send("Invalid Todo Status");
    }
  } else {
    res.status(400);
    res.send("Invalid Todo Priority");
  }
});

// API - 5 UPDATE TODO
app.post("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  let updateColumn = "";
  const reqBody = req.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = req.body;
  let = updateTodoQuery;
  switch (true) {
    case reqBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        res.send("Status Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Status");
      }
      break;
    case reqBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        res.send("Priority Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }
      break;
    case reqBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        res.send("Category Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;
    case reqBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority='${priority}', status='${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        res.send("Category Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;
  }
});

//API - 6
app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId}`;
  await db.run(deleteTodoQuery);
  res.send("Todo Deleted");
});

module.exports = app;
