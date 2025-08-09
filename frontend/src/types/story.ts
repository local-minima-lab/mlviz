export interface StoryPage {
    component: string;
    parameters: TrainingParameters;
}

export interface Story {
    name: string;
    description?: string;
    pages: StoryPage[];
}

export interface StoryConfig {
    stories: Record<string, Story>;
}

export type TrainingParameters = Record<string, any>;
