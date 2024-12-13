import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StrategyType } from '../types/strategy';

@Injectable()
export class LoginGuard extends AuthGuard([StrategyType.Wallet, StrategyType.Email]) {}
