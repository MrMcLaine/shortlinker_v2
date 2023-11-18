import { APIGatewayProxyHandler } from "aws-lambda";
import {linkService} from "../services/linkService";

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const shortUrl = event.pathParameters!.linkId?.toString();

        if (!shortUrl) {
            return { statusCode: 400, body: 'Link ID is required' };
        }

        const originalUrl = await linkService.getLinkFromShortUrl(shortUrl);

        if (originalUrl) {
            return {
                statusCode: 301,
                headers: { Location: originalUrl },
                body: JSON.stringify('Redirecting...')
            };
        } else {
            return { statusCode: 404, body: 'Link not found or inactive' };
        }
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: 'Internal server error' };
    }
}