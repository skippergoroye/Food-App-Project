import express, {Request, Response, NextFunction} from 'express'
import { registerSchema, option, GeneratePassword, GenerateSalt, GenerateOTP, onRequestOTP, emailHtml, sendmail, Generatesignature, verifySignature, loginSchema, validatePassword, updateSchema} from '../utils'
import { fromAdminMail, userSubject } from '../config'
import { UserAttributes, UserInstance } from '../model/userModel'
import {v4 as uuidV4} from 'uuid'
import { JwtPayload } from 'jsonwebtoken'

export const Register = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const { email, phone, password, confirm_password} = req.body
        const uuidUser = uuidV4()
        const validateResult = registerSchema.validate(req.body,option)
        if(validateResult.error){
            console.log(validateResult.error)
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }

        //Generate Salt
        const salt = await GenerateSalt()
        const userPassword = await GeneratePassword(password, salt)
        
        //Generate OTP
        const {otp, expiry} = GenerateOTP();

        //check if the user exist
        const User = await UserInstance.findOne({where:{email:email}})

        if(!User){
             await UserInstance.create({
                id: uuidUser,
                email,
                password:userPassword,
                firstName:'',
                lastName:'',
                salt,
                address: '',
                phone,
                otp,
                otp_expiry: expiry,
                lng: 0,
                lat: 0,
                verified: false,
                role: 'user'
            })

            //Send OTP to user
            await onRequestOTP(otp, phone)
            
            //send mail to users
            const html =  emailHtml(otp)
            await sendmail(fromAdminMail, email, userSubject, html);

            //check if the user exist
            const User = await UserInstance.findOne({where:{email:email}})as unknown as UserAttributes

            //Generate signature from user
            const signature = await Generatesignature({
                id: User.id,
                email: User.email,
                verified: User.verified
            })

            return res.status(201).json({
                message: 'User Created Successfully check your email or phone for OTP verification',
                signature,
                verified: User.verified,
            })
        }
        return res.status(400).json({
            message: 'User Already Exist'
        })

    }catch(err){
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/signup"
        })
    }
}


/** ======================= Verify Users ========================  **/
export const verifyUser = async (req: Request, res: Response) => {
    try{
        const token = req.params.signature
        const decode = await verifySignature(token) 
        console.log(decode)

        //check if the user is a registered user
        const User = await UserInstance.findOne({where:{email:decode.email}})as unknown as UserAttributes

        if(User){
            const {otp} = req.body

            if(User.otp === parseInt(otp) && User.otp_expiry >= new Date()){
                const updatedUser = await UserInstance.update({
                    verified: true
                }, {where:{email: decode.email}})as unknown as UserAttributes

                //Generate a new Signature
                const signature = await Generatesignature({
                    id: updatedUser.id,
                    email: updatedUser.email,
                    verified: updatedUser.verified
                })

                return res.status(200).json({
                    message: 'User Verified Successfully',
                    signature,
                    verified: User.verified,
                    role: User.role
                })
            }
            return res.status(400).json({
                Error: 'OTP is invalid or expired'
            })
        }

      
    }catch(err){
        return res.status(500).json({
            Error: "Internal server Error",
            route: "/users/verify"
        })
    }
}

/** ======================= Login ========================  **/

export const Login = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const { email, password} = req.body
        const validateResult = loginSchema.validate(req.body,option)
        if(validateResult.error){
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }

   
        //check if user exist
        const User = await UserInstance.findOne({where:{email:email}})as unknown as UserAttributes;
        
        if(User.verified === true){
           const validation = await validatePassword(password, User.password, User.salt)
           if(validation){
            let signature = await Generatesignature({
                id: User.id,
                email: User.email,
                verified: User.verified
            });

            return res.status(200).json({
                message:"You have Successfully logged In",
                signature,
                email: User.email,
                verified: User.verified
            })
           }
        }

        return res.status(400).json({
            Error: "Wrong Username or password"
        })
    
    }catch(err){
        return res.status(500).json({
            Error: "Internal server Error",
            route: "/users/login"
        })
    }
}


/** ======================= Resend OTP ========================  **/
export const resendOTP = async (req: Request, res: Response) => {
    try{
        const token = req.params.signature
        const decode = await verifySignature(token) 
        console.log(decode)

        //check if user exist
        const User = await UserInstance.findOne({where:{email:decode.email}})as unknown as UserAttributes;

        //Generate OTP
        if(User){
            const {otp, expiry} = GenerateOTP();
            const updatedUser = await UserInstance.update({
                otp,
                otp_expiry: expiry
            }, {where:{email: decode.email}})as unknown as UserAttributes

        if(updatedUser){
            const User = await UserInstance.findOne({where:{email:decode.email}})as unknown as UserAttributes;

            //Send Otp to user
            await onRequestOTP(otp, User.phone);

            //send Mail to user
            const html = emailHtml(otp)
            await sendmail(fromAdminMail, User.email, userSubject, html)

            return res.status(200).json({
                message:"OTP resent to phone number and email",
            })
           }
        }

        return res.status(400).json({
            message:"Error Sending OTP",
        })
    }catch(err){
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/resend-otp/:signature"
        })
    }
}


/** ======================= PROFILE ========================  **/
export const getAllUsers = async(req:Request, res:Response) => {
    try{
        const limit = req.query.limit as number | undefined
        const users = await UserInstance.findAndCountAll({
            limit:limit
        })

        return res.status(200).json({
            message: "You have successfully retrieved all users",
            count: users.count,
            users: users.rows
        })
    }catch(err){
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/get-all-users"
        })
    }
    
}

export const getSingleUser = async(req:JwtPayload, res:Response)=>{
    try{
      const id = req.user.id

      // find the user by id
      const User = await UserInstance.findOne({where:{id: id}})as unknown as UserAttributes;
      
      if(User){
        return res.status(200).json({
            User
          })
      }
     
    }catch(err){
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/get-user"
        })
    }
}

export const updateUserProfile = async(req:JwtPayload, res:Response) => {
    
    try{
        const id = req.user.id;
        const {firstName, lastName, address, phone} = req.body

        const validateResult = updateSchema.validate(req.body,option)
        if(validateResult.error){
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }

        const User = await UserInstance.findOne({where:{id: id}})as unknown as UserAttributes;

        if(!User){
            return res.status(400).json({
                Error: "Not authorised to upfate your profile"
            })
        }

        const updatedUser = await UserInstance.update({
            firstName, lastName, address, phone
        }, {where:{id:id}})as unknown as UserAttributes

        if(updatedUser){
            return res.status(200).json({
                message: "You have successfully updated your profile",
                User
            })
        }

        return res.status(400).json({
            message:"Error updating your profile"
        })


    }catch(err){
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/update-profile"
        })
    }
}

//forgot password
