import { Suspense } from 'react';
import { AuthPortal } from '@/components/auth/AuthPortal';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Đang kết nối cổng đăng ký..." submessage="Gia sư Đào Bá Anh Quân LMS" />}>
      <AuthPortal initialMode="signup" />
    </Suspense>
  );
}

