import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assetsRouter from "./assets";
import adminRouter from "./admin";
import categoriesRouter from "./categories";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assetsRouter);
router.use(adminRouter);
router.use(categoriesRouter);
router.use(settingsRouter);

export default router;
