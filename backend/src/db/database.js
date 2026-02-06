import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js';
import { DB_STRING } from '../constants.js';

const connectDB = async() =>{
    try {
        const connectionInstance = await mongoose.connect(`${DB_STRING}/${DB_NAME}`)
        console.log(`\n MongoDB Connected!! DB Host: ${connectionInstance.connection.host}`)
    }
    catch(error){
        console.log("MongoDB Connection Failed!!", error);
        process.exit(1);
    }
}
export default connectDB;