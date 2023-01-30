const { isAdminOrDbUserWithFullAuthority } = require('../Middlewares/middleware');
const customers = require('../models/customers');
const   user        =   require('../models/userModel'),
        customer    = require('../models/customers'),
        cars        = require('../models/car'),
        carFeedbacks= require('../models/carFeedbacks'),
        carBookings = require('../models/carBookings'),
        admin      = require('../models/admin'),
        shop       = require('../models/shop'),
        dbUsers     = require('../models/dbUser'),
        ideasSchema      =   require('../models/ideasModel'),                
        sgMail      =   require('@sendgrid/mail'),
        crypto      =   require('crypto');


//Setting up environment variables and links
var linkStarting ;
//if we are not in the production level (in development phase/level)
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
    linkStarting = 'http://localhost:3000';
}else{
    linkStarting = 'https://hangurentacar.herokuapp.com';
}
                        
const   client  =   require('twilio')(process.env.ACCOUNT_SID,process.env.AUTH_TOKEN);  

        
//Landing Page
const landingPage = (req,res)=>{
    res.redirect('/index');
};

//Index page...
const indexPage = (req,res)=>{
    res.render('index.ejs',{sentTitle:'Rent A Car'});
};

//Update User Get...
const updateUserGet = (req,res)=>{
    const userId = req.params.id;
    user.findById(userId)
    .then(foundUser=>{
        res.render('updateUser.ejs',{sentTitle:'Update ' + foundUser.fullName + ' detials',
                                        user:foundUser});
    })
    .catch(error=>{
        res.render('error.ejs',{sentTitle : " Page Not Found"});})
}


//update User Post ...
const updateUserPost = (req,res)=>{
    const userId = req.params.id;
    var formData = {};
    var username = req.body.email;      
    if(req.file){
        formData = {
            username:username,
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            fullName:(req.body.firstName).toLowerCase()+(req.body.lastName).toLowerCase(),          
            email:req.body.email,                        
            gender:req.body.gender,
            address:req.body.address,                        
            country:req.body.country,
            image : req.file.path,
            contactNumber:req.body.contactNumber,                    
            profession:req.body.profession,
            experience:req.body.experience,
            languages:req.body.languages,

            project1:req.body.project1,
            project2:req.body.project2,
            project3:req.body.project3,
        }
    }else{
        formData = {
            username:username,
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            fullName:(req.body.firstName).toLowerCase()+(req.body.lastName).toLowerCase(),                             
            email:req.body.email,                        
            gender:req.body.gender,
            address:req.body.address,                        
            country:req.body.country,            
            contactNumber:req.body.contactNumber,                    
            profession:req.body.profession,
            experience:req.body.experience,
            languages:req.body.languages,

            project1:req.body.project1,
            project2:req.body.project2,
            project3:req.body.project3,
        }
    }
    user.findByIdAndUpdate(userId,formData)
    .then(updatedUser=>{
        res.redirect('/userProfile/'+userId);
    })
    .catch(error=>{
        res.redirect('/userProfile/'+userId);
        console.log('Error updating User data  ' + error)
    })
}


//AddIdea Get...
const addIdeaGet = (req,res)=>{
    res.render('ideaGet.ejs',{sentTitle:'Add New Idea'});
}


// for /new Idea Post request...
const addIdeaPost = (req,res)=>
{
    let newImage = '';
    if(req.file){
        newImage = req.file.path;
         }
    else{
        newImage = 'null';
         }

    const formData = {
            author : {
                    id:req.user._id,
                    fullName:req.user.firstName + " " + req.user.lastName
                     },
                    image : newImage,
                    title : req.body.title,
                    discription : req.body.discription,
                    category : req.body.category,
                    numOfDevelopers : req.body.numOfDevelopers,
                    approved:false,                                        
                    }        
    const idea = new ideasSchema(formData);
    idea.save()
    .then(idea=>{
        // req.flash('success','New Idea added successfuly');
        
        sgMail.setApiKey(process.env.sendGridAPI);                        
        const message = {
            to : ['muhammad.zubairmz12349@gmail.com','muhammadrafi3400@gmail.com','adilzia00778@gmail.com'],
            from:{
                name: 'DPaPIC',
                email:'dpapic2021@gmail.com',
            },
            subject:'Check this idea for approvel',
            text:`
            A user want to submit new idea please have a look at that and make approved or reject the submittion
            ${linkStarting}/checkIdea/${idea._id}
            `,
            html:`
            <h1>Dear DPaPIC team member, Aslam-Alikum! </h1>
            A user want to submit new idea please have a look at its credentials and approve or reject the submittion.
            ${linkStarting}/checkIdea/${idea._id}
            `
        }
        sgMail.send(message)
        .then(response=>{
            req.flash('success','You Idea has been sent to DPaPIC team, kindly wait for approval email');
            console.log('Idea sent for approval') ;
            res.redirect('/ideas');
        })
        .catch(error=>{
            req.flash('error','Unexpected error occured. Your idea was not delivered to DPaPIC team for approval. Please try again');
            console.log('Error occured and new idea cannot sent for checking: ' + error) ;
            res.redirect('/ideas');
        })    
    })
    .catch(error=>{
        res.render('error.ejs',{sentTitle : " Page Not Found"});
     })     
}

//Check Idea for approval Get requst...
const checkIdeaGet = (req,res)=>{
    const ideaId = req.params.id;
    ideasSchema.findById(ideaId).populate('comments').exec()
    .then(foundIdea=>{
        res.render('checkIdea.ejs',{sentTitle:'Checking' + foundIdea.title,
                                        idea:foundIdea});
    })
    .catch(error=>{
        res.render('error.ejs',{sentTitle : " Page Not Found"});   
    })
}

