// Import required modules
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

// Import Firebase and memory modules
const { db } = require('./firebase');
const { getOrCreateConversation, storeMessage, getConversationHistory } = require('./memory');

// Import specialized agents
const { selectAgent } = require('./agents');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Tori endpoint
app.post('/tori', async (req, res) => {
  try {
    // Extract request data
    const { message, userId, userPlan = 'free' } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and userId are required' });
    }
    
    // Get or create conversation
    const conversation = await getOrCreateConversation(userId, userPlan);
    
    // Get conversation history based on user plan
    const conversationHistory = await getConversationHistory(userId, conversation.id, userPlan);
    
    // Select the appropriate agent based on message content and user plan
    const selectedAgent = selectAgent(message, userPlan);
    
    // Prepare messages for OpenAI
    const messages = [
      { role: "system", content: selectedAgent.systemMessage },
    ];
    
    // Add conversation history to messages (if available)
    if (conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }
    
    // Add the current user message
    messages.push({ role: "user", content: message });
    
    // If there's a specific message to include from agent selection (e.g., premium feature notice)
    if (selectedAgent.message) {
      // We'll handle this in the response instead of modifying the OpenAI prompt
    }
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      temperature: 0.7,
    });
    
    // Extract the response
    let responseContent = completion.choices[0].message.content;
    
    // If there's a specific message from agent selection, prepend it to the response
    if (selectedAgent.message) {
      responseContent = selectedAgent.message + "\n\n" + responseContent;
    }
    
    // Store the user message in Firebase
    await storeMessage(conversation.id, userId, "user", message, selectedAgent.agent);
    
    // Store the assistant response in Firebase
    await storeMessage(conversation.id, userId, "assistant", responseContent, selectedAgent.agent);
    
    // Determine which premium features are available based on user plan
    const premiumFeatures = {
      available: userPlan === 'premium',
      specializedAgents: userPlan === 'premium',
      documentGeneration: userPlan === 'premium',
      conversationMemory: userPlan === 'premium'
    };
    
    // Send the response
    res.json({
      response: responseContent,
      agentUsed: selectedAgent.agent,
      premiumFeatures: premiumFeatures
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Tori AI assistant backend is running');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
