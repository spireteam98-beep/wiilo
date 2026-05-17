'use client';

import { useEffect, useState } from 'react';
import { recommendVideos, RecommendVideosOutput } from '@/ai/flows/ai-content-recommendations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { videos } from '@/lib/videos';

const VIEWING_HISTORY_KEY = 'streamflow_viewing_history';

export default function Recommendations({ currentVideoId }: { currentVideoId: string }) {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const historyJson = localStorage.getItem(VIEWING_HISTORY_KEY);
        // Ensure viewing history is an array of strings
        const viewingHistoryTitles: string[] = historyJson ? JSON.parse(historyJson) : [];
        
        // Let's seed the history if it's empty for demo purposes
        if(viewingHistoryTitles.length === 0) {
            const currentVideo = videos.find(v => v.id === currentVideoId);
            if (currentVideo) {
                viewingHistoryTitles.push(currentVideo.title);
            }
        }

        if (viewingHistoryTitles.length === 0) {
          setRecommendations([]);
          return;
        }

        const result = await recommendVideos({ viewingHistory: viewingHistoryTitles, numberOfRecommendations: 3 });
        setRecommendations(result.recommendations);

      } catch (e) {
        console.error('Failed to get recommendations:', e);
        setError('Could not load recommendations at this time.');
      } finally {
        setIsLoading(false);
      }
    };

    // We use a timeout to allow viewing history to be populated after a video is watched
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 1000);


    return () => clearTimeout(timer);
  }, [currentVideoId]);

  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle>Because you watched...</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="bg-secondary p-4 rounded-lg hover:bg-primary/50 transition-colors cursor-pointer">
                <div className="aspect-video bg-muted rounded-md mb-2 flex items-center justify-center">
                    <PlayIcon className="text-muted-foreground"/>
                </div>
                <h3 className="font-semibold text-base text-primary-foreground">{rec}</h3>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Start watching videos to get personalized recommendations.</p>
        )}
      </CardContent>
    </Card>
  );
}

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}
