import { IsString, IsOptional, IsIn } from 'class-validator';
import { PostCategory } from '@mansil/types';

const postCategories = Object.values(PostCategory);

export class UpdatePostDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsIn(postCategories)
    @IsOptional()
    category?: string;
}
