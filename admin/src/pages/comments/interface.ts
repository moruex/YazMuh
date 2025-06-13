// interfaces.ts

export interface CensorReasonOption {
    value: string;
    label: string;
}

export interface Comment {
    id: number;
    content: string;
    author: {
        id: number;
        name: string;
        avatar?: string;
    };
    movieId: number;
    movieTitle: string;
    createdAt: string;
    updatedAt?: string;
    isCensored: boolean;
    censorReason?: string;
    likes: number;
    replies: number;
}
