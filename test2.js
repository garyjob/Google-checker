var redis = require('redis');
redisClient = redis.createClient(6379, "localhost");

redisClient.on('error', function(error) {
  console.log("Redis Client error : "+error);
});

redisClient.lpush("somelist", "something");



