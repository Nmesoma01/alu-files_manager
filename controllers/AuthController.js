import sha1 from 'sha1';
import { v4 as uuid4 } from 'uuid';
import { set, get, del } from '../utils/redis';
import { db } from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const credentials = req.headers.authorization.split(' ')[1];
    const [email, password] = Buffer.from(credentials, 'base64').toString().split(':');

    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const query = { email, password: sha1(password) };
    const user = await db.collection('users').findOne(query);

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const token = uuid4();
    await set(`auth_${token}`, user._id.toString(), 86400);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await del(`auth_${token}`);
    return res.status(204).send();
  }
}

export default AuthController;
