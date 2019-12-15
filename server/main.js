require('dotenv').config();
const fs = require('fs');
const request= require('request');
const morgan = require('morgan');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');

const express = require('express');
const path = require('path');
const db = require('./dbutil');
const CONFIGFILE = './config.js';

// MYSQL config
if (fs.existsSync(CONFIGFILE)) {
	console.log("config.js exists");
	config = require(CONFIGFILE);
	config.ssl = {
		ca: fs.readFileSync(config.mysql.cacert)
    }
} else {
	console.log("config.js does not exist so use environment variables");
	config = {
		mysql: {
			host: process.env.DB_HOST, //these are the heroku config variables
			port: process.env.DB_PORT,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_DATABASE,
			connectionLimit: 4,
			ssl: {
				ca: process.env.DB_CA
			}
		},
		s3:{
			accessKey: process.env.S3_ACCESS_KEY,
			secret: process.env.S3_SECRET_KEY
		},
		mongodb: {
			url: process.env.MONGO_URL
		},
		tokenSecret: process.env.TOKEN_SECRET,
		edamam_api: {
			appId: process.env.EDAMAM_API_ID, 
			appKey: process.env.EDAMAM_API_KEY
		},
		google_auth: {
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: process.env.GOOGLE_CALLBACK_URL
		}
	};
}
//console.log("config=", config);

const fileUpload = multer({ dest: __dirname + '/tmp' });
const { loadConfig, testConnections } = require('./initdb');
const conns = loadConfig(config);
const PORT = parseInt(process.argv[2] || process.env.APP_PORT || process.env.PORT) || 3000;

// MySQL
const pool = conns.mysql;
const FIND_USER = 'select count(*) as user_count from user where username = ? and password = sha1(?)';
const findUser = db.mkQueryFromPool(db.mkQuery(FIND_USER), pool);

// AUTHENTICATION
const GET_USER_DETAILS = 'select userid, username from user where username = ?';
const getUserDetails = db.mkQueryFromPool(db.mkQuery(GET_USER_DETAILS), pool);

const GET_USERNAME = 'select username from user where userid = ?';
const getUsername = db.mkQueryFromPool(db.mkQuery(GET_USERNAME), pool);

const authenticateUser = (param) => {
    return (
        findUser(param)
            .then(result => (result.length && result[0].user_count > 0)) //returns true or false
    )
};

// INSERT AND GET RECIPE DATA
const INSERT_RECIPE = 'insert into recipe (userid, recipename, preptime, cooktime, recipedescription, serving, submitted, image_url) values (?, ?, ?, ?, ?, ?, ?, ?)';
const insertRecipe = db.mkQuery(INSERT_RECIPE, pool);

// cannot use last_insert_id() because it has no relation to specific tables
const GET_LAST_INSERTED_RECIPEID = 'select max(recipeid) as recipeid from recipe';
const getLastInsertedRecipeid = db.mkQuery(GET_LAST_INSERTED_RECIPEID, pool);

const INSERT_CATEGORY = 'insert into category (recipeid, category) values (?, ?)';
const insertCategory = db.mkQuery(INSERT_CATEGORY, pool);

const INSERT_INGREDIENT = 'insert into ingredient (recipeid, amount, unit, ingredientname) values (?, ?, ?, ?)';
const insertIngredient = db.mkQuery(INSERT_INGREDIENT, pool);

const INSERT_INSTRUCTION = 'insert into instruction (recipeid, step, instruction) values (?, ?, ?)';
const insertInstruction = db.mkQuery(INSERT_INSTRUCTION, pool);

const INSERT_REVIEW = 'insert into review (recipeid, userid, rating, comments) values (?, ?, ?, ?)';
const insertReview = db.mkQueryFromPool(db.mkQuery(INSERT_REVIEW), pool);

const GET_RECIPE = 'select *, SUM(IFNULL(`preptime`, 0) + IFNULL(`cooktime`, 0) ) AS `totaltime`, (select avg(rev.rating) from review rev where recipeid = ? group by rev.recipeid) as averageRating from recipe rec where rec.recipeid = ?';
const getRecipe = db.mkQueryFromPool(db.mkQuery(GET_RECIPE), pool);

const GET_CATEGORY = 'select category from category where recipeid = ?';
const getCategory = db.mkQueryFromPool(db.mkQuery(GET_CATEGORY), pool);

