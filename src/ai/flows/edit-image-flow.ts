'use server';
/**
 * @fileOverview An AI flow for editing images based on a text prompt.
 *
 * - editImage - A function that handles the image editing process.
 * - EditImageInput - The input type for the editImage function.
 * - EditImageOutput - The return type for the editImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const EditImageInputSchema = z.object({
  image: z
    .string()
    .describe(
      "The source image to edit, as a data URI or a public URL. If using a data URI, it must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('The text prompt describing the desired edits.'),
});
export type EditImageInput = z.infer<typeof EditImageInputSchema>;

const EditImageOutputSchema = z.object({
  editedImage: z.string().describe('The edited image as a data URI.'),
});
export type EditImageOutput = z.infer<typeof EditImageOutputSchema>;

async function imageUrlToDataUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error("Error converting image URL to data URL:", error);
        // Fallback or re-throw
        throw new Error("Could not process image from URL.");
    }
}

export async function editImage(input: EditImageInput): Promise<EditImageOutput> {
  return editImageFlow(input);
}

const editImageFlow = ai.defineFlow(
  {
    name: 'editImageFlow',
    inputSchema: EditImageInputSchema,
    outputSchema: EditImageOutputSchema,
  },
  async ({ image, prompt }) => {
    let imageUri = image;

    // If the image is a public URL, fetch it and convert to a data URI.
    if (image.startsWith('http')) {
        imageUri = await imageUrlToDataUrl(image);
    }
      
    // The nano-banana model is good for image-to-image tasks.
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        { media: { url: imageUri } },
        { text: prompt },
      ],
      config: {
        // You must specify both TEXT and IMAGE as response modalities.
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to return an image.');
    }

    return {
      editedImage: media.url,
    };
  }
);
