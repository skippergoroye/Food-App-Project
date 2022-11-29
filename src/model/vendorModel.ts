import {DataTypes, Model} from 'sequelize';
import {db} from '../config/index';
import { FoodInstance } from './foodModel';

export interface VendorAttributes{
    id:string;
    email: string;
    name: string;
    restaurantName: string;
    password: string;
    salt:string;
    address:string;
    phone:string;
    pincode: string;
    serviceAvailable: boolean;
    rating: number;
    role: string;
    coverImage: string
}

export class VendorInstance extends Model<VendorAttributes>{}

VendorInstance.init({
    id:{
        type: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },

    email:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate:{
            notNull:{
                msg: 'Email address is required'
            },
            isEmail: {
                msg: 'Please enter a valid email address'
            }
        }
    },

    name:{
        type: DataTypes.STRING,
        allowNull: true,
    },

    restaurantName:{
        type: DataTypes.STRING,
        allowNull: true,
    },

    password:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notNull:{
                msg: 'Password is required'
            },
            notEmpty:{
                msg: 'Password is required'
            }
        }
    },

    salt:{
        type: DataTypes.STRING,
        allowNull: true,
    },

    address:{
        type: DataTypes.STRING,
        allowNull: true,
    },

    phone:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notNull:{
                msg: 'Phone Number is required'
            },
            notEmpty:{
                msg: 'Phone Number is required'
            }
        }
    },

    pincode:{
        type: DataTypes.STRING,
        allowNull: true,
    },

    serviceAvailable:{
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },

    rating:{
        type: DataTypes.NUMBER,
        allowNull: true,
    },


    role:{
        type: DataTypes.STRING,
        allowNull: true,
    },

    coverImage:{
        type: DataTypes.STRING,
        allowNull: true,
    },

}, {
    sequelize: db,
    tableName: 'vendor'
})

VendorInstance.hasMany(FoodInstance, {foreignKey:'vendorId', as:'food'})

FoodInstance.belongsTo(VendorInstance, {foreignKey:'vendorId', as:'vendor'})