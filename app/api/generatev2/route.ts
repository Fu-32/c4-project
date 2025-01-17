import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { APIError } from 'openai/error'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Type definitions
type Template = 'release-notes' | 'user-stories' | 'product-specs'
type Personality = 'steve-jobs' | 'sam-altman' | 'shreyas'
type Length = 'short' | 'medium' | 'long'

interface Audience {
  enabled: boolean
  demographics: {
    ageRange: string
    gender: string
  }
  professional: string
  experience: string
  purchaseBehavior: string
}

interface GenerateRequestPayload {
  template: Template
  personality: Personality
  context: string
  audience?: Audience
  complexity: number
  length: Length
}

interface LanguagePatterns {
  openings: string[]
  transitions: string[]
  emphasis: string[]
  closings: string[]
}

interface PersonalityStyle {
  tone: string
  formalityLevel: string
  emotionalStyle: string
  humorLevel: string
  emphasisStyle: string
  technicalDepth: string
  characteristics: string[]
  languagePatterns: LanguagePatterns
  emojiStyle: string
}

interface MarkdownSection {
  [key: string]: string
}

interface MarkdownTemplate {
  header: string
  sections: MarkdownSection
  itemFormat: string
  footer: string
}

// Personality definitions
const personalityStyles: Record<Personality, PersonalityStyle> = {
  'steve-jobs': {
    tone: 'visionary and persuasive',
    formalityLevel: 'semi-formal',
    emotionalStyle: 'passionate',
    humorLevel: 'minimal',
    emphasisStyle: 'dramatic',
    technicalDepth: 'conceptual',
    characteristics: [
      'Uses powerful metaphors',
      'Focuses on user experience',
      'Emphasizes revolutionary impact',
      'Builds dramatic tension',
      'Uses repetition for emphasis',
      'Speaks in absolutes',
      'Emphasizes simplicity',
      'Creates emotional connection',
      'Uses storytelling',
      'Highlights design excellence'
    ],
    languagePatterns: {
      openings: [
        'Today, we\'re introducing something extraordinary...',
        'This is a revolutionary moment...',
        'What we\'re about to share will change everything...',
        'I\'m incredibly excited to show you...'
      ],
      transitions: [
        'But there\'s one more thing...',
        'Now, why is this important?',
        'Here\'s what makes this magical...',
        'Let me show you something incredible...'
      ],
      emphasis: [
        'magical',
        'incredible',
        'amazing',
        'revolutionary',
        'beautiful',
        'elegant',
        'seamless',
        'extraordinary'
      ],
      closings: [
        'This changes everything.',
        'This is just the beginning.',
        'Welcome to the future.',
        'And that\'s what makes it magical.'
      ]
    },
    emojiStyle: 'minimal'
  },
  'sam-altman': {
    tone: 'analytical and forward-thinking',
    formalityLevel: 'balanced',
    emotionalStyle: 'measured',
    humorLevel: 'occasional',
    emphasisStyle: 'data-driven',
    technicalDepth: 'deep',
    characteristics: [
      'Data-driven insights',
      'Long-term perspective',
      'Technical depth with clarity',
      'Uses concrete examples',
      'Balances optimism with realism',
      'References industry trends',
      'Emphasizes scalability',
      'Focuses on first principles',
      'Discusses market dynamics',
      'Values intellectual honesty'
    ],
    languagePatterns: {
      openings: [
        'Let\'s analyze the data...',
        'The evidence suggests...',
        'Looking at the trends...',
        'From a first principles perspective...'
      ],
      transitions: [
        'More importantly...',
        'This leads us to an interesting insight...',
        'The data shows a clear pattern...',
        'Consider the implications...'
      ],
      emphasis: [
        'significant',
        'fundamental',
        'exponential',
        'strategic',
        'empirical',
        'substantial',
        'systematic',
        'quantifiable'
      ],
      closings: [
        'Looking ahead...',
        'In the long term...',
        'The data points to...',
        'This creates exponential opportunities...'
      ]
    },
    emojiStyle: 'moderate'
  },
  'shreyas': {
    tone: 'product-focused and strategic',
    formalityLevel: 'professional',
    emotionalStyle: 'thoughtful',
    humorLevel: 'rare',
    emphasisStyle: 'framework-based',
    technicalDepth: 'balanced',
    characteristics: [
      'Framework-based thinking',
      'User-centric rationale',
      'Clear prioritization',
      'Uses mental models',
      'Focuses on first principles',
      'Emphasizes trade-offs',
      'Strategic scaffolding',
      'Product craft emphasis',
      'Decision-making frameworks',
      'Systems thinking'
    ],
    languagePatterns: {
      openings: [
        'First, let\'s frame the problem...',
        'The key insight is...',
        'Through this framework...',
        'From a product craft perspective...'
      ],
      transitions: [
        'This framework suggests...',
        'Consider the trade-offs...',
        'The mental model here...',
        'From a systems perspective...'
      ],
      emphasis: [
        'systematic',
        'foundational',
        'intentional',
        'principled',
        'strategic',
        'crafted',
        'balanced',
        'optimized'
      ],
      closings: [
        'Remember the principles...',
        'Focus on the core...',
        'Consider the implications...',
        'Apply this framework wisely...'
      ]
    },
    emojiStyle: 'structured'
  }
}

