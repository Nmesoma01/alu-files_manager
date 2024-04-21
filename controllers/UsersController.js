import { ObjectID } from 'mongodb';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const crypto = require('crypto');

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const user = await dbClient.usersCollection.findOne({ email });
    console.log(user);
    if (user) {
      return res.status(400).json({ error: 'Already exist' });
    }
    const hashedPassword = crypto
      .createHash('sha1')
      .update(password)
      .digest('hex');
    const result = await dbClient.usersCollection.insertOne({
      email,
      password: hashedPassword,
    });
    const createdUser = {
      id: result.insertedId,
      email,
    };
    return res.status(201).json(createdUser);
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    console.log(userId);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.usersCollection.findOne({
      _id: ObjectID(userId),
    });
    console.log(user);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json({ id: userId, email: user.email });
  }
}
