'use server';
/**
 * @fileOverview An AI flow for shuffling words in a sentence.
 *
 * - shuffleWords: Takes a sentence and returns a shuffled version of it.
 * - ShuffleWordsInput: The input type for the shuffleWords function.
 * - ShuffleWordsOutput: The return type for the shuffleWords function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ShuffleWordsInputSchema = z.object({
  sentence: z.string().describe('The sentence to shuffle.'),
});
export type ShuffleWordsInput = z.infer<typeof ShuffleWordsInputSchema>;

const ShuffleWordsOutputSchema = z.object({
  shuffledSentence: z.string().describe('The shuffled sentence, with words separated by " / ".'),
});
export type ShuffleWordsOutput = z.infer<typeof ShuffleWordsOutputSchema>;

const promptContext = `
You are an AI assistant that shuffles the words of a given English sentence.
Your task is to take a sentence and randomize the order of its words.
The output must be a string where the shuffled words are separated by " / ".
Do not include the final punctuation in the shuffled output if it exists.

Example:
- Input: "I go to school."
- Output: "go / I / school / to"

- Input: "What is your name?"
- Output: "your / name / What / is"

The output must be a JSON object with the "shuffledSentence" key.
`;

export async function shuffleWords(input: ShuffleWordsInput): Promise<ShuffleWordsOutput> {
  return shuffleWordsFlow(input);
}

const shuffleWordsFlow = ai.defineFlow(
  {
    name: 'shuffleWordsFlow',
    inputSchema: ShuffleWordsInputSchema,
    outputSchema: ShuffleWordsOutputSchema,
  },
  async ({ sentence }) => {
    if (!sentence) {
        return { shuffledSentence: '' };
    }

    const generationPrompt = ai.definePrompt({
        name: 'shuffleWordsPrompt',
        input: { schema: ShuffleWordsInputSchema },
        output: { schema: ShuffleWordsOutputSchema },
        prompt: `
            ${promptContext}

            Here is the sentence to shuffle:
            ---
            ${sentence}
            ---

            Please return the shuffled sentence in the specified JSON format.
        `,
    });
    
    const { output } = await generationPrompt({ sentence });
    
    if (!output) {
        throw new Error('AI failed to shuffle words.');
    }
    
    return output;
  }
);
