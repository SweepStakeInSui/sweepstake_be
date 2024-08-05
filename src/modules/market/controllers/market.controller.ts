import { MarketService } from '../services/market.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Logger } from 'log4js';
import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { GetMarketListRequestDto, GetMarketListResponseDto } from '../dtos/get-market-list.dto';

@ApiTags('market')
// @UseGuards(UserGuard)
@Controller('market')
export class MarketController {
    constructor(
        private loggerService: LoggerService,
        private marketService: MarketService,
    ) {
        this.logger = this.loggerService.getLogger(MarketController.name);
    }

    private logger: Logger;

    @Get('/')
    // @ApiBearerAuth()
    @ApiOperation({
        description: '',
    })
    @ApiOkResponsePayload(GetMarketListResponseDto, EApiOkResponsePayload.OBJECT, true)
    async getMarketList(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ): Promise<GetMarketListRequestDto> {
        limit = limit > 100 ? 100 : limit;
        return this.marketService.paginate({
            page,
            limit,
        });

        // const result: GetInvestorListResponseDto = {
        //     investors: investors.map((i): InvestorOutput => {
        //         return {
        //             ...i,
        //             proof: proofs[i.id],
        //             history: histories[i.id],
        //         };
        //     }),
        // };
        // return result;
    }

    // @Get('/:id')
    // @ApiBearerAuth()
    // @ApiOperation({
    //     description: 'Get investor by wallet address with claim proof and claim history',
    // })
    // @ApiOkResponsePayload(GetInvestorListResponseDto, EApiOkRespon sePayload.ARRAY)
    // async getInvestor(@Param() params: GetInvestorParamsDto): Promise<GetInvestorResponseDto> {
    //     const investor = await this.marketService.find({
    //         address: params.address,
    //     });

    //     const proof = await this.marketService.getProof([investor.id]);

    //     const history = await this.marketService.getHistory([investor.id]);
    //     return {
    //         ...investor,
    //         proof: proof[investor.id],
    //         history: history[investor.id],
    //     };
    // }

    // @Post('/investor')
    // @ApiBearerAuth()
    // @ApiOperation({
    //     description: 'Create new investor',
    // })
    // @ApiOkResponsePayload(CreateInvestorResponseDto, EApiOkResponsePayload.OBJECT)
    // async createInvestor(@Body() body: CreateInvestorRequestDto): Promise<CreateInvestorResponseDto> {
    //     this.logger.info(body);

    //     const result = await this.marketService.create(body);

    //     return {
    //         ...result,
    //     };
    // }

    // @Patch('/investor/:id')
    // @ApiBearerAuth()
    // @ApiParam({
    //     name: 'id',
    //     type: 'number',
    // })
    // @ApiOperation({
    //     description:
    //         'Update investor by id (so we can update new wallet address and keep the claim history), only need to pass the field you want to update',
    // })
    // @ApiOkResponsePayload(UpdateInvestorResponseDto, EApiOkResponsePayload.OBJECT)
    // async updateInvestor(
    //     @Param() params: UpdateInvestorParamsDto,
    //     @Body() body: UpdateInvestorRequestDto,
    // ): Promise<UpdateInvestorResponseDto> {
    //     this.logger.info(body);

    //     const result = await this.marketService.update(params.id, body);

    //     return {
    //         ...result,
    //     };
    // }

    // @Delete('/investor/:id')
    // @ApiBearerAuth()
    // @ApiParam({
    //     name: 'id',
    //     type: 'number',
    // })
    // @ApiOperation({
    //     description: 'Delete investor by id',
    // })
    // @ApiOkResponsePayload(DeleteInvestorResponseDto, EApiOkResponsePayload.OBJECT)
    // async deleteInvestor(
    //     @Param()
    //     params: DeleteInvestorParamsDto,
    // ): Promise<DeleteInvestorResponseDto> {
    //     const result = await this.marketService.delete(params.id);

    //     return {
    //         id: result,
    //     };
    // }

    // @Get('/root')
    // @ApiBearerAuth()
    // @ApiOperation({
    //     description: 'Get root of claim merkle tree to update in smart contract',
    // })
    // @ApiOkResponsePayload(GetRootResponseDto, EApiOkResponsePayload.OBJECT)
    // async getRootHash(): Promise<GetRootResponseDto> {
    //     const root = await this.marketService.getRoot();

    //     return {
    //         root,
    //     };
    // }

    // @Post('/root')
    // @ApiBearerAuth()
    // @ApiOperation({
    //     description: 'Create new claim merkle tree with current investor data',
    // })
    // @ApiOkResponsePayload(UpdateRootResponseDto, EApiOkResponsePayload.OBJECT)
    // async updateRootHash(): Promise<UpdateRootResponseDto> {
    //     const root = await this.marketService.updateRoot();

    //     return {
    //         root,
    //     };
    // }
}
