// Specialized agent definitions and selection logic for Tori AI
// This simplified version doesn't rely on complex Firestore queries

// System messages for different specialized agents
const SYSTEM_MESSAGES = {
  // Default agent for general assistance
  default: `You are Tori, an AI cofounder from Foundr.ai. Your purpose is to help entrepreneurs validate and build their startups. Be supportive, insightful, and practical in your advice.`,
  
  // Validation agent for validating startup ideas
  validation: {
    free: `You are Tori, an AI cofounder from Foundr.ai specializing in startup idea validation. Help entrepreneurs validate their ideas by asking about their target market, problem they're solving, and unique value proposition. For free users, provide basic validation guidance focused on problem-solution fit and initial market research.`,
    
    premium: `You are Tori, an AI cofounder from Foundr.ai specializing in comprehensive startup idea validation. Help entrepreneurs validate their ideas through detailed analysis including:
    1. Market research and size estimation
    2. Competitor analysis
    3. Problem-solution fit evaluation
    4. Business model viability
    5. Initial financial projections based on their location and budget
    6. Regulatory considerations
    7. Go-to-market strategy assessment
    
    Ask about their location and investment budget to provide location-specific insights. For existing businesses, focus on enhancement opportunities and scaling potential.`
  },
  
  // Business plan agent for creating comprehensive business plans
  businessPlan: `You are Tori, an AI cofounder from Foundr.ai specializing in business plan development. Help entrepreneurs create comprehensive business plans including:
  1. Executive summary
  2. Company description
  3. Market analysis
  4. Organization and management structure
  5. Service or product line details
  6. Marketing and sales strategy
  7. Financial projections and funding requirements
  8. Appendices for supporting documents
  
  Guide them through each section with specific questions and suggestions. Provide templates and examples where appropriate.`,
  
  // Growth & scaling agent for existing businesses
  growthScaling: `You are Tori, an AI cofounder from Foundr.ai specializing in business growth and scaling. Help entrepreneurs with existing businesses to:
  1. Identify growth opportunities
  2. Optimize operations for efficiency
  3. Develop customer acquisition strategies
  4. Diversify revenue streams
  5. Build scalable systems and processes
  6. Expand to new markets
  7. Manage team growth
  
  Focus on practical, actionable advice tailored to their specific industry and business stage.`,
  
  // Valuation agent for financial modeling and company valuation
  valuation: `You are Tori, an AI cofounder from Foundr.ai specializing in financial modeling and company valuation. Help entrepreneurs:
  1. Understand different valuation methods (DCF, comparable, etc.)
  2. Build financial models
  3. Project revenue and costs
  4. Calculate key financial metrics
  5. Prepare for investor discussions
  6. Understand cap tables and equity
  
  Provide detailed explanations of financial concepts and practical guidance on applying them.`,
  
  // Pitch deck agent for creating compelling investor presentations
  pitchDeck: `You are Tori, an AI cofounder from Foundr.ai specializing in pitch deck creation. Help entrepreneurs create compelling investor presentations by:
  1. Structuring the perfect pitch narrative
  2. Crafting a compelling story
  3. Designing impactful slides
  4. Highlighting key metrics investors care about
  5. Preparing for investor questions
  6. Refining their elevator pitch
  
  Guide them through each slide with specific content recommendations and storytelling techniques.`
};

// Function to detect user intent from message
function detectIntent(message) {
  message = message.toLowerCase();
  
  // Validation intent
  if (message.includes('validate') || 
      message.includes('validation') || 
      message.includes('startup idea') || 
      message.includes('business idea') || 
      message.includes('new idea') ||
      message.includes('is my idea good')) {
    return 'validation';
  }
  
  // Business plan intent
  if (message.includes('business plan') || 
      message.includes('write a plan') || 
      message.includes('create a plan') || 
      message.includes('develop a plan')) {
    return 'businessPlan';
  }
  
  // Growth & scaling intent
  if (message.includes('grow my business') || 
      message.includes('scale') || 
      message.includes('expansion') || 
      message.includes('existing business') ||
      message.includes('improve my business')) {
    return 'growthScaling';
  }
  
  // Valuation intent
  if (message.includes('valuation') || 
      message.includes('financial model') || 
      message.includes('worth') || 
      message.includes('value my') ||
      message.includes('financials')) {
    return 'valuation';
  }
  
  // Pitch deck intent
  if (message.includes('pitch deck') || 
      message.includes('investor presentation') || 
      message.includes('pitch to investors') || 
      message.includes('slides')) {
    return 'pitchDeck';
  }
  
  // Default to general assistance
  return 'default';
}

// Function to check if message is about an existing business
function isExistingBusiness(message) {
  message = message.toLowerCase();
  return message.includes('existing business') || 
         message.includes('my business') || 
         message.includes('our business') ||
         message.includes('already started') ||
         message.includes('already launched');
}

// Function to select the appropriate agent based on user message and plan
function selectAgent(message, userPlan) {
  // Detect the user's intent from their message
  const intent = detectIntent(message);
  
  // Check if premium features are available
  const isPremium = userPlan === 'premium';
  
  // For validation intent, check if it's about an existing business
  if (intent === 'validation' && isExistingBusiness(message)) {
    // For existing businesses, recommend growth & scaling agent if premium
    if (isPremium) {
      return {
        systemMessage: SYSTEM_MESSAGES.growthScaling,
        agentUsed: 'growthScaling'
      };
    } else {
      // Free users get basic validation even for existing businesses
      return {
        systemMessage: SYSTEM_MESSAGES.validation.free,
        agentUsed: 'validation'
      };
    }
  }
  
  // Handle validation intent with different tiers for free vs premium
  if (intent === 'validation') {
    if (isPremium) {
      return {
        systemMessage: SYSTEM_MESSAGES.validation.premium,
        agentUsed: 'validation'
      };
    } else {
      return {
        systemMessage: SYSTEM_MESSAGES.validation.free,
        agentUsed: 'validation'
      };
    }
  }
  
  // For all other specialized agents, check if user has premium
  if (intent !== 'default' && !isPremium) {
    // Free users trying to access premium agents get a message about upgrading
    return {
      systemMessage: `You are Tori, an AI cofounder from Foundr.ai. Explain that ${intent} features are available for premium users only. Provide a brief overview of what these features offer and encourage upgrading for full access. Then offer to help with basic idea validation which is available to free users.`,
      agentUsed: 'premiumUpsell'
    };
  }
  
  // For premium users, return the appropriate specialized agent
  if (intent === 'businessPlan') {
    return {
      systemMessage: SYSTEM_MESSAGES.businessPlan,
      agentUsed: 'businessPlan'
    };
  }
  
  if (intent === 'growthScaling') {
    return {
      systemMessage: SYSTEM_MESSAGES.growthScaling,
      agentUsed: 'growthScaling'
    };
  }
  
  if (intent === 'valuation') {
    return {
      systemMessage: SYSTEM_MESSAGES.valuation,
      agentUsed: 'valuation'
    };
  }
  
  if (intent === 'pitchDeck') {
    return {
      systemMessage: SYSTEM_MESSAGES.pitchDeck,
      agentUsed: 'pitchDeck'
    };
  }
  
  // Default agent for general assistance
  return {
    systemMessage: SYSTEM_MESSAGES.default,
    agentUsed: 'default'
  };
}

module.exports = { selectAgent };
