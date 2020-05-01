const express = require('express');
const Datastore = require('nedb');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const port = process.env.port || 3000

app.listen(port, ()=> {
    console.log(`Listening to + ${port}`);
});

const database = new Datastore('database.db');
database.loadDatabase();

app.post(`/signUp`, async (request, response) => {
    const signup = request.body;
    signup.grade = 'normal';
    console.log(signup);

    await database.find({SUuser: signup.SUuser, SUpass: signup.SUpass}, (err, docs) => {

        console.log(docs)
        if (docs.length == 0) {
            database.insert(signup);
            response.json({status: 'Sign Up Successful', signal : '1'});
        } else {
            response.json({status: 'Credentials are taken, please try again', signal: '0'});
        }
    });

});

app.post(`/LogIn`, async (request, response) => {
    const login = request.body;
    const login_user = login.login_user;
    const login_pass = login.login_pass;

    console.log('user: ' + login_user + 'login_pass: ' + login_pass);

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

app.post(`/changerequest`, async (request, response) => {
    const VO = request.body;
    const VO_grade = VO.getOriGrade;
    const VO_user = VO.getOriUser;
    const VO_pass = VO.getOriPass;
    const VO_target = VO.target_user;
    const VO_type = VO.change_type;
    const VO_val = VO.change_val;
    
    // findChanges_user = findChanges_json.getOriUser;
    // console.log(findChanges_user);
    await database.find({SUuser: VO_user, SUpass: VO_pass, grade: VO_grade}, (err, docs) => {
        
        if(docs.length == 1) {

            if (VO_type == 'username') {
               
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
                Status: 'Update Successful',
                new_username: docs[0].SUuser,
                new_password: docs[0].SUpass,
                new_grade: docs[0].grade
            });

        } else {
            response.json({status: "something went wrong, please check"});
        }
    });

});