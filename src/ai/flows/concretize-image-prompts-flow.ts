'use server';
/**
 * @fileOverview An AI flow for making image generation prompts more concrete.
 *
 * - concretizeImagePrompts - Takes a list of simple prompts and makes them more descriptive for image generation.
 * - ConcretizeImagePromptsInput - The input type for the function.
 * - ConcretizeImagePromptsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ConcretizeImagePromptsInputSchema = z.object({
  prompts: z.array(z.string()).describe('A list of short, simple prompts to be made more concrete for image generation.'),
});
export type ConcretizeImagePromptsInput = z.infer<typeof ConcretizeImagePromptsInputSchema>;

const ConcretizeImagePromptsOutputSchema = z.object({
  concretizedPrompts: z.array(z.string()).describe('The list of more descriptive, concretized prompts.'),
});
export type ConcretizeImagePromptsOutput = z.infer<typeof ConcretizeImagePromptsOutputSchema>;

const promptContext = `
You are an AI assistant that helps create better prompts for an image generation model that creates educational clipart for children.
Your task is to take a list of simple, one-word or short-phrase prompts and make them more "concrete" and descriptive.
The output should be a simple scene description that is easy for an image generation model to understand.
The language of the output prompt must be in English to be understood by the image generation model.

The generated image will be a clean, vibrant clipart-style illustration with bold black outlines and simple, flat coloring, isolated on a clean white background. Your concretized prompt should reflect this style.

Example:
- Input: ['butter']
- Output: ['a piece of yellow butter on a white plate']

- Input: ['rain']
- Output: ['a gray sky with cartoon rain drops falling']

- Input: ['a girl', 'a boy']
- Output: ['a young girl with a red dress and pigtails', 'a playful boy with curly hair and a green shirt']

Keep the descriptions simple, clear, and focused on a single subject. The output must be an array of strings in a JSON object.
`;

export async function concretizeImagePrompts(input: ConcretizeImagePromptsInput): Promise<ConcretizeImagePromptsOutput> {
  return concretizeImagePromptsFlow(input);
}

const concretizeImagePromptsFlow = ai.defineFlow(
  {
    name: 'concretizeImagePromptsFlow',
    inputSchema: ConcretizeImagePromptsInputSchema,
    outputSchema: ConcretizeImagePromptsOutputSchema,
  },
  async ({ prompts }) => {

    if (!prompts || prompts.length === 0) {
        return { concretizedPrompts: [] };
    }

    const generationPrompt = ai.definePrompt({
        name: 'concretizePrompt',
        input: { schema: ConcretizeImagePromptsInputSchema },
        output: { schema: ConcretizeImagePromptsOutputSchema },
        prompt: `
            ${promptContext}

            Here is the list of prompts to concretize:
            ---
            ${JSON.stringify(prompts)}
            ---

            Please return the concretized prompts in the specified JSON format.
        `,
    });
    
    const { output } = await generationPrompt({ prompts });
    
    if (!output) {
        throw new Error('AI failed to concretize prompts.');
    }
    
    return output;
  }
);
