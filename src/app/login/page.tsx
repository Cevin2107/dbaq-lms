import { Suspense } from 'react';
import { AuthPortal } from '@/components/auth/AuthPortal';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Đang kết nối cổng đăng nhập..." submessage="Gia sư Đào Bá Anh Quân LMS" />}>
      <AuthPortal initialMode="login" />
    </Suspense>
  );
}

