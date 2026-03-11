import { IsString, IsBoolean, IsIn } from 'class-validator';

export class RecordConsentDto {
  @IsIn(['privacy_policy', 'terms_of_service', 'marketing'])
  type!: string;

  @IsString()
  version!: string;

  @IsBoolean()
  accepted!: boolean;
}