//Idea approved
const ideaApproved =async (req,res)=>{

    const ideaId = req.params.id;    
    
    var formData={};
    if(req.file){
         formData = {                                       
                    image:req.file.path,
                    title : req.body.title,
                    discription : req.body.discription,
                    category : req.body.category,
                    numOfDevelopers : req.body.numOfDevelopers,
                    approved:true,                                       
                    }
    }else{
         formData = {                                                             
                    title : req.body.title,
                    discription : req.body.discription,
                    category : req.body.category,
                    numOfDevelopers : req.body.numOfDevelopers,
                    approved:true,                                        
                    }
    }
        
    ideasSchema.findByIdAndUpdate(ideaId,formData).populate('comments').exec()
    .then(updatedIdea=>{
        console.log('Idea approved and saving after checking');        
        
        //Send user a notification about Idea approvel        
        sgMail.setApiKey(process.env.sendGridAPI); 

        const authorId = updatedIdea.author.id;                            
        
              //Return  Author email             
                user.findById(authorId)
                .then(author=>{                    
                    const message = {
                        to : author.email,
                        from:{
                            name: 'DPaPIC',
                            email:'dpapic2021@gmail.com',
                        },
                        subject:'Your Idea has been approved',
                        text:`
                        Your new idea has been approved and displayed on DPaPIC ideas page, Please have a look
                        ${linkStarting}/ideas
                        `,
                        html:`
                        <h1>Thanks ${author.fullName}, for being a part of DPaPIC family</h1>
                        <h3>Your new idea has been approved and displayed on DPaPIC ideas page, Please have a look</h3>
                        ${linkStarting}/ideas
                        `
                    }
                    sgMail.send(message)
                    .then(response=>{
                        req.flash('success','Idea saved after approval and notification has sent to user (author)');
                        console.log('Idea saved after approval and notification has sent to user (author)') ;
                        res.redirect('/ideas');
                    })
                    .catch(error=>{
                        req.flash('error','Message not sent after idea approvel and saving');
                        console.log('Error occured and message not sent to user after idea approvel and saving ' + error) ;
                        res.redirect('/ideas');
                    })
                })
                .catch(error=>{
                    req.flash('error','Unexpected error occured finding author.');
                    return res.redirect('/ideas');
                })                      
    })
    .catch(error=>{
       req.flash('error','error saving idea after approvel, Please check log for details');
        res.redirect('/ideas');
        console.log('error saving idea after approvel ' + error );
    })
}


//idea Rejected ...
const ideaRejected = (req,res)=>{
    const ideaId = req.params.id;
    ideasSchema.findByIdAndDelete(ideaId)
    .then(foundIdea=>{
        console.log('Idea Reject awo delete shwa'); 
        
        //Send user a notification about Idea approvel        
        sgMail.setApiKey(process.env.sendGridAPI); 

        const authorId = foundIdea.author.id;                            
        
              //Return  Author email             
                user.findById(authorId)
                .then(author=>{                    
                    const message = {
                        to : author.email,
                        from:{
                            name: 'DPaPIC',
                            email:'dpapic2021@gmail.com',
                        },
                        subject:'Sorry! Your Idea was rejected by DPaPIC team',
                        text:`
                        Sorry! Your new idea was rejected by DPaPIC team. Please try adding a new one.
                        ${linkStarting}/ideas
                        `,
                        html:`
                        <h1>Thanks ${author.fullName}, for being a part of DPaPIC family</h1>
                        <h3>We are Sorry that your new idea was rejected by DPaPIC team. Please try adding a new one.</h3>
                        ${linkStarting}/ideas
                        `
                    }
                    sgMail.send(message)
                    .then(response=>{
                        req.flash('success','Idea deleted after rejection and notification has sent to user (author)');
                        console.log('Idea deleted after rejection and notification has sent to user (author)') ;
                        res.redirect('/ideas');
                    })
                    .catch(error=>{
                        req.flash('error','Message not sent after idea rejection and deletion');
                        console.log('Error occured and message not sent to user after idea approvel and saving ' + error) ;
                        res.redirect('/ideas');
                    })
                })
                .catch(error=>{
                    req.flash('error','Unexpected error occured finding author at idea rejection');
                    return res.redirect('/ideas');
                })
    })
    .catch(error=>{
        console.log('Error finding and deleting Idea ' + error);
        res.send(error);
        // res.render('error.ejs',{sentTitle : " Page Not Found"});   
    })
    
}

//Ideas Filter...
const filterIdeas = (req,res)=>{
    const givenCategory = req.body.category;
    if(givenCategory=='All'){
        ideasSchema.find()
        .then(results=>{
            res.render('ideas.ejs',{sentTitle:'Projects Ideas',ideas : results});        
        })    
        .catch(error=>{
        res.render('error.ejs',{sentTitle : " Page Not Found"});
     })
    }else{
        ideasSchema.find({category : givenCategory})    
        .then(ideas=>{
            res.render('ideas.ejs',{sentTitle:'Ideas',
                                            ideas:ideas});
        })
        .catch(error=>{
            res.render('error.ejs',{sentTitle : " Page Not Found"});   
        })
    }
   
    
}

//Ideas get...
const showOneIdea = (req,res)=>{
    const ideaId = req.params.id;
    ideasSchema.findById(ideaId).populate('comments').exec()
    .then(foundIdea=>{
        res.render('showOneIdea.ejs',{sentTitle:foundIdea.title,
                                        idea:foundIdea});
    })
    .catch(error=>{
        res.render('error.ejs',{sentTitle : " Page Not Found"});   
    })
    
}


//Modify Idea with Id get...
const modifyIdeaGet = (req,res)=>{
    const ideaId = req.params.id;
    ideasSchema.findById(ideaId).populate('comments').exec()
    .then(foundIdea=>{
        res.render('modifyIdea.ejs',{sentTitle:'Modify' + foundIdea.title,
                                        idea:foundIdea});
    })
    .catch(error=>{
        res.render('error.ejs',{sentTitle : " Page Not Found"});   
    })
    
}

//Modify Idea with Id post
const modifyIdeaPost = (req,res)=>
{
    var formData={};
    if(req.file){
         formData = {
            author : {
                    id:req.user._id,
                    fullName:req.user.firstName + " " + req.user.lastName
                     },                              
                    image:req.file.path,
                    title : req.body.title,
                    discription : req.body.discription,
                    category : req.body.category,
                    numOfDevelopers : req.body.numOfDevelopers,                                        
                    }
    }else{
         formData = {
            author : {
                    id:req.user._id,
                    fullName:req.user.firstName + " " + req.user.lastName
                     },                                                  
                    title : req.body.title,
                    discription : req.body.discription,
                    category : req.body.category,
                    numOfDevelopers : req.body.numOfDevelopers,                                        
                    }
    }
    
    const ideaId = req.params.id;
    ideasSchema.findByIdAndUpdate(ideaId,formData).populate('comments').exec()
    .then(updatedIdea=>{
        res.redirect('/showOneIdea/'+ideaId);
    })
    .catch(error=>{
        res.render('error.ejs',{sentTitle : " Page Not Found"});
        console.log('Error Updating idea' + error);
    })
}


//Delete Idea with Id...
const deleteIdea = (req,res)=>{
    const ideaId = req.params.id;
    ideasSchema.findByIdAndDelete(ideaId).populate('comments').exec()
    .then(foundIdea=>{
        console.log('Idea delete shwa');
        foundIdea.comments.forEach(comment=>{
            commentsSchema.findByIdAndDelete(comment._id)
            .then(foundComment=>{
                console.log('Comment delete sho');                
            })
            .catch(error=>{
                console.log('Error deleting comment ' + error )
            })
        })  
        res.redirect('/ideas');      
    })
    .catch(error=>{
        console.log('Error deleting Idea ' + error);
        res.render('error.ejs',{sentTitle : " Page Not Found"});   
    })
    
}




