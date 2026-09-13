import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('categories')
  findCategories() {
    return this.productsService.findCategories();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Get(':id/image')
  async findImage(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: HeaderResponse,
  ) {
    const image = await this.productsService.findImage(id);
    response.setHeader('Content-Type', 'image/jpeg');
    response.setHeader('Content-Length', image.byteLength);
    response.setHeader('Cache-Control', 'public, max-age=86400');
    return new StreamableFile(image);
  }
}

interface HeaderResponse {
  setHeader(name: string, value: string | number): void;
}
