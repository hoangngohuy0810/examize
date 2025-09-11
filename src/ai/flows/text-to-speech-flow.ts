'use server';
/**
 * @fileOverview An AI flow for generating speech from text.
 *
 * - textToSpeech - A function that handles the text-to-speech conversion.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

const SpeakerConfigSchema = z.object({
  name: z.string().describe('The name of the speaker, e.g., "Speaker1".'),
  voice: z.string().describe('The prebuilt voice name to use for this speaker, e.g., "Algenib".'),
});

const TextToSpeechInputSchema = z.object({
  script: z.string().describe('The complete script to be converted to speech. It should be formatted with speaker names, e.g., "Speaker1: Hello. Speaker2: Hi."'),
  speakers: z.array(SpeakerConfigSchema).describe('An array of speaker configurations, mapping speaker names to voice names.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audio: z.string().describe('The generated audio as a data URI in WAV format.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

// Helper function to convert raw PCM audio buffer to a Base64-encoded WAV string
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000, // Gemini TTS outputs at 24000Hz
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({ script, speakers }) => {
    const isMultiSpeaker = speakers.length > 1;

    const speechConfig: any = {
      responseModalities: ['AUDIO'],
      speechConfig: {}
    };

    if (isMultiSpeaker) {
        // Configure for multiple speakers, ensuring the order from the client is respected.
        speechConfig.speechConfig.multiSpeakerVoiceConfig = {
            speakerVoiceConfigs: speakers.map(speaker => ({
                speaker: speaker.name,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker.voice } }
            }))
        };
    } else if (speakers.length === 1) {
        // Configure for a single speaker
        speechConfig.speechConfig.voiceConfig = {
            prebuiltVoiceConfig: { voiceName: speakers[0].voice }
        };
    } else {
        // Default to a single voice if no speakers are provided
         speechConfig.speechConfig.voiceConfig = {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }
        };
    }

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: speechConfig,
      prompt: script,
    });

    if (!media || !media.url) {
      throw new Error('Audio generation failed to return audio data.');
    }

    // The returned data URI is raw PCM audio, we need to convert it to a WAV file
    const pcmAudioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(pcmAudioBuffer);

    return {
      audio: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