//------> Below is for rent a car website <------ //
const vehicles = (req,res)=>{
    cars.find()
    .then(cars=>{
        console.log(`Cars found and sent to vehicles page`);
        res.render('vehicles.ejs',{sentTitle:'Vehicles',
                                     sentCars:cars});
    })
    .catch(error=>{
        console.log(`error at vehicles page, ${error}`);
        req.flash(`error`, `${JSON.stringify(error)}`);
        res.redirect('/');
    })    
}

//Registration Get
const registrationGet = (req,res)=>{
    res.render('registration.ejs',{sentTitle:'Get Register'});
}

//RegistrationPost request (new customer);
const registrationPost = (req,res)=>{
    
    let customerData = {
        username : req.body.email ,     //let UserName = email for signIn purpose 
        cnic : req.body.cnic,
        fullName : req.body.fullName,
        gender : req.body.gender ,

        email : req.body.email ,
        emailToken : crypto.randomBytes(32).toString('hex'),
        isVerified : false ,
        passwordResetToken : null ,        
    }

    // register new customer with customerData
    customer.register(new customer(customerData) , req.body.password,(error,customer)=>{
        if(error){
            console.log('Error in registering new customer : \n' + error)
            req.flash('error',JSON.stringify(error));
            res.redirect('/index');
        }
        else{            
        sgMail.setApiKey(process.env.sendGridAPI);
        const message = {
            to : req.body.email,
            from : {
                name : 'Rent A Car',
                email : 'rentacar453@gmail.com'
            },
            subject: 'Kindly Confirm Your Email !',
            text:`
            Thank you for choosing us, Please verify your account. Click on below link.
            ${linkStarting}/verifyEmail?token=${customer.emailToken}
            `,
            html:`
            <h1> Wellcome to Rent A Car </h1>
            <h4>${customer.fullName} Please verify Your account.</h4>
            <p> You are recieving this email because someone has requested to be a part of 
            (Rent A Car) website. If you haven't, ignore this email. Otherwise Confirm your account by
            clicking on below link. </p>
            <p>${linkStarting}/verifyEmail?token=${customer.emailToken}</p> or click on 
            <a href="${linkStarting}/verifyEmail?token=${customer.emailToken}"> Verify Account</a>
            `
        }

        sgMail.send(message)
        .then(result=>{
            req.flash('success',`Thank You for choosing us, An email has been sent to ${customer.email}
            Kindly Verify your account`);
            res.redirect('/customer/login');
            console.log('Successfully Registered, Verification email sent');
        })
        .catch(error=>{
            req.flash('error',`Dear ${customer.fullName}, an unexpected error occured. 
                Kindly try again.`);
            res.redirect('/index');
            console.log(`Registration Error: ${error}`);
        })
        }
    })
}

//Verify Email ( Customer Email )
const verifyEmail = (req,res)=>{

    const token = req.query.token ;
    const newData = {
        isVerified : true ,
        emailToken : null 
    }
    customer.findOneAndUpdate({emailToken : token},newData)
    .then(result=>{
        console.log(`Customer Email Verified and Saved`);
        req.flash('success',`Wellcome back, All set ! Please Sign In .`)
        res.redirect('/signIn') ;
    })
    .catch(error=>{
        console.log(`Customer Email Verification Error :  ${error}`);
        req.flash('error',`An error Occured, Kindly try again ...`)
        res.redirect('/index') ;
    })
}

//car Feedback Get...
const carFeedbackGet = (req,res)=>{
    const carId = req.params.id;
    cars.findById(carId).populate('feedbacks').exec()
    .then(foundCar=>{
    res.render('carFeedback.ejs',{sentTitle:'Feedback on '+foundCar.fullName,
                                    car:foundCar});
    })
    .catch(error=>{
        res.render('error.ejs',{sentTitle : " Page Not Found"});   
    })
}


//for Comment page Post request...
const carFeedbackPost = (req,res)=>{
    const carId = req.params.id;
    const author = {
        id:req.user._id,
        fullName:req.user.fullName,
    }
    const feedbackText = req.body.text;    

        new carFeedbacks({
            author:author,
            text:feedbackText
        })
        .save()
        .then((feedback)=>{
            cars.findById(carId).populate('feedbacks').exec()
            .then((car)=>{                       
                car.feedbacks.push(feedback);
                car.save()
                .then((savedCar)=>{
                    console.log('Comment/feedback add sho');
                    req.flash('success','Comment/Feedback added successfuly');    
                    res.redirect(`/vehicles/carDetails/withId/${carId}`);
                })
                .catch((err)=>{
                    console.log('Error saving Car after feedback' + err);
                })        
            })
            .catch((error)=>{
                console.log('car not found at adding feedbackPost' + error);        
            })
        })
        .catch((err)=>{
            console.log('Comment/feedback not added ' + err)
        })
}


//Modify Comment/ feedback Get...
const modifyCarFeedbackGet = (req,res)=>{
    const carId = req.params.carId;
    const feedbackId = req.params.feedbackId;

    cars.findById(carId).populate('feedbacks').exec()
    .then(foundCar=>{
        carFeedbacks.findById(feedbackId)
        .then(foundFeedback=>{
            res.render('modifyCarFeedback.ejs',{sentTitle:'Modify Your Feedback',
                                    car:foundCar,
                                    feedback:foundFeedback});
        })
        .catch(error=>{
            res.render('error.ejs',{sentTitle:'Page not found'});
            console.log('Error in finding feedback at modify Feedback Get'+ error);
        })    
    })
    .catch(error=>{
        res.render('error.ejs',{sentTitle : " Page Not Found"}); 
        console.log('Error in finding car at modify feedback Get'+ error);
    })
}


//Modify feedback / comment Post request
const modifyCarFeedbackPost = (req,res)=>{
    const carId = req.params.carId;
    const feedbackId = req.params.feedbackId;
    
    const author = {
        id:req.user._id,
        fullName:req.user.fullName,
    }
    const commentText = req.body.text;

    var formData = {
        author:author,
        text:commentText,
    }
    cars.findById(carId).populate('feedbacks').exec()
    .then(foundCar=>{
        carFeedbacks.findByIdAndUpdate(feedbackId,formData)
        .then(updatedFeedback=>{
            console.log('Comment/feedback Successfully updated');
            req.flash('success','Feedback successfuly updated');    
            res.redirect(`/vehicles/carDetails/withId/${carId}`);
        })
        .catch(error=>{
            res.render('error.ejs',{sentTitle:'Page not found'});
            console.log('Error finding feedback at modifyFeedback,'+ error);
        })    
    })
    .catch(error=>{
        res.render('error.ejs',{sentTitle : " Page Not Found"}); 
        console.log('Error finding Car at modifyFeedback,'+ error);
    })

}

