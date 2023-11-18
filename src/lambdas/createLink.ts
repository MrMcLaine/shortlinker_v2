import { APIGatewayProxyHandler } from "aws-lambda";
import { linkService } from "../services/linkService";
import { ExpiryTerm } from "../contants/ExpiryTerm";
import { createOneTimeSchedule } from "../utils/createOneTimeSchedule";


export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const baseUrl = process.env.BASE_URL;
        const userId = event.requestContext.authorizer?.principalId;
        const { originalUrl, expiryPeriod } = JSON.parse(event.body || '{}');

        if (!originalUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing originalUrl' })
            }
        }

        const newLink  = await linkService.createLink(userId, originalUrl, expiryPeriod);
        const fullShortUrl = `${baseUrl}/${newLink.shortUrl}`;

        if (expiryPeriod !== ExpiryTerm.ONCE) {
            const expirationDateTime = newLink.expiredAt;
            await createOneTimeSchedule(newLink.linkId, expirationDateTime);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ fullShortUrl, linkId: newLink.linkId })
        }
    } catch (error) {
        console.error('Error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not create link' })
        }
    }
}