// Markdown templates
const markdownTemplates: Record<Template, MarkdownTemplate> = {
  'release-notes': {
    header: '# 📦 Release Notes {version}\n\n_Released on {date}_\n\n',
    sections: {
      newFeatures: '## ✨ New Features\n\n',
      improvements: '## 🚀 Improvements\n\n',
      bugFixes: '## 🐛 Bug Fixes\n\n',
      breakingChanges: '## ⚠️ Breaking Changes\n\n',
      deprecations: '## 📢 Deprecations\n\n'
    },
    itemFormat: '- {content}\n',
    footer: '\n---\n_Generated with 💖 by {team}_\n'
  },
  'user-stories': {
    header: '# 👤 User Story: {title}\n\n',
    sections: {
      userType: '### 🎭 As a {userType}\n\n',
      action: '### 🎯 I want to\n\n',
      benefit: '### ✨ So that\n\n',
      acceptanceCriteria: '### ✅ Acceptance Criteria\n\n',
      technicalNotes: '### 🔧 Technical Notes\n\n'
    },
    itemFormat: '- [ ] {criterion}\n',
    footer: '\n---\n_Priority: {priority} | Effort: {effort}_\n'
  },
  'product-specs': {
    header: '# 📋 Product Specification: {title}\n\n',
    sections: {
      overview: '## 🎯 Overview\n\n',
      problem: '## 🤔 Problem Statement\n\n',
      solution: '## 💡 Proposed Solution\n\n',
      requirements: '## ⚙️ Technical Requirements\n\n',
      impact: '## 📊 User Impact\n\n',
      timeline: '## 📅 Implementation Timeline\n\n',
      metrics: '## 📈 Success Metrics\n\n'
    },
    itemFormat: '### {subtitle}\n{content}\n\n',
    footer: '\n---\n_Last updated: {date} | Status: {status}_\n'
  }
}

// Helper function to validate the payload
function validatePayload(payload: any): payload is GenerateRequestPayload {
  return (
    payload &&
    typeof payload.template === 'string' &&
    typeof payload.personality === 'string' &&
    typeof payload.context === 'string' &&
    typeof payload.complexity === 'number' &&
    typeof payload.length === 'string' &&
    payload.complexity >= 1 &&
    payload.complexity <= 5 &&
    ['release-notes', 'user-stories', 'product-specs'].includes(payload.template) &&
    ['steve-jobs', 'sam-altman', 'shreyas'].includes(payload.personality) &&
    ['short', 'medium', 'long'].includes(payload.length)
  )
}

// Helper function to get word count target
function getLengthTarget(length: Length): number {
  const targets = {
    short: 250,
    medium: 500,
    long: 1000
  }
  return targets[length]
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    // Validate payload
    if (!validatePayload(payload)) {
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      )
    }

    // Get personality and template details
    const personality = personalityStyles[payload.personality]
    const template = markdownTemplates[payload.template]
    const wordTarget = getLengthTarget(payload.length)

    // Construct system prompt
    const systemPrompt = `You are an AI writing assistant that writes in the style of ${payload.personality}.

PERSONALITY TRAITS:
- Tone: ${personality.tone}
- Formality: ${personality.formalityLevel}
- Emotional Style: ${personality.emotionalStyle}
- Humor Level: ${personality.humorLevel}
- Emphasis Style: ${personality.emphasisStyle}
- Technical Depth: ${personality.technicalDepth}

WRITING CHARACTERISTICS:
${personality.characteristics.map(char => `- ${char}`).join('\n')}

LANGUAGE PATTERNS TO USE:
- Openings: ${personality.languagePatterns.openings.join(', ')}
- Transitions: ${personality.languagePatterns.transitions.join(', ')}
- Emphasis Words: ${personality.languagePatterns.emphasis.join(', ')}
- Closings: ${personality.languagePatterns.closings.join(', ')}

FORMATTING REQUIREMENTS:
1. Use ${personality.emojiStyle} emoji style
2. Follow the provided Markdown template exactly
3. Target approximately ${wordTarget} words
4. Use complexity level ${payload.complexity} (1=simple, 5=advanced)
5. Each section should be properly formatted for Notion compatibility

The output should maintain the personality's voice while being informative and well-structured.`

    // Construct user prompt
    const userPrompt = `Generate a ${payload.template.replace('-', ' ')} with the following context:

${payload.context}

${payload.audience?.enabled ? `
Target Audience:
- Demographics: ${payload.audience.demographics.ageRange}, ${payload.audience.demographics.gender}
- Professional Status: ${payload.audience.professional}
- Experience Level: ${payload.audience.experience}
- Purchase Behavior: ${payload.audience.purchaseBehavior}
` : ''}

Use this template structure:
${JSON.stringify(template, null, 2)}

Ensure all sections are included and properly formatted.`

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0.2,
      presence_penalty: 0.1
    })

    // Extract and validate the generated content
    const generatedContent = completion.choices[0].message.content

    if (!generatedContent) {
      throw new Error('No content generated')
    }

    // Return the response
    return NextResponse.json({
      success: true,
      content: generatedContent,
      metadata: {
        template: payload.template,
        personality: payload.personality,
        wordTarget,
        complexity: payload.complexity
      }
    })

  } catch (error) {
    console.error('Error generating content:', error)

    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}