//DeleteComment
const deleteCarFeedback = (req,res)=>{
    
    const carId = req.params.carId;
    const feedbackId = req.params.feedbackId;

    cars.findById(carId).populate('feedbacks').exec()
        .then(foundCar=>{            
            carFeedbacks.findByIdAndDelete(feedbackId)
            .then((feedback)=>{
                console.log('Comment/feedback Delete sho');
                req.flash('success','Feedback successfuly Deleted');    
                res.redirect(`/vehicles/carDetails/withId/${carId}`);
            })
            .catch((error)=>{
                console.log('feedback not found at deleteFeedback'+error);
                req.flash('error',JSON.stringify(error));    
                res.redirect(`/vehicles/carDetails/withId/${carId}`);               
            })            
        })    
        .catch(error=>{
            console.log('Car not found at deleteFeedback'+error);
            req.flash('error',JSON.stringify(error));    
            res.redirect(`/vehicles/carDetails/withId/${carId}`);    
    })
}

//Login get request...
const customerLogin = (req,res)=>{
    res.render('login.ejs',{sentTitle:'Sign In / Log In'});
}

//-----  Login Post are performed in routes.js module ------ //

// Show car registration form
const carRegistrationGet = (req,res)=>{
    res.render('carRegistration.ejs',{sentTitle:'Register New car'})
}

// Car registration post request
const carRegistrationPost = async (req,res)=>{
    
    let formData = {        
        fullName        :   req.body.fullName,
        displayImage    :   req.file.path,       
        model           :   req.body.model,
        drivingMode     :   req.body.drivingMode,
        rentPerDay      :   req.body.rentPerDay,
        airCondition    :   req.body.airCondition,
        engineCapacity  :   req.body.engineCapacity,
        seatCapacity    :   req.body.seatCapacity,
        colour          :   req.body.colour,
        details         :   req.body.details,
        status          :   'Available', // By default mark as available
    }
    //formData object ends next register/add car with formData(details)
  
    new cars(formData)
    .save()
    .then(newCar=>{
        console.log(`Car successfully registered`);
        req.flash('success',`Wellcome back, new Car registered`)
        res.redirect(`/adminPanel/2/cars`) ;
    })
    .catch(error=>{
        console.log(`Car registration Error :  ${error}`);
        req.flash('error',`An error Occured, Kindly try again ...`)
        res.redirect('/adminPanel/2/cars') ;
    })

}

//Reset Password Get 
const resetPasswordGetEmail = (req,res)=>{
    res.render('resetPasswordEmail.ejs',{sentTitle:'Provide an Email'});
}
const resetPasswordEmail = async (req,res)=>{
    const email = req.body.email ;

    // First Find email in Db 
    await customer.findOne({email:email})
    .then(foundCustomer=>{
        //set an password reset token (that will be unique for each user...)
        const newToken = crypto.randomBytes(32).toString('hex');
        
        //Now update user with the generated token ...
        customer.findOneAndUpdate({email:email},{passwordResetToken:newToken},{new:true})
        .then(returnedCustomer=>{
             // Now send an email to found customer email for reseting password ...             
             sgMail.setApiKey(process.env.sendGridAPI);
             const message = {
                 to : email ,
                 from :{
                     name : 'Rent a Car',
                     email:'rentacar453@gmail.com'
                 },
                 subject :'Request for reseting password',
                 text:`
                 SomeOne has requested to reset password  for this email, If you haven't kindly ignore
                 this email. If you have requested then kindly click on below link for password reset.
                 ${linkStarting}/verifyPasswordToken?token=${returnedCustomer.passwordResetToken}
                 `,
                 html:`
                 <h1>Hi, ${returnedCustomer.fullName}</h1>
                 <p> You are recieving this email because someone has requested to reset
                 password for this email. If you haven't, ignore this email. Otherwise kindly,
                 click on below link to reset password for ${returnedCustomer.email} </p>
                 <p>${linkStarting}/verifyPasswordToken?token=${returnedCustomer.passwordResetToken}</p> or click on 
                 <a href="${linkStarting}/verifyPasswordToken?token=${returnedCustomer.passwordResetToken}"> Verify Account</a>
                 `
             }
             sgMail.send(message)
             .then(msg=>{
                 req.flash('success',`Email sent to ${returnedCustomer.email}, kindly check you inbox to reset password`);
                 res.redirect('/index');
                 console.log('Password reseting email sent.');
             })
             .catch(error=>{
                 console.log(`Error in sending Reseting password email ${error}`);
                 req.flash(`error`,`Reseting password email not sent, Kindly try again !`);
                 res.redirect('/index') ;
             })
        })
        .catch(error=>{
            console.log(`Error in Customer Updation, Error : ${error}`);
        })

    })
    .catch(error=>{
        console.log(`Email Not found for reseting Password : \n ${error}`);
        req.flash(`error`,`Email not exists, Kindly register yourself!`);
        res.redirect('/index') ;
    })
}

//verifyPasswordToken Get
const verifyPasswordToken = (req,res)=>{
    const token = req.query.token;
    customer.findOne({passwordResetToken:token})
    .then(customer=>{
        res.render('resetPassword.ejs',{sentTitle:`Password Reset`,sentToken:token});
    })
    .catch(error=>{
        req.flash(`error`,`Invalid or Expired link, send another forgot Password request .`);
        console.log(`Invalid or expired link, send another forgot password request : ${error}`);
        res.redirect('/index');
    })
}

//VerifyPasswordToken Post
const verifyPasswordTokenPost = async (req,res)=>{
    const token = req.body.token ;
    console.log("token: " + token)
    console.log("req.body.token: " + req.body.token)

    const foundCustomer = await customer.findOneAndUpdate({passwordResetToken:token},
                                                        {passwordResetToken:null},
                                                        {new:true});
    try {
        await foundCustomer.setPassword(req.body.password);
        await foundCustomer.save()
        .then(customer=>{
            req.flash(`success`,`Password successfuly reset for: ${foundCustomer.email}`);
            console.log(`Password Successfully reseted : `);
            res.redirect('/index');
        })
        .catch(error=>{
            req.flash(`error`,`Error in reseting password`);
            console.log(`Error in saving reseted Password, Error : ${error}`);
            res.redirect('/index');
        })
    } catch (error) {
        req.flash(`error`,`Invalid or Expired link, send another forgot Password request .`);
        console.log(`Invalid or expired link, send another forgot password request : ${error}`);
        res.redirect('/index');
    }
}

