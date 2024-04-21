import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    try {
      const base64Credentials = req.headers.authorization.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      console.log(credentials);
      const [email, password] = credentials.split(':');
      console.log(email, password);
      if (!email || !password) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.usersCollection.findOne({ email });
      console.log(user);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      console.log('I got here');
      const isRightPassword = crypto.createHash('sha1').update(password).digest('hex') === user.password;
      if (!isRightPassword) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = uuidv4();
      const key = `auth_${token}`;
      redisClient.set(key, user._id.toString(), 86400);
      return res.status(200).json({ token });
    } catch (error) {
      console.log(error);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await redisClient.del(`auth_${token}`);
    if (!result) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log(result);
    return res.status(204).end();
  }
}
