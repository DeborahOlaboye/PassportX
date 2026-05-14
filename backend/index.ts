import express from 'express';
import notificationRoutes from './routes/notifications';

const app = express();

app.use(express.json());
app.use('/api/notifications', notificationRoutes);

export default app;