//Car bookingForm Get
const carBookingForm = (req,res)=>{
    let customerId  = req.user._id,
        carId       = req.params.carId;

    customer.findById(customerId)
    .then(foundCustomer=>{
        cars.findById(carId)
        .then(foundCar=>{
            res.render('carBookingForm.ejs',{sentTitle:"Car Reservation"
                                            ,car:foundCar
                                            ,customer:foundCustomer});
        })
        .catch(error=>{
            req.flash(`error`,`Car Not Found Error, try again`);
            console.log(`error in findingCar at carBookingForm : ${error}`);
            res.redirect('/vehicles');
        })
    })
    .catch(error=>{
        req.flash(`error`,`Invalid or Expired link, send another forgot Password request .`);
        console.log(`error in finding Customer at carBookingForm : ${error}`);
        res.redirect('/vehicles');
    })    
}

//Car booking Post request...
const carBookingPost = async(req,res)=>{
    let calculatedRent, returningDate ,

    //Car returning date preperation ...
    returningDay = 0,
    returningMonth = 0,
    returningYear = 0,

    car , customer , carId, customerId ;

    //Initialize carId and CustomerId
    carId = req.params.carId;
    customerId = req.params.customerId;

    // Firt find not Verified bookings for the phone Number
    await carBookings.find({phoneNumber : req.body.phoneNumber}).populate('customerId').exec()
    .then(foundBookings=>{
        foundBookings.forEach(booking=>{
            if(!booking.isPhoneNumberVerified){
                carBookings.findByIdAndDelete(booking._id)
                .then(foundBooking=>{
                    req.flash(`error`,
                    `Sorry! A reservation with ${req.body.phoneNumber} by 
                    ${booking.customerId.fullName} Was not verified and has been removed.`);                    

                    console.log(`A reservation with ${req.body.phoneNumber} by 
                    ${booking.customerId.fullName} was not verified and has been removed.`)
                })
                .catch(error=>{
                    console.log('Found No Reservations for not verified phoneNumber');
                });                
            }
        })
    })

    //First let find car then calculate rent and figure out the returning date for the reserving car    
    await cars.findById(carId)
    .then(foundCar=>{        
        car = foundCar ;

        // Returning Date and total Rent Calculation ... // ... //
        const   bookingDate = req.body.bookingDate,
                bookingDays = parseInt(req.body.bookingDays);                                                    

            //Find out booking day , month and year by slicing bookingDate value ...
            let bookingDay = parseInt(bookingDate.slice(8)),
                bookingMonth = parseInt(bookingDate.slice(5,8));
                bookingYear =  parseInt(bookingDate.slice(0,4));             

            //Number of days in each month ...
            let january = 31,feberuary = 28,march=31,april=30,may=31,june=30,july=31,august=31,september=30,october=31,november=30,december=31;
            
            let totalDays = bookingDays + bookingDay ;

            //Recognize month, then add days according to that month
            switch(bookingMonth){
                case 1 : 
                //check is a function that has three arguments(bookingYear,bookingMonth,totalDays);
                check(bookingYear,january , totalDays);                       
                break;
                case 2:
                check(bookingYear,feberuary,totalDays);
                break;
                case 3:
                check(bookingYear,march,totalDays);
                break;
                case 4:
                check(bookingYear,april,totalDays);
                break;
                case 5:
                check(bookingYear,may,totalDays);
                break;
                case 6:
                check(bookingYear,june,totalDays);
                break;
                case 7:
                check(bookingYear,july,totalDays);
                break;
                case 8:
                check(bookingYear,august,totalDays);
                break;
                case 9:
                check(bookingYear,september,totalDays);
                break;
                case 10:
                check(bookingYear,october,totalDays);
                break;
                case 11:
                check(bookingYear,november,totalDays);
                break;
                case 12:
                check(bookingYear,december,totalDays);
                break;
                default:
                req.flash(`error`,`Something Wrong in choosing Booking Month !`);
                res.redirect('/vehicles/reserveCar/withIds/'+carId);
                break;
            }

            // Function for checking days,month and year.
            function check(year, month, days){
                if(days > month){
                    returningDay = (days - month);
                    returningMonth = (bookingMonth+1) ;  

                    if(returningMonth > 12){
                    returningMonth = (returningMonth - 12) ;              
                    returningYear = (year + 1) ;              
                }
                else{
                    returningYear = year ;
                }
                }
                
                else{
                    returningDay = days ;
                    returningMonth = bookingMonth;
                    returningYear = year ;                          
                }
                //set the value of returning date input box.
                returningDate = returningDay + "-" + returningMonth + "-" + returningYear;            
            } 
            calculatedRent = (parseInt(req.body.bookingDays)) * (parseInt(foundCar.rentPerDay));            
        // End of returning Date and total Rent Calculation ... // ... //             
    })
    .catch(error=>{
        req.flash(`error`,`Error: Car Not Found, try again`);
        console.log(`error in findingCar at carBooking Post : ${error}`);
        res.redirect('/vehicles');
    })

    //Second let's find the customer
    await customers.findById(customerId)
    .then(foundCustomer=>{
        customer = foundCustomer ;                   
    })
    .catch(error=>{
        req.flash(`error`,`Sorry: Sustomer Not Found, try again`);
        console.log(`error in findingCustomer at carBooking Post : ${error}`);
        res.redirect('/vehicles');
    })
    
    //Now sent OTP to the phoneNumber and generate formData
    client
    .verify
    .services(process.env.VERIFY_SERVICE_SID)
    .verifications
    .create({
        to : req.body.phoneNumber,
        channel : 'sms'
    })
    .then(data=>{
        let formData = {
            customerId      :   customer, //Save complete customer in customerId
            carId           :   car,       //Save complete Car in CarId
            phoneNumber     :   req.body.phoneNumber,
            bookingDate     :   req.body.bookingDate,
            bookingDays     :   req.body.bookingDays,
            returningDate   :   returningDate,

            returningDay    : returningDay,
            returningMonth  : returningMonth,
            returningYear   : returningYear,
            
            rent            :   calculatedRent,
            isPhoneNumberVerified : false
        }

        new carBookings(formData)
        .save()
        .then(newBooking=>{           
            req.flash('success','Complete Your Reservation by Verifying Phone Number');
            console.log(`Code sent to ${formData.phoneNumber}`);
            res.redirect(`/verifyOTP/${formData.phoneNumber}/${carId}/${newBooking._id}`);
        })
        .catch(error=>{
            req.flash(`error`,`Error: Car Not Found, try again`);
            console.log(`error in (new carBookings) at carBooking Post : ${error}`);
            res.redirect('/vehicles');
        })        
    })
    .catch(error=>{
        console.log(error);
        req.flash('error','Invalid Phone Number');
        res.redirect('/vehicles/reserveCar/withIds/'+req.params.carId);
    })
            
}

