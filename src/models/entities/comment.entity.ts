import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from '@models/entities/user.entity';
import { MarketEntity } from '@models/entities/market.entity';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity('comments')
export class CommentEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    content: string;

    @ManyToOne(() => UserEntity, user => user.comments)
    user: UserEntity;

    @ManyToOne(() => MarketEntity, market => market.comments)
    market: MarketEntity;

    @ManyToOne(() => CommentEntity, comment => comment.replies, { nullable: true })
    parentComment: CommentEntity;

    @OneToMany(() => CommentEntity, comment => comment.parentComment)
    replies: CommentEntity[];
}
