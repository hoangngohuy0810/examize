'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, GripVertical, ImageUp, Star, Sparkles, Loader2, Images, RefreshCw, Bot, BrainCircuit, Save, FilePlus, Settings2, User, Mic, Eye, HelpCircle, Printer, Upload, BookOpenCheck, Shuffle, Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { editImage } from '@/ai/flows/edit-image-flow';
import { useToast } from '@/hooks/use-toast';
import { generateStoryboard, generateSingleImage, generateCharacterImage } from '@/ai/flows/generate-storyboard-flow';
import { concretizeImagePrompts } from '@/ai/flows/concretize-image-prompts-flow';
import { generateReadingPassage } from '@/ai/flows/generate-reading-passage-flow';
import { generateQuestions, type GeneratedQuestion } from '@/ai/flows/generate-questions-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { saveTest, getTestById, type TestData } from '@/services/test-storage';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KNOWLEDGE_BASES, getCumulativeKnowledge, getCurrentUnitKnowledge, type KnowledgeUnit } from '@/lib/knowledge-base';
import { shuffleWords } from '@/ai/flows/shuffle-words-flow';
import { speechToText } from '@/ai/flows/speech-to-text-flow';

type QuestionType = 'mcq' | 'mcq-image' | 'fib' | 'true-false' | 'write-the-word' | 'writing-fill-in-word' | 'writing-order-words' | 'writing-paragraph' | 'speaking-qa';

// Mock data structures
interface Option {
  id: number;
  text: string;
  isCorrect: boolean;
  description: string;
  imageUrl?: string;
  imagePrompt?: string;
}

interface ImageItem {
  id: number;
  imageUrl?: string;
}

interface SubQuestion {
  id: number;
  text: string;
  answer: string;
  imageIndex?: number; // Optional index to link to an image in ImageItem[]
}

interface Question {
  id: number;
  type: QuestionType;
  text: string;
  textAfter?: string; // For write-the-word
  answer?: string; // For write-the-word and fib
  options: Option[];
  isExample?: boolean;
  isTrue?: boolean; // For true-false
  images?: ImageItem[]; // For writing-fill-in-word
  subQuestions?: SubQuestion[]; // For writing-fill-in-word
  disorderedWords?: string; // For writing-order-words
  imageUrl?: string; // For speaking-qa
  referenceAnswer?: string; // For speaking-qa
}

interface Part {
  id: number;
  title: string;
  passage?: string;
  audioUrl?: string; // For listening parts
  questions: Question[];
}

interface Section {
  id: 'listening' | 'reading' | 'writing' | 'speaking';
  title: string;
  parts: Part[];
}

const PREBUILT_VOICES_WITH_DESC = [
    { voice: 'achernar', gender: 'Nữ', description: 'Giọng nữ, rõ ràng, thân thiện' },
    { voice: 'algenib', gender: 'Nam', description: 'Giọng nam, trầm ấm, chuyên nghiệp' },
    { voice: 'algieba', gender: 'Nam', description: 'Giọng nam, tự nhiên, kể chuyện' },
    { voice: 'alnilam', gender: 'Nữ', description: 'Giọng nữ, tự nhiên, kể chuyện' },
    { voice: 'aoede', gender: 'Nữ', description: 'Giọng nữ, nhẹ nhàng, du dương' },
    { voice: 'autonoe', gender: 'Nam', description: 'Giọng nam, trẻ trung, năng động' },
    { voice: 'callirrhoe', gender: 'Nữ', description: 'Giọng nữ, thanh lịch, tinh tế' },
    { voice: 'charon', gender: 'Nam', description: 'Giọng nam, mạnh mẽ, truyền cảm' },
    { voice: 'despina', gender: 'Nữ', description: 'Giọng nữ, vui vẻ, hoạt bát' },
    { voice: 'erinome', gender: 'Nam', description: 'Giọng nam, trưởng thành, đáng tin cậy' },
    { voice: 'gacrux', gender: 'Nam', description: 'Giọng nam, ấm áp, sâu lắng' },
    { voice: 'kore', gender: 'Nữ', description: 'Giọng nữ, chuyên nghiệp, thông báo' },
    { voice: 'laomedeia', gender: 'Nữ', description: 'Giọng nữ, dịu dàng, truyền cảm' },
    { voice: 'puck', gender: 'Nam', description: 'Giọng nam, vui vẻ, hài hước' },
    { voice: 'sadachbia', gender: 'Nữ', description: 'Giọng nữ, trung tính, rõ ràng' },
    { voice: 'zubenelgenubi', gender: 'Nam', description: 'Giọng nam, rõ ràng, tin cậy' },
];


const initialSections: Section[] = [
  {
    id: 'listening',
    title: 'Phần nghe (Listening)',
    parts: [],
  },
  { id: 'reading', title: 'Phần đọc (Reading)', parts: [] },
  { id: 'writing', title: 'Phần viết (Writing)', parts: [] },
  { id: 'speaking', title: 'Phần nói (Speaking)', parts: [] },
];

