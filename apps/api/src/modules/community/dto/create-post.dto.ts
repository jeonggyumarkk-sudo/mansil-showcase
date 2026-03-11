import { IsString, IsIn } from 'class-validator';
import { PostCategory } from '@mansil/types';

const postCategories = Object.values(PostCategory);

export class CreatePostDto {
    @IsString()
    title!: string;

    @IsString()
    content!: string;

    @IsIn(postCategories)
    category!: string;
}
