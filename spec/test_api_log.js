var log = api.log.create('bunyan', {
	name : 'test-logging'
});

log.info('hi from info');
log.error('yo from error');