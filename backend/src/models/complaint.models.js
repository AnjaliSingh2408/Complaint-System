import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const complaintSchema = new Schema({
    complainDescription:{
        type:String,
        required:true
    },
    complainImage:{
        type:[String]
    },
    complaintStatus:{
        type:String,
        enum:["Pending","In Progress","Resolved"],
        default:"Pending"
    },
    location:{
        type:{
            type:String,
            enum:["Point"],
            required:true
        },
        coordinates:{
            type:[Number],
            required:true
        }
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    }

});

complaintSchema.index({loctaion:"2dsphere"})

complaintSchema.plugin(mongooseAggregatePaginate);
export const Complaint = mongoose.model('Complaint', complaintSchema)