// commentGenerator.ts
import { CensorReasonOption, Comment } from "./interface";

const userNames = [
  "MovieLover42", "HarshCritic", "FilmBuff99", "CasualViewer", "SciFiFan",
  "DramaQueen", "ActionHero", "ComedyKing", "RomComLover", "ThrillerMaster"
];

const movieTitles = [
  "Inception", "The Last Airbender", "Parasite", "Interstellar", "The Dark Knight",
  "The Matrix", "Avengers: Endgame", "Titanic", "Forrest Gump", "Joker"
];

const commentsList = [
  "Absolutely amazing! The cinematography was breathtaking.",
  "Terrible acting and a boring plot. Waste of time!",
  "The director really outdid themselves with this one. Oscar-worthy!",
  "Too long and drawn out, but had some good moments.",
  "Incredible visuals, but the story was weak.",
  "The best performance I've seen in years!",
  "Couldn't sit through it. Just awful.",
  "Mind-blowing! I need to watch it again.",
  "Not as good as everyone says, but still decent.",
  "This is what cinema is all about!"
];

export const censorReasonOptions: CensorReasonOption[] = [
  { value: "offensive_language", label: "Offensive Language" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "racist_content", label: "Racist Content" },
  { value: "spam", label: "Spam" },
  { value: "spoilers", label: "Spoilers" },
  { value: "other", label: "Other" }
];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const generateMockComments = (count: number): Comment[] => {
  const comments: Comment[] = [];

  for (let i = 1; i <= count; i++) {
    const name = getRandomItem(userNames);
    const userId = Math.floor(Math.random() * 1000) + 100;
    const movieTitle = getRandomItem(movieTitles);
    const movieId = Math.floor(Math.random() * 500) + 500;
    const content = getRandomItem(commentsList);
    const likes = Math.floor(Math.random() * 100);
    const replies = Math.floor(Math.random() * 20);
    const isCensored = Math.random() < 0.2;
    const createdAt = new Date(
      Date.now() - Math.floor(Math.random() * 10000000000)
    ).toISOString();

    const comment: Comment = {
      id: i,
      content,
      author: {
        id: userId,
        name,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50)}`
      },
      movieId,
      movieTitle,
      createdAt,
      likes,
      replies,
      isCensored,
      ...(isCensored && { censorReason: getRandomItem(censorReasonOptions).label })
    };
    comments.push(comment);
  }
  return comments;
};

export const mockDataComments: Comment[] = generateMockComments(50);
