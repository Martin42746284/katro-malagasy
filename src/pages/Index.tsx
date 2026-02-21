import KatroBoard from '@/components/KatroBoard';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 animate-slide-up">
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground tracking-wide">
          K<span className="text-primary">A</span>TRO
        </h1>
        <p className="text-sm text-muted-foreground mt-2 tracking-widest uppercase">
          Jeu de stratégie Malagasy
        </p>
      </div>

      {/* Game */}
      <KatroBoard />

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          Application de théorie des graphes
        </p>
      </div>
    </div>
  );
};

export default Index;
