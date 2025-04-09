export interface Person {
    id: number;
    name: string;
    type: 'ACTOR' | 'DIRECTOR';
    imageUrl: string;
    birthDate: string;
    deathDate: string | null;
    nationality: string;
    biography: string;
    notableWorks: string[];
  }