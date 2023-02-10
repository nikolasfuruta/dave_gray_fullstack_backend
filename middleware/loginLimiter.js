const rateLimit = require('express-rate-limit');
const { logEvents } = require('./logger');

const loginLimiter = rateLimit({
	windowMs: 60 * 1000, //1 minute
	max: 5, //limit each IP to 5 login req. per window/minute
	message: {
		message:
			'Too many login attemps from this IP, please try again after a 60s pause',
	},
	handler: (req, res, next, options) => {
		const msg = `Too Many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`;
		logEvents(msg, 'errLog.log');
		res.status(options.statusCode).send(options.message);
	},
	standardHeaders: true, //return rate limit info in the 'RateLimit-*' headers
	legacyHeaders: false, //disable the 'x-RateLimit-*' headers
});


module.exports = loginLimiter