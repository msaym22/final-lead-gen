import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { openai } from '@/lib/ai'

export async function POST(request) {
  try {
    const { 
      leadId, 
      messageType = 'initial_outreach',
      approach = 'problem_focused',
      generateVariants = true,
      variantCount = 3
    } = await request.json()

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    const db = await connectDB()

    // Get lead information
    const lead = await db.collection('leads').findOne({ id: leadId })
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Get industry research data
    const industryKnowledge = await db.collection('industry_knowledge')
      .findOne({ industry: lead.company.industry })

    // Get successful message patterns
    const successfulPatterns = await getSuccessfulMessagePatterns(db, lead.company.industry)

    console.log(`Generating ${approach} messages for ${lead.contact.name} at ${lead.company.name}`)

    const messageGeneration = {
      leadId,
      timestamp: new Date(),
      approach,
      messages: [],
      metadata: {
        leadContext: {
          company: lead.company.name,
          industry: lead.company.industry,
          contactName: lead.contact.name,
          contactTitle: lead.contact.title,
          opportunityScore: lead.opportunity.score,
          painPoints: lead.opportunity.painPoints,
          marketingIssues: lead.opportunity.marketingIssues
        },
        researchBasis: {
          industryInsights: industryKnowledge?.topInsights?.length || 0,
          painPointsIdentified: lead.opportunity.painPoints.length,
          successfulPatterns: successfulPatterns.length
        }
      }
    }

    // Generate primary message
    const primaryMessage = await generatePersonalizedMessage(
      lead, 
      industryKnowledge, 
      successfulPatterns, 
      approach,
      messageType
    )

    messageGeneration.messages.push(primaryMessage)

    // Generate variants if requested
    if (generateVariants && variantCount > 1) {
      const approaches = ['problem_focused', 'opportunity_focused', 'social_proof', 'roi_focused']
      const additionalApproaches = approaches.filter(a => a !== approach).slice(0, variantCount - 1)

      for (const variantApproach of additionalApproaches) {
        const variant = await generatePersonalizedMessage(
          lead,
          industryKnowledge,
          successfulPatterns,
          variantApproach,
          messageType
        )
        messageGeneration.messages.push(variant)
      }
    }

    // Analyze and score messages
    for (let i = 0; i < messageGeneration.messages.length; i++) {
      const analysis = await analyzeMessageEffectiveness(
        messageGeneration.messages[i],
        lead,
        industryKnowledge
      )
      messageGeneration.messages[i].analysis = analysis
    }

    // Sort messages by predicted effectiveness
    messageGeneration.messages.sort((a, b) => b.analysis.effectivenessScore - a.analysis.effectivenessScore)

    // Save to database
    await db.collection('generated_messages').insertOne(messageGeneration)

    // Update lead with message generation info
    await db.collection('leads').updateOne(
      { id: leadId },
      { 
        $set: { 
          lastMessageGenerated: new Date(),
          messageCount: (lead.messageCount || 0) + messageGeneration.messages.length
        }
      }
    )

    return NextResponse.json({
      success: true,
      data: messageGeneration,
      message: `Generated ${messageGeneration.messages.length} personalized messages for ${lead.contact.name}`
    })

  } catch (error) {
    console.error('Message generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate messages', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const messageType = searchParams.get('messageType')
    const limit = parseInt(searchParams.get('limit')) || 10

    const db = await connectDB()
    
    let query = {}
    if (leadId) query.leadId = leadId
    if (messageType) query.messageType = messageType

    const messages = await db.collection('generated_messages')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({
      success: true,
      data: messages
    })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

async function generatePersonalizedMessage(lead, industryKnowledge, successfulPatterns, approach, messageType) {
  try {
    const yourInfo = {
      name: process.env.NEXT_PUBLIC_YOUR_NAME || 'Muhammad Saim',
      website: process.env.NEXT_PUBLIC_YOUR_WEBSITE,
      calendly: process.env.NEXT_PUBLIC_YOUR_CALENDLY,
      expertise: 'paid advertising and email marketing expert'
    }

    const prompt = `
Generate a highly personalized ${messageType} message using the ${approach} approach.

SENDER INFORMATION:
Name: ${yourInfo.name}
Expertise: ${yourInfo.expertise}
Website: ${yourInfo.website}
Calendly: ${yourInfo.calendly}

RECIPIENT INFORMATION:
Name: ${lead.contact.name}
Title: ${lead.contact.title}
Company: ${lead.company.name}
Industry: ${lead.company.industry}
Company Size: ${lead.company.size}

OPPORTUNITY ANALYSIS:
Opportunity Score: ${lead.opportunity.score}/100
Pain Points: ${lead.opportunity.painPoints.join(', ')}
Marketing Issues: ${lead.opportunity.marketingIssues.join(', ')}
Estimated Value: $${lead.opportunity.potentialValue}/month
Urgency: ${lead.opportunity.urgency}

INDUSTRY INSIGHTS:
${industryKnowledge?.topInsights?.slice(0, 5).map(insight => `- ${insight.text}`).join('\n') || 'No specific industry insights available'}

SUCCESSFUL PATTERNS:
${successfulPatterns.slice(0, 3).map(pattern => `- ${pattern.pattern} (${pattern.successRate}% response rate)`).join('\n')}

MESSAGE APPROACH: ${approach}
${getApproachGuidelines(approach)}

REQUIREMENTS:
1. Keep it under 150 words
2. Reference specific marketing issues found on their website
3. Include estimated ROI or results
4. Use psychology-based persuasion techniques
5. End with a soft call-to-action
6. Sound natural and consultative, not salesy
7. Show you've done research on their business
8. Include your Calendly link for easy scheduling

Subject Line: Also generate 3 subject line options

Generate the message in this JSON format:
{
  "approach": "${approach}",
  "subjectLines": ["", "", ""],
  "message": "",
  "reasoning": "",
  "psychologyTriggers": [],
  "personalizations": [],
  "estimatedROI": ""
}
`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7
    })

    const messageData = JSON.parse(response.choices[0].message.content)
    
    return {
      id: generateMessageId(),
      approach,
      messageType,
      ...messageData,
      generatedAt: new Date(),
      status: 'draft'
    }

  } catch (error) {
    console.error('Error generating personalized message:', error)
    return {
      id: generateMessageId(),
      approach,
      messageType,
      subjectLines: ['Quick question about your marketing', 'Noticed something on your website', 'Marketing opportunity for ' + lead.company.name],
      message: `Hi ${lead.contact.name},\n\nI noticed ${lead.company.name} could benefit from some marketing optimization. As a paid advertising expert, I've helped similar ${lead.company.industry} companies increase their ROI by 40-60%.\n\nWould you be open to a quick 15-minute conversation about your current marketing challenges?\n\nBest regards,\n${yourInfo.name}`,
      reasoning: 'Fallback message due to generation error',
      psychologyTriggers: ['Social proof', 'Curiosity'],
      personalizations: ['Company name', 'Industry'],
      estimatedROI: 'Unknown',
      generatedAt: new Date(),
      status: 'draft',
      error: 'Generation failed, using template'
    }
  }
}

function getApproachGuidelines(approach) {
  const guidelines = {
    'problem_focused': `
Focus on specific problems you identified:
- Lead with the biggest marketing issue found
- Quantify the impact of the problem
- Position yourself as the solution expert
- Create urgency around fixing the issue`,

    'opportunity_focused': `
Focus on growth opportunities:
- Highlight untapped potential you identified
- Show what competitors are doing better
- Present the upside of optimization
- Frame as investment in growth`,

    'social_proof': `
Focus on credibility and results:
- Reference similar companies you've helped
- Include specific results and metrics
- Mention industry recognition or expertise
- Build trust through proven success`,

    'roi_focused': `
Focus on financial returns:
- Lead with potential ROI calculations
- Compare current vs optimized performance
- Show monthly/yearly impact projections
- Make the business case clear`
  }

  return guidelines[approach] || guidelines['problem_focused']
}

async function analyzeMessageEffectiveness(message, lead, industryKnowledge) {
  try {
    const prompt = `
Analyze the effectiveness of this outreach message:

MESSAGE:
Subject: ${message.subjectLines[0]}
Body: ${message.message}

CONTEXT:
Recipient: ${lead.contact.title} at ${lead.company.name}
Industry: ${lead.company.industry}
Opportunity Score: ${lead.opportunity.score}/100

Rate the message on:
1. PERSONALIZATION (1-10): How well customized to the recipient
2. RELEVANCE (1-10): How relevant to their industry/role
3. VALUE PROPOSITION (1-10): How compelling the offer is
4. PSYCHOLOGY (1-10): Use of persuasion principles
5. CALL TO ACTION (1-10): Clarity and strength of CTA
6. OVERALL EFFECTIVENESS (1-10): Predicted response likelihood

Also identify:
- Strengths of the message
- Areas for improvement
- Predicted response rate %
- Best time to send

Return as JSON:
{
  "scores": {
    "personalization": 0,
    "relevance": 0,
    "valueProposition": 0,
    "psychology": 0,
    "callToAction": 0,
    "overall": 0
  },
  "effectivenessScore": 0,
  "predictedResponseRate": 0,
  "strengths": [],
  "improvements": [],
  "bestSendTime": "",
  "recommendedFollowUp": ""
}
`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    })

    return JSON.parse(response.choices[0].message.content)
  } catch (error) {
    console.error('Error analyzing message effectiveness:', error)
    return {
      scores: { personalization: 7, relevance: 7, valueProposition: 6, psychology: 6, callToAction: 7, overall: 7 },
      effectivenessScore: 70,
      predictedResponseRate: 8,
      strengths: ['Personalized to company'],
      improvements: ['Could include more specific metrics'],
      bestSendTime: 'Tuesday-Thursday 9-11 AM',
      recommendedFollowUp: 'Follow up in 5-7 days'
    }
  }
}

