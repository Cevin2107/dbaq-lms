import { Suspense } from 'react';
import { AuthPortal } from '@/components/auth/AuthPortal';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Đang kết nối cổng khôi phục..." submessage="Gia sư Đào Bá Anh Quân LMS" />}>
      <AuthPortal initialMode="forgot-password" />
    </Suspense>
  );
}

