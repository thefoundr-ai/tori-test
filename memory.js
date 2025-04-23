const { db } = require('./updated-firebase');

/**
 * Store a new message in the conversation history
 * @param {string} userId - User identifier
 * @param {string} role - Message role ('user' or 'assistant')
 * @param {string} content - Message content
 * @param {string} agentUsed - Agent that processed the message
 * @returns {Promise<string>} - Message ID
 */
async function storeMessage(userId, role, content, agentUsed) {
  try {
    // Create a simpler document structure that doesn't require complex queries
    const messageData = {
      userId,
      role,
      content,
      timestamp: new Date(),
      agentUsed
    };
    
    // Use userId as the collection name to avoid complex queries
    // This creates a separate collection for each user
    const messageRef = await db.collection(`users/${userId}/messages`).add(messageData);
    
    // Update the user document with last activity timestamp
    // This is a simple update that doesn't require complex queries
    await db.collection('users').doc(userId).set({
      lastActive: new Date(),
      userPlan: messageData.userPlan || 'free'
    }, { merge: true });
    
    return messageRef.id;
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  }
}

/**
 * Get conversation history for a user
 * For premium users: Returns up to 10 messages
 * For free users: Returns only the last message
 * @param {string} userId - User identifier
 * @param {string} userPlan - User subscription plan ('free' or 'premium')
 * @returns {Promise<Array>} - Array of message objects formatted for OpenAI
 */
async function getConversationHistory(userId, userPlan) {
  try {
    // Determine how many messages to retrieve based on user plan
    const limit = userPlan === 'premium' ? 10 : 1;
    
    // Simple query that only requires a single collection and sorting by timestamp
    // This avoids the need for complex composite indexes
    const messagesRef = db.collection(`users/${userId}/messages`)
      .orderBy('timestamp', 'desc')
      .limit(limit * 2); // Multiply by 2 to account for both user and assistant messages
    
    const querySnapshot = await messagesRef.get();
    
    // Format messages for OpenAI (only need role and content)
    const messages = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        role: data.role,
        content: data.content
      });
    });
    
    // Return messages in chronological order
    return messages.reverse();
  } catch (error) {
    console.error('Error getting conversation history:', error);
    // Return empty array instead of throwing error to make the function more resilient
    return [];
  }
}

module.exports = {
  storeMessage,
  getConversationHistory
};
