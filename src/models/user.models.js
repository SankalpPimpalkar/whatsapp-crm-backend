import mongoose from "mongoose";

let userSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true,
        unique: true
    },
    integrationTokens:{
        hubspot:{
            acces_token:{
                type: String,
                required: true
            },
            refresh_token:{
                type: String,
                required: true
            },
            expires_in:{
                type: Number,
                required: true
            }
        }
    }
});

export const User = mongoose.model("User",userSchema);