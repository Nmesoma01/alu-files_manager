const sha1 = require('sha1');
const { v4: uuid4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  static async getConnect(req, res) {
    const credentials = req.headers.authorization.split(' ')[1];
    const [email, password] = Buffer.from(credentials, 'base64').toString().split(':');

    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const query = { email, password: sha1(password) };
    const user = await dbClient.db.collection('users').findOne(query);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const token = uuid4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

module.exports = AuthController;
