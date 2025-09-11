'use server';
/**
 * @fileOverview An AI flow for generating reading comprehension questions based on a passage.
 * 
 * - generateQuestions: Generates questions of varying difficulty from a text passage.
 * - GenerateQuestionsInput: The input type for the function.
 * - GenerateQuestionsOutput: The return type for the function.
 * - GeneratedQuestion: The type for a single generated question object.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Zod schema for a single choice in a multiple-choice question
const GeneratedOptionSchema = z.object({
  text: z.string().describe('The text of the choice.'),
  isCorrect: z.boolean().describe('Whether this choice is the correct answer.'),
});

// Zod schema for the different types of questions the AI can generate
// Using z.union instead of z.discriminatedUnion to avoid 'const' in the JSON schema sent to Google AI, which is not supported.
const GeneratedQuestionSchema = z.union([
    z.object({
        type: z.enum(['mcq']).describe('The type of question.'),
        question: z.string().describe('The question text.'),
        options: z.array(GeneratedOptionSchema).length(3).describe('An array of 3 possible choices for the question.'),
        difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the question.'),
    }),
    z.object({
        type: z.enum(['fib']).describe('The type of question.'),
        question: z.string().describe('The question text with a blank represented by "___".'),
        answer: z.string().describe('The correct word or phrase for the blank.'),
        difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the question.'),
    }),
    z.object({
        type: z.enum(['true-false']).describe('The type of question.'),
        statement: z.string().describe('The statement to be evaluated.'),
        isTrue: z.boolean().describe('Whether the statement is true or false.'),
        difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the question.'),
    }),
]);
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;


// Zod schema for the main input of the flow
const GenerateQuestionsInputSchema = z.object({
  passage: z.string().describe('The reading passage to generate questions from.'),
  questionType: z.enum(['mcq', 'fib', 'true-false']).describe('The type of questions to generate.'),
  questionCounts: z.object({
    easy: z.number().int().min(0).describe('Number of easy questions to generate.'),
    medium: z.number().int().min(0).describe('Number of medium questions to generate.'),
    hard: z.number().int().min(0).describe('Number of hard questions to generate.'),
  }).describe('The number of questions to generate for each difficulty level.'),
   knowledge: z.object({
      unitTitle: z.string().describe('The title of the curriculum unit to focus on.'),
      currentUnitVocabulary: z.array(z.string()).describe('The list of vocabulary specific to the current unit.'),
      currentUnitSentencePatterns: z.array(z.string()).describe('The list of sentence patterns specific to the current unit.')
  }).optional().describe('The knowledge base to constrain the generation.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;


// Zod schema for the output of the flow
const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).describe('The list of generated questions.'),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;


const questionGenerationContext = `
You are an expert in creating English reading comprehension questions for Vietnamese primary school students (CEFR A1/A2 level), following the "Tiếng Anh 5 i-Learn Smart Start" curriculum.
Your task is to generate a set of questions based on a given passage, question type, difficulty distribution, and a specific knowledge base from the curriculum.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze the Passage**: First, carefully read and understand the provided reading passage.
2.  **Adhere to Knowledge Constraints**: The questions and, most importantly, the **answers** must be based on the provided "currentUnitVocabulary" and "currentUnitSentencePatterns". Do not ask questions whose answers rely on vocabulary or grammar from previous units, even if those words appear in the passage for context.
3.  **Difficulty Levels**:
    - Easy: Questions that can be answered by directly finding a sentence or phrase in the text. They test basic recall of facts related to the current unit's knowledge.
    - Medium: Questions that require basic inference or understanding the main idea of a sentence or two. They might involve understanding pronouns or simple cause-and-effect related to the current unit's topics.
    - Hard: Questions that require understanding the main idea of the whole passage, making a larger inference, or understanding the author's purpose, all within the context of the current unit's theme.
4.  **Format Correctly**: Based on the requested 'questionType', generate the questions in the specified JSON format.

**Question Formats:**
1.  If 'questionType' is 'mcq' (Multiple-Choice Question):
    - Generate a question text.
    - Provide an array of exactly 3 choices, with only one correct answer.
    - Format: { "type": "mcq", "question": "...", "options": [ ... ], "difficulty": "..." }

2.  If 'questionType' is 'fib' (Fill-in-the-Blank):
    - Generate a sentence from the passage with a key word or phrase replaced by "___". The blank should represent a word from the current unit's vocabulary.
    - Provide the correct word/phrase for the blank.
    - Format: { "type": "fib", "question": "...", "answer": "...", "difficulty": "..." }

3.  If 'questionType' is 'true-false':
    - Generate a statement about the passage. The statement's truth value should hinge on concepts from the current unit.
    - Determine if the statement is true or false.
    - Format: { "type": "true-false", "statement": "...", "isTrue": boolean, "difficulty": "..." }

Generate the questions based on the user's requested counts for each difficulty level.
`;


export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}


const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async ({ passage, questionCounts, questionType, knowledge }) => {
    const { easy, medium, hard } = questionCounts;
    const total = easy + medium + hard;

    if (total === 0) {
        return { questions: [] };
    }

    let knowledgePromptSection = '';
    if (knowledge) {
        knowledgePromptSection = `
        **Knowledge Base Constraints for Question Generation:**
        - Curriculum Unit: ${knowledge.unitTitle}
        
        **Core knowledge for questions and answers (Primary Focus):**
        - Target Vocabulary: ${knowledge.currentUnitVocabulary.join(', ')}
        - Target Sentence Patterns: ${knowledge.currentUnitSentencePatterns.join('; ')}
        `;
    }

    const prompt = ai.definePrompt({
        name: 'generateQuestionsPrompt',
        input: { schema: GenerateQuestionsInputSchema },
        output: { schema: GenerateQuestionsOutputSchema },
        prompt: `
            ${questionGenerationContext}

            Here is the reading passage:
            ---
            ${passage}
            ---

            ${knowledgePromptSection}

            Please generate a total of ${total} questions of type '${questionType}' with the following distribution:
            - Easy questions: ${easy}
            - Medium questions: ${medium}
            - Hard questions: ${hard}

            Return the output in the specified JSON format.
        `,
    });
    
    const { output } = await prompt({ passage, questionCounts, questionType, knowledge });
    
    if (!output) {
        throw new Error('AI failed to generate questions.');
    }
    
    return output;
  }
);
