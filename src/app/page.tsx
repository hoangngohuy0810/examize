import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Wand2, ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: ReactNode }) {
  return (
    <Card className="text-center flex flex-col items-center p-6 bg-secondary/30 border-none shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4 bg-secondary p-4 rounded-full text-primary-foreground">
        {icon}
      </div>
      <CardTitle className="text-xl font-bold mb-2">{title}</CardTitle>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
    return (
        <Card className="bg-background p-6 shadow-lg border-border/80">
            <CardContent className="p-0">
                <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-muted-foreground italic mb-4">"{quote}"</p>
                <p className="font-bold text-foreground">{author}</p>
                <p className="text-sm text-muted-foreground">{role}</p>
            </CardContent>
        </Card>
    );
}


export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z"></path><path d="M12.61 10.42 18.05 5l1 4-2 2-3-3-2-2 4-1Z"></path><path d="m15 5 3 3"></path><path d="M22 4s-1.5 1.5-3 3"></path></svg>
            <span>Examaker</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Tính năng</Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Đánh giá</Link>
          </nav>
          <Button asChild>
            <Link href="/dashboard">Bắt đầu miễn phí</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              Soạn đề thi tiếng Anh chưa bao giờ dễ dàng hơn
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Examaker là trợ lý AI đắc lực, giúp giáo viên tiểu học tạo ra các bài kiểm tra ngôn ngữ sáng tạo, phù hợp và hấp dẫn chỉ trong vài phút.
            </p>
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Tạo đề thi đầu tiên của bạn <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <div className="mt-12 relative">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                <Image
                    src="https://picsum.photos/seed/dashboard/1200/600"
                    alt="Bảng điều khiển Examaker"
                    width={1200}
                    height={600}
                    className="rounded-lg shadow-2xl mx-auto relative z-10"
                    data-ai-hint="dashboard application"
                />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Mọi thứ bạn cần cho một bài kiểm tra hoàn hảo</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
                Từ việc lên ý tưởng đến tạo câu hỏi, Examaker tự động hóa các công việc tốn thời gian để bạn có thể tập trung vào điều quan trọng nhất: học sinh của mình.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <FeatureCard 
                title="Trình tạo đề linh hoạt"
                description="Tùy chỉnh mọi khía cạnh của bài kiểm tra, từ loại câu hỏi đến độ khó, để phù hợp với nhu cầu lớp học."
                icon={<Wand2 className="w-8 h-8" />}
              />
              <FeatureCard 
                title="Sáng tạo nội dung với AI"
                description="Tạo đoạn văn, chủ đề và câu hỏi phù hợp với lứa tuổi và mục tiêu học tập chỉ bằng một cú nhấp chuột."
                icon={<Sparkles className="w-8 h-8" />}
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20">
             <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Được tin dùng bởi các nhà giáo dục tâm huyết</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto mt-4">Xem các giáo viên khác nói gì về việc Examaker đã thay đổi cách họ chuẩn bị bài kiểm tra.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <TestimonialCard 
                        quote="Examaker đã tiết kiệm cho tôi hàng giờ làm việc mỗi tuần. Công cụ AI thực sự thông minh và tạo ra những nội dung rất phù hợp với học sinh của tôi."
                        author="Cô Mai Lan"
                        role="Giáo viên Tiếng Anh, Trường Tiểu học ABC"
                    />
                    <TestimonialCard 
                        quote="Học sinh của tôi rất thích các bài nghe và nói được tạo từ ứng dụng. Nó làm cho các bài kiểm tra trở nên thú vị hơn nhiều!"
                        author="Thầy Nam Phong"
                        role="Tổ trưởng chuyên môn Tiếng Anh, Trường Tiểu học XYZ"
                    />
                    <TestimonialCard 
                        quote="Một công cụ tuyệt vời để tạo nhanh các bài tập ôn luyện. Tôi đặc biệt thích tính năng tùy chỉnh đề thi, nó rất linh hoạt."
                        author="Cô Thanh Trúc"
                        role="Giáo viên Tiếng Anh, Trường Tiểu học Sao Mai"
                    />
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
            <div className="container mx-auto px-4 text-center">
                 <div className="bg-secondary/50 rounded-lg p-10 md:p-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Sẵn sàng để đơn giản hóa việc tạo đề thi?</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                        Tham gia cùng hàng ngàn giáo viên khác và trải nghiệm tương lai của việc thiết kế bài kiểm tra ngôn ngữ.
                    </p>
                    <Button size="lg" asChild>
                        <Link href="/dashboard">Bắt đầu miễn phí ngay</Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-secondary/20">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Examaker. Mọi quyền được bảo lưu.</p>
          </div>
      </footer>
    </div>
  );
}
