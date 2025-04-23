require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { selectAgent } = require('./agents');
const { storeMessage, getConversationHistory } = require('./memory');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Fallback in-memory conversation storage if Firebase fails
const fallbackConversations = {};

// Main endpoint for Tori AI assistant
app.post('/tori', async (req, res) => {
  try {
    const { userId, message, userPlan = 'free' } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }
    
    // Select the appropriate specialized agent based on message and user plan
    const { systemMessage, agentUsed } = selectAgent(message, userPlan);
    
    let conversationHistory = [];
    let usingFirebase = true;
    
    try {
      // Try to get conversation history from Firebase
      conversationHistory = await getConversationHistory(userId, userPlan);
      
      // Store user message in Firebase
      await storeMessage(userId, 'user', message, agentUsed);
    } catch (error) {
      // If Firebase fails, fall back to in-memory storage
      console.error('Firebase error, using fallback memory:', error);
      usingFirebase = false;
      
      // Initialize conversation for this user if it doesn't exist
      if (!fallbackConversations[userId]) {
        fallbackConversations[userId] = [];
      }
      
      // Store user message in fallback memory
      fallbackConversations[userId].push({ role: 'user', content: message });
      
      // Get conversation history from fallback memory (limited based on user plan)
      const historyLimit = userPlan === 'premium' ? 10 : 1;
      conversationHistory = fallbackConversations[userId].slice(-historyLimit * 2);
    }
    
    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemMessage },
      ...conversationHistory
    ];
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    // Get the assistant's response
    const assistantResponse = completion.choices[0].message.content;
    
    try {
      if (usingFirebase) {
        // Store assistant response in Firebase
        await storeMessage(userId, 'assistant', assistantResponse, agentUsed);
      } else {
        // Store assistant response in fallback memory
        fallbackConversations[userId].push({ role: 'assistant', content: assistantResponse });
      }
    } catch (error) {
      console.error('Error storing assistant response:', error);
      // Continue even if storing the response fails
    }
    
    // Return response with metadata
    return res.json({
      message: assistantResponse,
      agentUsed: agentUsed,
      conversationMemory: true,
      storageType: usingFirebase ? 'firebase' : 'fallback',
      premiumFeatures: {
        extendedMemory: userPlan === 'premium',
        specializedAgents: userPlan === 'premium',
        detailedAnalysis: userPlan === 'premium'
      }
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'An error occurred while processing your request', details: error.message });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Tori AI API is running');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
