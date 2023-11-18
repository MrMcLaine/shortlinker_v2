import { APIGatewayEvent } from 'aws-lambda';
import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

const ddbClient = new DynamoDBClient({ region: 'us-east-1' } as any);

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    console.log('Starting deleteNote handler');
    console.log('event', event);

    const noteId = event.noteId;

    console.log('noteId', noteId);
    if (!noteId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing noteId' }) };
    }

    const params = {
        TableName: process.env.NOTES_TABLE!,
        Key: { noteId: { S: noteId } }
    };

    console.log('params', params);

    try {
        await ddbClient.send(new DeleteItemCommand(params));
        console.log('Note deleted successfully');
        return { statusCode: 200, body: JSON.stringify({ message: 'Note deleted successfully' }) };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Could not delete note' }) };
    }
};
