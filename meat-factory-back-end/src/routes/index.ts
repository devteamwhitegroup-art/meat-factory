import { Router } from "express";
import fileRouter from "./file.route";
import seedRouter from "./seed.route";
import { OrderController } from "../controller/order/order.controller";

const router = Router();

router.use("/file", fileRouter);
router.use("/seed", seedRouter);

// QPay payment callback (GET or POST). The body is ignored — checkPayment asks
// QPay itself, so a forged call can at most trigger a harmless re-check.
router.all("/qpay/callback/:id", async (req, res) => {
  await OrderController.checkPayment(String(req.params.id)).catch(() => undefined);
  res.send("SUCCESS");
});

export default router;
