import { useState } from 'react';
import { Edit2 } from 'lucide-react';

interface BackgroundHeroSectionProps {
  imageUrl: string;
  imagePosition?: string;
  overlayOpacity?: number;
  height?: string;
  onEditClick?: () => void;
  children: React.ReactNode;
}

export function BackgroundHeroSection({
  imageUrl,
  imagePosition = 'center',
  overlayOpacity = 0.5,
  height = 'h-96',
  onEditClick,
  children,
}: BackgroundHeroSectionProps) {
  const [isHovering, setIsHovering] = useState(false);

  const overlayStyle = {
    background: `linear-gradient(to bottom, rgba(0, 0, 0, ${overlayOpacity * 0.8}), rgba(0, 0, 0, ${overlayOpacity}), rgba(0, 0, 0, ${overlayOpacity * 1.2}))`,
  };

  return (
    <div
      className={`relative ${height} bg-cover bg-center flex items-center justify-center group overflow-hidden`}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: imagePosition,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute inset-0 z-0" style={overlayStyle} />

      {onEditClick && isHovering && (
        <button
          onClick={onEditClick}
          className="absolute top-6 right-6 z-20 p-3 bg-white/90 hover:bg-white rounded-xl shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          title="Change background image"
        >
          <Edit2 className="w-5 h-5 text-gray-700" />
        </button>
      )}

      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
