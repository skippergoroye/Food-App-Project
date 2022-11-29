import {DataTypes, Model} from 'sequelize';
import {db} from '../config/index';

export interface FoodAttributes{
    id:string;
    description:string;
    category: string;
    name:string;
    foodType: string;
    readyTime: number;
    price: number;
    rating: number;
    vendorId: string;
    image: string;
}

export class FoodInstance extends Model<FoodAttributes>{}

FoodInstance.init({
    id:{
        type: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },

    name:{
        type: DataTypes.STRING,
        allowNull: false
    },

    description:{
        type: DataTypes.STRING,
        allowNull: false
    },

    category:{
        type: DataTypes.STRING,
        allowNull: false
    },

    foodType:{
        type: DataTypes.STRING,
        allowNull: false
    },

    readyTime:{
        type: DataTypes.NUMBER,
        allowNull: false
    },

    price:{
        type: DataTypes.NUMBER,
        allowNull: false
    },

    rating:{
        type: DataTypes.NUMBER,
        allowNull: false
    },

    vendorId:{
        type: DataTypes.UUIDV4,
        allowNull: false
    },

    image:{
        type: DataTypes.STRING,
        allowNull: false
    },

}, {
    sequelize: db,
    tableName: 'food'
})
