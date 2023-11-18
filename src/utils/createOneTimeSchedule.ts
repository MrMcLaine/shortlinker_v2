import {
    CreateScheduleCommand,
    FlexibleTimeWindowMode,
    SchedulerClient,
    ScheduleState
} from "@aws-sdk/client-scheduler";

const schedulerClient = new SchedulerClient({ region: process.env.AWS_REGION || 'us-east-1' } as any);

export const createOneTimeSchedule = async (linkId: string, expirationDateTime: string) => {
    const ruleName = `deactivateLink-${linkId}`;
    const accountId = process.env.AWS_ACCOUNT_ID || '870642761716';
    const lambdaArn = `arn:aws:lambda:${process.env.AWS_REGION}:${accountId}:function:note-app-dev-linkDeactivation`;
    const roleArn = `arn:aws:iam::${accountId}:role/RemoveLambdaRole`;

    const date = new Date(expirationDateTime);
    const cronExpression = `cron(${date.getUTCMinutes()} ${date.getUTCHours()} ${date.getUTCDate()} ${date.getUTCMonth() + 1} ? ${date.getUTCFullYear()})`;

    const input = {
        Name: ruleName,
        ScheduleExpression: cronExpression,
        Description: 'One-time schedule for deactivating a link',
        State: ScheduleState.ENABLED,
        Target: {
            Arn: lambdaArn,
            RoleArn: roleArn,
            Input: JSON.stringify({ linkId: linkId }),
        },
        FlexibleTimeWindow: {
            Mode: FlexibleTimeWindowMode.OFF,
        },
        ScheduleExpressionTimezone: 'Europe/Kiev',
    };

    const command = new CreateScheduleCommand(input);

    try {
        await schedulerClient.send(command);

    } catch (error) {
        console.error('Error creating schedule:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' })
        };
    }
};
