import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { beforeEach, describe, it } from 'node:test';

describe('AutController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

});

