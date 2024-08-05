import { MarketEntity } from '@models/entities/market.entity';
import { Pagination } from 'nestjs-typeorm-paginate';

export class GetMarketListRequestDto {}

export class GetMarketListResponseDto extends Pagination<MarketEntity> {}
