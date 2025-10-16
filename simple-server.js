const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Simple server is running',
    timestamp: new Date().toISOString(),
  });
});

// Simple welcome page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Leave Request Management System</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
          }
          h2 {
            color: #2980b9;
          }
          .feature {
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 10px 15px;
            margin-bottom: 10px;
          }
          .api-endpoint {
            background-color: #f1f1f1;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <h1>Leave Request Management System</h1>
        <p>Welcome to the Leave Request Management System backend. This system is designed to digitize and simplify the leave application and approval process.</p>
        
        <h2>Core Features</h2>
        <div class="feature">User Management with role-based access control</div>
        <div class="feature">Leave Request submission and tracking</div>
        <div class="feature">Two-step approval workflow (Manager → HR)</div>
        <div class="feature">Leave balance tracking</div>
        <div class="feature">Holiday calendar management</div>
        
        <h2>API Endpoints</h2>
        <p>The API is available at:</p>
        <div class="api-endpoint">http://localhost:${PORT}/api</div>
        
        <p>Health check endpoint:</p>
        <div class="api-endpoint">http://localhost:${PORT}/api/health</div>
        
        <h2>GraphQL API</h2>
        <p>The GraphQL playground will be available at:</p>
        <div class="api-endpoint">http://localhost:${PORT}/api/graphql</div>
        <p>(Not available in this simple server)</p>
        
        <h2>Status</h2>
        <p>This is a simple server for preview purposes. The full application is under development.</p>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple server running at http://localhost:${PORT}`);
});
