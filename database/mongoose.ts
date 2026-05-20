import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if(!cached){
    cached = global.mongooseCache = {conn: null, promise: null};
}

export const connectToDatabase = async () => {
    if(!MONGODB_URI) throw new Error ('MONGODB_URI must be set within .env.local')
    if(cached.conn) return cached.conn;


    if(!cached.promise){
        cached.promise = mongoose.connect(MONGODB_URI, {bufferCommands: false})
    }

    try {
        cached.conn = await cached.promise
    }catch (err){
        cached.promise = null;
        throw err
    }
    // Avoid logging full connection URI which may include credentials
    const env = process.env.NODE_ENV || 'development'
    console.log(`Connected to database (${env})`)

    return cached.conn;
}