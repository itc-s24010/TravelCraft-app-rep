import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Compass, MapPin, Calendar, Wallet, Bell, ChevronRight, Globe2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Compass className="w-6 h-6" />
            <span className="font-serif font-bold text-xl text-foreground tracking-tight">旅行プランナー</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="font-medium hover:bg-primary/5 hover:text-primary">ログイン</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="font-semibold shadow-sm hover-elevate">はじめる</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 relative">
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground font-medium text-sm mb-6 border border-accent/30 shadow-sm">
            <Globe2 className="w-4 h-4 text-accent-foreground/70" />
            <span>あなただけの旅行パートナー</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-8 leading-[1.1]">
            次の旅を、もっと<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative inline-block">
              スマートに計画
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-accent/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            旅程・予約・予算をひとつの美しい場所にまとめて管理。<br />
            旅の興奮を、複雑な表計算で台無しにしないために。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                無料でプランを立てる
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white relative z-10 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">すべてが、あるべき場所に</h2>
            <p className="text-muted-foreground text-lg">煩雑な管理から解放されましょう。旅行プランナーがすべての詳細を整理します。</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: MapPin,
                title: "旅程＆交通",
                desc: "フライト・電車・バスなどの移動情報を一目で確認できます。",
                color: "text-primary",
                bg: "bg-primary/10"
              },
              {
                icon: Wallet,
                title: "予算管理",
                desc: "カテゴリ別に上限を設定して支出を追跡し、予算オーバーを防ぎます。",
                color: "text-secondary",
                bg: "bg-secondary/10"
              },
              {
                icon: Calendar,
                title: "カレンダー表示",
                desc: "旅程全体をカレンダーで可視化し、空白や重複をすぐに把握できます。",
                color: "text-accent-foreground",
                bg: "bg-accent/20"
              },
              {
                icon: Bell,
                title: "リマインダー",
                desc: "チェックインや乗り物の時間を、カスタム通知で絶対に見逃しません。",
                color: "text-chart-5",
                bg: "bg-chart-5/10"
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border hover:border-primary/30 bg-background hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-serif">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/30 text-center">
        <div className="flex items-center justify-center gap-2 text-primary/50 mb-4">
          <Compass className="w-5 h-5" />
          <span className="font-serif font-bold text-lg text-foreground/50">旅行プランナー</span>
        </div>
        <p className="text-muted-foreground text-sm">
          旅の計画を、もっとシンプルに。
        </p>
      </footer>
    </div>
  );
}
