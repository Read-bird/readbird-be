import express from "express";
import userController from "../architecture/controllers/user.controller";
import refresh from "../jwt/refresh";
import authJWT from "../jwt/authJWT";

const userRouter = express.Router();

userRouter.post("/login", userController.signInKakao);
userRouter.post("/token", refresh);
userRouter.post("/login-guest", userController.signInGuest);
userRouter.delete("/plan/delete", authJWT, userController.deleteAllPlan);
userRouter.get("/plan/delete", authJWT, userController.findPlanByDelete);

export default userRouter;
