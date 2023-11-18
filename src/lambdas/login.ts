import { APIGatewayProxyHandler } from "aws-lambda";
import { userService } from "../services/userService";

export const handler: APIGatewayProxyHandler = async (event) => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing body' })
        }
    }

    try {
        const { email, password } = JSON.parse(event.body);
        const { token } = await userService.login(email, password);

        return {
            statusCode: 200,
            body: JSON.stringify({ token })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not get user' })
        }
    }
}