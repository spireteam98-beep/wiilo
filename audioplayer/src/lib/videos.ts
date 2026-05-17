export interface Subtitle {
  label: string;
  lang: string;
  src: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailId: string;
  subtitles: Subtitle[];
}

export const videos: Video[] = [
  {
    id: 'big-buck-bunny',
    title: 'Equalizer',
    description: 'A large and lovable rabbit deals with three mischievous rodents.',
    videoUrl: '/video/movies/Equalizer.mp4',
    thumbnailId: 'big-buck-bunny-thumbnail',
    subtitles: [
      {
        label: 'English',
        lang: 'en',
        src: '/subtitles/big-buck-bunny-en.vtt',
      },
      {
        label: 'Español',
        lang: 'es',
        src: '/subtitles/big-buck-bunny-es.vtt',
      },
    ],
  },
  {
    id: 'elephants-dream',
    title: 'Elephants Dream',
    description: 'The first-ever open movie, made with open source graphics software.',
    videoUrl: '/video/movies/scandal/scandal005.mkv',
    thumbnailId: 'elephants-dream-thumbnail', // You would add this to placeholder-images.json
    subtitles: [],
  },
    {
    id: 'for-bigger-blazes',
    title: 'For Bigger Blazes',
    description: 'A short film by Google.',
    videoUrl: '/video/movies/public Enemy.mp4',
    thumbnailId: 'for-bigger-blazes-thumbnail',
    subtitles: [],
  },
];
