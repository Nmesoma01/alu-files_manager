import { ObjectID } from 'mongodb';
import sha1 from 'sha1';
import { db } from '../utils/db';
import { get } from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      const userEmail = await db.collection('users').findOne({ email });
      if (userEmail) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedpwd = sha1(password);
      const result = await db.collection('users').insertOne({ email, password: hashedpwd });

      const user = { _id: result.insertedId, email };
      return res.status(201).json(user);
    } catch (error) {
      console.error('Error in postNew:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await get(`auth_${token}`);
    const idObject = new ObjectID(userId);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await db.collection('users').findOne({ _id: idObject });

    return res.status(200).json({ id: userId, email: user.email });
  }
}

export default UsersController;
