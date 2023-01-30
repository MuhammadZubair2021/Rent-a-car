const   user            =   require("../models/userModel"),
        ideasSchema     =   require('../models/ideasModel'),
        carFeedbacks  =   require('../models/carFeedbacks'),
        admin           =   require('../models/admin'),
        customers       =   require('../models/customers'),
        cars            =   require('../models/car'),
        dbUsers         =   require('../models/dbUser'),        
        passport        =   require('passport');


//MiddleWare function for checking user is logged in or not.
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    else{
        req.flash('error','Kindly, Log In to Continue');
        res.redirect('/customer/login');
        return false ;
    }
    
}

//MiddleWare function for checking Admin is logged in or not.
function isAdminLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    else{
        req.flash('error','Kindly, Log In to Continue');
        res.redirect('/index/admin-login');
        return false ;
    }    
}


//Check Customer Registration for Reseting Password...
const isEmailRegistered = (req,res,next)=>{    
    let  customerEmailArray = [];
     
     customers.find()
     .then(customers =>{        
         customers.forEach(oneCustomer=>
             {                
                 customerEmailArray.push(oneCustomer.email)
             }) 
                     
              if((customerEmailArray.indexOf(req.body.email))== -1){
                 req.flash('error',`Provided email don't exists`);
                 return res.redirect('/customer/login');
 
              }            
             else{               
                 return next();
             }        
     })
         .catch(error=>{
             console.log(error);
             req.flash('error','Error at finding customers, try again');
             return res.redirect('/customer/login');                       
     }) 
 }

//Check Car availability
function isCarAvailable(req,res,next){
    let carId = req.params.carId ;
    cars.findById(carId)
    .then(foundCar=>{
        if(foundCar.status == 'Available'){
            console.log('Car Availability checked, Status: Available');
            return next();           
        }
        else{
            req.flash('error','Sorry! Already Reserved');
            res.redirect('/vehicles');
            return false ;
        }
    })
    .catch(error=>{
        req.flash('error','Car Not Found, try again');
        res.redirect('/vehicles');
        return false ;
    })
}

//Check that current user is admin / dbUser with read and Write role
async function isAdminOrDbUserWithFullAuthority(req,res,next){
        let currentUser = req.user;

        try {
            const   foundAdmin         = await admin.findOne({email:'bilalkpk520@gmail.com'}),
                    foundUsers    = await dbUsers.find();   
            
           if((currentUser._id).equals(foundAdmin._id)){            
               return next();
            }

            await foundUsers.forEach(dbUser=>{
                if((currentUser._id).equals(dbUser._id)){                
                    dbUserFlag = 'on';
                   return next()
                }
            })               
                    req.flash(`error`,`You are not allowed to do so.`)
                    res.redirect('/vehicles');                
               
        } catch (error) {
            req.flash(`error`,`Unexpected error occured, try again`);
            console.log(`Error at finding admin and dbUsers at isAdmin(), ${error}`);
            res.redirect('/vehicles')
        }
         
}


//MiddleWare function for checking user is authorized to edit or delete campground?
function checkUserIdeaOwnership(req,res,next){
    const ideaId = req.params.id;
    if(req.isAuthenticated()){
        ideasSchema.findById(ideaId)
        .then((foundIdea)=>{
            if(foundIdea.author.id.equals(req.user.id)){                
                next();
            }
            else {                            
                res.redirect('/showOneIdea/'+ideaId);
            }
        })
    }
    else{
        console.log('you need to be logged in');
        req.flash('error','Please login first');       
        res.redirect('/signIn');
    }
}


//MiddleWare function for checking user is authorized to edit or delete comment?
function checkUserCommentOwnership(req,res,next){
    if(req.isAuthenticated()){
        commentsSchema.findById(req.params.commentId)
        .then((foundComment)=>{
            if(foundComment.author.id.equals(req.user.id)){                
                next();
            }
            else {
                console.log('You are not authorized to do this');
                req.flash('error','You are not authorized to do this');               
                res.redirect('..');
            }
        })
    }
    else{
        console.log('you need to be logged in');
        req.flash('error','Please login first');   
        res.redirect('signIn');
    }
}

//Check user Login credentials (input data)...
const checkLoginCredentials = (req,res,next)=>{    
   let  customerEmailArray = [];
    
    customers.find()
    .then(customers =>{        
        customers.forEach(oneCustomer=>
            {                
                customerEmailArray.push(oneCustomer.email)
            }) 
                    
             if((customerEmailArray.indexOf(req.body.username))== -1){
                req.flash('error',`Email not registered`);
                return res.redirect('/customer/login');

             }            
            else{               
                return next();
            }        
    })
        .catch(error=>{
            console.log(error);
            req.flash('error','Invalid Credentials, Please try again.');
            return res.redirect('/customer/login');                       
    }) 

}

//Check for user account verification...
const checkAccountVerification = (req,res,next)=>{
    customers.find({username:req.body.username})
    .then(foundUser=>{        
        if(foundUser[0].isVerified){
           return next();
        }
        else{
            req.flash('error','Account not verified, Kindly verify your account by clicking on the link sent to '+ foundUser[0].email);
            res.redirect('/customer/login');
        }
    })
    .catch(error=>{
        req.flash('error','Something went wrong, please try again') ;
        res.redirect('/customer/login');
    })
}

//Serialize Customer with Passport
const serializeCustomer = async (req,res,next)=>{
    passport.serializeUser(customers.serializeUser());
    passport.deserializeUser(customers.deserializeUser());
    return next();
}


//Serialize Admin with Passport
const serializeAdmin = async (req,res,next)=>{
    passport.serializeUser(admin.serializeUser());
    passport.deserializeUser(admin.deserializeUser());
    return next();
}

//finally export all the middleware functions
module.exports = {
    isLoggedIn,
    isAdminLoggedIn,
    isCarAvailable,
    isEmailRegistered,
    isAdminOrDbUserWithFullAuthority,
    checkLoginCredentials,
    checkAccountVerification,
    checkUserIdeaOwnership,
    checkUserCommentOwnership,
    serializeCustomer,
    serializeAdmin, 
}