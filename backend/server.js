require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes');
const folderRoutes = require('./routes/folderRoutes');
const statsRoutes = require('./routes/statsRoutes');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Smart Cloud Backend | Status</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #4f46e5;
                --bg-gradient: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                --clay-bg: rgba(255, 255, 255, 0.7);
                --clay-shadow: 20px 20px 60px #bebebe, -20px -20px 60px #ffffff;
                --success: #10b981;
            }

            body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: var(--bg-gradient);
                font-family: 'Outfit', sans-serif;
                color: #2d3748;
            }

            .container {
                background: var(--clay-bg);
                padding: 3rem;
                border-radius: 40px;
                box-shadow: var(--clay-shadow);
                text-align: center;
                max-width: 500px;
                width: 90%;
                border: 1px solid rgba(255, 255, 255, 0.4);
                backdrop-filter: blur(10px);
            }

            .logo {
                font-size: 3rem;
                margin-bottom: 1rem;
            }

            h1 {
                font-weight: 600;
                font-size: 1.8rem;
                margin: 0 0 1rem 0;
                background: linear-gradient(to right, #4f46e5, #9333ea);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .status-badge {
                display: inline-flex;
                align-items: center;
                background: white;
                padding: 0.5rem 1.2rem;
                border-radius: 50px;
                box-shadow: inset 2px 2px 5px #d1d1d1, inset -2px -2px 5px #ffffff;
                font-weight: 600;
                color: var(--success);
                font-size: 0.9rem;
                margin-bottom: 2rem;
            }

            .pulse {
                width: 10px;
                height: 10px;
                background: var(--success);
                border-radius: 50%;
                margin-right: 10px;
                box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }

            .services {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                margin-top: 1rem;
            }

            .service-item {
                background: white;
                padding: 1rem;
                border-radius: 20px;
                box-shadow: 4px 4px 10px #e0e0e0, -4px -4px 10px #ffffff;
                font-size: 0.85rem;
            }

            .service-name {
                display: block;
                font-weight: 600;
                margin-bottom: 4px;
                color: #4a5568;
            }

            .service-status {
                color: var(--success);
                font-size: 0.75rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            }

            .footer {
                margin-top: 2rem;
                font-size: 0.75rem;
                color: #718096;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">⚡</div>
            <h1>Smart Cloud Backend</h1>
            <div class="status-badge">
                <span class="pulse"></span>
                SYSTEMS OPERATIONAL
            </div>
            
            <div class="services">
                <div class="service-item">
                    <span class="service-name">MongoDB Atlas</span>
                    <span class="service-status">● Connected</span>
                </div>
                <div class="service-item">
                    <span class="service-name">Azure Storage</span>
                    <span class="service-status">● Ready</span>
                </div>
                <div class="service-item">
                    <span class="service-name">Deduplication</span>
                    <span class="service-status">● Active</span>
                </div>
                <div class="service-item">
                    <span class="service-name">File Hashing</span>
                    <span class="service-status">● SHA-256</span>
                </div>
            </div>

            <div class="footer">
                v1.0.2 Stable Release • Port 5000
            </div>
        </div>
    </body>
    </html>
  `);
});

app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/stats', statsRoutes);

// Static file serving for Production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Handle SPA routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}


// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
