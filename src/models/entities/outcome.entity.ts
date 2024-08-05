import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';
import { OutcomeType } from '@modules/market/types/outcome';

@Entity({ name: 'outcome' })
export class OutcomeEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    marketId: string;

    @Column({
        type: 'enum',
        enum: OutcomeType,
        default: OutcomeType.Yes,
    })
    type: OutcomeType;
}
