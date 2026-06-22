import { Router } from "express";
import fileRouter from "./file.route";
import seedRouter from "./seed.route";

const router = Router();

router.use("/file", fileRouter);
router.use("/seed", seedRouter);

export default router;
