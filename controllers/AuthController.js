const { v4: uuidv4 } = require("uuid");
const { redisClient } = require("../utils/redis"); // Assuming redisClient is defined there

class AuthController {
  static async getConnect(req, res) {
    const authorization = req.header("Authorization");
    if (!authorization) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = Buffer.from(authorization.split(" ")[1], "base64")
      .toString("utf-8")
      .split(":");
    const email = decoded[0];
    const password = decoded[1];

    // Find user by email and compare password hash (SHA1 in this example)
    const user = await dbClient.usersCollection.findOne({
      email,
      password: sha1(password),
    }); // Assuming dbClient is defined elsewhere

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), "EX", 60 * 60 * 24); // Set expiration for 24 hours

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header("X-Token");
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const key = `auth_${token}`;
    await redisClient.del(key);

    return res.status(204).send(); // No content response for successful disconnection
  }
}

module.exports = AuthController;
