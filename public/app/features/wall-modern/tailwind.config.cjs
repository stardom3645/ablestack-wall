module.exports = {
  content: ['./public/app/features/wall-modern/**/*.{ts,tsx}'],
  prefix: 'wl-',
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: { primary: 'var(--wall-primary)', muted: 'var(--wall-muted)', surface: 'var(--wall-surface)' },
      fontFamily: { sans: ['Inter', '"Pretendard"', '"Noto Sans KR"', 'sans-serif'] },
    },
  },
};
