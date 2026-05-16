import { COLORS as SHARED_COLORS } from '@/lib/constants';

export const COLORS = {
  ...SHARED_COLORS,
  warning: '#FF9800',
};

export const CRYSTAL_THEME = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes gold-pulse {
    0%, 100% { box-shadow: 0 0 15px rgba(212, 175, 55, 0.4); }
    50% { box-shadow: 0 0 30px rgba(212, 175, 55, 0.7); }
  }
  .crystal-bg {
    background: linear-gradient(135deg, 
      #2d1b4e 0%, 
      #1a0a2e 15%,
      #4a2c6a 30%,
      #6B4C9A 50%,
      #3d2666 70%,
      #1a0a2e 85%,
      #2d1b4e 100%
    );
    background-size: 400% 400%;
    animation: gradient-shift 12s ease infinite;
    position: relative;
    overflow: hidden;
  }
  .crystal-bg::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(ellipse at 15% 15%, rgba(212, 175, 55, 0.25) 0%, transparent 50%),
      radial-gradient(ellipse at 85% 85%, rgba(107, 76, 154, 0.3) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 30%, rgba(212, 175, 55, 0.15) 0%, transparent 40%);
    animation: shimmer 6s linear infinite;
    pointer-events: none;
  }
  .crystal-bg::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 70%, rgba(212, 175, 55, 0.1) 0%, transparent 20%),
      radial-gradient(circle at 80% 20%, rgba(107, 76, 154, 0.15) 0%, transparent 25%),
      radial-gradient(circle at 60% 80%, rgba(32, 178, 170, 0.08) 0%, transparent 20%);
    animation: shimmer 10s linear infinite reverse;
    pointer-events: none;
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 16px;
    animation: gold-pulse 4s ease-in-out infinite;
  }
  .glass-card-subtle {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
  }
  .gold-glow {
    text-shadow: 0 0 10px rgba(212, 175, 55, 0.6), 0 0 20px rgba(212, 175, 55, 0.4);
  }
  .gold-border {
    border-color: rgba(212, 175, 55, 0.5) !important;
  }
  .purple-glow {
    text-shadow: 0 0 8px rgba(107, 76, 154, 0.5);
  }
  .MuiButton-outlined {
    border-color: rgba(100, 149, 237, 0.9) !important;
    color: #6495ED !important;
    background: rgba(100, 149, 237, 0.1) !important;
  }
  .MuiButton-outlined:hover {
    border-color: #4169E1 !important;
    background: rgba(100, 149, 237, 0.25) !important;
  }
`;
