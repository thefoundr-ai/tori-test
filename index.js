const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Tori API endpoint
app.post('/tori', (req, res) => {
  try {
    // Basic validation
    const { userId, message, userPlan } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: {
          message: 'Missing required field: userId',
          status: 400
        }
      });
    }
    
    if (!message) {
      return res.status(400).json({
        error: {
          message: 'Missing required field: message',
          status: 400
        }
      });
    }
    
    // Default to free plan if not specified
    const plan = userPlan || 'free';
    
    // Simple response for testing
    const response = {
      response: `Hello! I'm Tori, your AI cofounder assistant. You said: "${message}". I'm currently running in ${plan} mode.`,
      agentUsed: 'tori',
      premiumFeatures: {
        longTermMemoryUsed: plan === 'premium',
        expandedPromptLength: plan === 'premium',
        specializedAgentsAvailable: plan === 'premium' ? 
          ['valuation', 'blueprint', 'pitch', 'mindfulness'] : 
          ['blueprint']
      }
    };
    
    // Return the response
    res.status(200).json(response);
  } catch (error) {
    console.error(`Error processing Tori request: ${error.message}`);
    res.status(500).json({
      error: {
        message: 'An unexpected error occurred',
        status: 500
      }
    });
  }
});

// Simple echo endpoint
app.post('/echo', (req, res) => {
  res.json({ 
    message: `You said: ${req.body.message || 'nothing'}`,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Tori backend server running on port ${port}`);
});

module.exports = app;
