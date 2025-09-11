
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTestById, type TestData } from '@/services/test-storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// You can expand these components to actually render the questions later
function QuestionRenderer({ question }: { question: any }) {
    return (
        <div className="p-4 border-l-4 border-secondary mb-4">
            <p className="font-semibold">{question.text}</p>
            {/* Render options, inputs, etc. based on question.type */}
            <p className="text-sm text-muted-foreground mt-2">Loại câu hỏi: {question.type}</p>
        </div>
    )
}


export default function TestPlayerPage() {
    const params = useParams();
    const testId = params.id as string;
    const [test, setTest] = useState<TestData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!testId) return;
        
        const fetchTest = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedTest = await getTestById(testId);
                if (fetchedTest) {
                    setTest(fetchedTest);
                } else {
                    setError('Không tìm thấy bài kiểm tra.');
                }
            } catch (err) {
                setError('Không thể tải bài kiểm tra. Vui lòng thử lại.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTest();
    }, [testId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen text-center">
                <h2 className="text-2xl font-bold text-destructive mb-4">{error}</h2>
                <Button asChild>
                    <Link href="/dashboard/my-tests">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
                    </Link>
                </Button>
            </div>
        );
    }

    if (!test) {
        return null;
    }

    return (
        <div className="container mx-auto max-w-4xl py-12">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">{test.title}</CardTitle>
                    <CardDescription className="text-lg">
                        {test.stats.totalQuestions} câu hỏi - {test.stats.totalScore.toFixed(2)} điểm
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {test.sections.map(section => (
                        <div key={section.id}>
                            <h2 className="text-2xl font-bold mb-4 border-b-2 pb-2 border-primary">{section.title}</h2>
                            {section.parts.map((part: any) => (
                                <div key={part.id} className="mb-6">
                                    <h3 className="text-lg font-semibold italic text-muted-foreground mb-4">{part.title}</h3>
                                    {part.passage && (
                                        <div className="prose max-w-none p-4 bg-muted rounded-md mb-4">
                                            <p>{part.passage}</p>
                                        </div>
                                    )}
                                    {part.questions.map((q: any) => (
                                        <QuestionRenderer key={q.id} question={q} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                    <div className="text-center pt-8">
                        <Button size="lg">
                            <Check className="mr-2 h-5 w-5" /> Nộp bài
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