//Verify phoneNUmber OTP Get
const verifyOTPGet = (req,res)=>{    
    res.render('verifyPhoneNumber.ejs',{sentTitle:'Verify PhoneNumber',
                                        phoneNumber : req.params.phoneNumber,
                                        carId       : req.params.carId,
                                        bookingId   : req.params.bookingId})
}

const verifyOTPPost = (req,res)=>{
    //First store Parameters in veriables
    const phoneNumber = req.params.phoneNumber,
          carId       = req.params.carId,
          bookingId   = req.params.bookingId;
    
    //Now Verify Code and reserve Car
    client
    .verify
    .services(process.env.VERIFY_SERVICE_SID)
    .verificationChecks
    .create({
        to : phoneNumber,
        code : req.body.code,
    })
    .then(data=>{
        if(data.valid){
            let carName;

            cars.findByIdAndUpdate(carId,{status:'Reserved'})
            .then(foundCar=>{

                //Change the isPhoneNumberVerified into true
                carBookings.findByIdAndUpdate(bookingId,{isPhoneNumberVerified : true})            
                .then(foundBooking=>{
                    customers.findById(foundBooking.customerId).populate('myBookings').exec()
                        .then((foundCustomer)=>{                       
                            foundCustomer.myBookings.push(foundBooking);
                            foundCustomer.save()
                            .then((savedCustomer)=>{
                                carName = foundCar.fullName;
                                console.log('Car Reserved and Status changed to (Reserved)');
                                req.flash('success',`Great! We have reserved ${carName} for You`);
                                res.redirect(`/customer/dashboard/2/reservations`);
                            })
                            .catch((err)=>{
                                console.log('Error saving Car after feedback' + err);
                            })        
                        })
                        .catch((error)=>{
                            console.log('car not found at adding feedbackPost' + error);        
                        })

                })
                .catch(error=>{
                    req.flash('error',`Car Bookings Not found, try again`);
                    res.redirect(`/verifyOTP/${phoneNumber}/${carId}/${bookingId}`);
                }) 

            })
            .catch(error=>{
                req.flash(`error`,`Error: Car Not Found, try again`);
                console.log(`error in findingCar at carBooking Post : ${error}`);
                res.redirect('/vehicles');
            })
            return true;
        }
        else{
            req.flash('error','Wrong Or Expired Code, try again');
            console.log('Error at Verifying OTP : ' + error)
            res.redirect(`/verifyOTP/${phoneNumber}/${carId}/${bookingId}`);       
            return false;
        }        
        
    })
    .catch(error=>{        
        console.log('Error at Verifying OTP : ' + error)
        res.redirect(`/verifyOTP/${phoneNumber}/${carId}/${bookingId}`);
    })
}

//Send OTP Again using SMS or Make a call
const sendOTPAgain = async (req,res)=>{
    let 
    phoneNumber =   req.params.phoneNumber,
    carId       =   req.params.carId,
    bookingId   =   req.params.bookingId,
    channel     =   req.params.channel;

    
    //Now sent OTP to the phoneNumber with the specified channel
    client
    .verify
    .services(process.env.VERIFY_SERVICE_SID)
    .verifications
    .create({
        to : phoneNumber,
        channel : channel
    })
    .then(data=>{               
        req.flash('success',`OTP sent through ${channel}`);
        console.log(`Code sent to ${phoneNumber} through ${channel}`);
        res.redirect(`/verifyOTP/${phoneNumber}/${carId}/${bookingId}`);
    })
    .catch(error=>{
        console.log(`error while sending OTP again ${error}`);
        req.flash('error','An Unexpected error Occured');
        res.redirect('/vehicles/reserveCar/withIds/'+req.params.carId);
    })
    
}

//Single Car Details
const carDetails = (req,res)=>{
    let carId = req.params.id;
    cars.findById(carId).populate('feedbacks').exec()
    .then(foundCar=>{
        console.log(`Car found and sent to Car details page`);
        res.render('carDetail.ejs',{sentTitle : "Car Details",
                                sentCar : foundCar});
    })
    .catch(error=>{
        console.log(`Error in finding car, ${error}`);
        req.flash(`error`,`${JSON.stringify(error)}`);
        res.redirect('/');
    })
    
}

//Issued Cars Get
const issuedCars = (req,res)=>{
    cars.find({status:'Reserved'}).populate('feedbacks').exec()
    .then(foundCars=>{
        console.log(`Cars found and sent to vehicles page`);
        res.render('issuedCars.ejs',{sentTitle:' Issued/Reserved Cars',
                                     sentCars:foundCars});
    })
    .catch(error=>{
        console.log(`error at vehicles page, ${error}`);
        req.flash(`error`, `${JSON.stringify(error)}`);
        res.redirect('/');
    }) 
}

//Mark/Make a reutrned car as available for others
const makeAvailable = (req,res)=>{
    let carId = req.params.carId ;
    cars.findByIdAndUpdate(carId,{status:'Available'})
    .then(foundCar=>{
        req.flash('success','Vehicle Make as available for others');
        res.redirect('/issuedCars');
    })
    .catch(error=>{
        req.flash('error','Error: '+JSON.stringify(error));
        res.redirect('/issuedCars');
    })
}

// Dashboard (Customer dashboard)
const dashboard = async (req,res)=>{
    let     customerId  = req.user._id,
            amount = req.params.amount,
            customer,
            bookings,
            cars;
    
    await customers.findById(customerId).populate('myBookings').exec()
    .then(foundCustomer=>{    
        carBookings.find({customerId : customerId}).populate([{
            path: 'carId',
            model: 'cars',
            populate: {
            path: 'feedbacks',
            model: 'carFeedbacks'
        }}])
        .exec()
        .then( bookings=>{
                                            
            res.render('dashboard.ejs',{sentTitle:'Dashboard',
                                            customer:foundCustomer,
                                            reservations:bookings,
                                            amount:amount                                           
                                                    })    
        })
        .catch(error=>{
            req.flash('error','bookings Not found, try again');
            res.redirect('/vehicles');
            console.log('Error in finding Customer bookings at dashboard \n '+error)
        })                            
    })
    .catch(error=>{
        req.flash('error','Customer Not found, try again');
        res.redirect('/vehicles');
        console.log('Error in finding Customer  at dashboard \n '+error)
    })        
}

// Admin Login page request
const adminLogin = (req,res)=>{
    res.render('adminLogin.ejs',{sentTitle:'Admin Login'});
}

