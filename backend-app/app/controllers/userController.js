const mongoose = require('mongoose');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')
const token=require('./../libs/tokenLib')
const redis =require('./../libs/redisLib')
const request = require('request-promise');
const passportConfig = require('./../../config/passportConfig')
/* Models */
const UserModel = mongoose.model('User')
const AuthModel=mongoose.model('Auth')

let getLLTandUpsertUser=(accessToken,refreshToken,profile,cb)=>{
	let getLLT=(accessToken,profile,cb)=>{			//Long Live Token 
		return new Promise((resolve,reject)=>{
			const options ={
				tpye:'GET',
				uri:'https://graph.facebook.com/v3.1/oauth/access_token',
				qs:{
					grant_type:'fb_exchange_token',          
					client_id:passportConfig.client_id,
					client_secret:passportConfig.client_secret,
					fb_exchange_token:accessToken
				}
			}
			request(options).then(fbRes => {
				fbRes=fbRes.toObject();
				if(fbRes.error){
					logger.error(fbRes.error,'userController:getLLTandUpsertUser:getLLT',9)
					profile['access_token']=accessToken;
					resolve(profile)
				}else{
					logger.info('LLT Received','userController:getLLTandUpsertUser:getLLT',9)
					profile['access_token']=fbRes.access_token;
					resolve(profile)
				}
			}).catch((err)=>{
				profile['access_token']=accessToken;
				resolve(profile);
			})
		})
	}
	let upsertUser=(profile)=>{
		return new Promise((resolve,reject)=>{
            UserModel.findOne({'facebookProvider.id': profile.id}).exec((err,retrievedUserDetails)=>{
                if(err){
                    logger.error(err.message, 'userController:getLLTandUpsertUser:upsertUser', 1)
                    reject(err);
                }else if(check.isEmpty(retrievedUserDetails)){
                    let newUser= new UserModel({
                        fullName: profile.displayName,
                        email: profile.emails[0].value,
                        facebookProvider: {
                          id: profile.id,
                          token: profile.access_token
                        },
                        createdOn:Date.now()
                    })
                    newUser.save((err,newUser)=>{
                        if(err){
                            logger.error(err.message,'userController:getLLTandUpsertUser:upsertUser', 1)
                            reject(err)
                        }else{
                            logger.info('New User saved Successfully','userController:getLLTandUpsertUser:upsertUser',1)
                            resolve(newUser.toObject())
                        }
                    })
   
                }else{
					retrievedUserDetails.facebookProvider.token=profile.access_token;
					retrievedUserDetails.save((err,updatedUser)=>{
                        if(err){
                            logger.error(err.message,'userController:getLLTandUpsertUser:upsertUser', 1)
                            reject(err)
                        }else{
                            logger.info('User Updated Successfully','userController:getLLTandUpsertUser:upsertUser',1)
                            resolve(updatedUser.toObject())
                        }
                    })
                }
            })
		})
	}
	getLLT(accessToken,profile,cb)
	.then(upsertUser)
	.then((resolve)=>{
		redis.deleteFromHash('AllUsers',resolve.facebookProvider.id);
		redis.setInHash('AllUsers',resolve.facebookProvider.id,resolve.facebookProvider.token,(err,hash)=>{
            if(err)
            logger.info('User hashing Unsuccessful!','userController:getLLTandUpsertUser',4)
            else 
            logger.info('User Successfully hashed!','userController:getLLTandUpsertUser',4)
        })
		return cb(null, resolve);
	}).catch((err)=>{
		return cb(err,null);
	})
}

let generateAndSendToken=(req,res)=>{
    if (!req.user) {
        return res.send(401, 'User Not Authenticated');
    }else{
        let generateToken=()=>{
            return new Promise((resolve,reject)=>{
                token.generateToken({id:req.user.facebookProvider.id}, (err, tokenDetails) => {
                    if (err) {
                        logger.error(err.message,'userController:userLogin:generateToken',3)
                        reject(response.generate(true, 'Failed to generate Token', 500, null))
                    } else {
                        logger.info('User Token Generated Successfully','userController:userLogin:generateToken',3)
                        resolve(tokenDetails)
                    }
                })
            })
        }
        let saveToken=(tokenDetails)=>{
            return new Promise((resolve,reject)=>{
                AuthModel.findOne({userId:req.user.id},(err,retrievedAuthModel)=>{
                    if(err){
                        logger.error(err.message,'userController:userLogin:saveToken()', 1)
                        reject(response.generate(true, 'Internal Server Error', 500, null))
                    } else if(check.isEmpty(retrievedAuthModel)){
                        let authModel = new AuthModel({
                            userId: req.user.id,
                            authToken: tokenDetails.token,
                            tokenSecret: tokenDetails.tokenSecret,
                            tokenValidationTime: Date.now()+ 86400000
                        })
                        authModel.save((err, newAuthModel) => {
                            if (err) {
                                logger.error(err.message,'userController:userLogin:saveToken()',1)
                                reject(response.generate(true, 'Internal Server Error', 500, null))
                            } else {
                                logger.info('User Token Model saved Successfully','userController:userLogin:saveToken()',1)
                                resolve({token: newAuthModel.authToken})
                            }
                        })
                    }else{
                        retrievedAuthModel.authToken=tokenDetails.token
                        retrievedAuthModel.tokenSecret=tokenDetails.tokenSecret
                        retrievedAuthModel.tokenValidationTime = Date.now()+ 86400000
                        retrievedAuthModel.save((err, newAuthModel) => {
                            if (err) {  
                                logger.error(err.message,'userController:userLogin:saveToken()', 1)
                                reject(response.generate(true,'Internal Server Error', 500, null))
                            }else if(check.isEmpty(newAuthModel)){
                                logger.error(err.message,'userController:loginUser:saveToken()',1)
                                reject(response.generate(true,'Failed to save new Token Details',404,null))
                            }else {
                                logger.info('New User Token Saved Successfully','userController:userLogin:saveToken()',1)
                                resolve({token: newAuthModel.authToken})
                            }
                        })
                    }
                })
            })
        }

    generateToken(req,res)
        .then(saveToken)
        .then((resolve)=>{
            res.status(200).send(response.generate(false,'User is Authorized',200,{
                id:req.user.facebookProvider.id,
                authToken:resolve.token
            }));   
        },(reject)=>{
            res.status(reject.status).send(reject);
        })
    }

}

let getAllUsers=(req,res)=>{
	UserModel.find().exec((err,users)=>{
		if(err)
		res.status(500).send(response.generate(true,'Internal SErver',500,null))
		else if(check.isEmpty(users))
		res.status(404).send(response.generate(false,'No Users Found',404,users))
		else
		res.status(200).send(response.generate(false,'All Users Found',200,users))
	})
}
module.exports={
getLLTandUpsertUser:getLLTandUpsertUser,
generateAndSendToken:generateAndSendToken,
getAllUsers:getAllUsers
}