const GET_INGREDIENT = 'select amount, unit, ingredientname from ingredient where recipeid = ?';
const getIngredient = db.mkQueryFromPool(db.mkQuery(GET_INGREDIENT), pool);

const GET_INSTRUCTION = 'select instruction from instruction where recipeid = ?';
const getInstruction = db.mkQueryFromPool(db.mkQuery(GET_INSTRUCTION), pool);

const GET_REVIEW = 'select r.rating, r.comments, u.username from review r left join user u on u.userid = r.userid where recipeid = ?';
const getReview = db.mkQueryFromPool(db.mkQuery(GET_REVIEW), pool);

const GET_ALL_RECIPEID = 'select recipeid from recipe';
const getAllRecipeId = db.mkQueryFromPool(db.mkQuery(GET_ALL_RECIPEID), pool);

const UPDATE_IMAGE_URL_RECIPE = 'update recipe set image_url = ? where recipeid = ?';
const updateImageUrlRecipe = db.mkQuery(UPDATE_IMAGE_URL_RECIPE, pool);

// REVIEW FUNCTION QUERIES

const GET_REVIEW_BY_USER = 'select r.recipeid, r.reviewid, rec.recipename, r.rating, r.comments from review r left join recipe rec on rec.recipeid = r.recipeid where r.userid = ?';
const getReviewByUser = db.mkQueryFromPool(db.mkQuery(GET_REVIEW_BY_USER), pool);

const GET_REVIEW_BY_ID = 'select r.rating, r.comments, rec.recipename from review r left join recipe rec on r.recipeid = rec.recipeid where reviewid = ?';
const getReviewById = db.mkQueryFromPool(db.mkQuery(GET_REVIEW_BY_ID), pool);

const UPDATE_REVIEW = 'update review set rating = ?, comments = ? where reviewid = ?';
const updateReview = db.mkQueryFromPool(db.mkQuery(UPDATE_REVIEW), pool);

const DELETE_REVIEW = 'delete from review where reviewid = ?';
const deleteReview = db.mkQueryFromPool(db.mkQuery(DELETE_REVIEW), pool);

// SEARCH QUERIES

const SEARCH_RECIPE_BY_NAME = 'select * from recipe where recipeid in (select distinct(recipeid) from recipe where recipename like ?);';
const searchRecipeByName = db.mkQueryFromPool(db.mkQuery(SEARCH_RECIPE_BY_NAME), pool);

const SEARCH_RECIPE_BY_INGREDIENT = 'select * from recipe where recipeid in(select distinct(recipeid) from ingredient where ingredientname like ?)';
const searchRecipeByIngredient = db.mkQueryFromPool(db.mkQuery(SEARCH_RECIPE_BY_INGREDIENT), pool);

const SEARCH_RECIPE_BY_CATEGORY = 'select * from recipe where recipeid in (select distinct(recipeid) from category where category like ?)';
const searchRecipeByCategory = db.mkQueryFromPool(db.mkQuery(SEARCH_RECIPE_BY_CATEGORY), pool);

// load passport and passport local
const passport= require('passport');
const LocalStrategy= require('passport-local').Strategy;

// you can do passport.use for local strategy
passport.use(new LocalStrategy(
    {
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
    },
    (req, user, pass, done) => {
        //perform authentication
        authenticateUser([user, pass])
        .then(result =>{
            req.authenticated = result;
            if (result){
                req.loginAt = new Date(); // since we have the req object, we can put in any kind of data we want
                return done(null, user);
            }
            return done(null, false);
        })
        .catch(err=>{
            console.error('authenication db error: ', err);
            return done(null, false);
        })
    })
);

// passport.use for googlestrategy
passport.use(new GoogleStrategy({
	clientID: config.google_auth.clientID,
	clientSecret: config.google_auth.clientSecret,
	callbackURL: config.google_auth.callbackURL
},
(token, refreshToken, profile, done) => {
	console.log("profile=", profile);
	console.log("token=", token);

	return done(null, {
		profile: profile,
		token: token //returns a token. store this into database
	});
}));

const app = express();

const angularDistPath = path.join(__dirname+ '/public', 'client');
app.use(express.static(angularDistPath));

// oauth 
app.use(cookieParser());
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());


