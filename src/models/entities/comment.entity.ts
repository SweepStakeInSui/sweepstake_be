import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity('comment')
export class CommentEntity extends BaseEntity {
    @Column({ type: 'varchar' })
    content: string;

    @Column({ type: 'int', default: 0 })
    likes: number;

    @Column({ type: 'simple-array', nullable: true })
    likedBy: string[];

    @Column({ type: 'varchar' })
    userId: string;

    @Column({ type: 'varchar' })
    marketId: string;

    @ManyToOne(() => CommentEntity, comment => comment.replies, { nullable: true })
    parentComment: CommentEntity;

    @OneToMany(() => CommentEntity, comment => comment.parentComment)
    replies: CommentEntity[];
}
