# **App Name**: Examaker

## Core Features:

- Test Template Gallery: Cung cấp bộ sưu tập các mẫu bài kiểm tra được thiết kế sẵn bao gồm các kỹ năng nghe, nói, đọc và viết phù hợp với học sinh tiểu học.
- Custom Test Builder: Cho phép giáo viên tạo các bài kiểm tra tùy chỉnh bằng cách chọn loại câu hỏi, đặt mức độ khó và xác định cấu trúc bài kiểm tra cho từng kỹ năng.
- Skill-Based Assessment: Cho phép đánh giá tập trung vào các kỹ năng riêng lẻ (Nghe, Nói, Đọc, Viết) với các định dạng câu hỏi cụ thể phù hợp với từng kỹ năng.
- AI-Powered Content Suggestions: Một công cụ AI để tạo và đề xuất các đoạn văn đọc, gợi ý viết, đoạn trích nghe và chủ đề nói phù hợp dựa trên cấp lớp và mục tiêu học tập. Tool
- Interactive Test Examples: Cung cấp các ví dụ và trình diễn tương tác cho từng kỹ năng để hướng dẫn giáo viên hiểu các nguyên tắc thiết kế bài kiểm tra.
- Export and Share: Chức năng xuất các bài kiểm tra đã tạo ở định dạng có thể in để dễ dàng phân phối.

## Style Guidelines:

- Màu chính: Xanh lam nhạt (#A7D9ED) để tạo môi trường yên tĩnh và đáng tin cậy.
- Màu nền: Trắng (#FFFFFF), cung cấp một lớp nền sạch sẽ và không gây xao nhãng.
- Màu nhấn: Xanh lục nhạt (#BDDEB7), để báo hiệu các lời kêu gọi hành động quan trọng đồng thời vẫn phù hợp với tông màu cảm xúc đã thiết lập.
- Phông chữ thân và tiêu đề: 'PT Sans', một kiểu chữ sans-serif nhân văn với vẻ ngoài hiện đại.
- Sử dụng các biểu tượng thân thiện và dễ tiếp cận liên quan đến các kỹ năng ngôn ngữ, theo phong cách nghệ thuật đường nét nhẹ nhàng.
- Đảm bảo bố cục rõ ràng và trực quan, dễ điều hướng.
- Kết hợp các hình ảnh động và chuyển tiếp tinh tế, không xâm phạm để nâng cao trải nghiệm người dùng.

## Firestore Integration Plan:

1.  **Install Firebase SDK:** Add the `firebase` package for client-side interactions.
2.  **Create Firebase Client Config:** Create `lib/firebase.ts` to initialize the Firebase client app. This will use public environment variables.
3.  **Update Environment Variables:** Add the necessary `NEXT_PUBLIC_FIREBASE_*` keys to `.env.local` for client-side configuration.
4.  **Create Server Action:** Implement a Server Action in `app/actions.ts` to handle writing data to Firestore securely on the server-side, using the already configured Firebase Admin SDK.
5.  **Update UI:** Modify the main `page.tsx` to include a form that captures user input and calls the Server Action to save the data to Firestore, demonstrating the complete workflow.
