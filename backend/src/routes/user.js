"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var client_1 = require("@prisma/client");
var multer_middleware_1 = require("../middlewares/multer.middleware");
var cloudinary_1 = require("../utils/cloudinary");
var bcryptjs_1 = require("bcryptjs");
var jsonwebtoken_1 = require("jsonwebtoken");
var router = (0, express_1.Router)();
var prismaClient = new client_1.PrismaClient();
router.post('/sign-up', multer_middleware_1.upload.fields([
    {
        name: "profile_img",
        maxCount: 1
    }
]), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, email, password, existingUser, hashedPassword, profileImageLocalPath, profileImage, user, tokenSecret, token, options, error_1;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 5, , 6]);
                _a = req.body, username = _a.username, email = _a.email, password = _a.password;
                // check whether the data is correct or not
                if ([email, username, password].some(function (field) {
                    return (field === null || field === void 0 ? void 0 : field.trim()) === "";
                })) {
                    return [2 /*return*/, res
                            .status(401)
                            .json({
                            status: 401,
                            message: "All fields are required"
                        })];
                }
                return [4 /*yield*/, prismaClient.user.findFirst({
                        where: {
                            OR: [
                                { username: username },
                                { email: email }
                            ]
                        }
                    })];
            case 1:
                existingUser = _c.sent();
                if (!existingUser) {
                    return [2 /*return*/, res
                            .status(402)
                            .json({
                            statu: 402,
                            message: "User already exists with this email or username"
                        })];
                }
                return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
            case 2:
                hashedPassword = _c.sent();
                profileImageLocalPath = (_b = req.files) === null || _b === void 0 ? void 0 : _b.profile_img[0].path;
                return [4 /*yield*/, (0, cloudinary_1.uploadOnCloudinary)(profileImageLocalPath)];
            case 3:
                profileImage = _c.sent();
                if (!profileImage) {
                    return [2 /*return*/, res
                            .status(500)
                            .json({
                            status: 500,
                            message: "Something went wrong uploading image on cloudinary"
                        })];
                }
                return [4 /*yield*/, prismaClient.user.create({
                        data: {
                            username: username,
                            email: email,
                            password: hashedPassword,
                            profile_img: profileImage.url
                        }
                    })];
            case 4:
                user = _c.sent();
                if (!user) {
                    return [2 /*return*/, res
                            .status(502)
                            .json({
                            status: 502,
                            message: "Something went wrong while creating user"
                        })];
                }
                tokenSecret = process.env.ACCESS_TOKEN_SECRET;
                token = jsonwebtoken_1.default.sign({ id: user.id }, tokenSecret);
                if (!token) {
                    return [2 /*return*/, res
                            .status(505)
                            .json({
                            status: 505,
                            message: "access token is not available"
                        })];
                }
                options = {
                    httpOnly: true,
                    secure: true
                };
                return [2 /*return*/, res
                        .status(200)
                        .json({
                        status: 200,
                        message: "User registered successfully",
                        user: user
                    })
                        .cookie("accessToken", token, options)];
            case 5:
                error_1 = _c.sent();
                console.log("User registeration failed: ", error_1);
                throw error_1;
            case 6: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