// Admin Panel
const adminPanel =async (req,res)=>{
    let amount = req.params.amount ;
    let flag = req.params.flag ;
      

    admin.findOne({email:'bilalkpk520@gmail.com'})
    .then(foundAdmin=>{
        
        //Render (find) all the customer .
        customer.find()
        .populate([{
                    path: 'myBookings',
                    model: 'carBookings',
                    populate:{
                        path: 'carId',
                        model: 'cars',
                        populate:{
                            path: 'feedbacks',
                            model:'carFeedbacks',
                        }
                    }                  
        }])
        .exec()
        .then(foundCustomer=>{            
            //Now renders (find) all db users
            dbUsers.find()
            .then(foundDbUser=>{            
                //New renders (find) the shop details 
                shop.find()
                .then(foundShop=>{
                    cars.find().populate('feedbacks').exec()
                    .then(foundCar=>{
                        console.log(`Cars found and sent to AdminPanel page`);
                         //Finally pass the admin, dbUsers and Customers to adminPanel page.
                            res.render('adminPanel.ejs',{sentTitle:'Admin Panel',
                            admin : foundAdmin ,
                            customers:foundCustomer,
                            cars : foundCar ,
                            dbUsers:foundDbUser,
                            shop:foundShop,
                            amount:amount,
                            flag:flag});
                    })
                    .catch(error=>{
                        console.log(`error in finding Cars at adminPanel page, ${error}`);
                        req.flash(`error`, `${JSON.stringify(error)}`);
                        res.redirect('/adminpanel/2/cars');
                    }) 
                })
                .catch(error=>{
                    console.log(`error in finding shop at adminPanel page, ${error}`);
                    req.flash('error',JSON.stringify(error));
                    res.redirect('/index')
                })                
            })
            .catch(error=>{
                console.log(`error in finding dbUsers at adminPanel page, ${error}`);
                req.flash('error',JSON.stringify(error));
                res.redirect('/index')
            })
        })
        .catch(error=>{
            console.log(`error in finding Customers at adminPanel page, ${error}`);
            req.flash('error',JSON.stringify(error));
            res.redirect('/index')
        })
    })
    .catch(error=>{
        console.log(`error in finding admin at adminPanel page, ${error}`);
        req.flash('error',JSON.stringify(error));
        res.redirect('/index')
    })
}

//Update Admin Profile details 
const updateAdminProfile = (req,res)=>{
    const adminId = req.params.id ;
    let newData = {
        cnic : req.body.cnic,
        fullName : req.body.fullName,

        email : req.body.email ,
        phoneNumber : req.body.phoneNumber ,
    }

    admin.findByIdAndUpdate(adminId,newData)
    .then(updatedAdmin=>{
        req.flash(`success`,`Profile Successfully Updated`);
        res.redirect('/adminPanel/2/customers');
    })
    .catch(error=>{
        req.flash(`error`,`An unexpected error occured ${error}`);
        console.log(`Error occured while updating admin profile Error: ${error}`);
    })
}


//Delete Customer with id
const deleteCustomer = (req,res)=>{
    let customerId = req.params.id;
    customers.findByIdAndDelete(customerId)
    .then(customer=>{
        req.flash('success',`Customer Successfully deleted from DB`);
        res.redirect('/adminPanel/2/customers');
        console.log('CustomerSuccessfully deleted from DB');
    })
    .catch(error=>{
        console.log('Error in deleting Customer : \n' + error)
        req.flash('error',JSON.stringify(error));
        res.redirect('/adminPanel/2/customers');
    })
}

// Add internal Images to car with id
const addInternalImagesToCar = (req,res)=>{
    let carId = req.params.id;
    cars.findById(carId)
    .then(foundCar=>{
        if(foundCar.internalImages.length == 4){
            req.flash('error',`Car has already 4 internal Images`)
            res.redirect('/adminPanel/2/customers');
        }
        else{
            if(req.files.length>4){
                req.flash('error',`You are trying to add more than 4, internal Images`)
                res.redirect('/adminPanel/2/customers');
            }
            else{                
               req.files.forEach(file=>{
                    foundCar.internalImages.push(file.path);
                })
                foundCar.save()
                .then(updatedCar=>{
                    req.flash('success',`Car internal Images have successfully added`);
                    res.redirect('/adminPanel/2/customers');
                    console.log('Car internal Images have successfully added');
                })
                .catch(error=>{
                    req.flash('error',`An error occured, try again`)
                    console.log('Error at saving car after adding internal images ' + error);
                    res.redirect('/adminPanel/2/customers');
                })                
            }
        }
    })
}
//Change admin Password 
const changeAdminPassword = async (req,res)=>{

    const   adminId     =   req.params.id ,
            oldPassword =   req.body.oldPassword ,
            newPassword =   req.body.password ;
    
    try {
        let foundAdmin = await admin.findById(adminId) ;
        await foundAdmin.changePassword(oldPassword,newPassword,(error)=>{
            if(error){
                req.flash(`error`,`${error}`);
                console.log(`Error occured while changing admin password: ${error}`);
                res.redirect('/adminPanel/2/customers');
            }
            else{
                foundAdmin.save()
                .then(updatedAdmin=>{
                    req.flash(`success`,`Password Successfully changed`);
                    console.log(`Password Successfully changed`);
                    res.redirect('/adminPanel/2/customers');
                })
                .catch(error=>{
                    req.flash(`error`,`Error occured while saving admin after password change ${error}`);
                    console.log(`Error occured while saving admin after password change, Error: ${error}`);
                    res.redirect('/adminPanel/2/customers');
                })
            }       
        })
        
    } catch (error) {
        req.flash(`error`,`Error in finding admin at Change password ${error}`);
        console.log(`Error in finding admin at Change password, Error: ${error}`);
    } 
}

//shopRegistration Get request
const shopRegistrationGet = (req,res)=>{
    res.render('shopRegistration.ejs',{sentTitle:'Register Shop'});
}

//Shop Registration post request 
const shopRegistrationPost = async (req,res)=>{
    let shopDetails ;
    try{
        let foundAdmin = await admin.findOne({email:'bilalkpk520@gmail.com'});
        shopDetails = {
                fullName : req.body.fullName,
                ownerDetails : {
                    id:foundAdmin._id,                
                },
                address : req.body.address ,
                email : req.body.email ,
                phoneNumber : req.body.phoneNumber,
            }
        console.log(`Admin found at Shop registration`);
    }
    catch(error){
        req.flash('error',`Sorry ! , ${JSON.stringify(error)}`);
        res.redirect('/adminPanel/2/customers');
        console.log('Error in finding Admin' + error);
    }      
    
    //Now add shop with details.
    new shop(shopDetails)
    .save()
    .then(returnedShop=>{
        req.flash('success',`Shop successfully registered`);
        res.redirect('/adminPanel/2/customers');
        console.log('Shop Successfully registered');
    })
    .catch(error=>{
        req.flash('error',`Sorry ! , ${JSON.stringify(error)}`);
        res.redirect('/adminPanel/2/customers');
        console.log('Error in registering shop' + error);
    })
}