// routes
app.post(
    '/api/login', 
    passport.authenticate('local', {
        // successRedirect: '/success.html',
        // failureRedirect: '/status/401',
        session: false
    })
    , 
    (req, resp) =>{
        // issue the JWT
        getUserDetails([ req.user ])
            .then(result => {
                const d = new Date()
                const rec = result[0];
                const token = jwt.sign({
                    sub: rec.username,
                    iss: 'foodFinder',
                    iat: d.getTime()/1000,
                    // 60 mins
					exp: (d.getTime()/1000) + (60 * 60),
					data: 
                    { 
                        userid: rec.userid
                    }
                }, config.tokenSecret)
                resp.status(200).json({ token_type: 'Bearer', access_token: token })
            })
    }
);

// RECIPE RELATED

// insert recipe into mysql, return recipeid
app.post('/api/recipe', fileUpload.single('recipeImage'),
    (req, resp, next) => {
		console.info('insert to sql>body: ', req.body);
        const authorization = req.get('Authorization');
        if (!(authorization && authorization.startsWith('Bearer ')))
            return resp.status(403).json({ message: 'not authorized' })

        const tokenStr = authorization.substring('Bearer '.length)
        conns.mongodb.db('foodFinderTokens').collection('jwt_tokens').find({ jwt: tokenStr })
            .toArray()
            .then(result => {
                if (result.length) {
                    console.info('found token')
                    req.jwt = result[0].token;
                    return next();
                }
                try {
                    console.info('not found: ')
					req.jwt = jwt.verify(tokenStr, config.tokenSecret);
					
					// already ran the following query: db.jwt_tokens.createIndex( { "createdAt": 1 }, { expireAfterSeconds: 3600 } )
                    conns.mongodb.db('foodFinderTokens').collection('jwt_tokens').insertOne(
                        {
							createdAt: new Date(),
                            name: req.jwt.sub,
                            jwt: tokenStr,
                            token: req.jwt
                        }
                    ).then(result => {
						console.log("inserted token into mongo");
						return next();
					})
					.catch (err=>{
						return resp.status(500).json({ err: 'invalid token' })
					})
                } catch (err) {
					return resp.status(500).json({error: `${err}`});
                }
            })
    },
    (req, resp) => {
        console.info('token: ', req.jwt);
		
		pool.getConnection(
            (err, conn) => {
                if (err){
                    return resp.status(500).json({error: `${err}`});
                }

				db.startTransaction(conn)
                .then (
					// get userid 
                    //insert into recipe table in MySQL
                    status => {
                        const params = [
                            parseInt(req.jwt.data.userid, 10), 
                            req.body.recipeName, 
                            parseInt(req.body.prepTime, 10), 
							parseInt(req.body.cookTime, 10),
                            req.body.description,
                            parseInt(req.body.serving, 10),
							new Date(),
							''
                        ]
                        return (insertRecipe({connection:status.connection, params: params}));
                    }
                )
				.then(getLastInsertedRecipeid) // (status) => { }
                .then(
                    status=> {
						// get last inserted recipeid from recipe table
						const latestrecipeid = status.result[0].recipeid;
						let catArr = req.body.category;
						//insert into category table
						if (!catArr.length){
							return status;
						}
						for (let i = 0; i < (catArr.length-1); i++) {
							const params = [
								parseInt(latestrecipeid, 10), 
								catArr[i]
							];
							insertCategory({connection:status.connection, params: params});
						}
						const params = [
                            parseInt(latestrecipeid, 10), 
                            catArr[catArr.length-1]
                        ];
                        return (insertCategory({connection:status.connection, params: params}));
                    }
				)
				.then(getLastInsertedRecipeid)
				.then(
                    status=> {
						// get last inserted recipeid from recipe table
						const latestrecipeid = status.result[0].recipeid;
						let ingredientArr = req.body.ingredients;

						//insert into ingredient table
						if (!ingredientArr.length){
							return db.passthru;
						}
						for (let i = 0; i < (ingredientArr.length-1); i++) {
							const params = [
								parseInt(latestrecipeid, 10), 
								ingredientArr[i].amount,
								ingredientArr[i].unit,
								ingredientArr[i].name
							];
							insertIngredient({connection:status.connection, params: params});
						}
						const params = [
                            parseInt(latestrecipeid, 10), 
							ingredientArr[ingredientArr.length-1].amount,
                            ingredientArr[ingredientArr.length-1].unit,
                            ingredientArr[ingredientArr.length-1].name							
                        ]
                        return (insertIngredient({connection:status.connection, params: params}));
                    }
				)
				.then(getLastInsertedRecipeid)
				.then(
                    status=> {
						// get last inserted recipeid from recipe table
						const latestrecipeid = status.result[0].recipeid;
						let instructArr = req.body.instructions;
						//insert into instruction table
						if (!instructArr.length){
							return db.passthru;
						}
						for (let i = 0; i < (instructArr.length-1); i++) {
							const params = [
								parseInt(latestrecipeid, 10),
								parseInt(i+1, 10),
								instructArr[i]
							]
							insertInstruction({connection:status.connection, params: params});
						}
						const params = [
							parseInt(latestrecipeid, 10), 
							parseInt(instructArr.length, 10),
                            instructArr[instructArr.length-1]
                        ]
                        return (insertInstruction({connection:status.connection, params: params}));
                    }
				)
				.then(db.passthru, db.logError)
				.then(db.commit, db.rollback)
				.then(getLastInsertedRecipeid)
                .then(
                    (status)=>{
                        return new Promise(
                            (resolve, reject) =>{
								console.log("inserted into mysql");
								resp.status(201).json({recipeid: status.result[0].recipeid});
								resolve;
                            }
                        )
                    },
                    (status)=>{
						console.log("rolled back");
                        resp.status(400).json({error: `${status.error}`});
                    }
                )
                .finally(()=>conn.release);
            }
        )
	}
);

