'use server';
/**
 * @fileOverview An AI flow for generating reading passages for English exams.
 *
 * - generateReadingPassage: Generates a reading passage based on a topic and desired length.
 * - GenerateReadingPassageInput: The input type for the function.
 * - GenerateReadingPassageOutput: The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateReadingPassageInputSchema = z.object({
  topic: z.string().describe('The topic for the reading passage. For example: health, jobs, family, school.'),
  length: z.enum(['short', 'medium', 'long']).describe('The desired length of the passage. Short is ~100 words, Medium is ~150 words, Long is ~200 words.'),
  knowledge: z.object({
      unitTitle: z.string().describe('The title of the curriculum unit to focus on.'),
      vocabulary: z.array(z.string()).describe('The list of vocabulary words for the current unit and all preceding units.'),
      sentencePatterns: z.array(z.string()).describe('The list of sentence patterns for the current unit and all preceding units.'),
      currentUnitVocabulary: z.array(z.string()).describe('The list of vocabulary specific to the current unit.'),
      currentUnitSentencePatterns: z.array(z.string()).describe('The list of sentence patterns specific to the current unit.')
  }).optional().describe('The knowledge base to constrain the generation.'),
});
export type GenerateReadingPassageInput = z.infer<typeof GenerateReadingPassageInputSchema>;

const GenerateReadingPassageOutputSchema = z.object({
  passage: z.string().describe('The generated reading passage in English.'),
});
export type GenerateReadingPassageOutput = z.infer<typeof GenerateReadingPassageOutputSchema>;


const passageContext = `
You are an expert in creating educational content for primary school students learning English in a Vietnamese context, following the "Tiếng Anh 5 i-Learn Smart Start" curriculum.
Your task is to write an engaging reading passage in English based on a given topic, length, and a specific knowledge base from the curriculum.
The passage should be written from a first-person perspective, using a Vietnamese name for the narrator (e.g., Hoa, Linh, Minh, An).
The language must be simple, clear, and appropriate for primary school students (CEFR A1/A2 level).

**CRITICAL INSTRUCTIONS:**
1.  **Strictly Adhere to the Knowledge Base**: The generated passage MUST primarily use the vocabulary and sentence structures from the provided knowledge base.
2.  **Focus on the Current Unit**: The main theme and new concepts in the passage must be built around the "currentUnitVocabulary" and "currentUnitSentencePatterns".
3.  **Use Cumulative Knowledge Appropriately**: You can use words and structures from the broader "vocabulary" and "sentencePatterns" lists (which include previous units) to ensure the text is natural and connected, but these should not be the main focus. They are for supporting context only.
4.  **Topic Integration**: Weave the given 'topic' into the passage in a way that aligns with the curriculum unit. For example, if the unit is "SCHOOL" and the topic is "My favorite teacher", the passage should reflect that.
5.  **Follow Style and Structure**: Maintain the friendly, first-person narrative style as seen in the examples.

Example 1 (Unit: Health, Topic: Staying Fit):
Hi, I’m Hoa. Last week in our P.E. class, we learned about how to stay fit and
strong. Our teacher told us that regular exercise is very important. She said we
should do sports or play outside for at least one hour a day. Playing computer
games is fun, but we shouldn’t sit too long because it’s not healthy.
My classmates and I made a list of our favorite sports. I like swimming and
badminton, but some of my friends enjoy football or skipping. Our teacher also
taught us some easy exercises we can do at home, such as jumping jacks,
push-ups, and stretches.
We talked about healthy eating, too. She said we should drink lots of water and
eat fruit and vegetables every day. We shouldn’t eat too much junk food or
drink soft drinks.
Now, I try to move more, eat better, and sleep early. I feel more energetic and
happier. Staying active is fun and good for our health!

Example 2 (Unit: Jobs, Topic: Future technology):
My name is Linh, and I go to Hoa Binh Primary School in Ho Chi Minh City.
This week, our science teacher taught us about jobs in the future. We talked
about how technology is changing the way people live and work. In the future,
robots might do many jobs that people do today. For example, robots could
cook meals, clean houses, or even take care of sick people.
We also learned that scientists are trying to build machines that can think like
humans. These machines are called artificial intelligence, or A.I. I think A.I. is
both exciting and a little scary. One day, computers might be able to make
decisions on their own.
I want to become a scientist when I grow up. I hope to invent something that
can help people and make the world a better place. There are so many
amazing things to discover in the future!
`;

export async function generateReadingPassage(input: GenerateReadingPassageInput): Promise<GenerateReadingPassageOutput> {
  return generateReadingPassageFlow(input);
}

const generateReadingPassageFlow = ai.defineFlow(
  {
    name: 'generateReadingPassageFlow',
    inputSchema: GenerateReadingPassageInputSchema,
    outputSchema: GenerateReadingPassageOutputSchema,
  },
  async ({ topic, length, knowledge }) => {
    let wordCount;
    switch (length) {
        case 'short':
            wordCount = 'about 100 words';
            break;
        case 'medium':
            wordCount = 'about 150 words';
            break;
        case 'long':
            wordCount = 'about 200 words';
            break;
    }

    let knowledgePromptSection = '';
    if (knowledge) {
        knowledgePromptSection = `
        **Knowledge Base Constraints for Generation:**
        - Curriculum Unit: ${knowledge.unitTitle}
        - Topic to Integrate: ${topic}
        - Word Count: ${wordCount}
        
        **Current Unit Focus (Primary):**
        - Vocabulary to emphasize: ${knowledge.currentUnitVocabulary.join(', ')}
        - Sentence Patterns to use: ${knowledge.currentUnitSentencePatterns.join('; ')}

        **Cumulative Knowledge (for context and fluency):**
        - Allowed Vocabulary: ${knowledge.vocabulary.join(', ')}
        - Allowed Sentence Patterns: ${knowledge.sentencePatterns.join('; ')}
        `;
    } else {
         knowledgePromptSection = `
        Please generate a new passage based on the following requirements:
        - Topic: ${topic}
        - Length: ${wordCount}
        `;
    }


    const prompt = `
      ${passageContext}

      ${knowledgePromptSection}
    `;

    const { text } = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
    });

    return { passage: text };
  }
);
