const   mongoose                =   require('mongoose');

const   carBookingSchema  =   new mongoose.Schema({
   customerId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Customers'
      },

   carId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'cars'
      },

   phoneNumber:String,
   bookingDate:String,
   bookingDays:String,
   returningDate:String,

   //Below three var will be used for figuring out returning Date...
   returningDay:String,
   returningMonth:String,
   returningYear:String,
   
   rent:String,
   isPhoneNumberVerified:Boolean,   
},{timestamps:true});

module.exports  =   mongoose.model('carBookings',carBookingSchema);