// search recipes from searchterm and filter
app.post('/api/recipes', (req, resp) =>{
	const searchterm = req.body.searchterm;
	const filter = req.body.filter;
	
	if (filter == 'name'){
		searchRecipeByName([`%${searchterm}%`])
		.then(result => {
			return resp.status(200).type('application/json').json(result);
		})
		.catch(error => {
			return resp.status(400).type('application/json').json({ error });
		})
	}
	else if (filter == 'ingredient'){
		searchRecipeByIngredient([`%${searchterm}%`])
		.then(result => {
			return resp.status(200).type('application/json').json(result);
		})
		.catch(error => {
			return resp.status(400).type('application/json').json({ error });
		})
	}
	else if (filter == 'keyword'){
		searchRecipeByCategory([`%${searchterm}%`])
		.then(result => {
			return resp.status(200).type('application/json').json(result);
		})
		.catch(error => {
			return resp.status(400).type('application/json').json({ error });
		})
	}	
})

// insert image into s3
app.post('/api/recipeimg', fileUpload.single('myImage'),
    (req, resp) => {
		console.info('file upload body: ', req.body);
		console.info('file upload file: ', req.file);

		pool.getConnection(
            (err, conn) => {
                if (err){
                    return resp.status(500).json({error: `${err}`});
                }
                
                db.startTransaction(conn)
                .then (
                    // update the image_url in recipe table
                    status => {
						console.info('req.file.filename: ', req.file.filename);
						console.info('req.body.recipeid: ', req.body.recipeid);
                        const params = [
							req.file.filename,
							req.body.recipeid
                        ]
                        return (updateImageUrlRecipe({connection:status.connection, params: params}));
                    }
                )
                .then(
                    status=> {
                        //upload to s3
                        return new Promise(
                            (resolve, reject)=>{
                                console.info('in s3');								
								fs.readFile(req.file.path, (err, imgFile)=>{
									if (err){
										return reject({connection: status.connection, error:err});
									}
									const params= {
										Bucket: 'day24-fileupload',
										Key: `foodFinder/${req.file.filename}`,
										Body: imgFile,
										ContentType: req.file.mimetype,
										ContentLength: req.file.size, 
										ACL: 'public-read'
										};
									conns.s3.putObject(params, (error, result) => {
                                        if (error){
                                            return reject({connection: status.connection, error:error});
                                        }
                                        resolve({connection: status.connection, result});
                                    })
								})
                            }
                        )
                    }      
                )
                .then(db.passthru, db.logError)
                .then(db.commit, db.rollback)
                .then(
                    (status)=>{
                        return new Promise(
                            (resolve, reject) =>{
								console.log("uploaded to s3");
                                fs.unlink(req.file.path, () =>{
                                    resp.status(201).json({message: `Posted article: ${req.body.title}`});
                                    resolve;
                                })
                            }
                        )
                    },
                    (status)=>{
						console.log("rolled back");
                        resp.status(400).json({error: `${status.error}`});
                    }
                )
                .finally(()=>conn.release);
            }
        )
	}
);

