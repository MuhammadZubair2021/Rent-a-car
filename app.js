const   express     =   require('express'),
        app         =   new express(),
        path        =   require('path'),        
        mongoose    =   require('mongoose'),
        passport    =   require('passport'),                
        bodyParser  =   require('body-parser'),        
        flash       =   require('connect-flash'),
        routes      =   require('./routes/routes'),        
        customer    =   require('./models/customers'),
        admin       =   require('./models/admin'),        
        localStrategy   = require('passport-local');      

var port ;        
//Setting up environment variables
//if we are not in the production level (in development phase/level)
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
    port = 3000 ;
}else{
    port = process.env.PORT ;
}
     
//Dababase URI (URL)
    const dbURI = process.env.dbURI ;    

// Connect to database...
mongoose.connect(dbURI,{ useNewUrlParser:true,useUnifiedTopology:true})
.then((results) => {
    console.log('Database Connected');
    }).catch(error=>
    {
        console.log(error);
    })


// Set view engine to view for ejs files
app.set('view engine','ejs') ;
app.use('/public',express.static(path.join(__dirname,'/static')));
app.use('/uploads',express.static(path.join(__dirname,'/uploads')));

//Passport Configuration....
app.use(require('express-session')({
    secret:'I am Muhammad Bilal',
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

//Set passport authentication 
    passport.use('customerLocal', new localStrategy(customer.authenticate()));
    passport.use('adminLocal', new localStrategy(admin.authenticate()));
    
//     passport.serializeUser(customer.serializeUser());
//     passport.deserializeUser(customer.deserializeUser());    


// //Set passport authentication for admin

// passport.serializeUser(admin.serializeUser());
// passport.deserializeUser(admin.deserializeUser());


//Parse the form data using body-parser module.
app.use(bodyParser.urlencoded({extended:false}));

// body parser middleware
app.use(express.json());
app.use(express.urlencoded( { extended: false } )); // this is to handle URL encoded data
// end parser middleware

app.use(flash());


//A middle ware to pass detail of current user /Customer and flash messages to every page...
app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error       = req.flash('error');
    res.locals.success     = req.flash('success');
    next();
})

app.use(routes);

app.listen(port,()=>{
    console.log('Server is listening on port : ' + port);
})