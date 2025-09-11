import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Wand2, ArrowRight, Library } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface FeatureCardProps {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}

function FeatureCard({ href, title, description, icon }: FeatureCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
        <CardHeader className="flex flex-col h-full">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="mb-4 bg-secondary p-3 rounded-full w-12 h-12 flex items-center justify-center">
                {icon}
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <CardTitle className="text-xl font-semibold mb-2">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Chào mừng đến với Examaker</h1>
        <p className="text-lg text-muted-foreground">Trợ lý AI của bạn để tạo ra các bài kiểm tra ngôn ngữ hấp dẫn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <FeatureCard
          href="/dashboard/builder"
          title="Xây dựng đề thi"
          description="Tạo các bài kiểm tra độc đáo từ đầu với trình tạo linh hoạt và trực quan của chúng tôi."
          icon={<Wand2 className="w-6 h-6 text-primary-foreground" />}
        />
        <FeatureCard
          href="/dashboard/my-tests"
          title="Kho đề thi"
          description="Xem, quản lý, chỉnh sửa và chia sẻ tất cả các bài kiểm tra bạn đã tạo."
          icon={<Library className="w-6 h-6 text-primary-foreground" />}
        />
      </div>
    </div>
  );
}
