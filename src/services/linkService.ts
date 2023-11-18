import { v4 as uuid } from 'uuid';
import shortid from 'shortid';
import { ExpiryTerm } from "../contants/ExpiryTerm";
import { ILink } from "../interfaces/ILink";
import { validateLink } from "../validation/linkValidation";
import { calculateExpiryDate } from "../utils/calculateExpiryDate";
import {
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import ddbDocClient from "../libs/db";

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

        const link = linkResult.Item;

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

        //TODO SQS email notification
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

            return link.originalUrl;
        }

        return null;
    }
}

export const linkService = new LinkService();