// get random recipe
// needs to be before /api/recipe/:recipeid endpoint
app.get('/api/recipe/random',
	(req, resp) => {
		getAllRecipeId()
		.then(result => {
			return resp.status(200).type('application/json').json(result);
		})
		.catch(error => {
			return resp.status(400).type('application/json').json({ error });
		})
	}
);

// view recipe details
// http://localhost:4200/api/recipe/1
app.get('/api/recipe/:recipeid', (req, resp) => {
	let userid;
	let processed;
	const recipeid = parseInt(req.params.recipeid,10);

	getRecipe([recipeid, recipeid])
    .then(result=>{
		if (result === undefined || result.length <= 0){
			return resp.status(404).type('application/json').json({status: '404', message: 'Bad request; recipeid does not exist in database', timestamp: new Date()});
		}
		return Promise.all([ Promise.resolve(result), getCategory([recipeid]), getIngredient([recipeid]), getInstruction([recipeid]), getReview([recipeid])])
	})
	.then(results => {
		//results is an array of 5 promises.
		const r0 = results[0];
		const r1 = results[1];
		const r2 = results[2];
		const r3 = results[3];
		const r4 = results[4];
		let catArr=[];
		let ingArr=[];
		let insArr=[];
		let reviewArr=[];
		userid = r0[0].userid;

		for (let i = 0; i < (r1.length); i++) {
			catArr.push(r1[i].category);
		};
		for (let i = 0; i < (r2.length); i++) {
			ingArr.push({...r2[i]});
		};
		for (let i = 0; i < (r3.length); i++) {
			insArr.push(r3[i].instruction);
		};
		for (let i = 0; i < (r4.length); i++) {
			reviewArr.push({...r4[i]});
		};

		let origIngName = ingArr[0].ingredientname;
		let finalIngName = origIngName.substring(origIngName.lastIndexOf(" ") + 1);
		let api_url = `https://api.edamam.com/api/nutrition-data?app_id=${config.edamam_api.appId}&app_key=${config.edamam_api.appKey}&ingr=${ingArr[0].amount}%20${ingArr[0].unit}%20${finalIngName}`;

		request.get(api_url, (err, resp, body) => {
			console.log(JSON.parse(body).calories);
		});

		processed = {
			recipeName: r0[0].recipename,
			prepTime: r0[0].preptime,
			cookTime: r0[0].cooktime,
			totalTime: r0[0].totaltime,
			description: r0[0].recipedescription,
			serving: r0[0].serving,
			category: catArr,
			ingredients: ingArr,
			instructions: insArr,
			username: '',
			submitted: r0[0].submitted,
			image_url: r0[0].image_url,
			reviews: reviewArr,
			averageRating: r0[0].averageRating
		};
		// console.log("processed", processed);

		getUsername([userid])
		.then(result=>{
			processed.username = result[0].username;
			return resp.send(processed);
		})
		.catch(err=>{
			return resp.status(500).json({error: err});
		})
	})
	.catch(err=>{
		return resp.status(500).json({error: err});
	})
});

// REVIEWS RELATED
// insert review
app.post(
    '/api/review', express.urlencoded({extended:true}),
	(req, resp, next) => {
		const authorization = req.get('Authorization');
		if (!(authorization && authorization.startsWith('Bearer ')))
			return resp.status(403).json({ message: 'not authorized' })

		const tokenStr = authorization.substring('Bearer '.length)
		conns.mongodb.db('foodFinderTokens').collection('jwt_tokens').find({ jwt: tokenStr })
			.toArray()
			.then(result => {
				if (result.length) {
					console.info('found token')
					req.jwt = result[0].token;
					return next();
				}
				try {
					console.info('not found: ')
					req.jwt = jwt.verify(tokenStr, config.tokenSecret);
					conns.mongodb.db('foodFinderTokens').collection('jwt_tokens').insertOne(
						{
							name: req.jwt.sub,
							jwt: tokenStr,
							token: req.jwt
						}
					).then(result => {
						console.log("inserted token into mongo");
						return next();
					})
					.catch (err=>{
						return resp.status(500).json({ err: 'invalid token' })
					})
				} catch (err) {
					return resp.status(500).json({error: `${err}`});
				}
			})
	},
	(req, resp) => {
		const params = [
			req.body.recipeid,
			parseInt(req.jwt.data.userid, 10),
			req.body.rating,
			req.body.comments
		]
		insertReview(params)
		.then(result =>{
			return resp.status(200).json(result);
		})
		.catch(err=>{
			return resp.status(500).json({error: `${err}`});
		})
	}
);

