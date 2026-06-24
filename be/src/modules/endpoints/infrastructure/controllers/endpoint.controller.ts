import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EndpointService } from '../../application/endpoint.service';
import { CreateEndpointDto } from '../../application/dto/create-endpoint.dto';
import { UpdateEndpointDto } from '../../application/dto/update-endpoint.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Endpoints')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('endpoints')
export class EndpointController {
  constructor(private readonly endpointService: EndpointService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new webhook endpoint' })
  @ApiResponse({ status: 201, description: 'Endpoint successfully created' })
  create(@Request() req, @Body() createEndpointDto: CreateEndpointDto) {
    return this.endpointService.create(req.user.id, createEndpointDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all endpoints for the current user' })
  @ApiResponse({ status: 200, description: 'List of endpoints' })
  findAll(@Request() req) {
    return this.endpointService.findAllByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific endpoint by ID' })
  @ApiResponse({ status: 200, description: 'The endpoint detail' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.endpointService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an endpoint' })
  @ApiResponse({ status: 200, description: 'The updated endpoint' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  update(@Request() req, @Param('id') id: string, @Body() updateEndpointDto: UpdateEndpointDto) {
    return this.endpointService.update(id, req.user.id, updateEndpointDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an endpoint' })
  @ApiResponse({ status: 200, description: 'Endpoint successfully deleted' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  remove(@Request() req, @Param('id') id: string) {
    return this.endpointService.remove(id, req.user.id);
  }
}