async function getSuccessfulMessagePatterns(db, industry) {
  try {
    // Get messages with high response rates for this industry
    const successfulMessages = await db.collection('message_responses')
      .find({
        industry,
        responseType: 'positive',
        responseRate: { $gte: 10 }
      })
      .sort({ responseRate: -1 })
      .limit(10)
      .toArray()

    return successfulMessages.map(msg => ({
      pattern: msg.messagePattern || 'Generic outreach',
      successRate: msg.responseRate,
      approach: msg.approach,
      keyElements: msg.keyElements || []
    }))
  } catch (error) {
    console.error('Error fetching successful patterns:', error)
    return [
      {
        pattern: 'Problem identification + Solution offer',
        successRate: 12,
        approach: 'problem_focused',
        keyElements: ['Specific issue mentioned', 'ROI quantified', 'Soft CTA']
      },
      {
        pattern: 'Social proof + Opportunity',
        successRate: 15,
        approach: 'social_proof',
        keyElements: ['Similar company results', 'Industry expertise', 'Growth opportunity']
      }
    ]
  }
}

function generateMessageId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Follow-up message generation
export async function generateFollowUpMessage(leadId, previousMessageId, responseType = 'no_response') {
  try {
    const db = await connectDB()
    
    const lead = await db.collection('leads').findOne({ id: leadId })
    const previousMessage = await db.collection('generated_messages')
      .findOne({ 'messages.id': previousMessageId })

    if (!lead || !previousMessage) {
      throw new Error('Lead or previous message not found')
    }

    const prompt = `
Generate a follow-up message based on the previous outreach:

PREVIOUS MESSAGE:
${previousMessage.messages.find(m => m.id === previousMessageId)?.message}

RESPONSE TYPE: ${responseType}
LEAD INFO: ${lead.contact.name} at ${lead.company.name}

Generate an appropriate follow-up that:
- References the previous message subtly
- Adds new value or insight
- Uses a different angle/approach
- Maintains professional tone
- Includes a clear next step

Return as JSON with message, subject line, and timing recommendation.
`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.7
    })

    return JSON.parse(response.choices[0].message.content)
  } catch (error) {
    console.error('Error generating follow-up message:', error)
    throw error
  }
}