// get all reviews of 1 user
app.get('/api/user/review',
	(req, resp, next) => {
		const authorization = req.get('Authorization');
		if (!(authorization && authorization.startsWith('Bearer ')))
			return resp.status(403).json({ message: 'not authorized' })

		const tokenStr = authorization.substring('Bearer '.length)
		conns.mongodb.db('foodFinderTokens').collection('jwt_tokens').find({ jwt: tokenStr })
			.toArray()
			.then(result => {
				if (result.length) {
					console.info('found token')
					req.jwt = result[0].token;
					return next();
				}
				try {
					console.info('not found: ')
					req.jwt = jwt.verify(tokenStr, config.tokenSecret);
					conns.mongodb.db('foodFinderTokens').collection('jwt_tokens').insertOne(
						{
							name: req.jwt.sub,
							jwt: tokenStr,
							token: req.jwt
						}
					).then(result => {
						console.log("inserted token into mongo");
						return next();
					})
					.catch (err=>{
						return resp.status(500).json({ err: 'invalid token' })
					})
				} catch (err) {
					return resp.status(500).json({error: `${err}`});
				}
			})
	},
	(req, resp) => {
		getReviewByUser([req.jwt.data.userid])
		.then(result =>{
			return resp.status(200).json(result);
		})
		.catch(err=>{
			return resp.status(500).json({error: `${err}`});
		})
	}
);

// get review by id
app.get('/api/user/review/:reviewid',
	(req, resp) => {
		const reviewid = parseInt(req.params.reviewid,10);
		getReviewById([reviewid])
		.then(result => {
			return resp.status(200).type('application/json').json(result[0]);
		})
		.catch(error => {
			return resp.status(400).type('application/json').json({ error });
		})
	}
);

// update review
app.put('/api/user/review/:reviewid',
	(req, resp) => {
		const reviewid = req.body.reviewData.updates[0].value;
		const rating = req.body.reviewData.updates[1].value;
		const comments = req.body.reviewData.updates[2].value;
		const params = [
			rating,
			comments,
			reviewid
		];
		updateReview(params)
		.then(result => {
			return resp.status(200).type('application/json').json(result);
		})
		.catch(error => {
			return resp.status(400).type('application/json').json({ error });
		})
	}
);

// delete review
app.delete('/api/user/review/:reviewid',
	(req, resp) => {
		const reviewid = req.params.reviewid;
		deleteReview([reviewid])
		.then(result => {
			return resp.status(200).type('application/json').json(result);
		})
		.catch(error => {
			return resp.status(400).type('application/json').json({ error });
		})
	}
);

// OAUTH
// the idea is to authenticate with google, then generate a authentication token. 
// then, user can save a recipe when gmail sends them an email with all recipe details (gmail will insert an email into their inbox)
// this section is only halfway done. can only generate the token

//authenticate google login
app.get('/auth/google', passport.authenticate('google', 
	{
		scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/gmail.insert']
	}
));

// after logging in, will go here
app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/'
    }),
    (req, res) => {
		console.info('user: ', req.user);
		console.log(req.user.token);
		console.log("successful login");
        req.session.token = req.user.token;
        res.redirect('/');
    }
);

// save recipe to inbox
app.get('/save/recipe', (req, resp) => {
	// const token = req.session.token;
	// console.info('token: ', token);
	// call insertMessage here
});

/**
 * Insert Message into user's mailbox.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} email RFC 5322 formatted String.
 * @param  {Function} callback Function to call when the request is complete.
 */
function insertMessage(userId, email, callback) {
	// Using the js-base64 library for encoding:
	// https://www.npmjs.com/package/js-base64
	var base64EncodedEmail = Base64.encodeURI(email);
	var request = gapi.client.gmail.users.messages.insert({
	  'userId': userId,
	  'resource': {
		'raw': base64EncodedEmail
	  }
	});
	request.execute(callback);
}

app.use(express.static(__dirname+ '/public'));

testConnections(conns)
.then(() => {
	app.listen(PORT,
		() => {
			console.info(`Application started on port ${PORT} at ${new Date()}`);
		}
	)
})
.catch(error => {
	console.error(error);
	process.exit(-1);
})



