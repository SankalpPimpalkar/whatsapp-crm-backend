import mongoose from "mongoose";

function mongodbConnection(url){
    mongoose.connect(url)
    .then(() => {
        console.log('🍀 Mongodb connnection successful')
    })
    .catch((err) => {
        console.log('❌ Mongodb connection failed', err)
        process.exit(1)
    })
}

export default mongodbConnection