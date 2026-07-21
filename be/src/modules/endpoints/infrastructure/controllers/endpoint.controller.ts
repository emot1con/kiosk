import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EndpointService } from '../../application/endpoint.service';
import { CreateEndpointDto } from '../dto/create-endpoint.dto';
import { UpdateEndpointDto } from '../dto/update-endpoint.dto';
@ApiTags('Endpoints')
@Controller('endpoints')
export class EndpointController {
  constructor(private readonly endpointService: EndpointService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new webhook endpoint' })
  @ApiResponse({ status: 201, description: 'Endpoint successfully created' })
  create(@Body() createEndpointDto: CreateEndpointDto) {
    return this.endpointService.create(createEndpointDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all endpoints for the current user' })
  @ApiResponse({ status: 200, description: 'List of endpoints' })
  findAll() {
    return this.endpointService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific endpoint by ID' })
  @ApiResponse({ status: 200, description: 'The endpoint detail' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  findOne(@Param('id') id: string) {
    return this.endpointService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an endpoint' })
  @ApiResponse({ status: 200, description: 'The updated endpoint' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  update(@Param('id') id: string, @Body() updateEndpointDto: UpdateEndpointDto) {
    return this.endpointService.update(id, updateEndpointDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an endpoint' })
  @ApiResponse({ status: 200, description: 'Endpoint successfully deleted' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  remove(@Param('id') id: string) {
    return this.endpointService.remove(id);
  }
}
