const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { storeMessage, getOrCreateConversation, getConversationHistory } = require('./memory');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define Tori's system message
const TORI_SYSTEM_MESSAGE = `
You are Tori, an AI cofounder and executive assistant for Foundr.ai.
Your purpose is to help users validate startup ideas, build business plans, organize strategy, and connect with specialized agents for specific tasks.
You are knowledgeable about startups, business models, market validation, and fundraising.
You are encouraging but realistic, helping founders focus on validation and execution.
Always introduce yourself as Tori from Foundr.ai in your first message to a new user.
`;

app.post('/tori', async (req, res) => {
  try {
    const { userId, message, userPlan } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Determine if user has access to premium features
    const isPremium = userPlan === 'premium';
    
    // Get or create conversation for this user
    const conversation = await getOrCreateConversation(userId, userPlan);
    
    // Get conversation history based on user plan
    const conversationHistory = await getConversationHistory(userId, conversation.conversationId, userPlan);
    
    // Prepare messages for OpenAI
    const messages = [
      { role: "system", content: TORI_SYSTEM_MESSAGE },
    ];
    
    // Add conversation history to messages (if available)
    if (conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }
    
    // Add the current user message
    messages.push({ role: "user", content: message });
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo", // You can change this to gpt-3.5-turbo to reduce costs
      messages: messages,
      temperature: 0.7,
    });
    
    // Extract the response
    const response = completion.choices[0].message.content;
    
    // Store the user message in Firebase
    await storeMessage(userId, conversation.conversationId, 'user', message, 'user');
    
    // Store Tori's response in Firebase
    await storeMessage(userId, conversation.conversationId, 'assistant', response, 'tori');
    
    // Return the response along with metadata
    return res.json({
      response,
      agentUsed: "tori",
      premiumFeatures: {
        available: isPremium,
        specializedAgents: isPremium,
        documentGeneration: isPremium,
        conversationMemory: isPremium
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
