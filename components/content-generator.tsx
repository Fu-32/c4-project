"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Wand2, Upload, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

const templateOptions = [
  {
    value: "blog",
    label: "Blog Post",
    emoji: "📝",
    description: "Long-form articles with SEO optimization",
  },
  {
    value: "social",
    label: "Social Media",
    emoji: "📱",
    description: "Engaging posts for social platforms",
  },
  {
    value: "email",
    label: "Email Campaign",
    emoji: "📧",
    description: "Compelling email marketing content",
  },
  {
    value: "landing",
    label: "Landing Page",
    emoji: "🎯",
    description: "Conversion-focused page content",
  },
];

const personalityStyles = [
  {
    value: "steve-jobs",
    name: "Steve Jobs",
    image:
      "https://media.licdn.com/dms/image/v2/C4E03AQGU6Y0AOGqTdQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1644504735058?e=1742428800&v=beta&t=AbG0Hzl1dZlyXpI63fSTRQzeY_WDIYPi3kinNwzEMBg",
    description: "Visionary and persuasive",
  },
  {
    value: "sam-altman",
    name: "Sam Altman",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=faces&q=80",
    description: "Analytical and forward-thinking",
  },
  {
    value: "shreyas",
    name: "Shreyas Doshi",
    image:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=50&h=50&fit=crop&crop=faces&q=80",
    description: "Product-focused and strategic",
  },
  {
    value: "pg",
    name: "Paul Graham",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=faces&q=80",
    description: "Insightful and analytical",
  },
  {
    value: "naval",
    name: "Naval Ravikant",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=faces&q=80",
    description: "Philosophical and concise",
  },
];

// 1. Définir l'interface du formulaire pour inclure TOUS les champs nécessaires
interface ContentGeneratorFormValues {
  template: string;       // si l'on souhaite récupérer la sélection du template
  personality: string;    // si l'on souhaite récupérer la sélection de la personnalité
  context: string;
  keywords: string;
  audience: string;
  complexity: number;
  ctaIntegration: number;
  tone: string;
  length: string;
}

export default function ContentGenerator() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 2. Utiliser l'interface ci-dessus et inclure tous les champs dans defaultValues
  const { register, handleSubmit, setValue, watch } =
    useForm<ContentGeneratorFormValues>({
      defaultValues: {
        template: "blog",
        personality: "steve-jobs",
        context: "",
        keywords: "",
        audience: "",
        complexity: 3,
        ctaIntegration: 50,
        tone: "professional",
        length: "medium",
      },
    });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} has been selected`,
        duration: 3000,
      });
    } else if (file) {
      toast({
        title: "Invalid file type",
        description: "Please upload only PDF files",
        duration: 3000,
        variant: "destructive",
      });
    }
  };
// ----------- AJOUT DE CETTE FONCTION D’APPEL API -----------
const callChatGPT = async (data: ContentGeneratorFormValues) => {
  const payload = {
    context: data.context,
    tone: data.tone,
    audience: data.audience,
    keywords: data.keywords.split(",").map(k => k.trim()), // Nettoyage des mots-clés
    complexity: data.complexity,
    ctaIntegration: data.ctaIntegration,
    length: data.length,
    template: data.template,
    personality: data.personality,
    // Ajoute ici tout autre paramètre à transmettre à l’API
  };
  
  console.log("Données envoyées à l'API :", payload); // Vérification

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    const result = await res.json();
    return result.text;
  } catch (error: any) {
    console.error("Error calling ChatGPT API:", error);
    throw error;
  }
};

  const onSubmit: SubmitHandler<ContentGeneratorFormValues> = async (data) => {
    setIsGenerating(true);
    toast({
      title: "Generating content...",
      description: "Please wait while we process your request.",
      duration: 3000,
    });


    try {
      // On appelle la fonction qui va ping l'API
      const generatedText = await callChatGPT(data);
      setGeneratedContent(generatedText);
      
      toast({
        title: "Content generated!",
        description: "Your content is ready.",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Generation error",
        description: "Something went wrong. Check console for details.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
      duration: 3000,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Content Generator</h1>
        <p className="text-muted-foreground">
          Generate high-quality content with customizable parameters
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr,400px]">
        <Card className="p-6 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select
                  // 3. Pour lier le Select au react-hook-form, on utilise onValueChange + setValue
                  defaultValue={watch("template")}
                  onValueChange={(val) => setValue("template", val)}
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
                          <div>
                            <p className="font-medium">{template.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="coming-soon" disabled>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Plus className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Add Template</p>
                          <p className="text-xs">Coming Soon</p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Personality Style</Label>
                <Select
                  defaultValue={watch("personality")}
                  onValueChange={(val) => setValue("personality", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {personalityStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        <div className="flex items-center gap-2">
                          <div className="relative w-6 h-6 overflow-hidden rounded-full flex-shrink-0">
                            <Image
                              src={style.image}
                              alt={style.name}
                              width={24}
                              height={24}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
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
                    // 4. On enregistre correctement le champ 'context'
                    {...register("context")}
                  />
                </div>
                <div className="space-y-2">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center bg-background">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="cursor-pointer space-y-2 block"
                    >
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Upload PDF document
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedFile
                            ? selectedFile.name
                            : "Only PDF files are supported"}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Keywords</Label>
              <Input
                placeholder="Enter keywords separated by commas"
                {...register("keywords")}
              />
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Input
                placeholder="Describe your target audience"
                {...register("audience")}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tone</Label>
                {/* 5. On utilise onValueChange + setValue pour lier le RadioGroup à RHF */}
                <RadioGroup
                  defaultValue={watch("tone")}
                  onValueChange={(val) => setValue("tone", val)}
                  className="grid grid-cols-2 gap-4"
                >
                  {["formal", "informal", "humorous", "professional"].map(
                    (tone) => (
                      <div key={tone} className="flex items-center space-x-2">
                        <RadioGroupItem value={tone} id={tone} />
                        <Label htmlFor={tone} className="capitalize">
                          {tone}
                        </Label>
                      </div>
                    )
                  )}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Lexical Complexity</Label>
                <TooltipProvider>
                  <Tooltip>
                    {/* 6. Retirer {...register("complexity")} et utiliser onValueChange */}
                    <TooltipTrigger asChild>
                      <Slider
                        defaultValue={[watch("complexity")]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={(val) => setValue("complexity", val[0])}
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
                <RadioGroup
                  defaultValue={watch("length")}
                  onValueChange={(val) => setValue("length", val)}
                  className="grid grid-cols-3 gap-4"
                >
                  {[
                    { value: "short", label: "Short (250)" },
                    { value: "medium", label: "Medium (500)" },
                    { value: "long", label: "Long (1000+)" },
                  ].map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={value} />
                      <Label htmlFor={value}>{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>CTA Integration</Label>
                <TooltipProvider>
                  <Tooltip>
                    {/* 7. Même correction que pour complexity */}
                    <TooltipTrigger asChild>
                      <Slider
                        defaultValue={[watch("ctaIntegration")]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(val) => setValue("ctaIntegration", val[0])}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Adjust the level of call-to-action integration (0-100%)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isGenerating}>
              <Wand2 className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Content"}
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
                <div className="prose prose-sm">
                  {generatedContent || "Generated content will appear here"}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}