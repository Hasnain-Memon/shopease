"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var user_1 = require("./routes/user");
var cookie_parser_1 = require("cookie-parser");
var cors_1 = require("cors");
var dotenv_1 = require("dotenv");
dotenv_1.default.config({
    path: "./.env"
});
var app = (0, express_1.default)();
var port = 3000;
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
// configuring middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static('public'));
app.use((0, cookie_parser_1.default)());
app.use('/api/v1/user', user_1.default);
app.listen(port, function () {
    console.log("app is listening on ".concat(port, "}"));
});
