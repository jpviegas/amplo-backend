import express from "express";
import {
  authUser,
  changePassword,
  consumePasswordToken,
  deleteUser,
  getAllUsers,
  getUserById,
  registerUser,
  requestPasswordReset,
  sendTestEmail,
  setMobileFirstAccessPassword,
  updateUser,
  validatePasswordToken,
  verifyMobileLoginCode,
} from "../controllers/userController";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/login", authUser);
router.post("/register", registerUser);
router.post("/email/test", sendTestEmail);
router.post("/password/request-reset", requestPasswordReset);
router.post("/password/validate-token", validatePasswordToken);
router.post("/password/consume-token", consumePasswordToken);
router.post("/mobile/verify-code", verifyMobileLoginCode);
router.post("/mobile/set-password", setMobileFirstAccessPassword);
router.patch("/:id", updateUser);
router.patch("/change-password/:id", changePassword);
router.delete("/:id", deleteUser);

export default router;
