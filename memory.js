const { db } = require('./firebase');

/**
 * Store a new message in the conversation history
 * @param {string} userId - User identifier
 * @param {string} conversationId - Conversation identifier
 * @param {string} role - Message role ('user' or 'assistant')
 * @param {string} content - Message content
 * @param {string} agentUsed - Agent that processed the message
 * @returns {Promise<string>} - Message ID
 */
async function storeMessage(userId, conversationId, role, content, agentUsed) {
  try {
    // Create message document
    const messageData = {
      conversationId,
      userId,
      role,
      content,
      timestamp: new Date(),
      agentUsed
    };
    
    // Add message to Firestore
    const messageRef = await db.collection('messages').add(messageData);
    
    // Update conversation metadata
    const conversationRef = db.collection('conversations').doc(conversationId);
    await conversationRef.update({
      updatedAt: new Date(),
      messageCount: admin.firestore.FieldValue.increment(1)
    });
    
    return messageRef.id;
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  }
}

/**
 * Get or create a conversation for a user
 * @param {string} userId - User identifier
 * @param {string} userPlan - User subscription plan ('free' or 'premium')
 * @returns {Promise<Object>} - Conversation object
 */
async function getOrCreateConversation(userId, userPlan) {
  try {
    // Check if user has an active conversation
    const conversationsRef = db.collection('conversations');
    const query = conversationsRef
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .limit(1);
    
    const querySnapshot = await query.get();
    
    // If conversation exists, return it
    if (!querySnapshot.empty) {
      const conversation = querySnapshot.docs[0];
      return {
        conversationId: conversation.id,
        ...conversation.data()
      };
    }
    
    // Otherwise, create a new conversation
    const newConversation = {
      userId,
      userPlan,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0
    };
    
    const conversationRef = await conversationsRef.add(newConversation);
    return {
      conversationId: conversationRef.id,
      ...newConversation
    };
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
}

/**
 * Get conversation history for a user
 * For premium users: Returns all messages (up to a limit)
 * For free users: Returns only the last message (or none)
 * @param {string} userId - User identifier
 * @param {string} conversationId - Conversation identifier
 * @param {string} userPlan - User subscription plan ('free' or 'premium')
 * @returns {Promise<Array>} - Array of message objects
 */
async function getConversationHistory(userId, conversationId, userPlan) {
  try {
    const messagesRef = db.collection('messages');
    let query;
    
    // For premium users, get more conversation history
    if (userPlan === 'premium') {
      // Get last 10 messages for context
      query = messagesRef
        .where('conversationId', '==', conversationId)
        .orderBy('timestamp', 'desc')
        .limit(10);
    } else {
      // For free users, get only the last message
      query = messagesRef
        .where('conversationId', '==', conversationId)
        .orderBy('timestamp', 'desc')
        .limit(1);
    }
    
    const querySnapshot = await query.get();
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({
        messageId: doc.id,
        ...doc.data()
      });
    });
    
    // Return messages in chronological order
    return messages.reverse();
  } catch (error) {
    console.error('Error getting conversation history:', error);
    throw error;
  }
}

module.exports = {
  storeMessage,
  getOrCreateConversation,
  getConversationHistory
};
