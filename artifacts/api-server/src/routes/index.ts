import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tripsRouter from "./trips";
import transportationRouter from "./transportation";
import accommodationRouter from "./accommodation";
import budgetRouter from "./budget";
import expensesRouter from "./expenses";
import notificationsRouter from "./notifications";
import categoriesRouter from "./categories";
import dashboardRouter from "./dashboard";
import activitiesRouter from "./activities";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/dashboard", dashboardRouter);
router.use("/trips", tripsRouter);
router.use("/trips/:tripId/transportation", transportationRouter);
router.use("/trips/:tripId/accommodation", accommodationRouter);
router.use("/trips/:tripId/budget", budgetRouter);
router.use("/trips/:tripId/expenses", expensesRouter);
router.use("/trips/:tripId/notifications", notificationsRouter);
router.use("/trips/:tripId/activities", activitiesRouter);
router.use("/categories", categoriesRouter);

export default router;
