import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from 'uuid';
import { comparePassword, createPasswordHash } from "../utils/passwordUtil";
import { IUser } from '../interfaces/IUser';
import { authService } from './AuthService';
import ddbDocClient from "../libs/db";

class UserService {
    async register(email: string, password: string): Promise<{ userId: string; token: string }> {
        const userId = uuid();
        const passwordHash = await createPasswordHash(password);
        const newUser: IUser = {
            userId,
            email,
            passwordHash,
        };

        if (!process.env.USERS_TABLE) {
            throw new Error('The USERS_TABLE environment variable is not defined');
        }

        const params = {
            TableName: process.env.USERS_TABLE,
            Item: newUser,
        };

        await ddbDocClient.send(new PutCommand(params));
        const token = authService.generateToken({ userId });

        return { userId, token };
    }

    async login(email: string, password: string): Promise<{ userId: string; token: string }> {
        const user = await this.getUserByEmail(email);

        if (!user) {
            throw new Error('User does not exist or wrong password.');
        }

        const passwordIsValid = await comparePassword(password, user.passwordHash);

        if (!passwordIsValid) {
            throw new Error('User does not exist or wrong password.');
        }

        const token = authService.generateToken({ userId: user.userId });

        return { userId: user.userId, token };
    }

    private async getUserByEmail(email: string): Promise<IUser | null> {
        const params = {
            TableName: process.env.USERS_TABLE!,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email,
            },
        };

        const result = await ddbDocClient.send(new QueryCommand(params));

        if (result.Items && result.Items.length > 0) {

            return result.Items[0] as IUser;
        }

        return null;
    }
}

export const userService = new UserService();
