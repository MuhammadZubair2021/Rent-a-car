const mongoose = require('mongoose');
const feedbackSchema = new mongoose.Schema({
    author:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'customers'
        },
        fullName:String,
    },
    //text is for comment text..
    text:String
},{timestamps:true});

module.exports = mongoose.model('carFeedbacks',feedbackSchema);
