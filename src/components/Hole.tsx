import React from 'react';

interface HoleProps {
  tokens: number;
  index: number;
  isPlayerSide: boolean;
  isFront: boolean;
  isClickable: boolean;
  isHighlighted: boolean;
  isCapturing: boolean;
  onClick: () => void;
}

const Hole: React.FC<HoleProps> = ({
  tokens,
  isClickable,
  isHighlighted,
  isCapturing,
  onClick,
}) => {
  // Generate token positions inside the hole
  const tokenPositions = React.useMemo(() => {
    const positions: { x: number; y: number }[] = [];
    const maxShow = Math.min(tokens, 12);
    for (let i = 0; i < maxShow; i++) {
      const angle = (i / Math.max(maxShow, 1)) * Math.PI * 2;
      const radius = maxShow <= 4 ? 12 : maxShow <= 8 ? 16 : 18;
      positions.push({
        x: Math.cos(angle) * radius * (0.5 + Math.random() * 0.5),
        y: Math.sin(angle) * radius * (0.5 + Math.random() * 0.5),
      });
    }
    return positions;
  }, [tokens]);

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={`
        relative w-16 h-16 sm:w-20 sm:h-20 rounded-full
        bg-hole border-2 transition-all duration-200
        flex items-center justify-center
        ${isClickable
          ? 'border-hole-highlight/50 cursor-pointer hover:bg-hole-hover hover:border-hole-highlight hover:scale-105 active:scale-95'
          : 'border-border/30 cursor-default'
        }
        ${isHighlighted ? 'animate-pulse-glow border-hole-highlight' : ''}
        ${isCapturing ? 'animate-capture-flash' : ''}
      `}
      style={{
        boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      {/* Tokens visualization */}
      <div className="relative w-full h-full flex items-center justify-center">
        {tokenPositions.map((pos, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-token animate-token-drop"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              boxShadow: '0 1px 3px hsl(var(--token-shadow))',
              animationDelay: `${i * 30}ms`,
            }}
          />
        ))}
      </div>

      {/* Token count */}
      <span className={`
        absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5
        min-w-[22px] h-[22px] rounded-full text-xs font-bold
        flex items-center justify-center
        ${tokens > 0
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground'
        }
      `}>
        {tokens}
      </span>
    </button>
  );
};

export default Hole;
