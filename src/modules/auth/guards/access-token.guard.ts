import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StrategyType } from '../types/strategy';

@Injectable()
export class AccessTokenGuard extends AuthGuard(StrategyType.AccessToken) {}
