import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { bigint, transformBigInt } from '@shared/decorators/transformers/big-int.transformer';
import { Transform } from 'class-transformer';
import { SnapshotTime } from '@modules/analytic/types/snapshot.type';

@Entity({ name: 'price-snapshot' })
export class SnapshotPriceEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    outcomeId: string;

    @Column({ type: 'bigint', nullable: true, transformer: bigint })
    @Transform(transformBigInt)
    price?: bigint;

    @Column({ type: 'int' })
    timestamp: number;

    @Column({ type: 'enum', enum: SnapshotTime, default: SnapshotTime.OneDay })
    snapshotTime: SnapshotTime;
}