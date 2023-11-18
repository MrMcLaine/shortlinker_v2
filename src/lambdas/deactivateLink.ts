import { APIGatewayProxyHandler } from "aws-lambda";
import { linkService } from "../services/linkService";

export const handler: APIGatewayProxyHandler = async (event) => {
    const userId = event.requestContext.authorizer!.principalId;
    const linkId = event.pathParameters!.linkId?.toString();

    if (!linkId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing linkId' })
        }
    }

    try {
        await linkService.deactivateLinkById(userId, linkId);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Link with id: ${linkId} deactivated successfully` })
        }
    } catch (error) {
        console.error('Error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not deactivate link' })
        }
    }
}