// Database user (db user registration)
const dbUserRegistrationGet = (req,res)=>{
    res.render('dbUserRegistration.ejs',{sentTitle:'Db User Registration'});
}

//Databse user (db user registration post)
const dbUserRegistrationPost = (req,res)=>{
    let userData = {
        username : req.body.email ,     //let UserName = email for signIn purpose 
        cnic : req.body.cnic,
        fullName : req.body.fullName,

        email : req.body.email ,
        passwordResetToken : null ,
        phoneNumber : req.body.phoneNumber ,

        role:req.body.role,
        disable:false,
    }

    // register new customer with customerData
    dbUsers.register(new dbUsers(userData) , req.body.password,(error,customer)=>{
        if(error){
            console.log('Error in registering database User : \n' + error)
            req.flash('error',JSON.stringify(error));
            res.redirect('/adminPanel/2/customers');
        }
        else{
            req.flash('success',`Database User added Successfully With
                                (${customer.role})  role(s)`);
            res.redirect('/adminPanel/2/customers');
            console.log('New Database User added Successfully');
        }
    })
}

//Modify dbUser with id
const modifyDbUser = (req,res)=>{
    let dbUserId = req.params.id;
    let newData = {        
        cnic : req.body.cnic,
        fullName : req.body.fullName,

        email : req.body.email ,        
        phoneNumber : req.body.phoneNumber ,

        role:req.body.role,        
    }

    dbUsers.findByIdAndUpdate(dbUserId,newData)
    .then(updatedUser=>{
        req.flash('success',`Database User ${updatedUser.fullName} Successfully Updated`);
        res.redirect('/adminPanel/2/customers');
        console.log('Database User Successfully updated');
    })
    .catch(error=>{
        console.log('Error in updating database User : \n' + error)
        req.flash('error',JSON.stringify(error));
        res.redirect('/adminPanel/2/customers');
    })
}

//Delete dbUser with id
const deleteDbUser = (req,res)=>{
    let dbUserId = req.params.id;
    dbUsers.findByIdAndDelete(dbUserId)
    .then(user=>{
        req.flash('success',`Database User Successfully deleted from DB`);
        res.redirect('/adminPanel/2/customers');
        console.log('Database User Successfully deleted from DB');
    })
    .catch(error=>{
        console.log('Error in deleting database User : \n' + error)
        req.flash('error',JSON.stringify(error));
        res.redirect('/adminPanel/2/customers');
    })
}

// disable DbUser
const disableDbUser = async (req,res)=>{
    let dbUserId = req.params.id;
    try {
        await dbUsers.findByIdAndUpdate(dbUserId,{disable:true})
        .then(returendUser=>{
            req.flash('success',`Database User ${returendUser.fullName} Successfully Disabled`);
            res.redirect('/adminPanel/2/customers');
            console.log('Database User Successfully Disabled');
        })
        .catch (error=>{
            console.log('Error in disabling database User : \n' + error)
            req.flash('error',JSON.stringify(error));
            res.redirect('/adminPanel/2/customers');
        })           
    }catch(error){
        console.log('Error in finding database User at disable dbUser : \n' + error)
        req.flash('error',JSON.stringify(error));
        res.redirect('/adminPanel/2/customers');
    }
}

// enable DbUser
const enableDbUser = async (req,res)=>{
    let dbUserId = req.params.id;
    try {
        await dbUsers.findByIdAndUpdate(dbUserId,{disable:false})
        .then(returendUser=>{           
            req.flash('success',`Database User ${returendUser.fullName} Successfully Enabled`);
            res.redirect('/adminPanel/2/customers');
            console.log('Database User Successfully Enabled');
        })
        .catch (error=>{
            console.log('Error in Enabling database User : \n' + error)
            req.flash('error',JSON.stringify(error));
            res.redirect('/adminPanel/2/customers');
        })           
    }catch(error){
        console.log('Error in finding database User at enable dbUser : \n' + error)
        req.flash('error',JSON.stringify(error));
        res.redirect('/adminPanel/2/customers');
    }
}

//ContactUs Form submission
const contactUs = (req, res) => {
    var textBody = `FROM: ${req.body.name} EMAIL: ${req.body.email} MESSAGE: ${req.body.message}`,
        htmlBody = `<h2>Mail From Contact Form</h2><p>from: ${req.body.name} <a href="mailto:${req.body.email}">${req.body.email}</a></p><p>${req.body.message}</p>`;    
    sgMail.setApiKey(process.env.sendGridAPI)
    const msg = {        
      to: 'bilalkpk520@gmail.com',
      from:{
          name:'Rent A Car',
          email : 'rentacar453@gmail.com'
      } ,
      subject: 'Mail From (Rent A Car) Contact Form',
      text: textBody,
      html: htmlBody,
    }
    sgMail
      .send(msg)
      .then(() => {
        console.log('Contact form Message sent')
        req.flash('success','Thank you for contacting us, we will reach you as soon as possible.')
        res.redirect('/index#contact-us');
      })
      .catch((error) => {
            console.log('Contact form Message sending Error : ')
            console.log(error);
            req.flash('error','Message not sent: an error occured, check your credentials and try again.');
            res.redirect('/index#contact-us');
      })}

// for page not found request
const pageNotFound = (req,res)=>
{
    res.render('error.ejs',{sentTitle : " Page Not Found"});   
}

module.exports = {
    landingPage,
    indexPage,       
    updateUserGet,
    updateUserPost,
    addIdeaGet,
    addIdeaPost,
    checkIdeaGet,
    ideaApproved,
    ideaRejected,    
    filterIdeas,
    showOneIdea,
    modifyIdeaGet,
    modifyIdeaPost,
    deleteIdea,

    registrationGet,
    registrationPost,
    vehicles,
    verifyEmail,
    customerLogin,
    
    carFeedbackGet,
    carFeedbackPost,
    modifyCarFeedbackGet,
    modifyCarFeedbackPost,
    deleteCarFeedback,

    carRegistrationGet,
    carRegistrationPost,
    resetPasswordGetEmail,
    resetPasswordEmail,
    verifyPasswordToken,
    verifyPasswordTokenPost,
    carBookingForm,
    carBookingPost,
    verifyOTPGet,
    verifyOTPPost,
    sendOTPAgain,
    carDetails,
    issuedCars,
    makeAvailable,
    dashboard,
    adminLogin,
    adminPanel,
    shopRegistrationGet,
    shopRegistrationPost,
    updateAdminProfile,
    deleteCustomer,
    addInternalImagesToCar,
    changeAdminPassword,
    dbUserRegistrationGet,
    dbUserRegistrationPost,
    modifyDbUser,
    deleteDbUser,
    disableDbUser,
    enableDbUser,    
    contactUs,
    pageNotFound, 
}