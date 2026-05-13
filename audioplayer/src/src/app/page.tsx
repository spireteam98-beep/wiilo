import Header from '@/components/common/header';
import BottomNav from '@/components/common/bottom-nav';
import WalletBalance from '@/components/dashboard/wallet-balance';
import RecommendedAssets from '@/components/dashboard/recommended-assets';
import MyAssets from '@/components/dashboard/my-assets';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1 bg-background pb-28">
        <div className="container mx-auto max-w-md space-y-6 px-4 py-6">
          <Header />
          <WalletBalance />
          <RecommendedAssets />
          <MyAssets />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
