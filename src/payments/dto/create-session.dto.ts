import { Type } from 'class-transformer';
import {
	ArrayMinSize,
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsPositive,
	IsString,
	ValidateNested,
} from 'class-validator';

export class CreateSessionDto {
	@IsString()
	@IsNotEmpty()
	orderId: string;

	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => CreateSessionItemDto)
	items: CreateSessionItemDto[];
}

class CreateSessionItemDto {
	@IsString()
	@IsNotEmpty()
	public name: string;

	@IsNumber()
	@IsPositive()
	public price: number;

	@IsNumber()
	@IsPositive()
	public quantity: number;
}
