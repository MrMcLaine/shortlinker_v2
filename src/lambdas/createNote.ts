import { APIGatewayEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (
    event: APIGatewayEvent,
): Promise<any> => {
    console.log('Starting createNote');
    console.log('Event:', event);

    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Request body is empty' }),
        };
    }

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Error parsing JSON body' }),
        };
    }

    const name: string = data.name;
    const description: string = data.description;

    console.log('Data:', data);

    /*const item = {
        noteId: uuid(),
        ...data
    };*/

    const item = {
        noteId: uuid(),
        name,
        description
    };

    console.log('Item:', item);

    const params = {
        TableName: process.env.NOTES_TABLE!,
        Item: item,
    };

    console.log('Params:', params);

    try {
        const putResult = await ddbDocClient.send(new PutCommand(params));
        console.log('Put result:', putResult);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Note created', noteId: item.noteId }),
        };
    } catch (error) {
        console.error('Error putting item:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not create note', details: errorMessage }),
        };
    }
};
