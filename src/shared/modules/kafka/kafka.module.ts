import { Global, Module } from '@nestjs/common';
import { KafkaProducerService } from './services/kafka-producer.service';
import { KafkaConsumerService } from './services/kafka-consumer.service';

const services = [KafkaProducerService, KafkaConsumerService];

@Global()
@Module({
    imports: [],
    providers: [...services],
    exports: [...services],
})
export class KafkaModule {}
