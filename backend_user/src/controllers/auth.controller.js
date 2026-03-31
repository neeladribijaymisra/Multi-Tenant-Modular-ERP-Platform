import User from "../models/User.js";
import Student from "../models/Student.js";

export async function login(req, res, next) {
  try {
    const { role, username, password } = req.body;
    const tenantSlug = req.params.tenant;

    const user = await User.findOne({
      tenantSlug,
      role,
      username,
      password,
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const studentProfile =
      user.role === "student"
        ? await Student.findOne({
            tenantSlug,
            username: user.username,
          }).lean()
        : null;

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        tenantSlug: user.tenantSlug,
        role: user.role,
        username: user.username,
        displayName: user.displayName,
        photoDataUrl: studentProfile?.photoDataUrl || "",
        profile: studentProfile
          ? {
              studentId: studentProfile.studentId,
              department: studentProfile.department,
              semester: studentProfile.semester,
              section: studentProfile.section,
              email: studentProfile.email,
              phone: studentProfile.phone,
              status: studentProfile.status,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
}
