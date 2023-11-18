import { APIGatewayProxyHandler } from "aws-lambda";
import { linkService } from "../services/linkService";

export const handler: APIGatewayProxyHandler = async (event) => {
    const userId = event.requestContext.authorizer!.principalId;

    try {
        const links = await linkService.getLinksByUser(userId);

        return {
            statusCode: 200,
            body: JSON.stringify(links)
        };
    } catch (error) {
        console.error('Error:', error);

        return {
            statusCode: 500,
            body: 'Internal server error'
        };
    }

}