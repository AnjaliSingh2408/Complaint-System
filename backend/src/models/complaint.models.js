import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const complaintSchema = new Schema({
    complaintTitle:{
        type:String,
        required:true
    },
    complaintDescription:{
        type:String,
        required:true
    },
    complaintImage:{
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
    submittedBy:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    assignedTo:{
        type:Schema.Types.ObjectId,
        ref:"User",
        default:null
    }

});

complaintSchema.index({location:"2dsphere"})

complaintSchema.plugin(mongooseAggregatePaginate);
export const Complaint = mongoose.model('Complaint', complaintSchema)