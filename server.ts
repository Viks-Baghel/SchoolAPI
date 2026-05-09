import express from 'express';
import dotenv from 'dotenv';
import schoolRoutes from './src/routes/schoolRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', schoolRoutes);

app.get('/health', (_req, res) => {
  res.json({
    "success":true,
    "message":"Health Endpoint created successfully"
  });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});