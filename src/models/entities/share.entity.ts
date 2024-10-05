import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { Transform } from 'class-transformer';
import { bigint, transformBigInt } from '@shared/decorators/transformers/big-int.transformer';

@Entity({ name: 'share' })
export class ShareEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public outcomeId: string;

    @Column({ type: 'varchar' })
    public userId: string;

    @Column({ type: 'bigint', transformer: bigint })
    @Transform(transformBigInt)
    public amount: bigint = 0n;
}
