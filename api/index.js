import app from '../server/app.js';
import connectDB from './_lib/db.js';

// Connect to MongoDB before handling requests
// The connection is cached across warm serverless invocations
let isReady = false;

const handler = async (req, res) => {
  if (!isReady) {
    await connectDB();
    isReady = true;
  }
  return app(req, res);
};

export default handler;
