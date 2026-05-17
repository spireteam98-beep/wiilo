'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { countries } from '@/lib/countries';

export default function ProfileSetupPage() {
  const { user, loading: authLoading, userProfile, isUserProfileLoading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: '',
    mobile: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countrySearchOpen, setCountrySearchOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin');
    } else if (!authLoading && user && !isUserProfileLoading && userProfile) {
      // If profile is already complete, redirect to preferences or home
      if (userProfile.profileComplete) {
        if (!userProfile.preferredCategories || userProfile.preferredCategories.length === 0) {
          router.replace('/profile/preferences');
        } else {
          router.replace('/');
        }
      } else {
        // Pre-fill form if data exists but profile isn't complete
        const nameParts = user.displayName?.split(' ') || [];
        setFormData({
          firstName: userProfile.firstName || (nameParts.length > 0 ? nameParts[0] : ''),
          lastName: userProfile.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
          country: userProfile.country || '',
          mobile: userProfile.mobile || '',
        });
      }
    }
  }, [user, authLoading, userProfile, isUserProfileLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCountrySelect = (countryValue: string) => {
    setFormData({ ...formData, country: countryValue });
    setCountrySearchOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({ title: "Validation Error", description: "First name and last name are required.", variant: "destructive" });
      return;
    }
     if (!formData.country) {
      toast({ title: "Validation Error", description: "Please select your country.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        country: formData.country,
        mobile: formData.mobile.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`, // Update the main name field too
        profileComplete: true,
        updatedAt: serverTimestamp(),
      });
      await refreshUserProfile(); // Refresh context after update
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
      router.push('/profile/preferences'); // Next step is preferences
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: "Failed to update profile. Please try again.", variant: "destructive" });
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

  // If user is not logged in, or profile is complete, useEffect should handle redirection.
  // This is a fallback display.
  if (!user || (userProfile && userProfile.profileComplete)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Complete Your Profile</CardTitle>
          <CardDescription>Tell us a bit more about yourself to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="firstName" className="text-foreground">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="country" className="text-foreground">Country</Label>
              <Popover open={countrySearchOpen} onOpenChange={setCountrySearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countrySearchOpen}
                    className="w-full justify-between mt-1 bg-input border-border text-foreground hover:bg-input/80"
                  >
                    {formData.country
                      ? countries.find((c) => c.value === formData.country)?.label
                      : "Select country..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {countries.map((c) => (
                          <CommandItem
                            key={c.value}
                            value={c.label} 
                            onSelect={() => handleCountrySelect(c.value)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.country === c.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {c.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="mobile" className="text-foreground">Mobile Number (Optional)</Label>
              <Input
                id="mobile"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleChange}
                className="mt-1 bg-input border-border text-foreground"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save and Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

