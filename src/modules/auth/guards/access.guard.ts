import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GuardType } from '../types/guard';

@Injectable()
export class AccessGuard extends AuthGuard(GuardType.Access) {}
