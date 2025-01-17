import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

import {
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

// Instanciez votre client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// N’acceptez que la méthode POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Dans votre front-end (content-generator.tsx), vous envoyez ces propriétés:
    // { context, audience, complexity, length, template, personality }
    // Nous allons donc les extraire ici, et définir des valeurs par défaut
    // pour le ton, la CTA, ou les keywords, pour rester compatibles.
    const {
      context = "",
      audience = {},
      complexity = 3,
      length = "medium",
      template = "release-notes",
      personality = "steve-jobs",
      outputContent = "text",
    } = body;

    // Valeurs par défaut pour les champs précédemment utilisés mais non envoyés par le front
    const tone = "professional"; // Ton par défaut
    const ctaIntegration = 50;   // Niveau d'intégration CTA (0 à 100)
    const ctaText = "";          // Texte CTA s'il y a lieu
    const keywords: string[] = []; // On peut le laisser vide

    // Voici votre nouveau System Prompt adapté avec les variables dynamiques.
    const mainSystemPrompt = `
You are a specialized Product Documentation Assistant tasked with generating high-quality ${template} based on the provided context.
Your expertise spans product management, technical writing, and user experience design.

Create a "writing agent" system capable of generating content for standard product management or user management templates, while incorporating distinct personalities and styles. The system should adapt the tone based on context and manage metadata and cross-references effectively.

Your task involves:
- Using structured templates specific to each document type (Release Notes, User Stories, Product Specs).
- Injecting distinct personalities that influence writing style (e.g., Shreyas-style, Steve Jobs-style).
- Adapting the tone of writing according to the provided context.
- Intelligent management of metadata and cross-references within the documents.

# Steps
1. **Template Selection:** Choose the appropriate structured template (Release Notes, User Stories, Product Specs) based on the type of document needed.
2. **Content Generation:** Fill in the template using relevant context provided, ensuring accuracy and completeness.
3. ---
   ## Style & Tone Guidelines
   - **Overall Tone**: ${tone}
   - **Personality / Style**: ${personality}
   - **Lexical Complexity**: ${complexity} (0 = extremely simple, 100 = extremely sophisticated)
   - **Text Length**: ${length} (short ~250, medium ~500, long ~1000+)
   - **Target Audience**: ${JSON.stringify(audience)}



   ## Keywords
   - **Integrate** (if relevant): ${keywords.join(", ")}

   ---

4. **Tone Adaptation:** Modify the writing tone to fit the context. 
5. **Metadata Management:** Ensure all essential metadata is appropriately filled and managed, including cross-references.

# Output Format
- Generate a detailed, well-structured **${template}** that aligns with industry best practices and the specified style preferences.
- Add some moderate emoji style in the beginning or end of titles/subtitles (as relevant).
- Each section should be properly formatted for Notion compatibility.
- **Output Content Type**: The output should be generated in the format specified by the parameter \`${outputContent}\`. 
  - If \`Notion\`, structure the output pour une intégration facile dans Notion en markdown et emoji apple.
  - Si \`React\`, adaptez le contenu pour une utilisation dans une application React, donc en code.
  - Sinon, générez un contenu en texte brut.

# Notes
- Personalities might adjust vocabulary, emphasis, etc.
- Pay attention to the context to adapt metadata usage.
- Expand the output as needed.

## Context
Below is the user-provided context or summary extracted from any PDF/document(s):

${context}
`;

    // Assistant message contenant les sections à injecter selon le template
    // Nous allons créer trois prompts selon le type de document.
    // Minimalement, nous remplaçons l'ancien contenu par celui que vous avez fourni.
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
   - For each new feature in the context (e.g., if there are 5 new features), create a subsection:  
       - **Feature Name**  
       - **Description**: Summarize what it does and why it matters.  
       - **Usage/Instructions**: Briefly guide how to enable or use it (if applicable).

5. **Improvements / Enhancements**  
   - List or describe any non-feature improvements, such as performance gains, UI refinements, etc.

6. **Bug Fixes**  
   - Summarize notable bugs resolved, if the user’s context mentions them.

7. **Known Issues or Limitations**  
   - Outline any remaining issues or constraints.

8. **Conclusion**  
   - Recap the significance of the release.  
   - Optionally mention upcoming plans or next steps.

### CTA Integration (Adaptive)
- If ${ctaIntegration} > 0, include a **Call to Action** section at the end:
- Encourage users to update, try the new features, or follow some link.
- Possibly embed a link or reference: “${ctaText}”.

### Additional Personalization Notes
- Incorporate the user’s **tone**, **style**, **keywords**, **target audience** in each section.
- Adjust detail level based on ${length} (short, medium, long).
- Keep the structure but adapt the headings if certain info is missing or not relevant.
`;

    const subPromptUserStories = `
## Document Type: User Stories

### Universal & Mandatory Sections

1. **Introduction / Context**  
   - State the overarching goal or product vision relevant to these user stories.  
   - Identify key user personas if they’re in the context.

2. **List of User Stories**  
   For each user story in the provided context:
   - **User Story Title**  
   - **As a [user role]**, I want **[goal]** so that **[benefit]**.  
   - **Acceptance Criteria** (bullet points):
       - Clear, testable conditions.  
       - Must detail exactly when we consider this story “done.”  
   - **Priority**: Indicate if High, Medium, Low.  
   - **Additional Notes**: Dependencies, constraints, or design considerations.

3. **Additional Requirements or Details**  
   - If any extra info is provided in context (performance requirements, UI sketches, etc.), place it here.

4. **Closing Remarks**  
   - Summarize how these stories fit into the broader product plan or sprint.

### CTA Integration (Adaptive)
- If ${ctaIntegration} > 0, add a short call to action about “reviewing these stories,” “assigning them to dev,” or “submitting feedback.”
- Use “${ctaText}” if provided.

### Additional Personalization Notes
- Integrate the user’s **tone** and **style** throughout.
- Weave in keywords if relevant.
`;

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
   - If context includes diagrams or references, mention them.  
   - Summarize steps a user takes to accomplish tasks.

5. **Technical Architecture**  
   - Outline relevant system components, data models, APIs, or architecture diagrams.  
   - If the user’s context references external services, highlight integration points.

6. **Dependencies & Assumptions**  
   - List external libraries, systems, or teams required.

7. **Timeline / Milestones**  
   - If the context mentions timelines or release phases, place them here.

8. **Risks & Mitigations**  
   - Identify potential risks and proposed solutions.

9. **Appendices / References**  
   - Additional documents, links, user feedback, or design docs.

### CTA Integration (Adaptive)
- If ${ctaIntegration} > 0, add a “Next Steps” or “Action Plan” section:
- “Review this spec,” “Begin development,” “Sign off,” etc.
- Use “${ctaText}” if provided.

### Additional Personalization Notes
- Apply ${tone}, ${personality} where relevant.
- Adjust length based on ${length} (short, medium, long).
`;

// Définition des outputscontentprompt 

const subStyleReact = `

## ## Output Format: React Code Integration

Generate the content in the form of code suitable for a React application. Follow these guidelines:

- **Valid Code**: Provide valid JavaScript/TypeScript code snippets with JSX that are compatible with a React environment.
- **Reusable Components**: Structure the content as reusable components with a clear separation of concerns. For example, break down the UI into functional components as needed.
- **Styling and Layout with Tailwind CSS**: Use only Tailwind CSS classes for styling and layout. Apply relevant Tailwind utility classes directly in the JSX to achieve the desired appearance and responsiveness.
- **Comments and Documentation**: Include comments within the code to explain complex sections or implementation choices to aid developers in understanding the code.
- **Context Adaptation**: The generated content should consider the provided context to create components that address specific needs, such as displaying data, forms, lists, etc.
- **Optimization**: Ensure performance considerations by using appropriate React hooks (e.g., "useState", "useEffect") or other advanced features when necessary, and optimize code as needed.
`;

const subStyleNotion = `
## Output Format: Notion Markdown with Apple Emojis

Vous devez générer le contenu en format Markdown, spécifiquement adapté pour une intégration fluide dans Notion. Suivez ces directives :

- **Structure Markdown** : Utilisez des titres ("#", "##", "##"), des listes à puces, des tableaux si nécessaire, pour organiser l'information clairement.
- **Emojis Apple** : Intégrez des emojis compatibles avec Apple au début ou à la fin des titres et sous-titres pour ajouter une touche visuelle.
- **Compatibilité Notion** : Assurez-vous que le Markdown est formaté pour être facilement copié-collé dans Notion : 
  - Utilisez des sauts de ligne appropriés.
  - Évitez des structures trop complexes qui pourraient ne pas se rendre correctement dans Notion.
- **Clarté et Lisibilité** : Gardez le texte clair, concis et bien structuré, tout en respectant le style et la tonalité demandés dans le contexte.
- **Sections Détaillées** : Décomposez le contenu en sections et sous-sections logiques afin de faciliter la lecture et la navigation dans Notion.

Exemple d'application :
- Titre principal avec un emoji Apple : "# 🎉 Titre Principal"
- Sous-titre : "## 🍏 Sous-titre pertinent"
- Liste à puces pour points importants.

Générez le contenu en suivant ces principes pour garantir une intégration optimale dans Notion.
`;

const subStyleText = `
Generate the content in clear, well-structured plain text. Follow these guidelines:
	•	Clarity: Write fluid paragraphs without Markdown formatting or code, using simple and direct language.
	•	Logical Structure: Organize the information into coherent sections or paragraphs, with a logical progression to guide the reader.
	•	Context Adaptation: Integrate relevant details from the provided context to enrich the text and make it useful and informative.
	•	Tone and Style: Adhere to the requested tone and style (e.g., professional, persuasive, etc.) to align with the indicated personality or style.
	•	No Special Formatting: Do not include any Markdown tags, emojis, or code elements. The output must remain plain text, fully readable and directly usable as such.

  Important Note:
  If this option is selected, the output must not contain any Markdown formatting whatsoever. It is a top priority that the generated content remains in pure plain text 
  without headings, lists, code blocks, or any other Markdown syntax. This ensures that the text is clean, simple, and fully accessible without additional formatting complications.
`;


    // En fonction du template choisi, on sélectionne le Sub-Prompt approprié
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
        chosenSubPrompt =
          "No specialized template found for this document type.";
        break;
    }

    let chosenSubStyle = "";
    switch (outputContent) {
      case "notion":
        chosenSubStyle = subStyleNotion;
        break;
      case "style":
        chosenSubStyle = subStyleText;
        break;
      case "react":
        chosenSubStyle = subStyleReact;
        break;
      default:
        chosenSubStyle =
          "No specialized template found for this document type.";
        break;
    }


    // Construit le tableau de messages à envoyer à l'API d'OpenAI
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: mainSystemPrompt,
      },
      {
        role: "assistant",
        content: chosenSubStyle,
      },
      {
        role: "assistant",
        content: chosenSubPrompt,
      },

    ];

    // Log pour le debug
    console.log("Generated Prompt:", JSON.stringify(messages, null, 2));

    // Appel à l’API OpenAI
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.3,
        max_tokens: 10000,
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

// Bloquer explicitement les méthodes non autorisées
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