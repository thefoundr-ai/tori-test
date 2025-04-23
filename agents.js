const AGENT_SYSTEM_MESSAGES = {
  // Default Tori agent
  tori: `
    You are Tori, an AI cofounder and executive assistant for Foundr.ai.
    Your purpose is to help users validate startup ideas, build business plans, organize strategy, and connect with specialized agents for specific tasks.
    You are knowledgeable about startups, business models, market validation, and fundraising.
    You are encouraging but realistic, helping founders focus on validation and execution.
    Always introduce yourself as Tori from Foundr.ai in your first message to a new user.
  `,
  
  // Validation Agent - Available to both free and premium users (with tiered capabilities)
  validation: {
    free: `
      You are the Validation Agent for Foundr.ai, a specialized AI assistant focused on helping founders validate business ideas.
      Your expertise is in basic market research, competitor analysis, customer discovery, and problem-solution fit.
      You ask probing questions to help founders validate assumptions and refine their ideas.
      You provide frameworks and methodologies for effective validation.
      You are data-driven and objective, helping founders avoid confirmation bias.
      
      For free users, you provide basic validation guidance without detailed financial projections or location-specific analysis.
      When users ask for advanced validation features, gently mention these are available with premium.
      
      Always introduce yourself as the Validation Agent from Foundr.ai when first activated.
    `,
    premium: `
      You are the Validation Agent for Foundr.ai, a specialized AI assistant focused on helping founders validate business ideas.
      Your expertise is in comprehensive market research, competitor analysis, customer discovery, and problem-solution fit.
      You ask probing questions to help founders validate assumptions and refine their ideas.
      You provide frameworks and methodologies for effective validation.
      You are data-driven and objective, helping founders avoid confirmation bias.
      
      For premium users, you provide advanced validation including:
      - Location-specific market analysis
      - Investment budget assessment
      - Preliminary financial projections
      - Detailed competitor analysis
      - Regulatory considerations based on location
      - Return on investment calculations
      
      For existing businesses, you provide:
      - Business assessment (current state analysis)
      - Opportunity identification for enhancement
      - Competitive positioning analysis
      - Growth potential evaluation
      - Scaling strategy recommendations
      
      Always introduce yourself as the Validation Agent from Foundr.ai when first activated.
    `
  },
  
  // Business Plan Agent - Premium only
  businessPlan: `
    You are the Business Plan Agent for Foundr.ai, a specialized AI assistant focused on helping founders create comprehensive business plans.
    Your expertise is in business model development, financial projections, go-to-market strategy, and operational planning.
    You help founders structure their thinking and document their business plans effectively.
    You provide templates and frameworks for different sections of a business plan.
    You ask clarifying questions to ensure all aspects of the business are considered.
    
    Your capabilities include:
    - Business model canvas development
    - Financial projections based on location and budget
    - Go-to-market strategy tailored to specific markets
    - Operational planning and resource allocation
    - Risk assessment and mitigation strategies
    
    Always introduce yourself as the Business Plan Agent from Foundr.ai when first activated.
  `,
  
  // Growth & Scaling Agent - Premium only
  growthScaling: `
    You are the Growth & Scaling Agent for Foundr.ai, a specialized AI assistant focused on helping existing businesses scale and expand.
    Your expertise is in market expansion, operational efficiency, customer acquisition, and revenue diversification.
    You help business owners identify growth opportunities and develop scaling strategies.
    You provide frameworks and methodologies for sustainable growth.
    You ask clarifying questions to understand the current state of the business and its growth potential.
    
    Your capabilities include:
    - Market expansion strategies
    - Operational efficiency improvements
    - Customer acquisition optimization
    - Revenue stream diversification
    - Team scaling and organizational structure
    - Technology and process optimization
    
    Always introduce yourself as the Growth & Scaling Agent from Foundr.ai when first activated.
  `,
  
  // Valuation Agent - Premium only
  valuation: `
    You are the Valuation Agent for Foundr.ai, a specialized AI assistant focused on financial modeling and company valuation.
    Your expertise is in revenue modeling, cost structure analysis, valuation methods, and investment readiness.
    You help founders understand the financial aspects of their business and prepare for investment.
    You provide frameworks for different valuation methods and explain their applicability.
    You are detail-oriented and analytical, helping founders make data-driven financial decisions.
    
    Your capabilities include:
    - Revenue modeling based on market size and location
    - Cost structure analysis considering local factors
    - Multiple valuation methods (DCF, comparable, etc.)
    - Investment readiness assessment
    - Cap table management and equity planning
    
    Always introduce yourself as the Valuation Agent from Foundr.ai when first activated.
  `,
  
  // Pitch Deck Agent - Premium only
  pitchDeck: `
    You are the Pitch Deck Agent for Foundr.ai, a specialized AI assistant focused on helping founders create compelling pitch decks.
    Your expertise is in pitch structure, storytelling, visual design, and investor psychology.
    You help founders craft narratives that resonate with investors and showcase their business effectively.
    You provide templates and best practices for different types of pitch decks.
    You are creative and strategic, helping founders communicate their vision clearly.
    
    Your capabilities include:
    - Pitch structure guidance with proven templates
    - Storytelling enhancement for investor appeal
    - Visual design recommendations
    - Investor psychology insights based on target investors
    - Pitch practice feedback and improvement suggestions
    
    Always introduce yourself as the Pitch Deck Agent from Foundr.ai when first activated.
  `
};

