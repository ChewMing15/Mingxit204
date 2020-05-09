const express = require('express');
const Datastore = require('nedb');

// Multer allows for uploading of blob, install using npm install --save multer 
const multer = require('multer');
const path = require('path'); //path is a build in function

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const port = process.env.port || 3000

app.listen(port, ()=> {
    console.log(`Listening to + ${port}`);
});

const database = new Datastore('database.db');
const database2 = new Datastore('database2.db');

database.loadDatabase();
database2.loadDatabase();

// Corresponding page is signup.html
app.post(`/signUp`, async (request, response) => {
    const signup = request.body;
    signup.grade = 'normal';
    console.log(signup);

    //NEDB syntax to find existing entries in database
    await database.find({SUuser: signup.SUuser, SUpass: signup.SUpass}, (err, docs) => {

        // if docs.legth > 0, then that means there's data. Docs are in JSON format and must specific the [0] element. Refer to the /LogIn fetch function to see.
        console.log(docs)
        if (docs.length == 0) {
            database.insert(signup);
            response.json({status: 'Sign Up Successful', signal : '1'});
        } else {
            response.json({status: 'Credentials are taken, please try again', signal: '0'});
        }
    });

});

// Corresponding page is index.html (sign in page)
app.post(`/LogIn`, async (request, response) => {
    const login = request.body;
    const login_user = login.login_user;
    const login_pass = login.login_pass;

    console.log('user: ' + login_user + 'login_pass: ' + login_pass);

    // Compare user input username and password with database. If match, then doc will return 1. 
    await database.find({ SUuser: login_user, SUpass: login_pass}, (err, docs, K) => {

        if (docs.length == 1) {

            response.json({
                status: 'clear', 
                grade : docs[0].grade,
                user: login_user,
                pass: login_pass
            }); 

        } else {
            response.json({status: 'error'});
        }
    });
});

// Corresponding page is page2.html (user access control page), blank find and send back to html page
app.get('/getDatabase', (request, response) => {
    
    database.find({}, (err, docs) => {
        if (err) {
            response.end();
            console.log('problem');
            return;
        }

        response.json(docs);
    });
});

// Corresponding page is page2.html (user access control page). Use this to control username/password/grade change or delete user. 
app.post(`/changerequest`, async (request, response) => {
    const VO = request.body;
    const VO_grade = VO.getOriGrade;
    const VO_user = VO.getOriUser;
    const VO_pass = VO.getOriPass;
    const VO_target = VO.target_user;
    const VO_type = VO.change_type;
    const VO_val = VO.change_val;
    
    await database.find({SUuser: VO_user, SUpass: VO_pass, grade: VO_grade}, (err, docs) => {
        
        if(docs.length == 1) {

            if (VO_type == 'delete') {

                // Syntax to remove database
                database.remove({SUuser: VO_user, SUpass: VO_pass}, {}, (err, numRemoved) => {
                    console.log(numRemoved);
                });

                response.json({status: 'Deleted'});
            
            } else {

                if (VO_type == 'username') {
                    
                    // Syntax to update entry. Can also use do $set and set multiple with comma in between to slot more info into that slot. numreplace is the number of entry replace, expect 1 most of the time. 
                    database.update({SUuser: VO_user, SUpass: VO_pass}, {$set: {grade: VO_val}}, {}, (err, numReplaced) => {
                        console.log('numreplaced:  ' + numReplaced);
                    });
                    
                } else if (VO_type == 'password') {

                    database.update({SUuser: VO_user, SUpass: VO_pass}, {$set: {grade: VO_val}}, {}, (err, numReplaced) => {
                        console.log('numreplaced:  ' + numReplaced);
                    });

                } else if (VO_type == 'grade') {

                    database.update({SUuser: VO_user, SUpass: VO_pass}, {$set: {grade: VO_val}}, {}, (err, numReplaced) => {
                        console.log('numreplaced:  ' + numReplaced);
                    });
                }
            
                response.json({
                    status: 'Update Successful',
                    new_username: docs[0].SUuser,
                    new_password: docs[0].SUpass,
                    new_grade: docs[0].grade
                });

            }

        } else {
            response.json({status: "something went wrong, please check"});
        }
    });

});

// Multer: Specify where is this going to be show. This is the path to where the image file will be saved. Database will only save the path.
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Multer: Specify what you are uploading. Note that field> name is the name given when appending image to FormData. 
const upload = multer({
    storage: storage,
    limits:{fileSize: 10000000},
    fileFilter: function(req, file, cb) {
        checkfiletype(file, cb);
    },
}).fields([{name: 'image'}]);

// Multer: To check if image is of the right file extension
function checkfiletype (file, cb) {
    const fileExt = /jpeg|png|jpg/;
    const ext_name = fileExt.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileExt.test(file.mimetype);

    if(ext_name && mimetype) {
        return cb(null, true);
    } else {
        return cb('Error', false);
    }

}

// Multer: The usual fetch-post after the 2 multer set up above. 
app.post('/saveform', upload,(request, response) => {

    //read from upload, first image file
    console.log(request.files['image'][0]);

    //text appended after image in DataForm is considered as body. we turned the check_cred into text before fitting it into the DataForm
    const img_text = request.body.check_cred;
    const img_text_JSON = JSON.parse(img_text);
    console.log(img_text_JSON);

    try {
        if(request.files['image'][0] == undefined) {
            response.json({outcome: 'file not defined'});
        } else {
            const img_added = request.files['image'][0];

            //combining the image file details and the text bit
            const combine = {
                head: img_added,
                body: img_text_JSON
            }

            database2.insert(combine);
  
            response.json({outcome: 'Success!'});
            console.log(combine.body.description); //example on how to access the database tree (just like JSON)
         
        }
    } catch {
        
        response.json({outcome: 'Something wrong'});
    }

});