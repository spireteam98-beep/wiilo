'use server';

/**
 * @fileOverview AI-powered fraud detection flow.
 *
 * - detectFraud - A function that detects potentially fraudulent transactions.
 * - FraudDetectionInput - The input type for the detectFraud function.
 * - FraudDetectionOutput - The return type for the detectFraud function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FraudDetectionInputSchema = z.object({
  transactionDetails: z
    .string()
    .describe('Details of the transaction, including amount, recipient, timestamp, and location.'),
  userProfile: z.string().describe('The user profile of the transaction initiator, including historical transaction data.'),
  deviceInfo: z.string().describe('Information about the device used for the transaction, including IP address and device type.'),
});
export type FraudDetectionInput = z.infer<typeof FraudDetectionInputSchema>;

const FraudDetectionOutputSchema = z.object({
  isFraudulent: z.boolean().describe('Whether the transaction is likely to be fraudulent.'),
  fraudExplanation: z.string().describe('Explanation of why the transaction is flagged as potentially fraudulent.'),
  suggestedAction: z.string().describe('Suggested action to take, such as requesting user confirmation or blocking the transaction.'),
});
export type FraudDetectionOutput = z.infer<typeof FraudDetectionOutputSchema>;

export async function detectFraud(input: FraudDetectionInput): Promise<FraudDetectionOutput> {
  return detectFraudFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fraudDetectionPrompt',
  input: {schema: FraudDetectionInputSchema},
  output: {schema: FraudDetectionOutputSchema},
  prompt: `You are an expert in fraud detection for cryptocurrency transactions.

You are provided with transaction details, the user's profile, and device information.

Analyze the provided information and determine if the transaction is potentially fraudulent.

Based on your analysis, set the isFraudulent output field to true or false.
Provide a fraudExplanation detailing why the transaction is flagged as potentially fraudulent.
Suggest an appropriate action to take in the suggestedAction output field.

Transaction Details: {{{transactionDetails}}}
User Profile: {{{userProfile}}}
Device Info: {{{deviceInfo}}}`,
});

const detectFraudFlow = ai.defineFlow(
  {
    name: 'detectFraudFlow',
    inputSchema: FraudDetectionInputSchema,
    outputSchema: FraudDetectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
