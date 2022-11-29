import {NextFunction, Request, Response} from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { NetworkContext } from 'twilio/lib/rest/supersim/v1/network'
import { APP_SECRET} from '../config'
import { UserAttributes, UserInstance } from '../model/userModel'
import { VendorAttributes, VendorInstance } from '../model/vendorModel'

export const auth = async(req:JwtPayload, res:Response, next:NextFunction) => {
    try{
        const authorization = req.headers.authorization

        if(!authorization){
            return res.status(401).json({
                Error: "Kindly signin"
            })
        }

        const token = authorization.slice(7, authorization.length)
        let verified = jwt.verify(token, APP_SECRET)

        if(!verified){
            return res.status(401).json({
                Error: "unauthorised"
            })
        }

        const {id} = verified as {[key:string]:string}

        const user = await UserInstance.findOne({where:{id: id}})as unknown as UserAttributes;

        if(!user){
            return res.status(401).json({
                Error: "Invalid Credentials"
            })
        }

        req.user = verified 
        next()
     
    }catch(err){
        return res.status(401).json({
            Error: "unauthorised",
        })
    }
    
}

export const authVendor = async(req:JwtPayload, res:Response, next:NextFunction) => {
    try{
        const authorization = req.headers.authorization

        if(!authorization){
            return res.status(401).json({
                Error: "Kindly signin"
            })
        }

        const token = authorization.slice(7, authorization.length)
        let verified = jwt.verify(token, APP_SECRET)

        if(!verified){
            return res.status(401).json({
                Error: "unauthorised"
            })
        }

        const {id} = verified as {[key:string]:string}

        const vendor = await VendorInstance.findOne({where:{id: id}})as unknown as VendorAttributes;

        if(!vendor){
            return res.status(401).json({
                Error: "Invalid Credentials"
            })
        }

        req.vendor = verified 
        next()
     
    }catch(err){
        return res.status(401).json({
            Error: "unauthorised",
        })
    }
    
}
