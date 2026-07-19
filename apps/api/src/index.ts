import express from "express";

const app = express();

app.get("/", (_, res) => {
    res.send("API Running");
});

app.listen(5000, () => {
    console.log("Server started");
});