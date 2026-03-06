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
        enum:["Pending","Assigned","In Progress","Resolved"],
        default:"Pending"
    },
    location:{
        address:String,//user generally not types the coordinates, they type the address and we will convert it to coordinates using geocoding
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
    },
    category: {
      type: String,
      enum: ["Infrastructure", "Sanitation", "Water", "Electricity", "Other"],
      default: "Other"
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low"
    },

});

complaintSchema.index({location:"2dsphere"})

complaintSchema.plugin(mongooseAggregatePaginate);
export const Complaint = mongoose.model('Complaint', complaintSchema)