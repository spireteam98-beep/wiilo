// src/app/admin/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import ContentForm from '@/components/admin/ContentForm';
import ContentList from '@/components/admin/ContentList';
import {
  getContentItems,
  addContentItem,
  updateContentItem,
  deleteContentItem,
  type ContentItem,
  type ContentItemData,
} from '@/services/contentService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setContentItems([]);
      // router.replace('/auth/signin'); // This check is better handled in the useEffect below
      return;
    }
    console.log('[AdminPage] Fetching content items...');
    setIsLoading(true);
    setError(null);
    try {
      const { items } = await getContentItems(); // Destructure items from the result
      setContentItems(items);
      console.log('[AdminPage] Content items fetched successfully:', items.length);
    } catch (err: any) {
      console.error('[AdminPage] Failed to fetch content items for admin panel. Raw error:', err);
      let detailedError = 'Could not fetch content items. Please try again.';
      if (err && err.code) {
        switch (err.code) {
          case 'permission-denied':
            detailedError = 'Permission denied. Please check your Firestore security rules to ensure authenticated users can read the "content" collection.';
            break;
          case 'unauthenticated':
            detailedError = 'Authentication required. Please sign in again.';
            router.push('/auth/signin'); // Redirect if unauthenticated during fetch attempt
            break;
          default:
            if (err.message && err.message.toLowerCase().includes("requires an index")) {
              detailedError = `Firestore query requires an index. Please check the Firebase console for an error message that includes a link to create the required index. Original error: ${err.message}`;
            } else if (err.message) {
              detailedError = `Error: ${err.message}`;
            }
        }
      } else if (err && typeof err.toString === 'function') {
        detailedError = err.toString();
      }
      setError(detailedError);
      toast({
        title: 'Error Loading Content',
        description: detailedError,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user, router]); // Added router to useCallback dependencies as it's used

  useEffect(() => {
    console.log('[AdminPage] useEffect triggered. AuthLoading:', authLoading, 'User:', !!user);
    if (!authLoading) {
      if (user) {
        fetchItems();
      } else {
        console.log('[AdminPage] No user found, redirecting to sign-in.');
        router.replace('/auth/signin');
      }
    }
  }, [user, authLoading, router, fetchItems]);

  const handleOpenForm = (item?: ContentItem) => {
    setEditingItem(item || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSubmitForm = async (data: ContentItemData) => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to submit content.", variant: "destructive" });
        return;
    }
    setFormSubmitLoading(true);
    try {
      if (editingItem) {
        await updateContentItem(editingItem.id, data);
        toast({ title: 'Success', description: 'Content item updated successfully.' });
      } else {
        await addContentItem(data);
        toast({ title: 'Success', description: 'Content item added successfully.' });
      }
      await fetchItems(); 
      handleCloseForm();
    } catch (err: any) {
      console.error('[AdminPage] Failed to save content item:', err);
      toast({
        title: 'Error Saving Content',
        description: err.message || 'Could not save content item.',
        variant: 'destructive',
      });
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to delete content.", variant: "destructive" });
        return;
    }
    setDeleteLoadingId(itemId);
    try {
      await deleteContentItem(itemId);
      toast({ title: 'Success', description: 'Content item deleted successfully.' });
      setContentItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (err: any) {
      console.error('[AdminPage] Failed to delete content item:', err);
      toast({
        title: 'Error Deleting Content',
        description: err.message || 'Could not delete content item.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  // This check is now primarily handled by the useEffect, but kept as a safeguard.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Content
        </Button>
      </header>

      {isLoading && !error && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading content...</p>
        </div>
      )}

      {error && (
         <Card className="border-destructive bg-destructive/10">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" /> Error Loading Content
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive/90 whitespace-pre-line">{error}</p>
                <Button onClick={fetchItems} variant="outline" className="mt-4">
                    Try Again
                </Button>
            </CardContent>
         </Card>
      )}

      {!isLoading && !error && (
        <ContentList items={contentItems} onEdit={handleOpenForm} onDelete={handleDeleteItem} isLoadingDelete={deleteLoadingId} />
      )}

      {isFormOpen && (
        <ContentForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          initialData={editingItem}
          isLoading={formSubmitLoading}
        />
      )}
    </div>
  );
}
