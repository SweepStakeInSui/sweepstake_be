import { BaseEntity } from '@shared/base/models/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'oracle' })
export class OracleEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    public marketId: string;

    @Column({ type: 'varchar', unique: true })
    public questionId: string;

    @Column({ type: 'varchar', nullable: true })
    public requestHash: string;

    @Column({ type: 'varchar', nullable: true })
    public settleHash: string;

    @Column({ type: 'varchar', nullable: true })
    public winner?: boolean;
}
