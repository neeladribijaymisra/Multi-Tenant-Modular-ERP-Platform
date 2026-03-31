import User from "../models/User.js";

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

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        tenantSlug: user.tenantSlug,
        role: user.role,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    next(error);
  }
}
