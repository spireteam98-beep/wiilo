'use server';
/**
 * @fileOverview Recommends personalized cryptocurrency investments based on user profile.
 *
 * - getPersonalizedAssetRecommendations - A function that returns personalized crypto recommendations.
 * - PersonalizedAssetRecommendationsInput - The input type for the getPersonalizedAssetRecommendations function.
 * - PersonalizedAssetRecommendationsOutput - The return type for the getPersonalizedAssetRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedAssetRecommendationsInputSchema = z.object({
  investmentProfile: z.string().describe('The user investment profile.'),
});
export type PersonalizedAssetRecommendationsInput = z.infer<
  typeof PersonalizedAssetRecommendationsInputSchema
>;

const PersonalizedAssetRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('A list of recommended cryptocurrency assets.'),
});
export type PersonalizedAssetRecommendationsOutput = z.infer<
  typeof PersonalizedAssetRecommendationsOutputSchema
>;

export async function getPersonalizedAssetRecommendations(
  input: PersonalizedAssetRecommendationsInput
): Promise<PersonalizedAssetRecommendationsOutput> {
  return personalizedAssetRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedAssetRecommendationsPrompt',
  input: {schema: PersonalizedAssetRecommendationsInputSchema},
  output: {schema: PersonalizedAssetRecommendationsOutputSchema},
  prompt: `Based on the following investment profile: {{{investmentProfile}}}, recommend a list of cryptocurrency assets for investment. Return the recommendations as a list of strings.
`,
});

const personalizedAssetRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedAssetRecommendationsFlow',
    inputSchema: PersonalizedAssetRecommendationsInputSchema,
    outputSchema: PersonalizedAssetRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
