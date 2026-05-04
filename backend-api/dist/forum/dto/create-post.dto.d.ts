export declare class CreatePostDto {
    title: string;
    content: string;
    type: 'dev' | 'cyber';
    tags?: string[];
    severity?: 'low' | 'medium' | 'high' | 'critical';
}
