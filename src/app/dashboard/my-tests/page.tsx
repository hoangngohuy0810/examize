
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from "@/components/ui/alert-dialog"

import { Loader2, Trash2, Edit, Play, PlusCircle, FileText, Clock, BarChart } from 'lucide-react';
import { getTests, deleteTest, type TestData } from '@/services/test-storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

function TestCard({ test, onDelete }: { test: TestData; onDelete: (testId: string) => void; }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!test.id) return;
    setIsDeleting(true);
    try {
      await deleteTest(test.id);
      toast({
        title: 'Xóa thành công',
        description: `Đề thi "${test.title}" đã được xóa.`,
      });
      onDelete(test.id);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Xóa thất bại',
        description: 'Đã có lỗi xảy ra khi xóa đề thi.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="line-clamp-2">{test.title}</CardTitle>
        <CardDescription>
          Tạo lúc: {format(new Date(test.createdAt), 'dd/MM/yyyy HH:mm')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
            <FileText className="mr-2 h-4 w-4" />
            <span>{test.stats.totalParts} phần</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
            <BarChart className="mr-2 h-4 w-4" />
            <span>{test.stats.totalQuestions} câu hỏi - {test.stats.totalScore.toFixed(2)} điểm</span>
        </div>
         {test.timeLimit && (
            <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                <span>{test.timeLimit} phút</span>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Xóa
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể được hoàn tác. Đề thi và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
                 <Link href={`/dashboard/builder?edit=${test.id}`}>
                    <Edit className="mr-2 h-4 w-4" /> Sửa
                </Link>
            </Button>
            <Button size="sm" asChild>
                 <Link href={`/test/${test.id}`} target="_blank">
                    <Play className="mr-2 h-4 w-4" /> Làm bài
                </Link>
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function MyTestsPage() {
  const [tests, setTests] = useState<TestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTests = async () => {
      setIsLoading(true);
      try {
        const fetchedTests = await getTests();
        setTests(fetchedTests);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tải danh sách đề thi. Vui lòng thử lại.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTests();
  }, [toast]);

  const handleTestDeleted = (deletedTestId: string) => {
    setTests(currentTests => currentTests.filter(test => test.id !== deletedTestId));
  };
  
  if (isLoading) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="flex flex-col">
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                    <CardFooter className="flex justify-between gap-2">
                         <Skeleton className="h-9 w-20" />
                        <div className="flex gap-2">
                             <Skeleton className="h-9 w-20" />
                             <Skeleton className="h-9 w-20" />
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
  }

  return (
    <div className="space-y-8">
        {tests.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h2 className="text-2xl font-semibold">Kho đề thi của bạn trống</h2>
                <p className="text-muted-foreground mt-2">Bắt đầu tạo một bài kiểm tra mới để quản lý tại đây.</p>
                <Button asChild className="mt-6">
                    <Link href="/dashboard/builder">
                        <PlusCircle className="mr-2 h-4 w-4" /> Tạo đề thi mới
                    </Link>
                </Button>
            </div>
        ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {tests.map(test => (
                    <TestCard key={test.id} test={test} onDelete={handleTestDeleted} />
                ))}
            </div>
        )}
    </div>
  );
}
