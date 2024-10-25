import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@shared/base/models/base.entity';

@Entity('comment')
export class CommentEntity extends BaseEntity {
    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'int', default: 0 })
    likes: number;

    @Column({ type: 'simple-array', nullable: true })
    likedBy: string[];

    @Column({ type: 'varchar' })
    userId: string;

    @Column({ type: 'varchar' })
    username: string;

    @Column({ type: 'varchar', nullable: true })
    avatar?: string;

    @Column({ type: 'varchar' })
    marketId: string;

    @ManyToOne(() => CommentEntity, comment => comment.replies, { nullable: true, createForeignKeyConstraints: false })
    parentComment: CommentEntity;

    @OneToMany(() => CommentEntity, comment => comment.parentComment, {
        nullable: true,
        createForeignKeyConstraints: false,
    })
    replies: CommentEntity[];
}
