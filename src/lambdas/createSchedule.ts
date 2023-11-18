import { APIGatewayProxyHandler } from 'aws-lambda';
import { SchedulerClient, CreateScheduleCommand, ScheduleState, FlexibleTimeWindowMode } from "@aws-sdk/client-scheduler";

const schedulerClient = new SchedulerClient({ region: process.env.AWS_REGION || 'us-east-1' } as any);

export const handler: APIGatewayProxyHandler = async (event) => {
    const noteId = event.queryStringParameters?.noteId;

    if (!noteId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'linkId is required' })
        };
    }
    let expiredAt = new Date();
    expiredAt.setTime(expiredAt.getTime() + 2 * 60 * 60 * 1000);

    const expirationDateTime = new Date(expiredAt.getTime() + 60 * 1000);
    const ruleName = `deactivateLink-${noteId.replace(/[^0-9a-zA-Z-_.]/g, '')}`;
    const accountId = process.env.AWS_ACCOUNT_ID || '870642761716';
    const lambdaArn = `arn:aws:lambda:${process.env.AWS_REGION}:${accountId}:function:note-app-dev-deleteNote`;
    const roleArn = `arn:aws:iam::${accountId}:role/RemoveLambdaRole`;

    console.log('ruleName', ruleName);
    console.log('accountId', accountId);
    console.log('lambdaArn', lambdaArn);
    console.log('roleArn', roleArn);
    console.log('expirationDateTime', expirationDateTime);

    const date = new Date(expirationDateTime);
    const cronExpression = `cron(${date.getUTCMinutes()} ${date.getUTCHours()} ${date.getUTCDate()} ${date.getUTCMonth() + 1} ? ${date.getUTCFullYear()})`;

    console.log('cronExpression', cronExpression);

    const input = {
        Name: ruleName,
        ScheduleExpression: cronExpression,
        Description: 'One-time schedule for deactivating a link',
        State: ScheduleState.ENABLED,
        Target: {
            Arn: lambdaArn,
            RoleArn: roleArn,
            Input: JSON.stringify({ noteId: noteId }),
        },
        FlexibleTimeWindow: {
            Mode: FlexibleTimeWindowMode.OFF,
        },
        ScheduleExpressionTimezone: 'Europe/Kiev',
    };

    console.log('input', input);


    const command = new CreateScheduleCommand(input);

    console.log('command', command);

    try {
        const response = await schedulerClient.send(command);
        console.log('response', response);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Schedule created successfully' })
        };
    } catch (error) {
        console.error('Error creating schedule:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' })
        };
    }
};
