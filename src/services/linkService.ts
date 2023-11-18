import { v4 as uuid } from 'uuid';
import shortid from 'shortid';
import { ExpiryTerm } from "../contants/ExpiryTerm";
import { ILink } from "../interfaces/ILink";
import { validateLink } from "../validation/linkValidation";
import { calculateExpiryDate } from "../utils/calculateExpiryDate";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
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
}

export const linkService = new LinkService();