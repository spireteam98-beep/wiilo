"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp, 
  PackageSearch,
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';
import { 
  predictiveInventoryAlerts, 
  PredictiveInventoryAlertsOutput 
} from '@/ai/flows/predictive-inventory-alerts-flow';
import { 
  salesPerformanceInsights, 
  SalesPerformanceInsightsOutput 
} from '@/ai/flows/sales-performance-insights-flow';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function AIAssistantPage() {
  const { currentTenant, products, transactions } = useStore();
  const [loading, setLoading] = useState(false);
  const [inventoryAlerts, setInventoryAlerts] = useState<PredictiveInventoryAlertsOutput | null>(null);
  const [salesInsights, setSalesInsights] = useState<SalesPerformanceInsightsOutput | null>(null);

  const runAnalysis = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const [inv, sales] = await Promise.all([
        predictiveInventoryAlerts({
          businessType: currentTenant.type as any,
          inventoryData: products.map(p => ({
            productId: p.id,
            productName: p.name,
            currentStock: p.stock,
            dailySalesVelocity: 1.5, // Mock velocity
            reorderPoint: 10,
            leadTimeDays: 3,
            isCritical: p.critical,
            isPopular: p.popular
          }))
        }),
        salesPerformanceInsights({
          businessType: currentTenant.type,
          salesTransactions: transactions.map(t => ({
            transactionId: t.id,
            productId: t.productId,
            productName: t.productName,
            quantity: t.quantity,
            unitPrice: t.total / t.quantity,
            totalPrice: t.total,
            timestamp: t.timestamp
          }))
        })
      ]);
      
      setInventoryAlerts(inv);
      setSalesInsights(sales);
      toast({ title: "Analysis Complete", description: "OmniBiz AI has finished processing your data." });
    } catch (error) {
      console.error(error);
      toast({ title: "Analysis Failed", description: "There was an error connecting to the AI service.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl shadow-sm border border-primary/10">
        <div className="flex items-start gap-5">
          <div className="bg-primary/10 p-4 rounded-2xl text-primary shrink-0 animate-pulse">
            <BrainCircuit className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">OmniBiz AI Assistant</h1>
            <p className="text-muted-foreground text-lg mt-1 max-w-xl">
              Get intelligent insights into your stock levels, sales trends, and business strategy powered by advanced machine learning.
            </p>
          </div>
        </div>
        <Button 
          size="lg" 
          onClick={runAnalysis} 
          disabled={loading} 
          className="h-14 px-8 text-lg font-bold gap-3 shadow-xl shadow-primary/20"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
          Run Smart Analysis
        </Button>
      </div>

      {!inventoryAlerts && !loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
          <Sparkles className="h-16 w-16 text-primary" />
          <p className="text-xl font-medium">Click the button above to start your AI analysis.</p>
        </div>
      )}

      {loading && (
        <div className="py-20 space-y-8 animate-pulse">
          <div className="h-40 bg-white rounded-2xl border"></div>
          <div className="h-64 bg-white rounded-2xl border"></div>
        </div>
      )}

      {inventoryAlerts && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center gap-3">
                <AlertTriangle className="text-orange-500 h-6 w-6" />
                <div>
                  <CardTitle>Inventory Alerts</CardTitle>
                  <CardDescription>Predicted stockouts and reorder suggestions.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {inventoryAlerts.alerts.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl font-medium">
                    <CheckCircle2 className="h-5 w-5" /> No immediate stockouts predicted.
                  </div>
                ) : (
                  inventoryAlerts.alerts.map((alert, i) => (
                    <div key={i} className="p-4 rounded-xl border border-orange-100 bg-orange-50/50 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-lg">{alert.productName}</span>
                        <Badge variant="outline" className="border-orange-200 text-orange-700">
                          Reorder {alert.suggestedReorderQuantity} units
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.reason}</p>
                      {alert.potentialStockoutDate && (
                        <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider mt-2">
                          Est. Stockout: {alert.potentialStockoutDate}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center gap-3">
                <Lightbulb className="text-accent h-6 w-6" />
                <div>
                  <CardTitle>General Advice</CardTitle>
                  <CardDescription>Strategic recommendations for your {currentTenant?.type}.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-accent/5 p-6 rounded-2xl text-accent-foreground leading-relaxed italic">
                  "{inventoryAlerts.generalAdvice}"
                </div>
              </CardContent>
            </Card>
          </div>

          {salesInsights && (
            <Card className="border-none shadow-lg">
              <CardHeader className="flex flex-row items-center gap-3">
                <TrendingUp className="text-primary h-6 w-6" />
                <div>
                  <CardTitle>Sales Performance Insights</CardTitle>
                  <CardDescription>Analysis of your best sellers and purchasing patterns.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> Top Performers
                    </h4>
                    {salesInsights.bestSellingProducts.map((p, i) => (
                      <div key={i} className="text-sm p-3 bg-muted rounded-lg flex justify-between">
                        <span>{p.productName}</span>
                        <span className="font-bold text-primary">${p.totalRevenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <PackageSearch className="h-4 w-4 text-accent" /> Customer Patterns
                    </h4>
                    {salesInsights.customerPurchasingPatterns.map((pattern, i) => (
                      <div key={i} className="text-sm space-y-1">
                        <p className="font-semibold text-foreground">{pattern.patternDescription}</p>
                        <p className="text-muted-foreground italic text-xs">Recommendation: {pattern.recommendation}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-orange-500" /> Peak Periods
                    </h4>
                    <div className="bg-orange-50 p-4 rounded-xl text-sm border border-orange-100">
                      <p className="font-bold mb-2 text-orange-800">{salesInsights.peakSalesPeriods.summary}</p>
                      <ul className="space-y-1 text-xs text-orange-700">
                        {salesInsights.peakSalesPeriods.detailedPeriods?.map((p, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{p.period}</span>
                            <span className="font-bold">${p.totalRevenue.toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-primary text-white rounded-2xl shadow-lg">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" /> Overall Strategic recommendation
                  </h4>
                  <p className="text-white/90 leading-relaxed">{salesInsights.overallSalesStrategyRecommendation}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}