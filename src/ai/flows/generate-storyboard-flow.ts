'use server';
/**
 * @fileOverview An AI flow for generating a storyboard of images.
 *
 * - generateStoryboard: Generates images based on frame descriptions, with an optional character prompt.
 * - GenerateStoryboardInput: The input type for the generateStoryboard function.
 * - GenerateStoryboardOutput: The return type for the generateStoryboard function.
 * - generateSingleImage: Regenerates a single image based on a character prompt and a frame prompt.
 * - GenerateSingleImageInput: The input type for the generateSingleImage function.
 * - GenerateSingleImageOutput: The return type for the generateSingleImage function.
 * - generateCharacterImage: Generates a single character image.
 * - GenerateCharacterImageInput: The input type for the generateCharacterImage function.
 * - GenerateCharacterImageOutput: The return type for the generateCharacterImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ILLUSTRATION_STYLE_PROMPT = `
A clean, vibrant clipart-style illustration. The subject should have bold black outlines and simple, flat coloring. Isolated on a clean white background.
`;

const CHARACTER_STYLE_PROMPT = `
Vibrant, clipart-style. A single character for a children's storybook. The character is standing still, looking forward. Full body shot. Consistent character design. Bold black outlines, simple flat colors. The character should be the main focus. Clean, simple background that doesn't distract from the character.
`;

const NEGATIVE_PROMPT = "text, labels, words, numbers, watermarks, logos, UI elements, borders, frames, multiple subjects, multiple characters, photorealistic, 3D, complex lighting, gradients, textures, pencils, crayons, watercolor, messy, cluttered";

// Character generation
const GenerateCharacterImageInputSchema = z.object({
  characterPrompt: z.string().describe('A description of the main character.'),
});
export type GenerateCharacterImageInput = z.infer<typeof GenerateCharacterImageInputSchema>;

const GenerateCharacterImageOutputSchema = z.object({
  image: z.string().describe('The data URI for the generated character image.'),
});
export type GenerateCharacterImageOutput = z.infer<typeof GenerateCharacterImageOutputSchema>;

// Main storyboard generation input
const GenerateStoryboardInputSchema = z.object({
  characterImage: z.string().optional().describe('An optional data URI of the character image to ensure consistency.'),
  frames: z.array(z.string()).describe('An array of strings, where each string is a prompt for a single frame.'),
});
export type GenerateStoryboardInput = z.infer<typeof GenerateStoryboardInputSchema>;

const GenerateStoryboardOutputSchema = z.object({
  images: z.array(z.string()).describe('An array of data URIs for the generated images.'),
});
export type GenerateStoryboardOutput = z.infer<typeof GenerateStoryboardOutputSchema>;

// Single image regeneration input
const GenerateSingleImageInputSchema = z.object({
  characterImage: z.string().optional().describe('The consistent character image data URI.'),
  framePrompt: z.string().describe('The specific prompt for the image to be regenerated.'),
});
export type GenerateSingleImageInput = z.infer<typeof GenerateSingleImageInputSchema>;

const GenerateSingleImageOutputSchema = z.object({
  image: z.string().describe('The data URI for the newly generated image.'),
});
export type GenerateSingleImageOutput = z.infer<typeof GenerateSingleImageOutputSchema>;

// Helper to generate a single image, used by all other functions
async function generateImage(framePrompt: string, characterImage?: string): Promise<string> {
  if (characterImage) {
    // Character-based generation using image-to-image
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        { media: { url: characterImage } },
        { text: `Place this character in the following scene, maintaining the same style: ${framePrompt}. Keep the background simple. Negative prompt: ${NEGATIVE_PROMPT}` },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    if (!media || !media.url) {
      throw new Error(`Image generation failed for prompt: ${framePrompt}`);
    }
    return media.url;
  } else {
    // Illustration-based generation using text-to-image
    const fullPrompt = `
      ${ILLUSTRATION_STYLE_PROMPT}
      Subject: A single, clear image of ${framePrompt}.
      Negative Prompt: ${NEGATIVE_PROMPT}
    `;
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: fullPrompt,
    });
    if (!media || !media.url) {
      throw new Error(`Image generation failed for prompt: ${framePrompt}`);
    }
    return media.url;
  }
}

export async function generateCharacterImage(input: GenerateCharacterImageInput): Promise<GenerateCharacterImageOutput> {
  const fullPrompt = `
    ${CHARACTER_STYLE_PROMPT}
    The character is: ${input.characterPrompt}.
    Negative Prompt: ${NEGATIVE_PROMPT}
  `;
  const { media } = await ai.generate({
    model: 'googleai/imagen-4.0-fast-generate-001',
    prompt: fullPrompt,
  });

  if (!media || !media.url) {
    throw new Error('Character image generation failed.');
  }

  return { image: media.url };
}

export async function generateSingleImage(input: GenerateSingleImageInput): Promise<GenerateSingleImageOutput> {
  const imageUrl = await generateImage(input.framePrompt, input.characterImage);
  return { image: imageUrl };
}

export async function generateStoryboard(input: GenerateStoryboardInput): Promise<GenerateStoryboardOutput> {
  return generateStoryboardFlow(input);
}

const generateStoryboardFlow = ai.defineFlow(
  {
    name: 'generateStoryboardFlow',
    inputSchema: GenerateStoryboardInputSchema,
    outputSchema: GenerateStoryboardOutputSchema,
  },
  async ({ characterImage, frames }) => {
    const imageGenerationPromises = frames.map(framePrompt => 
        generateImage(framePrompt, characterImage)
    );

    const images = await Promise.all(imageGenerationPromises);

    return { images };
  }
);