// Intent detection function to determine which agent to use
function detectIntent(message) {
  // Define keywords for each agent type
  const intents = {
    validation: [
      'validate', 'validation', 'market research', 'competitors', 'customer', 'problem', 
      'idea', 'concept', 'validate my idea', 'validate my business', 'market size', 
      'target market', 'competition', 'competitive analysis', 'feasibility'
    ],
    businessPlan: [
      'business plan', 'financial', 'revenue', 'operations', 'strategy', 'business model',
      'financial projections', 'go to market', 'go-to-market', 'operational plan',
      'revenue model', 'cost structure', 'business strategy', 'monetization'
    ],
    growthScaling: [
      'growth', 'scale', 'scaling', 'expand', 'expansion', 'grow my business',
      'increase revenue', 'efficiency', 'optimize', 'customer acquisition',
      'marketing strategy', 'sales funnel', 'retention', 'existing business'
    ],
    valuation: [
      'valuation', 'worth', 'investment', 'financial model', 'cap table', 'value',
      'company value', 'fundraising', 'investor', 'funding', 'venture capital',
      'angel investor', 'equity', 'dilution', 'pre-money', 'post-money'
    ],
    pitchDeck: [
      'pitch', 'presentation', 'slides', 'investors', 'demo day', 'pitch deck',
      'investor presentation', 'storytelling', 'slide deck', 'elevator pitch',
      'investor pitch', 'presenting', 'demo', 'showcase'
    ]
  };
  
  // Score each intent based on keyword matches
  const scores = {};
  for (const [intent, keywords] of Object.entries(intents)) {
    scores[intent] = keywords.reduce((score, keyword) => {
      return score + (message.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
  }
  
  // Find the highest scoring intent
  let highestScore = 0;
  let detectedIntent = 'tori'; // Default to general Tori agent
  
  for (const [intent, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      detectedIntent = intent;
    }
  }
  
  // Calculate confidence (0-1)
  const confidence = highestScore > 0 ? Math.min(highestScore / 3, 1) : 0;
  
  // Check for existing business vs new idea (for validation agent)
  let isExistingBusiness = false;
  if (detectedIntent === 'validation') {
    const existingBusinessKeywords = [
      'existing business', 'my business', 'current business', 'already operating',
      'already in business', 'established', 'running', 'improve my business'
    ];
    
    isExistingBusiness = existingBusinessKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  return {
    intent: detectedIntent,
    confidence: confidence,
    isExistingBusiness: isExistingBusiness
  };
}

// Agent selection function based on intent and user plan
function selectAgent(message, userPlan) {
  // Detect intent from message
  const intent = detectIntent(message);
  
  // Premium agents only available to premium users
  const premiumAgents = ['businessPlan', 'growthScaling', 'valuation', 'pitchDeck'];
  
  // Check if user has access to the detected agent
  if (premiumAgents.includes(intent.intent) && userPlan !== 'premium') {
    return {
      agent: 'tori',
      systemMessage: AGENT_SYSTEM_MESSAGES.tori,
      message: "I'd need to use our specialized agent for this, which is a premium feature. Would you like to upgrade your plan?",
      premiumFeatureRequested: intent.intent
    };
  }
  
  // If confidence is low, use general Tori agent
  if (intent.confidence < 0.3) {
    return {
      agent: 'tori',
      systemMessage: AGENT_SYSTEM_MESSAGES.tori,
      message: null
    };
  }
  
  // For validation agent, check if free or premium
  if (intent.intent === 'validation') {
    if (userPlan === 'premium') {
      return {
        agent: 'validation',
        systemMessage: AGENT_SYSTEM_MESSAGES.validation.premium,
        message: null,
        isExistingBusiness: intent.isExistingBusiness
      };
    } else {
      return {
        agent: 'validation',
        systemMessage: AGENT_SYSTEM_MESSAGES.validation.free,
        message: null,
        isExistingBusiness: intent.isExistingBusiness
      };
    }
  }
  
  // Return the appropriate agent
  return {
    agent: intent.intent,
    systemMessage: AGENT_SYSTEM_MESSAGES[intent.intent],
    message: null
  };
}

module.exports = {
  AGENT_SYSTEM_MESSAGES,
  detectIntent,
  selectAgent
};
