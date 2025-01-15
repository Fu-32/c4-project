import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

import { 
    ChatCompletionMessageParam,
    ChatCompletionSystemMessageParam,
    ChatCompletionAssistantMessageParam
  } from "openai/resources/chat/completions";

  
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Accepter uniquement POST et rejeter toutes les autres méthodes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. EXTRACT ALL RELEVANT FIELDS // NEW
    const {
        context = "",
        tone = "professional",
        audience = "",
        keywords = [],
        complexity = 3,
        ctaIntegration = 50,
        length = "medium",
        template = "release-notes",
        personality = "steve-jobs",
        ctaText = "" // <--- add this if ctaText is used
      } = body;
    


    // 2. DEFINE THE "MAIN PROMPT" // NEW
    //    (You can make this as brief or as detailed as you like;
    //     here's a concise but powerful version.)
    const mainSystemPrompt = `
    You are a specialized Product Documentation Assistant tasked with generating high-quality ${template} based on the provided context. 
    Your expertise spans product management, technical writing, and user experience design.

    Primary Objective:
    Generate a detailed, well-structured ${template} in **Markdown** format that aligns with industry best practices and the specified style preferences.

    ---
    ## Style & Tone Guidelines
    - **Overall Tone**: ${tone} 
    - **Personality / Style**: ${personality} 
    - **Lexical Complexity**: ${complexity} (0 = extremely simple, 100 = extremely sophisticated)
    - **Text Length**: ${length} (could be short ~250 words, medium ~500, or long ~1000+)
    - **Target Audience**: ${audience}

    ## CTA Integration
    - **Level**: ${ctaIntegration} (0 = none, 100 = very strong presence)
    - **CTA Text**: ${ctaText}

    ## Keywords
    - **Integrate** (if relevant): ${keywords.join(", ")}

    ---
    ## Context
    Below is the user-provided context or summary extracted from an uploaded PDF/document:
    "${context}"

    ---
    ## Instructions

    1. **Review** all the above parameters and context carefully.
    2. **Use** the sub-prompt below that corresponds to the user’s selected document type:  
    - **Release Notes** → See Sub-Prompt (a)  
    - **User Stories** → See Sub-Prompt (b)  
    - **Product Specs** → See Sub-Prompt (c)  
    3. **Output** must be valid **Markdown**.
    4. **Incorporate** any relevant sections from the sub-prompt, but also **adapt** to the user’s actual context (e.g., if the user only has 2 features, show 2 features; if they have 5, show 5).
    5. **Reflect** the style preferences, tone, complexity, and CTA settings in your writing.

    When finished, produce a single **Markdown** document containing the final output.
`;

// Sub-prompt for Release Notes
const subPromptReleaseNotes = `
    ## Document Type: Release Notes

    ### Universal & Mandatory Sections

    1. **Release Title & Version**  
    - Example: “Release Notes for {ProductName} v{VersionNumber}”  
    - Summarize the scope or overall theme of this release.

    2. **Release Date**  
    - Provide the official release date or timeframe.

    3. **Overview / Executive Summary**  
    - In 1–2 paragraphs, provide a high-level summary.  
    - Mention key improvements or reasons why this release is important.

    4. **New Features**  
    - For each new feature in the context (e.g., if there are 5 new features in the user’s document), create a subsection:  
        - **Feature Name**  
        - **Description**: Summarize what it does and why it matters.  
        - **Usage/Instructions**: Briefly guide how to enable or use it (if applicable).

    5. **Improvements / Enhancements**  
    - List or describe any non-feature improvements, such as performance gains, UI refinements, etc.

    6. **Bug Fixes**  
    - Summarize notable bugs resolved, if the user’s context mentions them.

    7. **Known Issues or Limitations**  
    - Outline any remaining issues or constraints that stakeholders should be aware of.

    8. **Conclusion**  
    - Recap the significance of the release.  
    - Optionally mention upcoming plans or next steps.

    ### CTA Integration (Adaptive)
    - If ${ctaIntegration} > 0, include a **Call to Action** section at the end: 
    - Encourage users to update, try the new features, or follow some link.  
    - Possibly embed a link or reference: “{ctaText}”.

    ### Additional Personalization Notes
    - Incorporate the user’s **tone**, **style**, **keywords**, **target audience** in each section.  
    - Adjust **detail level** based on ${length} (short, medium, long).  
    - Keep the structure but **adapt** the headings if certain info is missing or not relevant.
`;

// Sub-prompt for User Stories
const subPromptUserStories = `
    ## Document Type: User Stories

    ### Universal & Mandatory Sections

    1. **Introduction / Context**  
    - State the overarching goal or product vision relevant to these user stories.  
    - Identify key user personas if they’re in the context.

    2. **List of User Stories**  
    For **each** user story in the provided context:
    - **User Story Title**  
    - **As a [user role]**, I want **[goal]** so that **[benefit]**.  
    - **Acceptance Criteria** (bullet points):
        - Clear, testable conditions.  
        - Must detail exactly when we consider this story “done.”  
    - **Priority**: Indicate if High, Medium, Low (if relevant).  
    - **Additional Notes**: Dependencies, constraints, or design considerations.

    3. **Additional Requirements or Details**  
    - If any extra info is provided in context (like performance requirements, UI sketches, etc.), place it here.

    4. **Closing Remarks**  
    - Summarize how these stories fit into the broader product plan or sprint.

    ### CTA Integration (Adaptive)
    - If ${ctaIntegration} > 0, consider adding a short call to action about “reviewing these stories,” “assigning them to the dev team,” or “submitting feedback.”  
    - Use {ctaText} if provided.

    ### Additional Personalization Notes
    - Integrate the user’s **tone** and **style** throughout.  
    - Weave in ${keywords.join(", ")} if relevant.  
    - Keep it all in **Markdown** with headings for each story.
`;

