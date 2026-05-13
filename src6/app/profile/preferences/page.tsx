'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'music', label: 'Music' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'news', label: 'News' },
  { id: 'tech', label: 'Tech' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'education', label: 'Education' },
  { id: 'sports', label: 'Sports' },
  { id: 'comedy', label: 'Comedy' },
];

export default function PreferencesPage() {
  const { user, loading: authLoading, userProfile, isUserProfileLoading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin');
    } else if (!authLoading && user && !isUserProfileLoading && userProfile) {
      if (!userProfile.profileComplete) {
        // If profile setup is not done, redirect there first
        router.replace('/profile/setup');
      } else if (userProfile.preferredCategories && userProfile.preferredCategories.length > 0) {
        // If preferences are already set, redirect to home or pre-fill
         router.replace('/'); // Or pre-fill: setSelectedCategories(userProfile.preferredCategories);
      }
      // If profile is complete but no preferences, stay on this page
      // Pre-fill if they are revisiting and had some selections
      setSelectedCategories(userProfile.preferredCategories || []);

    }
  }, [user, authLoading, userProfile, isUserProfileLoading, router]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.Event<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (selectedCategories.length === 0) {
      toast({ title: "Selection Required", description: "Please select at least one category.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        preferredCategories: selectedCategories,
        updatedAt: serverTimestamp(),
      });
      await refreshUserProfile(); // Refresh context after update
      toast({ title: "Preferences Saved", description: "Your content preferences have been updated." });
      router.push('/'); // Redirect to dashboard
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({ title: "Error", description: "Failed to save preferences. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isUserProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user || (userProfile && !userProfile.profileComplete && !isUserProfileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting to profile setup...</p>
      </div>
    );
  }

  if (userProfile && userProfile.profileComplete && userProfile.preferredCategories && userProfile.preferredCategories.length > 0) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Content Preferences</CardTitle>
          <CardDescription>Select categories you're interested in to personalize your experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center space-x-2 p-2 border border-border rounded-md hover:bg-card/50 transition-colors">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                    className="text-primary border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor={category.id} className="text-sm font-medium text-foreground cursor-pointer select-none">
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
            <Button type="submit" className="w-full mt-8" disabled={isSubmitting || selectedCategories.length === 0}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Preferences
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
