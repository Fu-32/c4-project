'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Wand2, Upload, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';

const MAX_FILES = 3;

const templateOptions = [
  {
    value: 'release-notes',
    label: 'Release Notes',
    emoji: '📝',
    description: 'Detailed updates about your product release',
  },
  {
    value: 'user-stories',
    label: 'User Stories',
    emoji: '👥',
    description: 'Standard user stories for agile teams',
  },
  {
    value: 'product-specs',
    label: 'Product Specs',
    emoji: '⚙️',
    description: 'Technical and product requirements specification',
  },
];

const personalityStyles = [
  {
    value: 'steve-jobs',
    name: 'Steve Jobs',
    image:
      'https://media.licdn.com/dms/image/v2/C4E03AQGU6Y0AOGqTdQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1644504735058?e=1742428800&v=beta&t=AbG0Hzl1dZlyXpI63fSTRQzeY_WDIYPi3kinNwzEMBg',
    description: 'Visionary and persuasive',
  },
  {
    value: 'sam-altman',
    name: 'Sam Altman',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=faces&q=80',
    description: 'Analytical and forward-thinking',
  },
  {
    value: 'shreyas',
    name: 'Shreyas Doshi',
    image:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=50&h=50&fit=crop&crop=faces&q=80',
    description: 'Product-focused and strategic',
  },
];

interface UploadedFile {
  id: string;
  name: string;
  file: File;
  uploadedAt: Date;
}

interface ContentGeneratorFormValues {
  template: string;
  personality: string;
  context: string;
  audience: {
    enabled: boolean;
    demographics: {
      ageRange: string;
      gender: string;
    };
    professional: string;
    interests: string[];
    experience: string;
    purchaseBehavior: string;
  };
  complexity: number;
  length: string;
}