function McqOptionEditor({ option, isExample, onOptionChange, onDeleteImage }: { option: Option, isExample?: boolean, onOptionChange: (updatedOption: Partial<Option>) => void, onDeleteImage: () => void }) {
    const [isAiEditorOpen, setIsAiEditorOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const { toast } = useToast();

    const handleGenerateImage = async () => {
        if (!aiPrompt || !option.imageUrl) return;
        setIsGenerating(true);
        setGeneratedImage(null);
        try {
            const result = await editImage({
                image: option.imageUrl,
                prompt: aiPrompt,
            });
            if (result.editedImage) {
                 setGeneratedImage(result.editedImage);
            } else {
                throw new Error("Không thể tạo ảnh.");
            }
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: 'Đã có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại.',
            });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleUseGeneratedImage = () => {
        if (generatedImage) {
            onOptionChange({ imageUrl: generatedImage });
            setIsAiEditorOpen(false);
            setGeneratedImage(null);
            setAiPrompt('');
        }
    };

    return (
      <>
        <div className="flex flex-col items-center gap-2">
            <div className="relative group w-32 h-32 rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50 hover:border-primary transition-colors">
                {option.imageUrl ? (
                    <>
                        <Image src={option.imageUrl} alt={`Option ${option.description}`} width={128} height={128} className="object-cover rounded-md w-full h-full" data-ai-hint="cake ingredients" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                                <ImageUp className="h-6 w-6"/>
                            </Button>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsAiEditorOpen(true)}>
                                <Sparkles className="h-5 w-5"/>
                            </Button>
                             <Button variant="ghost" size="icon" className="text-destructive hover:bg-white/20" onClick={onDeleteImage}>
                                <Trash2 className="h-5 w-5"/>
                            </Button>
                        </div>
                    </>
                ) : (
                    <Button variant="ghost" className="text-muted-foreground flex-col h-full w-full">
                        <ImageUp className="h-8 w-8"/>
                        <span className="text-xs mt-1">Tải ảnh lên</span>
                    </Button>
                )}
            </div>
             <div className="flex flex-col gap-1 w-40">
                <div className="flex items-center gap-2">
                    <Checkbox id={`option-correct-${option.id}`} checked={option.isCorrect} disabled={isExample} onCheckedChange={(checked) => onOptionChange({ isCorrect: !!checked })} />
                    <Label htmlFor={`option-correct-${option.id}`} className="font-bold">{option.text}</Label>
                     <Input 
                        placeholder="Đáp án..." 
                        value={option.description || ''} 
                        onChange={(e) => onOptionChange({ description: e.target.value })}
                        className="text-xs h-7 flex-1"
                     />
                </div>
                 <Textarea
                    placeholder="Mô tả ảnh cho AI..." 
                    value={option.imagePrompt || ''} 
                    onChange={(e) => onOptionChange({ imagePrompt: e.target.value })}
                    className="text-xs h-14"
                />
            </div>
        </div>
        <Dialog open={isAiEditorOpen} onOpenChange={setIsAiEditorOpen}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa ảnh bằng AI</DialogTitle>
                    <DialogDescription>
                        Mô tả thay đổi bạn muốn áp dụng cho hình ảnh.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 py-4">
                     <div className="space-y-4">
                        <div className="space-y-2">
                             <Label htmlFor="ai-prompt">Yêu cầu chỉnh sửa</Label>
                             <Textarea 
                                id="ai-prompt" 
                                placeholder="ví dụ: biến quả táo thành quả cam" 
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="h-24"
                            />
                        </div>
                        <Button onClick={handleGenerateImage} disabled={isGenerating || !aiPrompt}>
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tạo ảnh
                        </Button>
                        <div className="mt-4">
                             <p className="text-sm text-muted-foreground mb-2">Ảnh gốc:</p>
                             {option.imageUrl && <Image src={option.imageUrl} alt="Ảnh gốc" width={300} height={300} className="rounded-md border" />}
                        </div>
                    </div>
                     <div className="flex flex-col items-center justify-center space-y-4">
                        <p className="text-sm text-muted-foreground">Kết quả:</p>
                        <div className="w-[300px] h-[300px] rounded-md border-2 border-dashed bg-muted/50 flex items-center justify-center">
                            {isGenerating && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                            {!isGenerating && generatedImage && <Image src={generatedImage} alt="Ảnh đã tạo" width={300} height={300} className="rounded-md object-cover" />}
                             {!isGenerating && !generatedImage && <p className="text-sm text-muted-foreground">Kết quả sẽ hiện ở đây</p>}
                        </div>
                         {generatedImage && !isGenerating && (
                            <Button onClick={handleUseGeneratedImage} className="w-full">
                                Sử dụng ảnh này
                            </Button>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAiEditorOpen(false)}>Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
    );
}

function StoryboardGenerator({ question, onImagesGenerated, onImagePromptsChange }: { question: Question, onImagesGenerated: (images: string[]) => void, onImagePromptsChange: (prompts: string[]) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
    const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
    const [isConcretizing, setIsConcretizing] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState<number | null>(null);

    const [characterPrompt, setCharacterPrompt] = useState('');
    const [createWithCharacter, setCreateWithCharacter] = useState(false);
    
    const [characterImage, setCharacterImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    
    const { toast } = useToast();

    const handleGenerateCharacter = async () => {
        if (!characterPrompt) {
            toast({ variant: 'destructive', title: 'Thiếu mô tả', description: 'Vui lòng nhập mô tả cho nhân vật.' });
            return;
        }
        setIsGeneratingCharacter(true);
        setCharacterImage(null);
        try {
            const result = await generateCharacterImage({ characterPrompt });
            if (result.image) {
                setCharacterImage(result.image);
            } else {
                throw new Error("Không thể tạo ảnh nhân vật.");
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Đã có lỗi xảy ra khi tạo ảnh nhân vật.' });
        } finally {
            setIsGeneratingCharacter(false);
        }
    };

    const handleConcretize = async () => {
        setIsConcretizing(true);
        try {
            const prompts = question.options.map(o => o.imagePrompt || '');
            if (prompts.some(p => !p)) {
                toast({ variant: 'destructive', title: 'Thiếu mô tả', description: 'Vui lòng nhập mô tả ảnh cho AI cho tất cả các lựa chọn.' });
                setIsConcretizing(false);
                return;
            }
            const result = await concretizeImagePrompts({ prompts });
            if (result.concretizedPrompts) {
                onImagePromptsChange(result.concretizedPrompts);
                toast({ title: 'Thành công', description: 'Đã cụ thể hóa các mô tả. Bạn có thể chỉnh sửa lại trước khi tạo ảnh.' });
            } else {
                 throw new Error("Không thể cụ thể hóa mô tả.");
            }
        } catch (error) {
             console.error(error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Đã có lỗi xảy ra khi cụ thể hóa mô tả.' });
        } finally {
            setIsConcretizing(false);
        }
    }

    const handleGenerateStoryboard = async () => {
        setIsGeneratingStoryboard(true);
        setGeneratedImages([]);
        try {
            const frames = question.options.map(o => o.imagePrompt || '');
            if (frames.some(f => !f)) {
                toast({ variant: 'destructive', title: 'Thiếu mô tả', description: 'Vui lòng nhập mô tả ảnh cho AI cho tất cả các lựa chọn.' });
                setIsGeneratingStoryboard(false);
                return;
            }

            const result = await generateStoryboard({ 
                characterImage: createWithCharacter ? characterImage ?? undefined : undefined, 
                frames 
            });

            if (result.images && result.images.length > 0) {
                setGeneratedImages(result.images);
            } else {
                throw new Error("Không thể tạo ảnh hàng loạt.");
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Đã có lỗi xảy ra khi tạo ảnh hàng loạt.' });
        } finally {
            setIsGeneratingStoryboard(false);
        }
    };
    
    const handleRegenerateOne = async (index: number) => {
        const framePrompt = question.options[index]?.imagePrompt;
        if (!framePrompt) return;

        setIsRegenerating(index);
        try {
            const result = await generateSingleImage({ 
                characterImage: createWithCharacter ? characterImage ?? undefined : undefined,
                framePrompt 
            });
            if (result.image) {
                setGeneratedImages(currentImages => {
                    const newImages = [...currentImages];
                    newImages[index] = result.image;
                    return newImages;
                });
            } else {
                throw new Error("Không thể tạo lại ảnh.");
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Đã có lỗi xảy ra khi tạo lại ảnh.' });
        } finally {
            setIsRegenerating(null);
        }
    };

    const handleUseImages = () => {
        onImagesGenerated(generatedImages);
        setIsOpen(false);
        setGeneratedImages([]);
        setCharacterImage(null);
    };
    
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset state on close
            setCreateWithCharacter(false);
            setCharacterPrompt('');
            setCharacterImage(null);
            setGeneratedImages([]);
        }
    };

    const isGenerating = isGeneratingCharacter || isGeneratingStoryboard || isRegenerating !== null || isConcretizing;

    return (
        <TooltipProvider>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                <Images className="h-4 w-4 mr-2" />
                Tạo ảnh hàng loạt
            </Button>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Tạo ảnh hàng loạt bằng AI</DialogTitle>
                        <DialogDescription>
                            Tạo một loạt ảnh nhất quán cho các lựa chọn của câu hỏi.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="with-character" 
                                checked={createWithCharacter} 
                                onCheckedChange={(checked) => setCreateWithCharacter(!!checked)} 
                            />
                            <Label htmlFor="with-character">Tạo ảnh có người</Label>
                        </div>
                        
                        {createWithCharacter && (
                            <Card className="p-4 bg-muted/50">
                                <CardHeader className="p-0 pb-4">
                                     <CardTitle className="text-lg">Bước 1: Tạo nhân vật</CardTitle>
                                     <CardDescription>Mô tả nhân vật chính để AI tạo hình ảnh gốc.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="character-prompt">Mô tả nhân vật</Label>
                                        <Textarea 
                                            id="character-prompt"
                                            placeholder="ví dụ: 'một cô bé tóc vàng mặc váy đỏ', 'một cậu bé tinh nghịch với mái tóc xoăn'..."
                                            value={characterPrompt}
                                            onChange={(e) => setCharacterPrompt(e.target.value)}
                                            className="h-24 bg-background"
                                        />
                                        <Button onClick={handleGenerateCharacter} disabled={isGeneratingCharacter || !characterPrompt}>
                                            {isGeneratingCharacter && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Tạo nhân vật
                                        </Button>
                                    </div>
                                    <div className="flex-shrink-0 w-full md:w-48 h-48 rounded-md border-2 border-dashed bg-muted flex items-center justify-center">
                                         {isGeneratingCharacter && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                                         {!isGeneratingCharacter && characterImage && <Image src={characterImage} alt="Ảnh nhân vật đã tạo" width={192} height={192} className="rounded-md object-cover w-full h-full" />}
                                         {!isGeneratingCharacter && !characterImage && <p className="text-xs text-muted-foreground text-center p-2">Ảnh nhân vật sẽ hiện ở đây</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        <Card className="p-4">
                             <CardHeader className="p-0 pb-4">
                                <CardTitle className="text-lg">{createWithCharacter ? 'Bước 2: Tạo ảnh hàng loạt' : 'Tạo ảnh hàng loạt'}</CardTitle>
                                <CardDescription>
                                    {createWithCharacter 
                                        ? 'Sử dụng nhân vật đã tạo và mô tả ảnh cho AI để tạo các ảnh cho từng đáp án.' 
                                        : 'Sử dụng mô tả ảnh cho AI để tạo các ảnh minh họa cho từng đáp án.'
                                    }
                                </CardDescription>
                            </CardHeader>
                             <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1 space-y-4">
                                       <p className="font-medium">Mô tả ảnh cho AI:</p>
                                       <div className="space-y-2">
                                       {question.options.map((opt) => (
                                            <div key={opt.id} className="flex items-start gap-2">
                                                <span className="font-bold pt-1">{opt.text}.</span>
                                                <p className="text-sm text-muted-foreground flex-1">{opt.imagePrompt || "Chưa có mô tả"}</p>
                                            </div>
                                        ))}
                                        </div>
                                        <div className='bg-muted/70 p-2 rounded-md space-y-2'>
                                             <div className='flex items-center gap-1.5'>
                                                <HelpCircle className='h-4 w-4 text-muted-foreground'/>
                                                <p className="text-xs text-muted-foreground">Để có kết quả tốt hơn, hãy cụ thể hóa mô tả trước.</p>
                                             </div>
                                            <div className="flex gap-2">
                                                <Button onClick={handleConcretize} disabled={isGenerating} size="sm" className="flex-1">
                                                    {isConcretizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1" />1. Concretize</>}
                                                </Button>
                                                <Button onClick={handleGenerateStoryboard} disabled={isGenerating || (createWithCharacter && !characterImage)} size="sm" className="flex-1">
                                                    {isGeneratingStoryboard ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Images className="h-4 w-4 mr-1" />2. Batch create</>}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="font-medium mb-2">Kết quả:</p>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                            {isGeneratingStoryboard && Array.from({ length: question.options.length }).map((_, i) => (
                                                <div key={i} className="aspect-square w-full rounded-md border-2 border-dashed bg-muted/50 flex items-center justify-center">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                </div>
                                            ))}
                                            {!isGeneratingStoryboard && generatedImages.map((imgSrc, index) => (
                                                 <div key={index} className="relative group aspect-square">
                                                    <Image src={imgSrc} alt={`Ảnh đã tạo ${index + 1}`} width={200} height={200} className="rounded-md object-cover w-full h-full" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-white hover:bg-white/20"
                                                                    onClick={() => handleRegenerateOne(index)}
                                                                    disabled={isGenerating}
                                                                >
                                                                    {isRegenerating === index ? (
                                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                                    ) : (
                                                                        <RefreshCw className="h-5 w-5" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Tạo lại ảnh này</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                     {isRegenerating === index && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                                                             <Loader2 className="h-8 w-8 animate-spin text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {!isGeneratingStoryboard && generatedImages.length === 0 && (
                                                <div className="col-span-full text-center text-muted-foreground py-10">
                                                    <p>Kết quả sẽ hiện ở đây</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <DialogFooter>
                        {generatedImages.length > 0 && !isGenerating && (
                            <Button onClick={handleUseImages}>
                                Sử dụng các ảnh này
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}

function WriteTheWordEditor({ question, onQuestionChange }: { question: Question, onQuestionChange: (updatedQuestion: Partial<Question>) => void }) {
    return (
        <div className="pl-8 space-y-2">
            <Label className="text-xs text-muted-foreground">Nội dung câu hỏi và đáp án</Label>
            <div className="flex items-center gap-2">
                <Textarea 
                    placeholder="Phần đầu câu..."
                    value={question.text}
                    onChange={(e) => onQuestionChange({ text: e.target.value })}
                    className="flex-1 bg-background"
                    rows={1}
                />
                <div className="flex flex-col items-center">
                    <Input 
                        placeholder="Đáp án"
                        value={question.answer || ''}
                        onChange={(e) => onQuestionChange({ answer: e.target.value })}
                        className="w-32 text-center border-primary border-2 font-bold"
                    />
                     <div className="w-24 h-[2px] bg-primary mt-1"></div>
                </div>
                <Textarea 
                    placeholder="Phần cuối câu..."
                    value={question.textAfter || ''}
                    onChange={(e) => onQuestionChange({ textAfter: e.target.value })}
                    className="flex-1 bg-background"
                    rows={1}
                />
            </div>
        </div>
    )
}

function TrueFalseEditor({ question, onAnswerChange }: { question: Question, onAnswerChange: (isTrue: boolean) => void }) {
    return (
        <div className="pl-8 flex gap-4">
            <div className='flex items-center gap-2'>
                <Checkbox id={`true-${question.id}`} checked={question.isTrue === true} onCheckedChange={() => onAnswerChange(true)} />
                <Label htmlFor={`true-${question.id}`}>Đúng (True)</Label>
            </div>
             <div className='flex items-center gap-2'>
                <Checkbox id={`false-${question.id}`} checked={question.isTrue === false} onCheckedChange={() => onAnswerChange(false)} />
                <Label htmlFor={`false-${question.id}`}>Sai (False)</Label>
            </div>
        </div>
    );
}

function AiImageGenerator({ onImageGenerated }: { onImageGenerated: (imageUrl: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!prompt) {
            toast({ variant: 'destructive', title: 'Thiếu mô tả', description: 'Vui lòng nhập mô tả cho ảnh.' });
            return;
        }
        setIsGenerating(true);
        setGeneratedImage(null);
        try {
            const result = await generateSingleImage({ framePrompt: prompt });
            if (result.image) {
                setGeneratedImage(result.image);
            } else {
                throw new Error("Không thể tạo ảnh.");
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Đã có lỗi xảy ra khi tạo ảnh.' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseImage = () => {
        if (generatedImage) {
            onImageGenerated(generatedImage);
            setIsOpen(false);
            setPrompt('');
            setGeneratedImage(null);
        }
    };

    return (
        <>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsOpen(true)}>
                <Sparkles className="h-5 w-5" />
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo ảnh minh họa bằng AI</DialogTitle>
                        <DialogDescription>Mô tả hình ảnh bạn muốn tạo.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Textarea
                            placeholder="ví dụ: một con mèo đang ngồi trên ghế"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="h-24"
                        />
                        <Button onClick={handleGenerate} disabled={isGenerating || !prompt}>
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tạo ảnh
                        </Button>
                        <div className="w-full aspect-square rounded-md border-2 border-dashed bg-muted/50 flex items-center justify-center mt-4">
                            {isGenerating && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                            {!isGenerating && generatedImage && <Image src={generatedImage} alt="Ảnh đã tạo" width={400} height={400} className="rounded-md object-cover" />}
                            {!isGenerating && !generatedImage && <p className="text-sm text-muted-foreground">Kết quả sẽ hiện ở đây</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
                        {generatedImage && !isGenerating && (
                            <Button onClick={handleUseImage}>Sử dụng ảnh này</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function WritingFillInWordEditor({ question, onSubQuestionChange, onImageChange, onAddSubQuestion, onDeleteSubQuestion }: { 
    question: Question,
    onSubQuestionChange: (subQuestionId: number, updatedSubQuestion: Partial<SubQuestion>) => void,
    onImageChange: (imageId: number, imageUrl: string) => void,
    onAddSubQuestion: () => void,
    onDeleteSubQuestion: (subQuestionId: number) => void,
}) {
    const imageInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, imageId: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                onImageChange(imageId, imageUrl);
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div className="pl-8 space-y-4">
             <div>
                 <Label className="text-xs text-muted-foreground mb-2 block">Các câu hỏi con và hình ảnh</Label>
                 <div className="space-y-4">
                    {(question.subQuestions || []).map((sq, index) => {
                        const img = (question.images || []).find(i => i.id === sq.id);
                        return (
                            <div key={sq.id} className="flex items-start gap-4 p-3 bg-secondary/50 rounded-md">
                                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                     <span className="font-semibold text-sm">{index + 1}.</span>
                                     <div className="relative group w-32 h-32 rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50 hover:border-primary transition-colors">
                                        <input
                                            type="file"
                                            ref={el => imageInputRefs.current[index] = el}
                                            onChange={(e) => handleImageUpload(e, sq.id)}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        {img?.imageUrl ? (
                                            <>
                                                <Image src={img.imageUrl} alt={`Illustration ${index+1}`} layout="fill" className="object-cover rounded-md" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => imageInputRefs.current[index]?.click()}>
                                                        <ImageUp className="h-6 w-6"/>
                                                    </Button>
                                                    <AiImageGenerator onImageGenerated={(newUrl) => onImageChange(sq.id, newUrl)} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full w-full">
                                                <Button variant="ghost" className="text-muted-foreground flex-col h-full w-full" onClick={() => imageInputRefs.current[index]?.click()}>
                                                    <ImageUp className="h-8 w-8"/>
                                                    <span className="text-xs mt-1">Tải ảnh lên</span>
                                                </Button>
                                                <AiImageGenerator onImageGenerated={(newUrl) => onImageChange(sq.id, newUrl)} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label className="text-xs text-muted-foreground">Nội dung câu hỏi</Label>
                                    <Textarea 
                                        placeholder="Nội dung câu hỏi..."
                                        value={sq.text}
                                        onChange={e => onSubQuestionChange(sq.id, { text: e.target.value })}
                                        className="flex-1 bg-background"
                                        rows={2}
                                    />
                                    <Label className="text-xs text-muted-foreground">Đáp án</Label>
                                    <Input 
                                        placeholder="Đáp án"
                                        value={sq.answer}
                                        onChange={e => onSubQuestionChange(sq.id, { answer: e.target.value })}
                                        className="w-full font-medium"
                                    />
                                </div>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0" onClick={() => onDeleteSubQuestion(sq.id)}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        )
                    })}
                     <Button variant="link" size="sm" className="p-0 h-auto" onClick={onAddSubQuestion}>
                        <PlusCircle className="h-4 w-4 mr-1"/>
                        Thêm câu hỏi con
                    </Button>
                 </div>
            </div>
        </div>
    )
}

function WritingOrderWordsEditor({ question, onQuestionChange }: { question: Question, onQuestionChange: (updatedQuestion: Partial<Question>) => void }) {
    const [isShuffling, setIsShuffling] = useState(false);
    const { toast } = useToast();

    const handleShuffle = async () => {
        if (!question.answer) {
            toast({ variant: 'destructive', title: 'Thiếu đáp án', description: 'Vui lòng nhập đáp án đúng trước khi xáo trộn.' });
            return;
        }
        setIsShuffling(true);
        try {
            const result = await shuffleWords({ sentence: question.answer });
            if (result.shuffledSentence) {
                onQuestionChange({ disorderedWords: result.shuffledSentence });
            } else {
                throw new Error("Không thể xáo trộn từ.");
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Đã có lỗi xảy ra khi xáo trộn từ.' });
        } finally {
            setIsShuffling(false);
        }
    }

    return (
        <div className="pl-8 space-y-3">
            <div>
                <Label className="text-xs text-muted-foreground">Đáp án đúng</Label>
                <div className="flex items-center gap-2">
                    <Input 
                        placeholder="ví dụ: I go to school."
                        value={question.answer || ''}
                        onChange={(e) => onQuestionChange({ answer: e.target.value })}
                        className="bg-background font-medium"
                    />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={handleShuffle} disabled={isShuffling}>
                                    {isShuffling ? <Loader2 className="h-4 w-4 animate-spin"/> : <Shuffle className="h-4 w-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Xáo trộn bằng AI</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
             <div>
                <Label className="text-xs text-muted-foreground">Các từ bị xáo trộn (phân tách bằng dấu / )</Label>
                <Input 
                    placeholder="ví dụ: go / I / school / to"
                    value={question.disorderedWords || ''}
                    onChange={(e) => onQuestionChange({ disorderedWords: e.target.value })}
                    className="bg-background"
                />
            </div>
        </div>
    )
}

function WritingParagraphEditor({ question, onQuestionChange }: { question: Question, onQuestionChange: (updatedQuestion: Partial<Question>) => void }) {
    return (
        <div className="pl-8 space-y-2">
            <Label className="text-xs text-muted-foreground">Yêu cầu của đề bài</Label>
             <Textarea 
                placeholder="ví dụ: Write a paragraph about meals in your family. (about 50 words)"
                value={question.text}
                onChange={(e) => onQuestionChange({ text: e.target.value })}
                className="bg-background"
                rows={3}
            />
        </div>
    )
}

function SpeakingQAEditor({ question, onQuestionChange }: { question: Question, onQuestionChange: (updatedQuestion: Partial<Question>) => void }) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                onQuestionChange({ imageUrl });
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div className="pl-8 space-y-4">
             <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-2">
                     <Label className="text-xs text-muted-foreground">Hình ảnh minh họa (tùy chọn)</Label>
                    <div className="relative group w-32 h-32 rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50 hover:border-primary transition-colors">
                        <input
                            type="file"
                            ref={imageInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        {question.imageUrl ? (
                            <>
                                <Image src={question.imageUrl} alt={`Speaking illustration`} layout="fill" className="object-cover rounded-md" />
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => imageInputRef.current?.click()}>
                                        <ImageUp className="h-6 w-6"/>
                                    </Button>
                                     <Button variant="ghost" size="icon" className="text-destructive hover:bg-white/20" onClick={() => onQuestionChange({ imageUrl: undefined })}>
                                        <Trash2 className="h-5 w-5"/>
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Button variant="ghost" className="text-muted-foreground flex-col h-full w-full" onClick={() => imageInputRef.current?.click()}>
                                <ImageUp className="h-8 w-8"/>
                                <span className="text-xs mt-1">Tải ảnh lên</span>
                            </Button>
                        )}
                    </div>
                </div>
                 <div className="flex-1 space-y-2">
                    <Label htmlFor={`ref-answer-${question.id}`} className="text-xs text-muted-foreground">Gợi ý đáp án</Label>
                    <Textarea
                        id={`ref-answer-${question.id}`}
                        placeholder="Nhập câu trả lời mẫu hoặc các từ khóa quan trọng để AI dựa vào đó chấm điểm..."
                        value={question.referenceAnswer || ''}
                        onChange={(e) => onQuestionChange({ referenceAnswer: e.target.value })}
                        className="bg-background h-32"
                    />
                </div>
            </div>
        </div>
    )
}

function QuestionEditor({ question, onDelete, onQuestionChange, onOptionChange, onAddOption, onOptionDeleteImage, onImagesGenerated, onImagePromptsChange, onSubQuestionChange, onImageChange, onAddSubQuestion, onDeleteSubQuestion }: { 
    question: Question, 
    onDelete: () => void, 
    onQuestionChange: (updatedQuestion: Partial<Question>) => void, 
    onOptionChange: (optionId: number, updatedOption: Partial<Option>) => void, 
    onAddOption: () => void, 
    onOptionDeleteImage: (optionId: number) => void, 
    onImagesGenerated: (images: string[]) => void, 
    onImagePromptsChange: (prompts: string[]) => void,
    onSubQuestionChange: (subQuestionId: number, updatedSubQuestion: Partial<SubQuestion>) => void,
    onImageChange: (imageId: number, imageUrl: string) => void,
    onAddSubQuestion: () => void,
    onDeleteSubQuestion: (subQuestionId: number) => void,
}) {

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onQuestionChange({ text: e.target.value });
    }
    
    const handleTrueFalseChange = (isTrue: boolean) => {
        onQuestionChange({ isTrue });
    }

    const isImageMcq = question.type === 'mcq-image';

    return (
        <div className="p-3 bg-secondary/20 border-l-4 border-primary rounded-r-lg space-y-3">
            <div className='flex items-start gap-2'>
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mt-2" />

                <div className="flex-grow">
                    {(question.type !== 'writing-fill-in-word') && (
                        <>
                            <Label className="text-xs text-muted-foreground">Nội dung câu hỏi</Label>
                            <Textarea placeholder="Nhập nội dung câu hỏi..." value={question.text} onChange={handleTextChange} className="bg-background"/>
                        </>
                    )}
                     {(question.type === 'writing-fill-in-word') && (
                        <>
                         <Label className="text-xs text-muted-foreground">Yêu cầu chung (tùy chọn)</Label>
                         <Textarea placeholder="ví dụ: Look and write. There is one example." value={question.text} onChange={handleTextChange} className="bg-background" rows={2}/>
                        </>
                     )}
                </div>


                 <div className="flex flex-col gap-1 ml-auto">
                    {isImageMcq && (
                        <StoryboardGenerator question={question} onImagesGenerated={onImagesGenerated} onImagePromptsChange={onImagePromptsChange} />
                    )}
                     <div className="flex items-center space-x-2 self-end">
                        <Switch id={`example-switch-${question.id}`} checked={question.isExample} onCheckedChange={(checked) => onQuestionChange({ isExample: !!checked })} />
                        <Label htmlFor={`example-switch-${question.id}`} className='text-xs'>Mẫu</Label>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0 self-end" onClick={onDelete}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            </div>

            {(question.type === 'mcq' || isImageMcq) && (
                 <div className="pl-8 space-y-4">
                    {isImageMcq ? (
                      <div className="flex gap-4 items-start flex-wrap">
                          {question.options.map(option => (
                             <McqOptionEditor 
                                key={option.id} 
                                option={option} 
                                isExample={question.isExample}
                                onOptionChange={(updatedOption) => onOptionChange(option.id, updatedOption)}
                                onDeleteImage={() => onOptionDeleteImage(option.id)}
                              />
                          ))}
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        {question.options.map(option => (
                           <div key={option.id} className="flex items-center gap-2">
                             <Checkbox id={`option-correct-${option.id}`} checked={option.isCorrect} disabled={question.isExample} onCheckedChange={(checked) => onOptionChange(option.id, { isCorrect: !!checked })} />
                             <Label htmlFor={`option-correct-${option.id}`} className="font-bold w-6">{option.text}</Label>
                             <Input 
                                placeholder={`Nội dung đáp án ${option.text}...`}
                                value={option.description || ''} 
                                onChange={(e) => onOptionChange(option.id, { description: e.target.value })}
                                className="h-9"
                                />
                           </div>
                        ))}
                      </div>
                    )}
                    {!question.isExample && (
                      <Button variant="link" size="sm" className="p-0 h-auto" onClick={onAddOption}>
                          <PlusCircle className="h-4 w-4 mr-1"/>
                          Thêm lựa chọn
                      </Button>
                    )}
                 </div>
            )}
            
            {question.type === 'write-the-word' && (
                <WriteTheWordEditor question={question} onQuestionChange={onQuestionChange} />
            )}

            {question.type === 'fib' && (
                <div className="pl-8">
                    <Input 
                        placeholder="Nhập câu trả lời đúng" 
                        value={question.answer || ''}
                        onChange={(e) => onQuestionChange({ answer: e.target.value })}
                    />
                </div>
            )}

             {question.type === 'true-false' && (
                <TrueFalseEditor question={question} onAnswerChange={handleTrueFalseChange} />
            )}

             {question.type === 'writing-fill-in-word' && (
                <WritingFillInWordEditor 
                    question={question}
                    onSubQuestionChange={onSubQuestionChange}
                    onImageChange={onImageChange}
                    onAddSubQuestion={onAddSubQuestion}
                    onDeleteSubQuestion={onDeleteSubQuestion}
                />
            )}

             {question.type === 'writing-order-words' && (
                <WritingOrderWordsEditor question={question} onQuestionChange={onQuestionChange} />
            )}

             {question.type === 'writing-paragraph' && (
                <WritingParagraphEditor question={question} onQuestionChange={onQuestionChange} />
            )}

             {question.type === 'speaking-qa' && (
                <SpeakingQAEditor question={question} onQuestionChange={onQuestionChange} />
            )}
        </div>
    )
}

function AiPassageGenerator({ curriculumId, knowledgeUnitId, onPassageGenerated }: { curriculumId?: string, knowledgeUnitId?: string, onPassageGenerated: (passage: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [topic, setTopic] = useState('');
    const [length, setLength] = useState<'short' | 'medium' | 'long'>('short');
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!topic) {
            toast({ variant: 'destructive', title: 'Thiếu chủ đề', description: 'Vui lòng nhập chủ đề cho đoạn văn.' });
            return;
        }
        setIsGenerating(true);
        try {
            let knowledge;
            if(curriculumId && knowledgeUnitId) {
                const cumulative = getCumulativeKnowledge(curriculumId, knowledgeUnitId);
                const currentUnit = getCurrentUnitKnowledge(curriculumId, knowledgeUnitId);
                 knowledge = {
                    unitTitle: currentUnit?.title || '',
                    vocabulary: cumulative.vocabulary,
                    sentencePatterns: cumulative.sentencePatterns,
                    currentUnitVocabulary: currentUnit?.vocabulary || [],
                    currentUnitSentencePatterns: currentUnit?.sentencePatterns || [],
                };
            }
            const result = await generateReadingPassage({ topic, length, knowledge });
            if (result.passage) {
                onPassageGenerated(result.passage);
                setIsOpen(false);
                setTopic('');
            } else {
                throw new Error("Không thể tạo đoạn văn.");
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Đã có lỗi xảy ra khi tạo đoạn văn.' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Tạo đoạn văn bằng AI
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo đoạn văn bằng AI</DialogTitle>
                        <DialogDescription>
                            Mô tả chủ đề và độ dài để AI tạo ra một đoạn văn đọc hiểu phù hợp.
                             {knowledgeUnitId && <p className="text-primary font-medium mt-1">Dựa trên kiến thức của: {getCurrentUnitKnowledge(curriculumId!, knowledgeUnitId!)?.title}</p>}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="passage-topic">Chủ đề</Label>
                            <Input id="passage-topic" placeholder="ví dụ: sức khỏe, công việc, gia đình..." value={topic} onChange={(e) => setTopic(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="passage-length">Độ dài</Label>
                            <Select onValueChange={(value: any) => setLength(value)} defaultValue="short">
                                <SelectTrigger id="passage-length">
                                    <SelectValue placeholder="Chọn độ dài..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="short">Ngắn (~100 từ)</SelectItem>
                                    <SelectItem value="medium">Vừa (~150 từ)</SelectItem>
                                    <SelectItem value="long">Dài (~200 từ)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                             {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tạo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function AiQuestionGenerator({ passage, curriculumId, knowledgeUnitId, onQuestionsGenerated }: { passage: string, curriculumId?: string, knowledgeUnitId?: string, onQuestionsGenerated: (questions: GeneratedQuestion[]) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [questionType, setQuestionType] = useState<'mcq' | 'fib' | 'true-false'>('mcq');
    const [questionCounts, setQuestionCounts] = useState({ easy: 1, medium: 1, hard: 0 });
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            let knowledge;
            if (curriculumId && knowledgeUnitId) {
                const currentUnit = getCurrentUnitKnowledge(curriculumId, knowledgeUnitId);
                 knowledge = {
                    unitTitle: currentUnit?.title || '',
                    currentUnitVocabulary: currentUnit?.vocabulary || [],
                    currentUnitSentencePatterns: currentUnit?.sentencePatterns || [],
                };
            }

            const result = await generateQuestions({ passage, questionType, questionCounts, knowledge });
            if (result.questions) {
                onQuestionsGenerated(result.questions);
                setIsOpen(false);
                 toast({ title: 'Thành công', description: `Đã tạo ${result.questions.length} câu hỏi.` });
            } else {
                 throw new Error("Không thể tạo câu hỏi.");
            }
        } catch (error) {
             console.error(error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Đã có lỗi xảy ra khi tạo câu hỏi.' });
        } finally {
            setIsGenerating(false);
        }
    };
    
     const totalQuestions = questionCounts.easy + questionCounts.medium + questionCounts.hard;

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} disabled={!passage}>
                <Bot className="h-4 w-4 mr-2" />
                Tạo câu hỏi bằng AI
            </Button>
             <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo câu hỏi bằng AI</DialogTitle>
                        <DialogDescription>
                            Chọn loại câu hỏi và số lượng để AI tự động tạo từ đoạn văn đã cho.
                              {knowledgeUnitId && <p className="text-primary font-medium mt-1">Dựa trên kiến thức của: {getCurrentUnitKnowledge(curriculumId!, knowledgeUnitId!)?.title}</p>}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                             <Label htmlFor="question-type">Loại câu hỏi</Label>
                            <Select onValueChange={(value: any) => setQuestionType(value)} defaultValue="mcq">
                                <SelectTrigger id="question-type">
                                    <SelectValue placeholder="Chọn loại câu hỏi..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mcq">Trắc nghiệm</SelectItem>
                                    <SelectItem value="fib">Điền vào chỗ trống</SelectItem>
                                    <SelectItem value="true-false">Đúng / Sai</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Số lượng câu hỏi theo độ khó</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="easy-q" className="text-sm text-muted-foreground">Dễ</Label>
                                    <Input id="easy-q" type="number" min="0" value={questionCounts.easy} onChange={(e) => setQuestionCounts(c => ({...c, easy: parseInt(e.target.value) || 0 }))} />
                                </div>
                                <div>
                                    <Label htmlFor="medium-q" className="text-sm text-muted-foreground">Trung bình</Label>
                                    <Input id="medium-q" type="number" min="0" value={questionCounts.medium} onChange={(e) => setQuestionCounts(c => ({...c, medium: parseInt(e.target.value) || 0 }))} />
                                </div>
                                <div>
                                    <Label htmlFor="hard-q" className="text-sm text-muted-foreground">Khó</Label>
                                    <Input id="hard-q" type="number" min="0" value={questionCounts.hard} onChange={(e) => setQuestionCounts(c => ({...c, hard: parseInt(e.target.value) || 0 }))} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
                        <Button onClick={handleGenerate} disabled={isGenerating || totalQuestions === 0}>
                             {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Tạo {totalQuestions > 0 ? `${totalQuestions} câu hỏi` : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function AiAudioGenerator({ onAudioGenerated }: { onAudioGenerated: (audioUrl: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [script, setScript] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [speakers, setSpeakers] = useState([{ name: 'Speaker1', voice: PREBUILT_VOICES_WITH_DESC[0].voice }]);
    const { toast } = useToast();

    const addSpeaker = () => {
        const newSpeakerNumber = speakers.length + 1;
        setSpeakers([...speakers, { name: `Speaker${newSpeakerNumber}`, voice: PREBUILT_VOICES_WITH_DESC[newSpeakerNumber-1]?.voice || PREBUILT_VOICES_WITH_DESC[0].voice }]);
    };
    
    const removeSpeaker = (indexToRemove: number) => {
        setSpeakers(speakers.filter((_, index) => index !== indexToRemove).map((s, i) => ({ ...s, name: `Speaker${i + 1}` })));
    };

    const handleVoiceChange = (index: number, newVoice: string) => {
        setSpeakers(speakers.map((s, i) => i === index ? { ...s, voice: newVoice } : s));
    };

    const insertSpeakerTag = (speakerName: string) => {
        setScript(prev => `${prev}${prev ? ' ' : ''}${speakerName}: `)
    };

    const handleGenerate = async () => {
        if (!script) {
            toast({ variant: 'destructive', title: 'Thiếu kịch bản', description: 'Vui lòng nhập nội dung kịch bản.' });
            return;
        }
        setIsGenerating(true);
        try {
            const result = await textToSpeech({ script, speakers });
            if (result.audio) {
                onAudioGenerated(result.audio);
                setIsOpen(false);
            } else {
                throw new Error("Không thể tạo audio.");
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Đã có lỗi xảy ra khi tạo audio.' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                <Mic className="mr-2 h-4 w-4" />
                Tạo audio bằng AI
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Tạo Audio bằng AI</DialogTitle>
                        <DialogDescription>
                            Nhập kịch bản và chọn giọng đọc để AI tạo file âm thanh.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                             <Label>Giọng đọc</Label>
                             <div className="space-y-3">
                                {speakers.map((speaker, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span className="font-semibold">{speaker.name}:</span>
                                        <Select value={speaker.voice} onValueChange={(value) => handleVoiceChange(index, value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn giọng đọc..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PREBUILT_VOICES_WITH_DESC.map(v => (
                                                    <SelectItem key={v.voice} value={v.voice}>{v.description} ({v.gender})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {speakers.length > 1 && (
                                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeSpeaker(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                             </div>
                             <Button variant="link" size="sm" className="p-0 h-auto" onClick={addSpeaker}>
                                <PlusCircle className="mr-1 h-4 w-4" />
                                Thêm người nói
                             </Button>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="audio-script">Kịch bản</Label>
                                {speakers.length > 1 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Chèn nhanh:</span>
                                        {speakers.map(speaker => (
                                            <Button key={speaker.name} size="sm" variant="outline" className="h-7" onClick={() => insertSpeakerTag(speaker.name)}>{speaker.name}</Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Textarea 
                                id="audio-script" 
                                placeholder={speakers.length > 1 ? "ví dụ: Speaker1: Hello. Speaker2: Hi there!" : "Nhập nội dung cần đọc..."} 
                                value={script} 
                                onChange={(e) => setScript(e.target.value)}
                                className="h-32"
                            />
                        </div>
                    </div>
                     <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                             {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tạo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function PartEditor({ part, sectionId, curriculumId, knowledgeUnitId, onAddQuestion, onAddGeneratedQuestions, onDelete, onPartChange, onDeleteQuestion, onQuestionChange, onOptionChange, onAddOption, onOptionDeleteImage, onImagesGenerated, onImagePromptsChange, onSubQuestionChange, onImageChange, onAddSubQuestion, onDeleteSubQuestion }: { 
    part: Part, 
    sectionId: Section['id'], 
    curriculumId: string | undefined,
    knowledgeUnitId: string | undefined,
    onAddQuestion: (type: QuestionType) => void, 
    onAddGeneratedQuestions: (questions: GeneratedQuestion[]) => void, 
    onDelete: () => void, 
    onPartChange: (updatedPart: Partial<Part>) => void,
    onDeleteQuestion: (questionId: number) => void, 
    onQuestionChange: (questionId: number, updatedQuestion: Partial<Question>) => void, 
    onOptionChange: (questionId: number, optionId: number, updatedOption: Partial<Option>) => void, 
    onAddOption: (questionId: number) => void,
    onOptionDeleteImage: (questionId: number, optionId: number) => void, 
    onImagesGenerated: (questionId: number, images: string[]) => void,
    onImagePromptsChange: (questionId: number, prompts: string[]) => void,
    onSubQuestionChange: (questionId: number, subQuestionId: number, updatedSubQuestion: Partial<SubQuestion>) => void,
    onImageChange: (questionId: number, imageId: number, imageUrl: string) => void,
    onAddSubQuestion: (questionId: number) => void,
    onDeleteSubQuestion: (questionId: number, subQuestionId: number) => void,
}) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAudioUploadClick = () => {
    audioInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          onPartChange({ audioUrl: dataUrl });
          toast({ title: 'Thành công', description: 'Tệp âm thanh đã được tải lên.' });
        };
        reader.readAsDataURL(file);
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng chỉ chọn tệp âm thanh.' });
      }
    }
    event.target.value = '';
  };
  
  return (
    <div className="p-4 border rounded-lg bg-secondary/50 space-y-4">
      <div className="flex items-start gap-2">
        <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
        <div className="flex-grow space-y-2">
          <Label htmlFor={`part-title-${part.id}`} className="font-semibold">Yêu cầu phần thi</Label>
          <Textarea id={`part-title-${part.id}`} placeholder="ví dụ: Listen and tick (V) Right or Wrong. There is one example." value={part.title} onChange={(e) => onPartChange({ title: e.target.value })}/>
        </div>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
       {sectionId === 'reading' && (
          <div className="space-y-2">
            <div className='flex items-center justify-between'>
                <Label htmlFor={`part-passage-${part.id}`} className="font-semibold">Nội dung Phần thi (Reading Passage)</Label>
                 <AiPassageGenerator curriculumId={curriculumId} knowledgeUnitId={knowledgeUnitId} onPassageGenerated={(passage) => onPartChange({ passage })} />
            </div>
            <Textarea 
                id={`part-passage-${part.id}`} 
                placeholder="Nhập hoặc tạo đoạn văn đọc hiểu tại đây..."
                value={part.passage || ''}
                onChange={(e) => onPartChange({ passage: e.target.value })}
                className="h-40"
            />
          </div>
        )}

        {sectionId === 'listening' && (
            <div className="space-y-2">
                 <div className='flex items-center justify-between'>
                    <Label className="font-semibold">Nội dung Audio</Label>
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={audioInputRef}
                            onChange={handleFileChange}
                            accept="audio/*"
                            className="hidden"
                        />
                        <Button variant="outline" size="sm" onClick={handleAudioUploadClick}>
                           <Upload className="mr-2 h-4 w-4" />
                           Tải tệp lên
                        </Button>
                         <AiAudioGenerator onAudioGenerated={(audioUrl) => onPartChange({ audioUrl })} />
                    </div>
                </div>
                {part.audioUrl && (
                    <audio controls src={part.audioUrl} className="w-full">
                        Your browser does not support the audio element.
                    </audio>
                )}
            </div>
        )}

      <div className="space-y-3">
        {part.questions.map((q) => (
            <QuestionEditor 
                key={q.id} 
                question={q} 
                onDelete={() => onDeleteQuestion(q.id)} 
                onQuestionChange={(updatedQuestion) => onQuestionChange(q.id, updatedQuestion)}
                onOptionChange={(optionId, updatedOption) => onOptionChange(q.id, optionId, updatedOption)}
                onAddOption={() => onAddOption(q.id)}
                onOptionDeleteImage={(optionId) => onOptionDeleteImage(q.id, optionId)}
                onImagesGenerated={(images) => onImagesGenerated(q.id, images)}
                onImagePromptsChange={(prompts) => onImagePromptsChange(q.id, prompts)}
                onSubQuestionChange={(subId, updated) => onSubQuestionChange(q.id, subId, updated)}
                onImageChange={(imgId, url) => onImageChange(q.id, imgId, url)}
                onAddSubQuestion={() => onAddSubQuestion(q.id)}
                onDeleteSubQuestion={(subId) => onDeleteSubQuestion(q.id, subId)}
            />
        ))}
      </div>

       <div className="flex items-center gap-2 px-1 pt-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" /> Thêm câu hỏi
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {sectionId === 'listening' && (
                        <DropdownMenuItem onSelect={() => onAddQuestion('mcq-image')}>Trắc nghiệm (có ảnh)</DropdownMenuItem>
                    )}
                     {(sectionId === 'listening' || sectionId === 'reading') && <>
                        <DropdownMenuItem onSelect={() => onAddQuestion('mcq')}>Trắc nghiệm (chữ)</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onAddQuestion('fib')}>Điền vào chỗ trống</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onAddQuestion('true-false')}>Đúng / Sai</DropdownMenuItem>
                     </>}
                    
                     {(sectionId === 'reading' || sectionId === 'writing') &&
                        <DropdownMenuItem onSelect={() => onAddQuestion('write-the-word')}>Viết từ (Write the word)</DropdownMenuItem>
                     }
                      {sectionId === 'writing' && <>
                        <DropdownMenuItem onSelect={() => onAddQuestion('writing-fill-in-word')}>Viết từ (có ảnh)</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onAddQuestion('writing-order-words')}>Sắp xếp từ</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onAddQuestion('writing-paragraph')}>Viết đoạn văn</DropdownMenuItem>
                    </>}
                     {sectionId === 'speaking' && <>
                        <DropdownMenuItem onSelect={() => onAddQuestion('speaking-qa')}>Vấn đáp (Q&A)</DropdownMenuItem>
                    </>}
                </DropdownMenuContent>
            </DropdownMenu>
            {sectionId === 'reading' && (
                <AiQuestionGenerator passage={part.passage || ''} curriculumId={curriculumId} knowledgeUnitId={knowledgeUnitId} onQuestionsGenerated={onAddGeneratedQuestions} />
            )}
        </div>
    </div>
  );
}

function SectionCard({ section, onAddPart, onAddQuestion, onAddGeneratedQuestions, onDeletePart, onPartChange, onDeleteQuestion, onQuestionChange, onOptionChange, onAddOption, onOptionDeleteImage, onImagesGenerated, onImagePromptsChange, curriculumId, knowledgeUnitId, onSubQuestionChange, onImageChange, onAddSubQuestion, onDeleteSubQuestion }: { 
    section: Section, 
    onAddPart: () => void, 
    onAddQuestion: (partId: number, type: QuestionType) => void, 
    onAddGeneratedQuestions: (partId: number, questions: GeneratedQuestion[]) => void,
    onDeletePart: (partId: number) => void,
    onPartChange: (partId: number, updatedPart: Partial<Part>) => void,
    onDeleteQuestion: (partId: number, questionId: number) => void,
    onQuestionChange: (partId: number, questionId: number, updatedQuestion: Partial<Question>) => void,
    onOptionChange: (partId: number, questionId: number, optionId: number, updatedOption: Partial<Option>) => void,
    onAddOption: (partId: number, questionId: number) => void,
    onOptionDeleteImage: (partId: number, questionId: number, optionId: number) => void,
    onImagesGenerated: (partId: number, questionId: number, images: string[]) => void,
    onImagePromptsChange: (partId: number, questionId: number, prompts: string[]) => void,
    curriculumId: string | undefined,
    knowledgeUnitId: string | undefined,
    onSubQuestionChange: (partId: number, questionId: number, subQuestionId: number, updatedSubQuestion: Partial<SubQuestion>) => void,
    onImageChange: (partId: number, questionId: number, imageId: number, imageUrl: string) => void,
    onAddSubQuestion: (partId: number, questionId: number) => void,
    onDeleteSubQuestion: (partId: number, questionId: number, subQuestionId: number) => void,
}) {
  return (
     <AccordionItem value={section.id}>
        <AccordionTrigger className="text-xl font-bold hover:no-underline px-4">
           <div className="flex items-center gap-3">
             <GripVertical className="h-6 w-6 text-muted-foreground cursor-grab" />
             {section.title}
           </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0 space-y-6">
            {section.parts.length > 0 ? (
                section.parts.map((p) => (
                    <PartEditor 
                      key={p.id} 
                      part={p}
                      sectionId={section.id}
                      curriculumId={curriculumId}
                      knowledgeUnitId={knowledgeUnitId}
                      onAddQuestion={(type) => onAddQuestion(p.id, type)}
                      onAddGeneratedQuestions={(questions) => onAddGeneratedQuestions(p.id, questions)}
                      onDelete={() => onDeletePart(p.id)} 
                      onPartChange={(updatedPart) => onPartChange(p.id, updatedPart)}
                      onDeleteQuestion={(questionId) => onDeleteQuestion(p.id, questionId)} 
                      onQuestionChange={(questionId, updatedQuestion) => onQuestionChange(p.id, questionId, updatedQuestion)}
                      onOptionChange={(questionId, optionId, updatedOption) => onOptionChange(p.id, questionId, optionId, updatedOption)}
                      onAddOption={(questionId) => onAddOption(p.id, questionId)}
                      onOptionDeleteImage={(questionId, optionId) => onOptionDeleteImage(p.id, questionId, optionId)}
                      onImagesGenerated={(questionId, images) => onImagesGenerated(p.id, questionId, images)}
                      onImagePromptsChange={(questionId, prompts) => onImagePromptsChange(p.id, questionId, prompts)}
                      onSubQuestionChange={(qId, subId, updated) => onSubQuestionChange(p.id, qId, subId, updated)}
                      onImageChange={(qId, imgId, url) => onImageChange(p.id, qId, imgId, url)}
                      onAddSubQuestion={(qId) => onAddSubQuestion(p.id, qId)}
                      onDeleteSubQuestion={(qId, subId) => onDeleteSubQuestion(p.id, qId, subId)}
                    />
                ))
            ) : (
                <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                    <p>Chưa có part nào trong phần này.</p>
                </div>
            )}
             <div className="flex items-center gap-2 px-1">
                <Button variant="outline" onClick={onAddPart}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Thêm Part
                </Button>
            </div>
        </AccordionContent>
    </AccordionItem>
  );
}

// Preview Dialog
function TestPreviewDialog({ testData, open, onOpenChange }: { testData: TestData, open: boolean, onOpenChange: (open: boolean) => void }) {
    
    // Specific renderers for the preview page
    function McqPreviewRenderer({ question }: { question: any }) {
        const isExample = question.isExample || false;
        return (
            <div className={cn("flex flex-col space-y-4", isExample && "pl-8")}>
                <p className={cn("text-justify", isExample && "italic")}>
                    {isExample && <span className="font-bold">Ex. </span>}
                    {question.text}
                </p>
                <div className="flex justify-around items-end text-center">
                    {question.options.map((opt: any) => (
                        <div key={opt.id} className="flex flex-col items-center space-y-2">
                            {opt.imageUrl &&
                                <div className="w-32 h-32 relative border-2 border-gray-400 rounded-md p-1">
                                    <Image
                                        src={opt.imageUrl}
                                        alt={opt.description || `Option ${opt.text}`}
                                        width={128}
                                        height={128}
                                        className="object-contain w-full h-full"
                                    />
                                </div>
                            }
                            <div className="flex items-center space-x-2">
                               <div className="w-5 h-5 border-2 border-black rounded-sm" />
                               <label className="font-bold">{opt.text}</label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function TrueFalsePreviewRenderer({ question }: { question: any }) {
        const isExample = question.isExample || false;
        return (
            <div className={cn("flex justify-between items-center py-1", isExample && "pl-8")}>
                <p className={cn("flex-1 text-justify pr-8", isExample && "italic")}>
                    {isExample && <span className="font-bold">Ex. </span>}
                    {question.text}
                </p>
                <div className="flex space-x-8 border-l-2 border-gray-400 pl-8">
                     <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-black rounded-sm" />
                    </div>
                     <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-black rounded-sm" />
                    </div>
                </div>
            </div>
        )
    }

    function PreviewQuestionRenderer({ question, index }: { question: any; index: number }) {
        switch(question.type) {
            case 'mcq':
            case 'mcq-image':
                return (
                     <div className="flex items-start space-x-3">
                        {!question.isExample && <span className="font-bold">{index}.</span>}
                        <div className="flex-1">
                            <McqPreviewRenderer question={question} />
                        </div>
                    </div>
                )
            case 'true-false':
                 return (
                     <div className="flex items-start space-x-3">
                        {!question.isExample && <span className="font-bold">{index}.</span>}
                        <div className="flex-1">
                             <TrueFalsePreviewRenderer question={question} />
                        </div>
                    </div>
                 )
            // Add cases for other question types here
            default:
                 return (
                    <div className="flex items-start space-x-3">
                       {!question.isExample && <span className="font-bold">{index}.</span>}
                       <div className="flex-1 text-justify">
                            {question.isExample && <span className="font-bold">Ex. </span>}
                            {question.text}
                       </div>
                    </div>
                )
        }
    }
    
    if (!testData) return null;

    const handlePrint = () => {
        const printContent = document.getElementById('printable-preview-area');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            const printHtml = printContent.innerHTML;

            const newWindow = window.open('', '_blank');
            if(newWindow) {
                newWindow.document.write(`
                    <html>
                    <head>
                        <title>In đề thi</title>
                        <link rel="stylesheet" href="/globals.css">
                         <style>
                           @media print {
                             body { -webkit-print-color-adjust: exact; }
                             @page { margin: 0.5in; }
                           }
                           body { font-family: 'Times New Roman', serif; }
                           .preview-checkbox {
                                width: 1.25rem; height: 1.25rem;
                                border: 2px solid black !important;
                                border-radius: 0.125rem;
                                display: inline-block;
                                vertical-align: middle;
                           }
                         </style>
                    </head>
                    <body>
                        ${printHtml}
                    </body>
                    </html>
                `);

                setTimeout(() => {
                    newWindow.document.close();
                    newWindow.focus();
                    newWindow.print();
                    newWindow.close();
                }, 250);
            }
        }
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Xem trước đề thi</DialogTitle>
                    <DialogDescription>
                        Đây là giao diện học sinh sẽ thấy. Nội dung không thể tương tác.
                    </DialogDescription>
                </DialogHeader>
                <div id="printable-preview-area" className="flex-1 overflow-y-auto p-6 bg-muted/50 rounded-md font-serif">
                     <div className="bg-white p-8 sm:p-12 shadow-lg rounded-md max-w-4xl mx-auto">
                        <header className="text-center mb-8">
                            <h1 className="text-2xl font-bold uppercase tracking-wider">{testData.title}</h1>
                             <div className="flex justify-between items-center mt-4 text-sm">
                                <span>Họ và tên: .................................................</span>
                                <span>Lớp: .................</span>
                                {testData.timeLimit && <span>Thời gian: {testData.timeLimit} phút</span>}
                            </div>
                        </header>
                        <main className="space-y-8">
                            {testData.sections.map(section => (
                                <section key={section.id} className="space-y-6">
                                    <h2 className="text-xl font-bold uppercase text-center">{section.title}</h2>
                                    {section.parts.map((part: any, partIndex: number) => (
                                        <div key={part.id}>
                                            <p className="font-bold text-justify mb-2">{part.title}</p>
                                            
                                            {part.audioUrl && (
                                                <div className="my-4">
                                                    <audio controls src={part.audioUrl} className="w-full">
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                </div>
                                            )}

                                            {part.passage && (
                                                <div className="text-justify italic bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
                                                    {part.passage}
                                                </div>
                                            )}

                                            <div className="space-y-6">
                                                {part.questions.filter((q: any) => q.isExample).map((q:any, index: number) => (
                                                      <PreviewQuestionRenderer key={q.id} question={q} index={0} />
                                                ))}

                                                {part.questions
                                                    .filter((q: any) => !q.isExample)
                                                    .map((q: any, index: number) => (
                                                        <PreviewQuestionRenderer key={q.id} question={q} index={index + 1} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <Separator className="my-6 border-gray-400" />
                                </section>
                            ))}
                        </main>
                        <footer className="text-center mt-12">
                            <p className="font-bold uppercase">--- Hết ---</p>
                        </footer>
                    </div>
                </div>
                 <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        In bài thi
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BuilderPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [testId, setTestId] = useState<string | null>(editId);
    const [isLoading, setIsLoading] = useState(true);
    const [sections, setSections] = useState<Section[]>(initialSections);
    const [testTitle, setTestTitle] = useState('Lớp 4 - Kiểm tra tiếng Anh giữa kỳ');
    const [timeLimit, setTimeLimit] = useState<number | undefined>(40);
    
    const [curriculumId, setCurriculumId] = useState<string | undefined>(KNOWLEDGE_BASES[0]?.id);
    const [knowledgeUnitId, setKnowledgeUnitId] = useState<string | undefined>(KNOWLEDGE_BASES[0]?.units[0]?.id);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const { toast } = useToast();

     useEffect(() => {
        const loadTestData = async () => {
            if (editId) {
                setIsLoading(true);
                try {
                    const fetchedTest = await getTestById(editId);
                    if (fetchedTest) {
                        setTestId(fetchedTest.id || null);
                        setTestTitle(fetchedTest.title);
                        setSections(fetchedTest.sections);
                        setCurriculumId(fetchedTest.curriculumId || KNOWLEDGE_BASES[0]?.id);
                        setKnowledgeUnitId(KNOWLEDGE_BASES.find(kb => kb.id === fetchedTest.curriculumId)?.units[0]?.id);
                        setTimeLimit(fetchedTest.timeLimit);
                    } else {
                        toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy bài thi để sửa.' });
                        router.push('/dashboard/builder');
                    }
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tải dữ liệu bài thi.' });
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Reset to default state for a new test
                setTestId(null);
                setTestTitle('Lớp 4 - Kiểm tra tiếng Anh giữa kỳ');
                setSections(initialSections);
                setCurriculumId(KNOWLEDGE_BASES[0]?.id);
                setKnowledgeUnitId(KNOWLEDGE_BASES[0]?.units[0]?.id);
                setTimeLimit(40);
                setIsLoading(false);
            }
        };
        loadTestData();
    }, [editId, toast, router]);

    const handleCurriculumChange = (newCurriculumId: string) => {
        setCurriculumId(newCurriculumId);
        const newUnitId = KNOWLEDGE_BASES.find(kb => kb.id === newCurriculumId)?.units[0]?.id;
        setKnowledgeUnitId(newUnitId);
    };

    const handleAddNewTest = () => {
        setTestId(null);
        router.push('/dashboard/builder', { scroll: false });
    };

    const handleAddPart = (sectionId: Section['id']) => {
        setSections(prevSections => 
            prevSections.map(section => {
                if (section.id === sectionId) {
                    const newPart: Part = {
                        id: Date.now(),
                        title: `Part ${section.parts.length + 1}: `,
                        passage: sectionId === 'reading' ? '' : undefined,
                        audioUrl: sectionId === 'listening' ? undefined : undefined,
                        questions: [],
                    };
                    return { ...section, parts: [...section.parts, newPart] };
                }
                return section;
            })
        );
    };

    const handleAddQuestion = (sectionId: Section['id'], partId: number, type: QuestionType) => {
        setSections(prevSections =>
            prevSections.map(section => {
                if (section.id === sectionId) {
                    const updatedParts = section.parts.map(part => {
                        if (part.id === partId) {
                            const isMcq = type === 'mcq' || type === 'mcq-image';
                             const newQuestion: Question = {
                                id: Date.now(),
                                type: type,
                                text: '',
                                textAfter: type === 'write-the-word' ? '' : undefined,
                                answer: (type === 'fib' || type === 'write-the-word' || type === 'writing-order-words') ? '' : undefined,
                                isTrue: type === 'true-false' ? undefined : undefined,
                                isExample: false,
                                options: isMcq ? [
                                    {id: 1, text: 'A', isCorrect: false, description: '', imagePrompt: ''}, 
                                    {id: 2, text: 'B', isCorrect: false, description: '', imagePrompt: ''}, 
                                    {id: 3, text: 'C', isCorrect: false, description: '', imagePrompt: ''}
                                ] : [],
                                images: type === 'writing-fill-in-word' ? [] : [],
                                subQuestions: type === 'writing-fill-in-word' ? [] : [],
                                disorderedWords: type === 'writing-order-words' ? '' : undefined,
                                imageUrl: type === 'speaking-qa' ? undefined : undefined,
                                referenceAnswer: type === 'speaking-qa' ? '' : undefined,
                            };
                             if (type === 'writing-fill-in-word') {
                                const firstSubId = Date.now() + 1;
                                newQuestion.subQuestions = [{ id: firstSubId, text: '', answer: '' }];
                                newQuestion.images = [{ id: firstSubId, imageUrl: undefined }];
                            }
                            return { ...part, questions: [...part.questions, newQuestion] };
                        }
                        return part;
                    })
                    return { ...section, parts: updatedParts };
                }
                return section;
            })
        );
    };
    
    const handleAddGeneratedQuestions = (sectionId: Section['id'], partId: number, generatedQuestions: GeneratedQuestion[]) => {
        setSections(prevSections => 
            prevSections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        parts: section.parts.map(part => {
                            if (part.id === partId) {
                                const newQuestions: Question[] = generatedQuestions.map((gq, index) => {
                                    const baseQuestion: Partial<Question> = {
                                        id: Date.now() + index,
                                        options: [],
                                        isExample: false,
                                    };
                                    if (gq.type === 'mcq') {
                                        return {
                                            ...baseQuestion,
                                            id: baseQuestion.id!,
                                            type: 'mcq',
                                            text: gq.question,
                                            options: gq.options.map((opt, optIndex) => ({
                                                id: optIndex + 1,
                                                text: String.fromCharCode(65 + optIndex), // A, B, C
                                                isCorrect: opt.isCorrect,
                                                description: opt.text,
                                                imagePrompt: '',
                                            })),
                                        };
                                    } else if (gq.type === 'fib') {
                                        return {
                                            ...baseQuestion,
                                            id: baseQuestion.id!,
                                            type: 'fib',
                                            text: gq.question,
                                            answer: gq.answer,
                                        };
                                    } else if (gq.type === 'true-false') {
                                         return {
                                            ...baseQuestion,
                                            id: baseQuestion.id!,
                                            type: 'true-false',
                                            text: gq.statement,
                                            isTrue: gq.isTrue,
                                        };
                                    }
                                    return null;
                                }).filter((q): q is Question => q !== null);

                                return { ...part, questions: [...part.questions, ...newQuestions] };
                            }
                            return part;
                        })
                    };
                }
                return section;
            })
        )
    };

    const handleDeletePart = (sectionId: Section['id'], partId: number) => {
        setSections(prevSections =>
            prevSections.map(section => {
                if (section.id === sectionId) {
                    return { ...section, parts: section.parts.filter(p => p.id !== partId) };
                }
                return section;
            })
        );
    };

    const handleDeleteQuestion = (sectionId: Section['id'], partId: number, questionId: number) => {
        setSections(prevSections =>
            prevSections.map(section => {
                if (section.id === sectionId) {
                    const updatedParts = section.parts.map(part => {
                        if (part.id === partId) {
                            const updatedQuestions = part.questions.filter(q => q.id !== questionId);
                            return { ...part, questions: updatedQuestions };
                        }
                        return part;
                    });
                    return { ...section, parts: updatedParts };
                }
                return section;
            })
        );
    };
    
    const handlePartChange = (sectionId: Section['id'], partId: number, updatedPart: Partial<Part>) => {
         setSections(prevSections =>
            prevSections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        parts: section.parts.map(part => 
                            part.id === partId ? { ...part, ...updatedPart } : part
                        )
                    };
                }
                return section;
            })
        );
    }
    
    const handleQuestionChange = (sectionId: Section['id'], partId: number, questionId: number, updatedQuestion: Partial<Question>) => {
        setSections(prevSections =>
            prevSections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        parts: section.parts.map(part => {
                            if (part.id === partId) {
                                return {
                                    ...part,
                                    questions: part.questions.map(question => 
                                        question.id === questionId ? { ...question, ...updatedQuestion } : question
                                    )
                                };
                            }
                            return part;
                        })
                    };
                }
                return section;
            })
        );
    };


    const handleOptionChange = (sectionId: Section['id'], partId: number, questionId: number, optionId: number, updatedOption: Partial<Option>) => {
        setSections(prevSections =>
            prevSections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        parts: section.parts.map(part => {
                            if (part.id === partId) {
                                return {
                                    ...part,
                                    questions: part.questions.map(question => {
                                        if (question.id === questionId) {
                                            const newOptions = question.options.map(option => {
                                                if (option.id === optionId) {
                                                    return { ...option, ...updatedOption };
                                                }
                                                // if it's a radio button-like behaviour, uncheck others
                                                if (updatedOption.isCorrect) {
                                                    return { ...option, isCorrect: false };
                                                }
                                                return option;
                                            });

                                            // Special handling for radio-like correction
                                            if (updatedOption.isCorrect) {
                                                const finalOptions = question.options.map(option => ({
                                                    ...option,
                                                    isCorrect: option.id === optionId,
                                                }));
                                                return { ...question, options: finalOptions };
                                            }

                                            return { ...question, options: newOptions };
                                        }
                                        return question;
                                    })
                                };
                            }
                            return part;
                        })
                    };
                }
                return section;
            })
        );
    };

    const handleAddOption = (sectionId: Section['id'], partId: number, questionId: number) => {
        setSections(prevSections =>
            prevSections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        parts: section.parts.map(part => {
                            if (part.id === partId) {
                                return {
                                    ...part,
                                    questions: part.questions.map(question => {
                                        if (question.id === questionId) {
                                            const nextOptionLetter = String.fromCharCode(65 + question.options.length);
                                            const newOption: Option = {
                                                id: Date.now(),
                                                text: nextOptionLetter,
                                                isCorrect: false,
                                                description: '',
                                                imagePrompt: ''
                                            };
                                            return {
                                                ...question,
                                                options: [...question.options, newOption]
                                            };
                                        }
                                        return question;
                                    })
                                };
                            }
                            return part;
                        })
                    };
                }
                return section;
            })
        );
    };
    
    const handleImagePromptsChange = (sectionId: Section['id'], partId: number, questionId: number, prompts: string[]) => {
       setSections(prevSections =>
            prevSections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        parts: section.parts.map(part => {
                            if (part.id === partId) {
                                return {
                                    ...part,
                                    questions: part.questions.map(question => {
                                        if (question.id === questionId) {
                                            return {
                                                ...question,
                                                options: question.options.map((option, index) => ({
                                                    ...option,
                                                    imagePrompt: prompts[index] || option.imagePrompt
                                                }))
                                            }
                                        }
                                        return question;
                                    })
                                };
                            }
                            return part;
                        })
                    };
                }
                return section;
            })
        );
    };

    const handleOptionDeleteImage = (sectionId: Section['id'], partId: number, questionId: number, optionId: number) => {
        setSections(prevSections =>
            prevSections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        parts: section.parts.map(part => {
                            if (part.id === partId) {
                                return {
                                    ...part,
                                    questions: part.questions.map(question => {
                                        if (question.id === questionId) {
                                            return {
                                                ...question,
                                                options: question.options.map(option => 
                                                    option.id === optionId ? { ...option, imageUrl: undefined } : option
                                                )
                                            }
                                        }
                                        return question;
                                    })
                                };
                            }
                            return part;
                        })
                    };
                }
                return section;
            })
        );
    };
    
    const handleImagesGenerated = (sectionId: Section['id'], partId: number, questionId: number, images: string[]) => {
        setSections(prevSections =>
            prevSections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        parts: section.parts.map(part => {
                            if (part.id === partId) {
                                return {
                                    ...part,
                                    questions: part.questions.map(question => {
                                        if (question.id === questionId) {
                                            return {
                                                ...question,
                                                options: question.options.map((option, index) => ({
                                                    ...option,
                                                    imageUrl: images[index] || option.imageUrl
                                                }))
                                            }
                                        }
                                        return question;
                                    })
                                };
                            }
                            return part;
                        })
                    };
                }
                return section;
            })
        );
    };

    // Handlers for 'writing-fill-in-word'
    const handleImageChange = (sectionId: Section['id'], partId: number, questionId: number, imageId: number, imageUrl: string) => {
        setSections(prevSections =>
            prevSections.map(sec => sec.id === sectionId ? { ...sec, parts: sec.parts.map(p => p.id === partId ? { ...p, questions: p.questions.map(q => q.id === questionId ? { ...q, images: (q.images || []).map(img => img.id === imageId ? { ...img, imageUrl } : img) } : q) } : p) } : sec)
        );
    };

    const handleSubQuestionChange = (sectionId: Section['id'], partId: number, questionId: number, subQuestionId: number, updatedSubQuestion: Partial<SubQuestion>) => {
        setSections(prevSections =>
            prevSections.map(sec => sec.id === sectionId ? { ...sec, parts: sec.parts.map(p => p.id === partId ? { ...p, questions: p.questions.map(q => q.id === questionId ? { ...q, subQuestions: (q.subQuestions || []).map(sq => sq.id === subQuestionId ? { ...sq, ...updatedSubQuestion } : sq) } : q) } : p) } : sec)
        );
    };
    
    const handleAddSubQuestion = (sectionId: Section['id'], partId: number, questionId: number) => {
        setSections(prevSections => prevSections.map(sec => {
            if (sec.id !== sectionId) return sec;
            return {
                ...sec,
                parts: sec.parts.map(p => {
                    if (p.id !== partId) return p;
                    return {
                        ...p,
                        questions: p.questions.map(q => {
                            if (q.id !== questionId) return q;
                            const newSubId = Date.now();
                            const newSubQuestion: SubQuestion = { id: newSubId, text: '', answer: '' };
                            const newImage: ImageItem = { id: newSubId, imageUrl: undefined };
                            return { 
                                ...q, 
                                subQuestions: [...(q.subQuestions || []), newSubQuestion],
                                images: [...(q.images || []), newImage],
                            };
                        })
                    };
                })
            };
        }));
    };

    const onDeleteSubQuestion = (sectionId: Section['id'], partId: number, questionId: number, subQuestionId: number) => {
        setSections(prevSections => prevSections.map(sec => {
            if (sec.id !== sectionId) return sec;
            return {
                ...sec,
                parts: sec.parts.map(p => {
                    if (p.id !== partId) return p;
                    return {
                        ...p,
                        questions: p.questions.map(q => {
                             if (q.id !== questionId) return q;
                             return { 
                                 ...q, 
                                 subQuestions: (q.subQuestions || []).filter(sq => sq.id !== subQuestionId),
                                 images: (q.images || []).filter(img => img.id !== subQuestionId)
                             }
                        })
                    };
                })
            };
        }));
    }

    const getTestStats = useCallback(() => {
        let totalQuestions = 0;
        let totalScore = 0;

        sections.forEach(section => {
            section.parts.forEach(part => {
                part.questions.forEach(q => {
                    if (!q.isExample) {
                        if (q.type === 'writing-paragraph') {
                             totalQuestions += 1;
                            totalScore += 1;
                        } else if (q.type === 'writing-fill-in-word') {
                            totalQuestions += (q.subQuestions || []).length;
                            totalScore += (q.subQuestions || []).length * 0.25;
                        }
                        else {
                            totalQuestions += 1;
                            totalScore += 0.25;
                        }
                    }
                });
            });
        });

        const totalParts = sections.reduce((acc, section) => acc + section.parts.length, 0);

        return { totalQuestions, totalScore, totalParts };
    }, [sections]);

    const { totalQuestions, totalScore, totalParts } = getTestStats();

    const handleSaveTest = async () => {
        if (!testTitle.trim()) {
            toast({
                variant: 'destructive',
                title: 'Thiếu tiêu đề',
                description: 'Vui lòng nhập tiêu đề cho bài kiểm tra.',
            });
            return;
        }

        setIsSaving(true);
        try {
            const testData: Omit<TestData, 'id' | 'createdAt' | 'updatedAt'> = {
                title: testTitle,
                sections: sections,
                stats: getTestStats(),
                curriculumId: curriculumId,
                knowledgeUnitId: knowledgeUnitId,
                timeLimit: timeLimit,
            };

            const savedId = await saveTest(testData, testId ?? undefined);

            if (!testId) {
                setTestId(savedId);
                router.push(`/dashboard/builder?edit=${savedId}`, { scroll: false });
            }

            toast({
                title: 'Lưu thành công!',
                description: `Đề thi đã được ${testId ? 'cập nhật' : 'lưu'} thành công.`,
            });
            
        } catch (error) {
            console.error("Failed to save test:", error);
            toast({
                variant: 'destructive',
                title: 'Lưu thất bại',
                description: 'Đã có lỗi xảy ra khi lưu đề thi. Vui lòng thử lại.',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return (
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="lg:col-span-1">
                     <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    const currentUnits = KNOWLEDGE_BASES.find(kb => kb.id === curriculumId)?.units || [];

    return (
        <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
            <CardHeader className="flex-row items-center justify-between">
                 <div>
                    <CardTitle>Xây dựng đề thi tùy chỉnh</CardTitle>
                    <CardDescription>
                    {testId ? `Đang sửa bài thi: ${testTitle}` : 'Thiết kế bài kiểm tra từ đầu.'}
                    </CardDescription>
                </div>
                <Button variant="outline" onClick={handleAddNewTest}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Tạo đề mới
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                <Label htmlFor="test-title" className="text-base font-semibold">Tiêu đề bài kiểm tra</Label>
                <Input 
                    id="test-title" 
                    placeholder="ví dụ: Lớp 4 - Kiểm tra tiếng Anh giữa kỳ" 
                    className="mt-2"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                />
                </div>
                 <div className="space-y-4">
                    <Label className="text-base font-semibold">Phạm vi kiến thức & Thời gian</Label>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <Label htmlFor="curriculum-select" className="text-sm text-muted-foreground">Giáo trình</Label>
                            <Select value={curriculumId} onValueChange={handleCurriculumChange}>
                                <SelectTrigger id="curriculum-select" className="mt-1">
                                    <SelectValue placeholder="Chọn giáo trình..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {KNOWLEDGE_BASES.map(kb => (
                                        <SelectItem key={kb.id} value={kb.id}>{kb.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-1">
                            <Label htmlFor="knowledge-unit" className="text-sm text-muted-foreground">Unit</Label>
                            <Select value={knowledgeUnitId} onValueChange={setKnowledgeUnitId} disabled={!curriculumId}>
                                <SelectTrigger id="knowledge-unit" className="mt-1">
                                    <div className="flex items-center gap-2">
                                        <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Chọn Unit..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {currentUnits.map(unit => (
                                        <SelectItem key={unit.id} value={unit.id}>{unit.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-1">
                             <Label htmlFor="time-limit" className="text-sm text-muted-foreground">Thời gian (phút)</Label>
                            <div className="relative mt-1">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="time-limit"
                                    type="number"
                                    placeholder="40"
                                    className="pl-9"
                                    value={timeLimit || ''}
                                    onChange={(e) => setTimeLimit(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                                />
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        AI sẽ tạo nội dung dựa trên kiến thức của Unit này và các unit trước đó.
                    </p>
                </div>
            </CardContent>
            </Card>

            <Accordion type="multiple" defaultValue={['listening', 'reading', 'writing', 'speaking']} className="w-full space-y-4">
                {sections.map(section => (
                    <Card key={section.id}>
                        <SectionCard 
                            section={section}
                            onAddPart={() => handleAddPart(section.id)}
                            onAddQuestion={(partId, type) => handleAddQuestion(section.id, partId, type)}
                            onAddGeneratedQuestions={(partId, questions) => handleAddGeneratedQuestions(section.id, partId, questions)}
                            onDeletePart={(partId) => handleDeletePart(section.id, partId)}
                            onPartChange={(partId, updatedPart) => handlePartChange(section.id, partId, updatedPart)}
                            onDeleteQuestion={(partId, questionId) => handleDeleteQuestion(section.id, partId, questionId)}
                            onQuestionChange={(partId, questionId, updatedQuestion) => handleQuestionChange(section.id, partId, questionId, updatedQuestion)}
                            onOptionChange={(partId, questionId, optionId, updatedOption) => handleOptionChange(section.id, partId, questionId, optionId, updatedOption)}
                            onAddOption={(partId, questionId) => handleAddOption(section.id, partId, questionId)}
                            onOptionDeleteImage={(partId, questionId, optionId) => handleOptionDeleteImage(section.id, partId, questionId, optionId)}
                            onImagesGenerated={(partId, questionId, images) => handleImagesGenerated(section.id, partId, questionId, images)}
                            onImagePromptsChange={(partId, questionId, prompts) => handleImagePromptsChange(section.id, partId, questionId, prompts)}
                            onSubQuestionChange={(partId, qId, subId, updated) => handleSubQuestionChange(section.id, partId, qId, subId, updated)}
                            onImageChange={(partId, qId, imgId, url) => handleImageChange(section.id, partId, qId, imgId, url)}
                            onAddSubQuestion={(partId, qId) => handleAddSubQuestion(section.id, partId, qId)}
                            onDeleteSubQuestion={(partId, qId, subId) => onDeleteSubQuestion(section.id, partId, qId, subId)}
                            curriculumId={curriculumId}
                            knowledgeUnitId={knowledgeUnitId}
                        />
                    </Card>
                ))}
            </Accordion>
        </div>
        <div className="lg:col-span-1">
            <Card className="sticky top-20">
            <CardHeader>
                <CardTitle>Cấu trúc bài kiểm tra</CardTitle>
                <CardDescription>
                Tóm tắt cấu hình bài kiểm tra của bạn.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                <p className="font-semibold truncate">{testTitle || "Chưa có tiêu đề"}</p>
                <p className="text-sm text-muted-foreground">{totalParts} phần, {totalQuestions} câu hỏi</p>
                </div>
                <Separator />
                 <div className="space-y-2">
                    <div className="flex justify-between items-center font-medium">
                        <span>Tổng số câu hỏi:</span>
                        <span>{totalQuestions}</span>
                    </div>
                     <div className="flex justify-between items-center font-medium">
                        <span>Tổng điểm tối đa:</span>
                        <span>{totalScore.toFixed(2)}</span>
                    </div>
                     {timeLimit && (
                        <div className="flex justify-between items-center font-medium">
                            <span>Thời gian làm bài:</span>
                            <span>{timeLimit} phút</span>
                        </div>
                    )}
                </div>
                <Separator />
                <div className="space-y-2">
                    <div className="font-medium">Các kỹ năng:</div>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                       {sections.map(section => (
                         <li key={section.id}>{section.title} ({section.parts.length} part)</li>
                       ))}
                    </ul>
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                 <Button className='w-full' variant="outline" onClick={() => setIsPreviewOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Xem trước
                 </Button>
                 <Button className='w-full' onClick={handleSaveTest} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Đang lưu...' : (testId ? 'Lưu thay đổi' : 'Lưu đề thi')}
                 </Button>
            </CardFooter>
            </Card>
        </div>
         <TestPreviewDialog 
            open={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            testData={{
                id: testId || 'preview-id', // Use a placeholder if no ID exists
                title: testTitle,
                sections: sections,
                stats: getTestStats(),
                createdAt: new Date(),
                curriculumId: curriculumId,
                knowledgeUnitId: knowledgeUnitId,
                timeLimit: timeLimit,
            }}
         />
        </div>
    );
}

export default function BuilderPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuilderPage />
    </Suspense>
  );
}
