class LiveClass {
	constructor(classId) {
		this.classId = classId;
		this.transports = [];
		this.producers = [];
		this.consumers = [];
		this.remotePorts = [];
		this.process = undefined;
	}

	addTransport(transport) {
		this.transports.push(transport);
	}

	getTransport(transportId) {
		return this.transports.find((transport) => transport.id === transportId);
	}

	addProducer(producer) {
		this.producers.push(producer);
	}

	getProducer(producerId) {
		return this.producers.find((producer) => producer.id === producerId);
	}

	addConsumer(consumer) {
		return this.consumers.push(consumer);
	}

	getConsumer(consumerId) {
		return this.consumers.find((consumer) => consumer.id === consumerId);
	}

	getProducersByKind(kind) {
		return this.producers.filter((producer) => producer.kind === kind);
	}

	getConsumersByKind(kind) {
		return this.consumers.filter((consumer) => consumer.kind === kind);
	}
}

export default LiveClass;