// Sub-prompt for Product Specs
const subPromptProductSpecs = `
    ## Document Type: Product Specs

    ### Universal & Mandatory Sections

    1. **Product Overview**  
    - Provide a concise summary of the product or feature set.  
    - Mention target audience or key use cases if they appear in the context.

    2. **Objectives & Success Criteria**  
    - Clear objectives this spec aims to address.  
    - Define success metrics or acceptance benchmarks.

    3. **Detailed Requirements**  
    - **Functional Requirements**  
        - Break down specific features, user interactions, or workflows.  
    - **Non-Functional Requirements**  
        - Performance constraints, security considerations, compatibility, etc.

    4. **User Flows / Wireframes**  
    - If context includes user flow diagrams or references, mention them.  
    - Summarize the steps a user takes to accomplish tasks.

    5. **Technical Architecture**  
    - Outline any relevant system components, data models, APIs, or architecture diagrams.  
    - If the user’s context references external services, highlight integration points.

    6. **Dependencies & Assumptions**  
    - List any external libraries, systems, or teams required to build/launch the product.

    7. **Timeline / Milestones**  
    - If the context mentions timelines or release phases, place them here.

    8. **Risks & Mitigations**  
    - Identify potential risks and proposed solutions.

    9. **Appendices / References**  
    - Additional supporting documents, links, user feedback, or design docs.

    ### CTA Integration (Adaptive)
    - If ${ctaIntegration} > 0, add a “Next Steps” or “Action Plan” section:  
    - “Review this spec with the team,” “Begin development,” “Sign off,” etc.  
    - Use {ctaText} if provided.

    ### Additional Personalization Notes
    - Apply ${tone}, ${personality}, and ${keywords.join(", ")} where relevant.  
    - Adjust length based on ${length} (short, medium, or long).  
    - Keep formatting in **Markdown** for clarity.
`;

    // 4. CHOOSE THE RIGHT SUB-PROMPT // NEW
    let chosenSubPrompt = "";
    switch (template) {
        case "release-notes":
        chosenSubPrompt = subPromptReleaseNotes;
        break;
        case "user-stories":
        chosenSubPrompt = subPromptUserStories;
        break;
        case "product-specs":
        chosenSubPrompt = subPromptProductSpecs;
        break;
        default:
        // Fallback in case user picks something else
        chosenSubPrompt = "No specialized template found for this document type.";
        break;
    }

const personalityTemplateSteveJobs = `
    - **Visionary and Inspirational Tone:** Bold, motivational, and emphasizing innovation.
    - **Style:** Direct, confident, and emotionally engaging.
    - **Focus:** Encourage groundbreaking ideas, with a focus on long-term impact and transformative vision.
    `;

const personalityTemplateSamAltman = `
- **Analytical and Strategic Tone:** Logical, structured, and forward-looking.
- **Style:** Data-driven, precise, and focusing on strategic insights.
- **Focus:** Emphasize long-term strategies, data interpretation, and calculated risk-taking.
`;

const personalityTemplateShreyasDoshi = `
- **Product-Centric and Thoughtful Tone:** Balanced, insightful, and product-driven.
- **Style:** Strategic but approachable, focusing on user-centric design and clarity.
- **Focus:** Emphasize user empathy, product-market fit, and clear decision-making frameworks.
`;

// 3. CHOOSE PERSONALITY TEMPLATE
let personalityTemplate = "";

switch (personality) {
    case "steve-jobs":
        personalityTemplate = personalityTemplateSteveJobs;
        break;
    case "sam-altman":
        personalityTemplate = personalityTemplateSamAltman;
        break;
    case "shreyas":
        personalityTemplate = personalityTemplateShreyasDoshi;
        break;
    default:
        personalityTemplate = ""; // Aucun style spécifique appliqué
        break;
}


    // 5. BUILD MESSAGES ARRAY // UPDATED

    const messages: ChatCompletionMessageParam[] = [
    {
        role: 'system',
        // That way, mainSystemPrompt and personalityTemplate will actually be interpolated at runtime.
        content: `${mainSystemPrompt}\n\n### Personality Style\n${personalityTemplate}`,
        // name est optionnel ; vous pouvez l’omettre si vous n’en avez pas besoin
    } as ChatCompletionSystemMessageParam,
    {
        role: 'assistant',
        content: chosenSubPrompt,
        // name est optionnel ici aussi
    } as ChatCompletionAssistantMessageParam,
    ];

    // 6. CALL OPENAI // ALMOST THE SAME
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        // You can tweak temperature, max_tokens, etc.:
        temperature: 0.7,
        max_tokens: 1500,
      });
      
      const text = response.choices[0]?.message?.content || "";
      return NextResponse.json({ text }, { status: 200 });
    } catch (error: any) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Something went wrong with the OpenAI API." },
        { status: 500 }
      );
    }
}

// Bloquer explicitement toutes les méthodes non autorisées
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

