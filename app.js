const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server running");
    });
  } catch (e) {
    console.log(`DB error:'${e.message}'`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasPriorityStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityStatusProperties(request.query):
      getTodoQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'AND
                priority='${priority}'AND
                status='${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'AND
                priority='${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'AND
                status='${status}';`;
      break;
    default:
      getTodoQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%';`;
      break;
  }
  const data = await database.all(getTodoQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                id=${todoId};`;
  const data = await database.get(getTodoQuery);
  response.send(data);
});

app.post("/todos/", async (request, response) => {
  const { todo, priority, status } = request.body;
  const postTodoQuery = `
    INSERT INTO
        todo(todo,priority,status) VALUES ('${todo}','${priority}','${status}');`;
  const data = await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  let updateColumn = "";
  const { todoId } = request.params;
  const requestBody = request.body;
  switch (true) {
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
  }
  const getTodoQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        id=${todoId};`;
  const previousTodo = await database.get(getTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const putTodoQuery = `
    UPDATE 
        todo
    SET
        todo='${todo}',
        priority='${priority}',
        status='${status}'
    WHERE
        id=${todoId};`;
  const data = await database.run(putTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo WHERE id=${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
