
// src/components/admin/ContentForm.tsx
'use client';

import type { FC } from 'react';
import React from 'react'; // Ensure React is imported if JSX is used
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription, // Import DialogDescription
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription as ShadcnFormDescription, // Renamed to avoid conflict
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
}from '@/components/ui/select';
import type { ContentItem, ContentItemData } from '@/services/contentService';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const musicCategories = [
  "Music", "Podcast", "Pop", "Rock", "Hip Hop", "Electronic", "R&B", "Jazz", "Classical",
  "Country", "Folk", "Reggae", "Blues", "Metal", "Indie", "Alternative",
  "Soul", "Funk", "Gospel", "Latin", "Afrobeat", "K-Pop", "World Music", "Ambient", "Other"
];

const articleCategories = [
    "News", "Technology", "Science", "Health", "Business", "Opinion", "Lifestyle", "Education", "Politics", "Sports", "Culture", "Fiction", "Other"
];


const baseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  imageUrl: z.string().url({ message: "Image URL must be a valid URL (e.g., https://example.com/image.png)"}).min(1, 'Image URL is required'),
  dataAiHint: z.string().min(1, 'AI Hint is required').max(50, 'AI Hint too long (max 50 chars)'),
  category: z.string().optional(),
  contentType: z.enum(['audio', 'article'], { required_error: "Content type is required." }),
  audioSrc: z.string().url({ message: "Audio URL must be a valid URL (e.g., https://example.com/audio.mp3)" }).optional().or(z.literal('')),
  excerpt: z.string().optional(),
  fullBodyContent: z.string().optional(),
  isSeries: z.boolean().optional().default(false),
  parentId: z.string().optional().nullable(),
  episodeNumber: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
  seriesTitle: z.string().optional().nullable(),
});

const formSchema = baseSchema.superRefine((data, ctx) => {
  if (data.contentType === 'audio') {
    if (!data.audioSrc || data.audioSrc.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Audio URL is required for audio content.",
        path: ["audioSrc"],
      });
    }
    if (!data.subtitle || data.subtitle.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Artist name (in Subtitle field) is required for audio content.",
        path: ["subtitle"],
      });
    }
    if (!data.category || data.category.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Category is required for audio content.",
          path: ["category"],
        });
    }
  } else if (data.contentType === 'article') {
    if (!data.excerpt || data.excerpt.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Excerpt is required for article content.",
        path: ["excerpt"],
      });
    }
    if (!data.fullBodyContent || data.fullBodyContent.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Full body content is required for article content.",
        path: ["fullBodyContent"],
      });
    }
  }

  if (data.isSeries && data.parentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A series (parent) cannot also be an episode of another series (parentId must be empty if 'Is Series' is checked).",
      path: ["parentId"],
    });
  }
  if (data.episodeNumber !== undefined && data.episodeNumber !== null && !data.parentId) {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Parent Series ID is required if Episode Number is provided.",
        path: ["parentId"],
    });
  }
  if (data.parentId && (data.episodeNumber === undefined || data.episodeNumber === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Episode Number is required if Parent Series ID is provided.",
      path: ["episodeNumber"],
    });
  }
});


type ContentFormValues = z.infer<typeof formSchema>;

interface ContentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContentItemData) => Promise<void>;
  initialData?: ContentItem | null;
  isLoading?: boolean;
  allSeries?: ContentItem[]; // For parent series selection, ensure these are series items
}

