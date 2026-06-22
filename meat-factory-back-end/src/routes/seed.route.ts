import { Router } from "express";
import { AdminController } from "../controller/user/admin.controller";

const router = Router();

router.post("/admin", async (_, res) => {
  try {
    await AdminController.seedAdmin();
    res.status(201).json({ message: "Admin seeded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error seeding admin", error });
  }
});

router.post("/staff", async (_, res) => {
  try {
    await AdminController.seedStaff();
    res.status(201).json({ message: "Staff seeded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error seeding staff", error });
  }
});

export default router;
