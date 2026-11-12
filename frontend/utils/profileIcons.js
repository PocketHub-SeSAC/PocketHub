/* 프로필 아이콘 목록 (Could 기능, 명세서에 없는 API — README 담당 1 메모 참고)
   서버·목업에는 키 문자열만 저장한다. 그림은 components/common/profileIconArt.js */
export const PROFILE_ICONS = [
  { key: 'cat', label: '고양이' },
  { key: 'dog', label: '강아지' },
  { key: 'rabbit', label: '토끼' },
  { key: 'bear', label: '곰' },
  { key: 'penguin', label: '펭귄' },
  { key: 'chick', label: '병아리' },
  { key: 'sprout', label: '새싹' },
  { key: 'snail', label: '달팽이' },
  { key: 'acorn', label: '도토리' },
  { key: 'cloud', label: '구름' },
  { key: 'mushroom', label: '버섯' },
  { key: 'star', label: '별' },
];
export const PROFILE_ICON_KEYS = PROFILE_ICONS.map((x) => x.key);
export const iconLabel = (key) => (PROFILE_ICONS.find((x) => x.key === key) || {}).label || '';
