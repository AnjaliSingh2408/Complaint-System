import mongoose,{Schema} from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema= new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        index:true,
        trim:true//to make search faster
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    fullName:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:[true,"Password is required!!"]
    },
    role: {
        type: String,
        enum: ["citizen", "staff", "admin"],
        default: "citizen"
    },
    complaintHistory:{
        type:Schema.Types.ObjectId,
        ref:"Complaint"
    },
    isActive:{
        type:Boolean,
        default:true
    },
    refreshToken:{
        type:String
    },
}, {timestamps:true});

//info save karne ke pehle password hash karna hai, only if passwrod is modified
userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();

    //hashing the password
    this.password = await bcrypt.hash(this.password,10);
    next();
})

//we will also create methods to check whether th epasword is corect, to generate accessToken and refreshToken

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = async function(){
    return jwt.sign(
        {
            //payload
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        //sign
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken =  async function(){
    return jwt.sign({
        _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User= mongoose.model('User',userSchema);