'use server';
/**
 * @fileOverview A Genkit flow for generating predictive inventory alerts and reorder suggestions.
 *
 * - predictiveInventoryAlerts - A function that triggers the inventory alert generation process.
 * - PredictiveInventoryAlertsInput - The input type for the predictiveInventoryAlerts function.
 * - PredictiveInventoryAlertsOutput - The return type for the predictiveInventoryAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictiveInventoryAlertsInputSchema = z.object({
  businessType: z.enum(['Shop', 'Restaurant', 'Coffee shop', 'Pharmacy', 'E-commerce']).describe('The type of business.'),
  inventoryData: z.array(
    z.object({
      productId: z.string().describe('Unique identifier for the product.'),
      productName: z.string().describe('Name of the product.'),
      currentStock: z.number().int().min(0).describe('Current quantity in stock.'),
      dailySalesVelocity: z.number().min(0).describe('Average daily sales for this product.'),
      reorderPoint: z.number().int().min(0).describe('The stock level at which a new order should be placed.'),
      leadTimeDays: z.number().int().min(0).describe('Number of days it takes for new stock to arrive.'),
      isCritical: z.boolean().describe('Whether this is a critical product for the business.'),
      isPopular: z.boolean().describe('Whether this is a popular product that sells frequently.'),
    })
  ).describe('Current inventory data for various products.'),
});
export type PredictiveInventoryAlertsInput = z.infer<typeof PredictiveInventoryAlertsInputSchema>;

const PredictiveInventoryAlertsOutputSchema = z.object({
  alerts: z.array(
    z.object({
      productId: z.string().describe('Unique identifier for the product.'),
      productName: z.string().describe('Name of the product.'),
      currentStock: z.number().int().describe('Current stock level of the product.'),
      dailySalesVelocity: z.number().describe('Average daily sales for this product.'),
      potentialStockoutDate: z.string().nullable().describe('Predicted date of stockout (YYYY-MM-DD), or null if no immediate stockout is predicted.'),
      suggestedReorderQuantity: z.number().int().min(0).describe('Recommended quantity to reorder to prevent stockout and maintain optimal levels.'),
      reason: z.string().describe('Explanation for the alert and the suggested reorder quantity.'),
    })
  ).describe('A list of potential stockout alerts and reorder suggestions.'),
  generalAdvice: z.string().describe('General advice for inventory management based on the business type and overall inventory status.'),
});
export type PredictiveInventoryAlertsOutput = z.infer<typeof PredictiveInventoryAlertsOutputSchema>;

export async function predictiveInventoryAlerts(input: PredictiveInventoryAlertsInput): Promise<PredictiveInventoryAlertsOutput> {
  return predictiveInventoryAlertsFlow(input);
}

const predictiveInventoryAlertsPrompt = ai.definePrompt({
  name: 'predictiveInventoryAlertsPrompt',
  input: { schema: PredictiveInventoryAlertsInputSchema },
  output: { schema: PredictiveInventoryAlertsOutputSchema },
  prompt: `You are an AI-powered business assistant named OmniBiz Suite. Your primary role is to proactively analyze inventory data for a {{businessType}} business and provide actionable insights. Your goal is to identify potential stockouts for popular or critical products and suggest optimal reorder quantities, thereby helping the business avoid lost sales and maintain consistent inventory levels.

Based on the provided inventory data, generate a list of alerts for products at risk of stockout and provide general inventory management advice.

Here is the current inventory data for the {{businessType}} business:

{{#each inventoryData}}
---
Product ID: {{{productId}}}
Product Name: {{{productName}}}
Current Stock: {{{currentStock}}} units
Average Daily Sales: {{{dailySalesVelocity}}} units/day
Reorder Point: {{{reorderPoint}}} units
Lead Time: {{{leadTimeDays}}} days
Is Critical: {{{isCritical}}}
Is Popular: {{{isPopular}}}
---
{{/each}}

Please follow these instructions carefully:
1.  **Identify At-Risk Products**:
    *   A product is considered at risk if:
        *   Its \`currentStock\` is less than or equal to its \`reorderPoint\`.
        *   OR, if its \`dailySalesVelocity\` is greater than 0 AND its \`currentStock\` divided by its \`dailySalesVelocity\` is less than its \`leadTimeDays\`. This means the current stock will run out before a new order arrives.
        *   Special consideration for \`isCritical\` or \`isPopular\` products: Even if slightly above the reorder point, if they have high \`dailySalesVelocity\` and their stock is trending low relative to lead time, consider them at risk.
2.  **For each identified at-risk product, generate an alert in the 'alerts' array with the following details**:
    *   **productId, productName, currentStock, dailySalesVelocity**: Directly use the provided values.
    *   **potentialStockoutDate**:
        *   Calculate the number of days until stock runs out: \`daysToStockout = currentStock / dailySalesVelocity\`. If \`dailySalesVelocity\` is 0, then \`daysToStockout\` is effectively infinite. If the product is not at risk of stockout, set \`potentialStockoutDate\` to \`null\`.
        *   Otherwise, if \`daysToStockout\` is a positive number, calculate the date by adding \`daysToStockout\` to today's date (assume today is {{currentDate}} for calculations) and format it as 'YYYY-MM-DD'.
    *   **suggestedReorderQuantity**:
        *   The goal is to ensure that, after reordering, the stock level is sufficient to cover at least 1.5 times the demand during the \`leadTimeDays\` (this 1.5 factor acts as a safety stock buffer). This means maintaining enough stock for \`leadTimeDemand * 1.5\` units.
        *   Calculate the projected demand during lead time: \`leadTimeDemand = dailySalesVelocity * leadTimeDays\`.
        *   Calculate the target stock level: \`targetStock = leadTimeDemand * 1.5\`.
        *   The \`suggestedReorderQuantity\` should be \`max(0, targetStock - currentStock)\`.
        *   If \`dailySalesVelocity\` is 0 for a critical product with \`currentStock\` below its \`reorderPoint\`, suggest a minimum reorder quantity of 10 units to maintain availability.
    *   **reason**: Provide a concise explanation for why the alert was issued and how the \`suggestedReorderQuantity\` was determined. Mention if it's a critical/popular product.
3.  **General Advice**: In the \`generalAdvice\` field, provide comprehensive, actionable inventory management advice tailored to the {{businessType}} and the overall state of the provided inventory. If there are no alerts, provide advice on maintaining optimal inventory, forecasting, and supplier relationships. If there are alerts, provide advice on risk mitigation, supplier communication, and process improvements.

Assume today's date is: {{currentDate}}`,
});

const predictiveInventoryAlertsFlow = ai.defineFlow(
  {
    name: 'predictiveInventoryAlertsFlow',
    inputSchema: PredictiveInventoryAlertsInputSchema,
    outputSchema: PredictiveInventoryAlertsOutputSchema,
  },
  async (input) => {
    const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { output } = await predictiveInventoryAlertsPrompt({
      ...input,
      currentDate: currentDate,
    });
    return output!;
  }
);
