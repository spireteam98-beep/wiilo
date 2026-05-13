'use server';
/**
 * @fileOverview Provides AI-driven content recommendations based on viewing history.
 *
 * - recommendVideos - A function that suggests related videos based on viewing history.
 * - RecommendVideosInput - The input type for the recommendVideos function, which includes the user's viewing history.
 * - RecommendVideosOutput - The return type for the recommendVideos function, containing a list of recommended video titles.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendVideosInputSchema = z.object({
  viewingHistory: z
    .array(z.string())
    .describe('An array of video titles representing the user\'s viewing history.'),
  numberOfRecommendations: z
    .number()
    .default(5)
    .describe('The number of video recommendations to return.'),
});
export type RecommendVideosInput = z.infer<typeof RecommendVideosInputSchema>;

const RecommendVideosOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('An array of video titles that are recommended based on the viewing history.'),
});
export type RecommendVideosOutput = z.infer<typeof RecommendVideosOutputSchema>;

export async function recommendVideos(input: RecommendVideosInput): Promise<RecommendVideosOutput> {
  return recommendVideosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendVideosPrompt',
  input: {schema: RecommendVideosInputSchema},
  output: {schema: RecommendVideosOutputSchema},
  prompt: `You are a video recommendation expert. Given a user's viewing history, you will suggest related videos that the user might enjoy.

  The user's viewing history is as follows:
  {{#each viewingHistory}}- {{{this}}}\n{{/each}}

  Please provide {{numberOfRecommendations}} video recommendations based on this viewing history. Ensure that the video recommendations are diverse and cover different aspects of the user's interests as reflected in their viewing history. The output should only contain the video titles.
  Consider the descriptions of Zod schema when creating the recommendation.`,
});

const recommendVideosFlow = ai.defineFlow(
  {
    name: 'recommendVideosFlow',
    inputSchema: RecommendVideosInputSchema,
    outputSchema: RecommendVideosOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
