import { APIGatewayProxyHandler } from "aws-lambda";
import { linkService } from "../services/linkService";


export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        //TODO need update
        const currentDomain = event.headers.Host;
        //TODO need update
        const userId = 'tempUserId'
        const { originalUrl, expiryPeriod } = JSON.parse(event.body || '{}');

        if (!originalUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing originalUrl' })
            }
        }

        const newLink  = await linkService.createLink(userId, originalUrl, expiryPeriod);
        const fullShortUrl = `https://${currentDomain}/dev/${newLink.shortUrl}`;

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