const ContentForm: FC<ContentFormProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading, allSeries = [] }) => {
  const { toast } = useToast();
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          subtitle: initialData.subtitle || '',
          audioSrc: initialData.audioSrc || '',
          category: initialData.category || '',
          excerpt: initialData.excerpt || '',
          fullBodyContent: initialData.fullBodyContent || '',
          contentType: initialData.contentType || 'audio',
          isSeries: initialData.isSeries || false,
          parentId: initialData.parentId || null,
          episodeNumber: initialData.episodeNumber || undefined,
          seriesTitle: initialData.seriesTitle || null,
        }
      : {
          title: '',
          subtitle: '',
          imageUrl: '',
          audioSrc: '',
          dataAiHint: '',
          category: '',
          contentType: 'audio',
          excerpt: '',
          fullBodyContent: '',
          isSeries: false,
          parentId: null,
          episodeNumber: undefined,
          seriesTitle: null,
        },
  });

  const watchedContentType = form.watch('contentType');
  const watchedIsSeries = form.watch('isSeries');
  const watchedParentId = form.watch('parentId');

  React.useEffect(() => {
    if (watchedParentId) {
      const selectedSeries = allSeries.find(s => s.id === watchedParentId && s.isSeries);
      form.setValue('seriesTitle', selectedSeries?.title || null);
    } else {
      form.setValue('seriesTitle', null);
    }
  }, [watchedParentId, allSeries, form]);


  const handleFormSubmitInternal: SubmitHandler<ContentFormValues> = async (data) => {
    console.log("[ContentForm] Attempting form submission with data (raw from RHF):", data);
    try {
      const parsedData = formSchema.parse(data);
      console.log("[ContentForm] Zod parsed data successfully:", parsedData);
      
      const submissionData: ContentItemData = {
        ...parsedData,
        subtitle: parsedData.subtitle || null,
        category: parsedData.category || null,
        audioSrc: parsedData.contentType === 'audio' ? (parsedData.audioSrc || null) : undefined, // Ensure null if empty for audio
        excerpt: parsedData.contentType === 'article' ? (parsedData.excerpt || null) : undefined,
        fullBodyContent: parsedData.contentType === 'article' ? (parsedData.fullBodyContent || null) : undefined,
        isSeries: parsedData.isSeries || false,
        parentId: parsedData.isSeries ? null : (parsedData.parentId || null),
        episodeNumber: parsedData.isSeries ? undefined : (parsedData.episodeNumber || undefined),
        seriesTitle: parsedData.isSeries ? null : (parsedData.seriesTitle || null),
      };
      await onSubmit(submissionData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[ContentForm] Direct Zod parsing error:", JSON.stringify(error.errors, null, 2));
         error.errors.forEach(err => {
          form.setError(err.path[0] as keyof ContentFormValues, { message: err.message });
        });
        toast({title: "Validation Error", description: "Please check the highlighted fields.", variant: "destructive"});
      } else {
        console.error("[ContentForm] Error submitting form:", error);
        toast({title: "Submission Error", description: "An unexpected error occurred.", variant: "destructive"});
      }
    }
  };
  
  const onFormValidationError = (errors: any) => {
    console.error("[ContentForm] Form validation errors (argument from RHF):", errors);
    console.error("[ContentForm] Current form values:", form.getValues());
    console.error("[ContentForm] form.formState.errors from RHF state:", form.formState.errors);
    console.error("[ContentForm] form.formState.errors from RHF state (JSON):", JSON.stringify(form.formState.errors, null, 2));
    console.log("[ContentForm] form.formState.isValid from RHF state:", form.formState.isValid);

    toast({
      title: "Validation Error",
      description: "Please check the form for errors and ensure all required fields are filled correctly.",
      variant: "destructive"
    });
  };
  
  if (!isOpen) return null;

  // Filter allSeries to only include items marked as series for the parentId dropdown
  const parentSeriesOptions = allSeries.filter(item => item.isSeries === true);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px] bg-card text-card-foreground overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Content' : 'Add New Content'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the content item. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(handleFormSubmitInternal, onFormValidationError)} 
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('category', ''); 
                      form.setValue('audioSrc', '');
                      form.setValue('excerpt', '');
                      form.setValue('fullBodyContent', '');
                    }} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-input text-foreground border-border">
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover text-popover-foreground">
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} className="bg-input text-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{watchedContentType === 'audio' ? 'Artist *' : 'Subtitle (Optional)'}</FormLabel>
                  <FormControl>
                    <Input placeholder={watchedContentType === 'audio' ? 'Enter artist name' : 'Enter subtitle'} {...field} value={field.value ?? ''} className="bg-input text-foreground border-border" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Featured Image / Album Art) *</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/image.jpg" {...field} className="bg-input text-foreground border-border" />
                  </FormControl>
                  {watchedContentType === 'audio' && (
                    <ShadcnFormDescription className="text-xs">
                      For audio, if this artist has a standard promo image, you can re-use that URL. For unique single/album art, provide its specific URL.
                    </ShadcnFormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dataAiHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Hint *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'pop music' or 'tech article'" {...field} className="bg-input text-foreground border-border" />
                  </FormControl>
                  <ShadcnFormDescription className="text-xs">
                    Short keywords (max 2 words) for image search if placeholder is used.
                  </ShadcnFormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{watchedContentType === 'audio' ? 'Audio Category *' : 'Article Category (Optional)'}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value || ''}>
                    <FormControl>
                      <SelectTrigger className="bg-input text-foreground border-border">
                        <SelectValue placeholder={`Select a category ${watchedContentType === 'audio' ? '*' : ''}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover text-popover-foreground max-h-60">
                      {(watchedContentType === 'audio' ? musicCategories : articleCategories).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedContentType === 'audio' && (
              <FormField
                control={form.control}
                name="audioSrc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audio URL *</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com/audio.mp3" {...field} value={field.value ?? ''} className="bg-input text-foreground border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {watchedContentType === 'article' && (
              <>
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Short summary of the article..." {...field} value={field.value ?? ''} className="bg-input text-foreground border-border min-h-[100px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullBodyContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Body Content *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Write the full article content here..." {...field} value={field.value ?? ''} className="bg-input text-foreground border-border min-h-[200px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="isSeries"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-input/50">
                  <div className="space-y-0.5">
                    <FormLabel>Is this a Series/Album (Parent)?</FormLabel>
                    <ShadcnFormDescription className="text-xs text-muted-foreground">
                      Check if this content item is a main series, album, or collection (a parent item).
                    </ShadcnFormDescription>
                  </div>
                  <FormControl>
                     <Input 
                        type="checkbox" 
                        checked={field.value || false} 
                        onChange={(e) => {
                            const isChecked = e.target.checked;
                            field.onChange(isChecked);
                            if (isChecked) { 
                                form.setValue('parentId', null); 
                                form.setValue('episodeNumber', undefined);
                                form.setValue('seriesTitle', null); 
                            }
                        }}
                        className="form-checkbox h-5 w-5 text-primary border-border focus:ring-primary accent-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!watchedIsSeries && ( 
                <>
                    <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Parent Series/Album (Optional)</FormLabel>
                        <Select
                            onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                            value={field.value || 'none'}
                        >
                            <FormControl>
                            <SelectTrigger className="bg-input text-foreground border-border">
                                <SelectValue placeholder="Select parent if this is an episode/track" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover text-popover-foreground max-h-60">
                            <SelectItem value="none">None (Standalone Content)</SelectItem>
                            {parentSeriesOptions.map(series => (
                                <SelectItem key={series.id} value={series.id}>{series.title}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <ShadcnFormDescription className="text-xs">
                            Link this item to a parent series/album. Only series items will appear here.
                        </ShadcnFormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="episodeNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Episode/Track Number (Optional)</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                placeholder="e.g., 1, 2, 3..." 
                                {...field} 
                                value={field.value === undefined || field.value === null ? '' : String(field.value)}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === '' ? undefined : Number(val));
                                }}
                                className="bg-input text-foreground border-border" 
                                disabled={!watchedParentId} 
                            />
                        </FormControl>
                         <ShadcnFormDescription className="text-xs">
                           Required if linked to a parent series/album.
                         </ShadcnFormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </>
            )}
            
            <DialogFooter className="sticky bottom-0 bg-card py-4 mt-auto border-t border-border -mx-6 px-6"> {/* Adjust padding for sticky footer */}
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Save Changes' : 'Add Content'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ContentForm;
