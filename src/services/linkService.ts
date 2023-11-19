import { v4 as uuid } from 'uuid';
import shortid from 'shortid';
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { ExpiryTerm } from "../contants/ExpiryTerm";
import { validateLink } from "../validation/linkValidation";
import { calculateExpiryDate } from "../utils/calculateExpiryDate";
import {
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import ddbDocClient from "../libs/db";
import { ILink } from "../interfaces/ILink";
import { IUser } from "../interfaces/IUser";

const sqsClient = new SQSClient({ region: process.env.AWS_REGION } as any);

class LinkService {
    async createLink(
        userId: string,
        originalUrl: string,
        expiryPeriod: ExpiryTerm
    ): Promise<ILink> {
        await validateLink(originalUrl, expiryPeriod);

        const linkId = uuid();
        const shortUrl = shortid.generate().substring(0, 6);
        const expiredAt = await calculateExpiryDate(expiryPeriod);
        const newLink: ILink = {
            linkId,
            originalUrl,
            shortUrl,
            userId,
            isActive: true,
            expiredAt,
            isOneTimeUse: expiryPeriod === ExpiryTerm.ONCE,
            transitionCount: 0,
            deactivateLetter: false
        };

        const params = {
            TableName: process.env.LINKS_TABLE!,
            Item: newLink,
        };

        try {
            await ddbDocClient.send(new PutCommand(params));

            return newLink;
        } catch (error) {
            throw error;
        }
    }

    async deactivateLink(linkId: string) {
        const linkResult = await ddbDocClient.send(new GetCommand({
            TableName: process.env.LINKS_TABLE!,
            Key: { linkId }
        }));

        const link = linkResult.Item as ILink;

        if (!link) {
            throw new Error('Link not found');
        }

        await ddbDocClient.send(new UpdateCommand({
            TableName: process.env.LINKS_TABLE!,
            Key: { linkId },
            UpdateExpression: 'set isActive = :val',
            ExpressionAttributeValues: {
                ':val': false
            }
        }));

        if (!link.deactivateLetter) {
            const userResult = await ddbDocClient.send(new GetCommand({
                TableName: process.env.USERS_TABLE!,
                Key: { userId: link.userId }
            }));

            const user = userResult.Item as IUser;

            if (!user) {
                throw new Error('User not found');
            }

            const messageBody = {
                linkId: link.linkId,
                userEmail: user.email,
                shortUrl: link.shortUrl
            };

            const sendMessageCommand = new SendMessageCommand({
                QueueUrl: process.env.LINK_DEACTIVATION_QUEUE_URL,
                MessageBody: JSON.stringify(messageBody)
            });

            await sqsClient.send(sendMessageCommand);
        }
    }

    async getLinkFromShortUrl(shortUrl: string): Promise<string | null> {
        const queryCommand = new QueryCommand({
            TableName: process.env.LINKS_TABLE!,
            IndexName: 'ShortUrlIndex',
            KeyConditionExpression: 'shortUrl = :shortUrl',
            ExpressionAttributeValues: {
                ':shortUrl': shortUrl,
            },
        });

        const result = await ddbDocClient.send(queryCommand);

        if (!result.Items) {
            return null;
        }

        if (result.Items.length > 0) {
            const link: ILink = result.Items[0] as ILink;

            await ddbDocClient.send(new UpdateCommand({
                TableName: process.env.LINKS_TABLE!,
                Key: { linkId: link.linkId },
                UpdateExpression: 'set transitionCount = transitionCount + :val',
                ExpressionAttributeValues: {
                    ':val': 1
                },
            }));

            if (link.isActive && link.isOneTimeUse) {
                await this.deactivateLink(link.linkId);
            }

            if (link.isActive) {
                return link.originalUrl;
            }
        }

        return null;
    }

    async getLinksByUser(userId: string): Promise<ILink[]> {
        const params = {
            TableName: process.env.LINKS_TABLE!,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
        };

        try {
            const result = await ddbDocClient.send(new QueryCommand(params));

            return result.Items as ILink[];
        } catch (error) {
            console.error('Error fetching links by user:', error);
            throw error;
        }
    }

    async deactivateLinkById(userId: string, linkId: string) {
        const getLinkResult = await ddbDocClient.send(new GetCommand({
            TableName: process.env.LINKS_TABLE!,
            Key: { linkId }
        }));

        const link = getLinkResult.Item as ILink;

        if (!link) {
            throw new Error('Link not found');
        }

        if (link.userId !== userId) {
            throw new Error('User is not authorized to deactivate this link');
        }

        await this.deactivateLink(linkId);
    }
}

export const linkService = new LinkService();