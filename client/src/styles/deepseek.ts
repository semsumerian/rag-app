// DeepSeek Color System
// Цветовая система DeepSeek для единообразия

export const deepSeekColors = {
  // Основные цвета
  main: {
    blue: '#509fff',
    blueHover: '#4166d5',
    blueLight: '#ebf3ff',
  },
  
  // Фоны
  bg: {
    primary: '#292a2d',      // Основной фон
    secondary: '#2f3033',    // Вторичный фон (карточки)
    sidebar: '#212327',      // Фон сайдбара
    input: '#404045',        // Фон полей ввода
    hover: '#333333',        // Фон при наведении
    active: '#2a2b2e',       // Активный фон
  },
  
  // Границы
  border: {
    primary: '#5a5a69',      // Основная граница
    secondary: 'rgba(90, 90, 105, 0.5)',  // Вторичная граница
    input: '#5a5a69',        // Граница полей ввода
  },
  
  // Текст
  text: {
    primary: '#ffffff',      // Основной текст
    secondary: '#e5e7eb',    // Вторичный текст
    muted: '#9ca3af',        // Приглушенный текст
    placeholder: '#6b7280',  // Текст плейсхолдера
  },
  
  // RGB значения для прозрачности
  rgb: {
    white: '255, 255, 255',
    black: '0, 0, 0',
    zinc: {
      200: '228, 228, 231',
      350: '161, 161, 170',
      400: '148, 163, 184',
      650: '82, 82, 91',
      750: '63, 63, 70',
    },
    neutral: {
      350: '142, 142, 147',
      400: '156, 163, 175',
      450: '120, 113, 108',
      500: '107, 114, 128',
      600: '75, 85, 99',
      650: '68, 68, 68',
      700: '55, 65, 81',
      750: '51, 51, 51',
    },
    red: {
      450: '248, 113, 113',
      500: '239, 68, 68',
      550: '220, 38, 38',
    },
  },
};

// CSS переменные для использования в inline styles
export const getDeepSeekColors = (isDark: boolean) => {
  if (!isDark) {
    return {
      // Светлая тема в стиле DeepSeek (молочные/теплые оттенки)
      bg: '#f5f5f0',              // Основной фон - теплый молочный
      bgSecondary: '#ebebe5',     // Вторичный - чуть темнее (как карточки)
      bgSidebar: '#fafaf5',       // Сайдбар - СВЕТЛЕЕ основного (инверсия DeepSeek)
      bgInput: '#ffffff',         // Поля ввода - чистый белый (самый светлый)
      bgHover: '#e0e0da',         // Hover - между основным и вторичным
      bgActive: '#f0f0ea',        // Активный - ближе к основному
      border: '#d4d4cf',          // Граница - мягкий теплый серый
      borderSecondary: 'rgba(212, 212, 207, 0.5)',
      text: '#2d2d2d',            // Текст - теплый темно-серый (не чистый черный)
      textSecondary: '#525252',   // Вторичный - средний серый
      textMuted: '#737373',       // Приглушенный
      textPlaceholder: '#9ca3af', // Плейсхолдер
      primary: '#4f46e5',         // Индиго
      primaryHover: '#4338ca',
      primaryLight: 'rgba(79, 70, 229, 0.1)',
    };
  }
  
  return {
    // Тёмная тема DeepSeek
    bg: '#292a2d',
    bgSecondary: '#2f3033',
    bgSidebar: '#212327',
    bgInput: '#404045',
    bgHover: '#333333',
    bgActive: '#2a2b2e',
    border: '#5a5a69',
    borderSecondary: 'rgba(90, 90, 105, 0.5)',
    text: '#ffffff',
    textSecondary: '#e5e7eb',
    textMuted: '#9ca3af',
    textPlaceholder: '#6b7280',
    primary: '#509fff',
    primaryHover: '#4166d5',
    primaryLight: 'rgba(80, 159, 255, 0.1)',
  };
};