export default function ContentGenerator() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [audienceEnabled, setAudienceEnabled] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, setValue, watch } =
    useForm<ContentGeneratorFormValues>({
      defaultValues: {
        template: 'blog',
        personality: 'steve-jobs',
        context: '',
        audience: {
          enabled: false,
          demographics: {
            ageRange: '25-34',
            gender: 'all',
          },
          professional: 'employed',
          interests: [],
          experience: 'intermediate',
          purchaseBehavior: 'first-time',
        },
        complexity: 3,
        length: 'medium',
      },
    });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (uploadedFiles.length >= MAX_FILES) {
      toast({
        title: 'Upload limit reached',
        description: `You can only upload up to ${MAX_FILES} files. Please delete some files first.`,
        duration: 3000,
        variant: 'destructive',
      });
      return;
    }

    if (file.type === 'application/pdf') {
      const newFile: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        file: file,
        uploadedAt: new Date(),
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      
      toast({
        title: 'File uploaded',
        description: `${file.name} has been added`,
        duration: 3000,
      });
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please upload only PDF files',
        duration: 3000,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    setIsDeleting(true);
    try {
      // Here you would typically make an API call to delete the file from storage
      // For now, we'll just remove it from the state
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      
      // Log deletion event
      console.log(`File deleted: ${fileId} at ${new Date().toISOString()}`);
      
      toast({
        title: 'File deleted',
        description: 'The file has been removed successfully',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the file. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const callChatGPT = async (data: ContentGeneratorFormValues) => {
    const payload = {
      context: data.context,
      audience: data.audience,
      complexity: data.complexity,
      length: data.length,
      template: data.template,
      personality: data.personality,
    };

    try {
      const res = await fetch('/api/generatev3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const result = await res.json();
      return result.text;
    } catch (error: any) {
      console.error('Error calling ChatGPT API:', error);
      throw error;
    }
  };

  const onSubmit: SubmitHandler<ContentGeneratorFormValues> = async (data) => {
    setIsGenerating(true);
    toast({
      title: 'Generating content...',
      description: 'Please wait while we process your request.',
      duration: 3000,
    });

    try {
      const generatedText = await callChatGPT(data);
      setGeneratedContent(generatedText);

      toast({
        title: 'Content generated!',
        description: 'Your content is ready.',
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: 'Generation error',
        description: 'Something went wrong. Check console for details.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: 'Copied!',
      description: 'Content copied to clipboard',
      duration: 3000,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div className="space-y-2">
        <div className='flex-col space-y-2'>
          <Image src={'/images/logo-cycle.webp'} alt={'Logo'} width={50} height={50} className="rounded-md" />
          <h1 className="text-3xl font-bold tracking-tight">C4 - Content Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Generate high-quality content with customizable parameters
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1,2fr,400px]">
        <Card className="p-6 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select
                  defaultValue={watch('template')}
                  onValueChange={(val) => setValue('template', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateOptions.map((template) => (
                      <SelectItem key={template.value} value={template.value}>
                        <div className="flex items-center gap-2">
                          <span role="img" aria-label={template.label}>
                            {template.emoji}
                          </span>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium">{template.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Personality Style</Label>
                <Select
                  defaultValue={watch('personality')}
                  onValueChange={(val) => setValue('personality', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {personalityStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        <div className="flex min-h-min items-center gap-2">
                          <div className="relative w-6 h-6 overflow-hidden rounded-full flex-shrink-0">
                            <Image
                              src={style.image}
                              alt={style.name}
                              width={24}
                              height={24}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium truncate">
                              {style.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {style.description}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <Label className="text-lg font-medium">
                Document Context Section
              </Label>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type or paste your context here"
                    className="min-h-[200px] bg-background"
                    {...register('context')}
                  />
                </div>
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center bg-background">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                      disabled={uploadedFiles.length >= MAX_FILES}
                    />
                    <label
                      htmlFor="pdf-upload"
                      className={`cursor-pointer space-y-2 block ${
                        uploadedFiles.length >= MAX_FILES ? 'opacity-50' : ''
                      }`}
                    >
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Upload PDF document
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {uploadedFiles.length >= MAX_FILES
                            ? `Maximum ${MAX_FILES} files reached`
                            : `${uploadedFiles.length}/${MAX_FILES} files uploaded (PDF only)`}
                        </p>
                      </div>
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Files</Label>
                      <div className="space-y-2">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 bg-background rounded-md border"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded">
                                <svg
                                  className="w-4 h-4 text-primary"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Uploaded {file.uploadedAt.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete File</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &quot;{file.name}&quot;? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-medium">Target Audience</Label>
                <Switch
                  checked={audienceEnabled}
                  onCheckedChange={setAudienceEnabled}
                />
              </div>

              <div className={`space-y-4 ${audienceEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age Range</Label>
                    <Select
                      defaultValue="25-34"
                      onValueChange={(val) =>
                        setValue('audience.demographics.ageRange', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18-24">18-24</SelectItem>
                        <SelectItem value="25-34">25-34</SelectItem>
                        <SelectItem value="35-44">35-44</SelectItem>
                        <SelectItem value="45-54">45-54</SelectItem>
                        <SelectItem value="55+">55+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      defaultValue="all"
                      onValueChange={(val) =>
                        setValue('audience.demographics.gender', val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Professional Status</Label>
                  <Select
                    defaultValue="employed"
                    onValueChange={(val) =>
                      setValue('audience.professional', val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <Select
                    defaultValue="intermediate"
                    onValueChange={(val) =>
                      setValue('audience.experience', val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Purchase Behavior</Label>
                  <Select
                    defaultValue="first-time"
                    onValueChange={(val) =>
                      setValue('audience.purchaseBehavior', val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first-time">First-time buyer</SelectItem>
                      <SelectItem value="repeat">Repeat customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Lexical Complexity</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Slider
                        defaultValue={[watch('complexity')]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={(val) => setValue('complexity', val[0])}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>1: Simple, 3: Intermediate, 5: Advanced</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-2">
                <Label>Text Length</Label>
                <Select
                  defaultValue={watch('length')}
                  onValueChange={(val) => setValue('length', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (250 words)</SelectItem>
                    <SelectItem value="medium">Medium (500 words)</SelectItem>
                    <SelectItem value="long">Long (1000+ words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="bg-slate-950 w-full" disabled={isGenerating}>
              <Wand2 className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Content'}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!generatedContent}
              >
                Copy
              </Button>
            </div>
            <div className="min-h-[400px] p-4 rounded-md bg-muted">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-pulse">Generating content...</div>
                </div>
              ) : (
                <div className="prose prose-sm whitespace-pre-line">
                  {generatedContent || 'Generated content will appear here'}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

