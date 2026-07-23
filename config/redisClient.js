const redis = require("redis");
const { promisify } = require("util");

// Redis config comes from env vars. If unset, caching is skipped (app still runs).
// Create a free Redis Cloud instance and put these 3 values in .env (optional, for Phase II).
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

let redisClient = null;

if (REDIS_HOST && REDIS_PORT) {
    redisClient = redis.createClient(Number(REDIS_PORT), REDIS_HOST, {
        no_ready_check: true,
        // Fail commands immediately when Redis is down (don't hang) so the Mongo fallback runs
        enable_offline_queue: false,
        // Don't keep hitting DNS for a dead host - give up after a few attempts
        retry_strategy: function (options) {
            if (options.attempt > 3) return undefined;
            return 1000;
        },
    });

    if (REDIS_PASSWORD) {
        redisClient.auth(REDIS_PASSWORD, function (err) {
            if (err) console.log("Redis auth error:", err.message);
        });
    }

    // CRITICAL: without this handler the whole process crashes when Redis goes down
    redisClient.on("error", function (err) {
        console.log("Redis error (skipping cache, falling back to Mongo):", err.message);
    });

    redisClient.on("connect", function () {
        console.log("Connected to Redis..");
    });
} else {
    console.log("ℹ️  No Redis config found - caching disabled, app runs on Mongo only.");
}

const SET_ASYNC = redisClient ? promisify(redisClient.SET).bind(redisClient) : null;
const GET_ASYNC = redisClient ? promisify(redisClient.GET).bind(redisClient) : null;

// Safe wrappers: if Redis is missing/fails, return null/no-op so the app never crashes or hangs
const safeGet = async function (key) {
    if (!GET_ASYNC) return null;
    try {
        return await GET_ASYNC(key);
    } catch (e) {
        return null;
    }
};

const safeSet = async function (key, value) {
    if (!SET_ASYNC) return null;
    try {
        return await SET_ASYNC(key, value);
    } catch (e) {
        return null;
    }
};

module.exports = { safeGet, safeSet };
